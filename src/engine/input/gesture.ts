// ─── 手势识别 ─────────────────────────────────────────────────────

import type { Node } from '../nodes/node'
import type { TouchSystem } from './touch'

export type SwipeDirection = 'left' | 'right' | 'up' | 'down'

export interface GestureConfig {
  swipeThreshold?: number
  swipeMaxTime?: number
  longPressTime?: number
  doubleTapInterval?: number
  tapMaxMove?: number
}

interface DragState {
  node: Node
  callback: (dx: number, dy: number, x: number, y: number) => void
  onEnd?: () => void
  active: boolean
  touchId: number
}

const DEFAULTS: Required<GestureConfig> = {
  swipeThreshold: 50,
  swipeMaxTime: 300,
  longPressTime: 600,
  doubleTapInterval: 300,
  tapMaxMove: 10,
}

export class GestureRecognizer {
  private _touch: TouchSystem
  private _config: Required<GestureConfig>

  private _swipeHandlers: Partial<Record<SwipeDirection, Array<() => void>>> = {}
  private _swipeAnyHandlers: Array<(dir: SwipeDirection) => void> = []
  private _dragStates: DragState[] = []
  private _pinchHandlers: Array<(scale: number, cx: number, cy: number) => void> = []
  private _pinchStartDist = 0
  private _longPressMap = new Map<Node, { callback: () => void; timer: any }>()
  private _doubleTapHandlers: Array<(x: number, y: number) => void> = []
  private _tapHandlers: Array<(x: number, y: number) => void> = []
  private _lastTapTime = 0
  private _lastTapX = 0
  private _lastTapY = 0
  private _startX = 0
  private _startY = 0
  private _startTime = 0
  private _moved = false

  constructor(touch: TouchSystem, config?: GestureConfig) {
    this._touch = touch
    this._config = { ...DEFAULTS, ...config }
    this._bindEvents()
  }

  onSwipe(direction: SwipeDirection | 'any', callback: (() => void) | ((dir: SwipeDirection) => void)): void {
    if (direction === 'any') {
      this._swipeAnyHandlers.push(callback as (dir: SwipeDirection) => void)
      return
    }
    if (!this._swipeHandlers[direction]) this._swipeHandlers[direction] = []
    this._swipeHandlers[direction]!.push(callback as () => void)
  }

  onDrag(node: Node, callback: (dx: number, dy: number, x: number, y: number) => void, onEnd?: () => void): void {
    this._dragStates.push({ node, callback, onEnd, active: false, touchId: -1 })
  }

  onPinch(callback: (scale: number, cx: number, cy: number) => void): void {
    this._pinchHandlers.push(callback)
  }

  onLongPress(node: Node, callback: () => void): void {
    this._longPressMap.set(node, { callback, timer: null })
  }

  onDoubleTap(callback: (x: number, y: number) => void): void {
    this._doubleTapHandlers.push(callback)
  }

  onTap(callback: (x: number, y: number) => void): void {
    this._tapHandlers.push(callback)
  }

  /** 清空所有注册的手势回调并重置进行中的手势状态（场景切换时调用，保留底层事件绑定） */
  clearCallbacks(): void {
    // 清空回调
    this._swipeHandlers = {}
    this._swipeAnyHandlers.length = 0
    this._dragStates.length = 0
    this._pinchHandlers.length = 0
    for (const [, s] of this._longPressMap) {
      if (s.timer) clearTimeout(s.timer)
    }
    this._longPressMap.clear()
    this._doubleTapHandlers.length = 0
    this._tapHandlers.length = 0
    // 重置进行中的手势追踪状态
    this._pinchStartDist = 0
    this._startX = 0
    this._startY = 0
    this._startTime = 0
    this._moved = false
    this._lastTapTime = 0
    this._lastTapX = 0
    this._lastTapY = 0
  }

  destroy(): void {
    this._swipeHandlers = {}
    this._swipeAnyHandlers.length = 0
    this._dragStates.length = 0
    this._pinchHandlers.length = 0
    for (const [, s] of this._longPressMap) {
      if (s.timer) clearTimeout(s.timer)
    }
    this._longPressMap.clear()
    this._doubleTapHandlers.length = 0
    this._tapHandlers.length = 0
  }

  private _bindEvents(): void {
    this._touch.onTouchStart((x, y, id) => {
      this._startX = x
      this._startY = y
      this._startTime = Date.now()
      this._moved = false

      for (const ds of this._dragStates) {
        if (!ds.active && ds.node.hitTest(x, y)) {
          ds.active = true
          ds.touchId = id
        }
      }

      for (const [node, state] of this._longPressMap) {
        if (node.hitTest(x, y)) {
          state.timer = setTimeout(() => {
            if (!this._moved) state.callback()
            state.timer = null
          }, this._config.longPressTime)
        }
      }

      if (this._touch.touchCount === 2) {
        const [t0, t1] = this._touch.touches
        const dx = t1.x - t0.x
        const dy = t1.y - t0.y
        this._pinchStartDist = Math.sqrt(dx * dx + dy * dy) || 1
      }
    })

    this._touch.onTouchMove((x, y, id) => {
      if (Math.abs(x - this._startX) > this._config.tapMaxMove ||
          Math.abs(y - this._startY) > this._config.tapMaxMove) {
        this._moved = true
      }

      for (const ds of this._dragStates) {
        if (ds.active && ds.touchId === id) {
          const tp = this._touch.touches.find(t => t.id === id)
          if (tp) ds.callback(tp.dx, tp.dy, x, y)
        }
      }

      if (this._moved) {
        for (const [, s] of this._longPressMap) {
          if (s.timer) { clearTimeout(s.timer); s.timer = null }
        }
      }

      if (this._pinchStartDist && this._touch.touchCount === 2) {
        const [t0, t1] = this._touch.touches
        const dx = t1.x - t0.x
        const dy = t1.y - t0.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        const scale = dist / this._pinchStartDist
        const cx = (t0.x + t1.x) / 2
        const cy = (t0.y + t1.y) / 2
        for (const fn of this._pinchHandlers) fn(scale, cx, cy)
      }
    })

    this._touch.onTouchEnd((x, y, id) => {
      const elapsed = Date.now() - this._startTime

      for (const ds of this._dragStates) {
        if (ds.active && ds.touchId === id) {
          ds.active = false
          ds.touchId = -1
          ds.onEnd?.()
        }
      }

      for (const [, s] of this._longPressMap) {
        if (s.timer) { clearTimeout(s.timer); s.timer = null }
      }

      if (this._touch.touchCount < 2) this._pinchStartDist = 0

      if (this._moved) {
        const dx = x - this._startX
        const dy = y - this._startY
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)

        if (elapsed < this._config.swipeMaxTime &&
            (absDx > this._config.swipeThreshold || absDy > this._config.swipeThreshold)) {
          const dir: SwipeDirection = absDx > absDy
            ? (dx > 0 ? 'right' : 'left')
            : (dy > 0 ? 'down' : 'up')
          const handlers = this._swipeHandlers[dir]
          if (handlers) for (const fn of handlers) fn()
          for (const fn of this._swipeAnyHandlers) fn(dir)
        }
      } else if (elapsed < this._config.swipeMaxTime) {
        for (const fn of this._tapHandlers) fn(x, y)

        const now = Date.now()
        if (now - this._lastTapTime < this._config.doubleTapInterval &&
            Math.abs(x - this._lastTapX) + Math.abs(y - this._lastTapY) < 30) {
          for (const fn of this._doubleTapHandlers) fn(x, y)
        }
        this._lastTapTime = now
        this._lastTapX = x
        this._lastTapY = y
      }
    })
  }
}
