import { getPlatform } from "../platform/platform"

// ─── 触摸系统 ─────────────────────────────────────────────────────

export interface PointerState {
  x: number
  y: number
  dx: number
  dy: number
  isDown: boolean
  justPressed: boolean
  justReleased: boolean
  id: number
}

export interface TouchPoint {
  id: number
  x: number
  y: number
  startX: number
  startY: number
  dx: number
  dy: number
  startTime: number
}

export class TouchSystem {
  readonly pointer: PointerState = {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    isDown: false,
    justPressed: false,
    justReleased: false,
    id: -1,
  }

  /**
   * justPressed/justReleased 存活帧计数。
   * touch 事件异步触发，可能在 update 和 endFrame 之间抵达，
   * 导致当帧 update 读不到。保证至少存活 1 帧。
   */
  private _justPressedFrames = 0
  private _justReleasedFrames = 0

  readonly touches: TouchPoint[] = []

  get touchCount(): number {
    return this.touches.length
  }

  private _callbacks: {
    onStart: Array<(x: number, y: number, id: number) => void>
    onMove: Array<(x: number, y: number, id: number) => void>
    onEnd: Array<(x: number, y: number, id: number) => void>
  } = { onStart: [], onMove: [], onEnd: [] }

  bind(): void {
    const platform = getPlatform()
    platform.onTouchStart((e: any) => {
      for (const t of e.changedTouches) {
        this._handleStart(t.identifier, t.clientX, t.clientY)
      }
    })
    platform.onTouchMove((e: any) => {
      for (const t of e.changedTouches) {
        this._handleMove(t.identifier, t.clientX, t.clientY)
      }
    })
    platform.onTouchEnd((e: any) => {
      for (const t of e.changedTouches) {
        this._handleEnd(t.identifier, t.clientX, t.clientY)
      }
    })
    platform.onTouchCancel((e: any) => {
      for (const t of e.changedTouches) {
        this._handleEnd(t.identifier, t.clientX, t.clientY)
      }
    })
  }

  endFrame(): void {
    // justPressed/justReleased 至少存活 1 帧，防止异步触摸事件竞态
    if (this._justPressedFrames > 0) {
      this._justPressedFrames--
      if (this._justPressedFrames <= 0) this.pointer.justPressed = false
    }
    if (this._justReleasedFrames > 0) {
      this._justReleasedFrames--
      if (this._justReleasedFrames <= 0) this.pointer.justReleased = false
    }
    this.pointer.dx = 0
    this.pointer.dy = 0
    for (const tp of this.touches) {
      tp.dx = 0
      tp.dy = 0
    }
  }

  onTouchStart(fn: (x: number, y: number, id: number) => void): void {
    this._callbacks.onStart.push(fn)
  }

  onTouchMove(fn: (x: number, y: number, id: number) => void): void {
    this._callbacks.onMove.push(fn)
  }

  onTouchEnd(fn: (x: number, y: number, id: number) => void): void {
    this._callbacks.onEnd.push(fn)
  }

  clearCallbacks(): void {
    this._callbacks.onStart.length = 0
    this._callbacks.onMove.length = 0
    this._callbacks.onEnd.length = 0
  }

  destroy(): void {
    this.clearCallbacks()
    this.touches.length = 0
  }

  private _handleStart(id: number, x: number, y: number): void {
    const tp: TouchPoint = {
      id,
      x,
      y,
      startX: x,
      startY: y,
      dx: 0,
      dy: 0,
      startTime: Date.now(),
    }
    this.touches.push(tp)

    if (this.touches.length === 1) {
      this.pointer.x = x
      this.pointer.y = y
      this.pointer.isDown = true
      this.pointer.justPressed = true
      this._justPressedFrames = 2
      this.pointer.id = id
    }

    for (const fn of this._callbacks.onStart) fn(x, y, id)
  }

  private _handleMove(id: number, x: number, y: number): void {
    const tp = this.touches.find((t) => t.id === id)
    if (tp) {
      tp.dx = x - tp.x
      tp.dy = y - tp.y
      tp.x = x
      tp.y = y
    }

    if (this.pointer.id === id) {
      this.pointer.dx = x - this.pointer.x
      this.pointer.dy = y - this.pointer.y
      this.pointer.x = x
      this.pointer.y = y
    }

    for (const fn of this._callbacks.onMove) fn(x, y, id)
  }

  private _handleEnd(id: number, x: number, y: number): void {
    const idx = this.touches.findIndex((t) => t.id === id)
    if (idx !== -1) this.touches.splice(idx, 1)

    if (this.pointer.id === id) {
      this.pointer.x = x
      this.pointer.y = y
      this.pointer.isDown = false
      this.pointer.justReleased = true
      this._justReleasedFrames = 2
    }

    for (const fn of this._callbacks.onEnd) fn(x, y, id)
  }
}
