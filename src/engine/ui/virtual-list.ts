import { Graphics as PixiGraphics } from "pixi.js"
import { UINode } from "./ui-node"
import { Node } from "../nodes/node"
import { clamp } from "../utils/math"
import { parseCssColor } from "../utils/color"

export interface VirtualListConfig {
  itemHeight: number
  itemCount: number
  renderItem: (index: number) => Node
  buffer?: number
  bg?: string
  scrollBarColor?: string
}

export class VirtualList extends UINode {
  private _config: VirtualListConfig
  private _scrollY = 0
  private _velocity = 0
  private _dragging = false
  private _lastTouchY = 0
  private _visibleNodes = new Map<number, Node>()

  private _bgGfx: PixiGraphics | null = null
  private _clipMask: PixiGraphics
  private _scrollBarGfx: PixiGraphics

  constructor(x: number, y: number, w: number, h: number, config: VirtualListConfig) {
    super()
    this.x = x
    this.y = y
    this.width = w
    this.height = h
    this._config = config

    this._clipMask = new PixiGraphics()
    this._scrollBarGfx = new PixiGraphics()
    this._pixiObj.addChild(this._clipMask)
    this._pixiObj.addChild(this._scrollBarGfx)

    this.on("touchbegin", (e) => {
      this._dragging = true
      this._velocity = 0
      this._lastTouchY = e.y
    })
    this.on("touchmove", (e) => {
      if (!this._dragging) return
      const dy = e.y - this._lastTouchY
      this._velocity = dy
      this._scrollY -= dy
      this._lastTouchY = e.y
    })
    this.on("touchend", () => {
      this._dragging = false
    })
  }

  get scrollY(): number {
    return this._scrollY
  }

  get totalHeight(): number {
    return this._config.itemHeight * this._config.itemCount
  }

  setItemCount(count: number): this {
    this._config.itemCount = count
    return this
  }

  setRenderItem(fn: (index: number) => Node): this {
    this._config.renderItem = fn
    return this
  }

  scrollToIndex(index: number, animated = false): this {
    const targetY = index * this._config.itemHeight
    if (animated) {
      this._velocity = -(targetY - this._scrollY) * 0.3
    } else {
      this._scrollY = targetY
    }
    return this
  }

  update(_dt: number): void {
    const maxScroll = Math.max(0, this.totalHeight - this.height)

    if (!this._dragging) {
      if (Math.abs(this._velocity) > 0.5) {
        this._scrollY -= this._velocity
        this._velocity *= 0.92
      } else {
        this._velocity = 0
      }

      if (this._scrollY < 0) {
        this._scrollY *= 0.85
        if (Math.abs(this._scrollY) < 0.5) this._scrollY = 0
      } else if (this._scrollY > maxScroll) {
        this._scrollY = maxScroll + (this._scrollY - maxScroll) * 0.85
      }
    }

    this._scrollY = clamp(this._scrollY, -50, maxScroll + 50)

    const { itemHeight, itemCount, renderItem, buffer = 3 } = this._config
    const startIdx = Math.max(0, Math.floor(this._scrollY / itemHeight) - buffer)
    const endIdx = Math.min(itemCount - 1, Math.ceil((this._scrollY + this.height) / itemHeight) + buffer)

    const toRemove: number[] = []
    for (const [idx, node] of this._visibleNodes) {
      if (idx < startIdx || idx > endIdx) {
        node.removeFromParent()
        toRemove.push(idx)
      }
    }
    for (const idx of toRemove) this._visibleNodes.delete(idx)

    for (let i = startIdx; i <= endIdx; i++) {
      if (!this._visibleNodes.has(i)) {
        const node = renderItem(i)
        node.y = i * itemHeight - this._scrollY
        this.addChild(node)
        this._visibleNodes.set(i, node)
      } else {
        const node = this._visibleNodes.get(i)
        if (node) node.y = i * itemHeight - this._scrollY
      }
    }
  }

  _syncPixi(): void {
    const { bg, scrollBarColor = "rgba(255,255,255,0.3)" } = this._config

    if (bg) {
      if (!this._bgGfx) {
        this._bgGfx = new PixiGraphics()
        this._pixiObj.addChildAt(this._bgGfx, 0)
      }
      this._bgGfx.visible = true
      this._bgGfx.clear()
      this._bgGfx.rect(0, 0, this.width, this.height)
      this._bgGfx.fill(parseCssColor(bg))
    } else if (this._bgGfx) {
      this._bgGfx.visible = false
    }

    this._clipMask.clear()
    this._clipMask.rect(0, 0, this.width, this.height)
    this._clipMask.fill({ color: 0xffffff })
    this._pixiObj.mask = this._clipMask

    this._scrollBarGfx.clear()
    const totalH = this.totalHeight
    if (totalH > this.height) {
      const maxScroll = totalH - this.height
      const barH = Math.max(20, (this.height / totalH) * this.height)
      const barY = (this._scrollY / maxScroll) * (this.height - barH)
      this._scrollBarGfx.roundRect(this.width - 4, clamp(barY, 0, this.height - barH), 3, barH, 1.5)
      this._scrollBarGfx.fill(parseCssColor(scrollBarColor))
      this._scrollBarGfx.alpha = parseCssColor(scrollBarColor).alpha
      this._scrollBarGfx.visible = true
    } else {
      this._scrollBarGfx.visible = false
    }
  }

  onDestroy(): void {
    this._visibleNodes.clear()
    this._pixiObj.mask = null
    this._clipMask.destroy()
    this._scrollBarGfx.destroy()
    if (this._bgGfx) {
      this._bgGfx.destroy()
      this._bgGfx = null
    }
  }
}
