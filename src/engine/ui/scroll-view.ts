import { Graphics as PixiGraphics } from "pixi.js"
import { UINode } from "./ui-node"
import { Node } from "../nodes/node"
import { clamp } from "../utils/math"
import { parseCssColor } from "../utils/color"

export interface ScrollViewOptions {
  bg?: string
  radius?: number
  elasticity?: number
  friction?: number
  showScrollBar?: boolean
  scrollBarColor?: string
}

export class ScrollView extends UINode {
  private _scrollY = 0
  private _velocity = 0
  private _contentHeight = 0
  private _dragging = false
  private _lastTouchY = 0
  private _options: ScrollViewOptions = {}
  private _content: Node

  private _bgGfx: PixiGraphics | null = null
  private _scrollBarGfx: PixiGraphics
  private _clipMask: PixiGraphics

  constructor(x = 0, y = 0, w = 300, h = 400, options?: ScrollViewOptions) {
    super()
    this.x = x
    this.y = y
    this.width = w
    this.height = h
    if (options) this._options = { ...options }

    this._content = new Node()
    this.addChild(this._content)

    this._scrollBarGfx = new PixiGraphics()
    this._clipMask = new PixiGraphics()
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

  get contentHeight(): number {
    return this._contentHeight
  }

  addItem(node: Node): this {
    this._content.addChild(node)
    this._recalcContentHeight()
    return this
  }

  removeItem(node: Node): this {
    this._content.removeChild(node)
    this._recalcContentHeight()
    return this
  }

  scrollTo(y: number, animated = true): this {
    const max = Math.max(0, this._contentHeight - this.height)
    const target = clamp(y, 0, max)
    if (animated) {
      this._velocity = -(target - this._scrollY) * 0.3
    } else {
      this._scrollY = target
      this._velocity = 0
    }
    return this
  }

  setScrollOptions(options: Partial<ScrollViewOptions>): this {
    Object.assign(this._options, options)
    return this
  }

  private _recalcContentHeight(): void {
    let maxY = 0
    for (const child of this._content.children) {
      const bottom = child.y + child.height
      if (bottom > maxY) maxY = bottom
    }
    this._contentHeight = maxY
  }

  update(_dt: number): void {
    const friction = this._options.friction ?? 0.92
    const elasticity = this._options.elasticity ?? 0.15
    const maxScroll = Math.max(0, this._contentHeight - this.height)

    if (!this._dragging) {
      if (Math.abs(this._velocity) > 0.5) {
        this._scrollY -= this._velocity
        this._velocity *= friction
      } else {
        this._velocity = 0
      }

      if (this._scrollY < 0) {
        this._scrollY *= 1 - elasticity
        if (Math.abs(this._scrollY) < 0.5) this._scrollY = 0
      } else if (this._scrollY > maxScroll) {
        this._scrollY = maxScroll + (this._scrollY - maxScroll) * (1 - elasticity)
        if (Math.abs(this._scrollY - maxScroll) < 0.5) this._scrollY = maxScroll
      }
    }

    this._content.y = -this._scrollY
  }

  _syncPixi(): void {
    const { bg, radius = 0, showScrollBar = true, scrollBarColor = "rgba(255,255,255,0.3)" } = this._options

    if (bg) {
      if (!this._bgGfx) {
        this._bgGfx = new PixiGraphics()
        this._pixiObj.addChildAt(this._bgGfx, 0)
      }
      this._bgGfx.visible = true
      this._bgGfx.clear()
      if (radius > 0)
        this._bgGfx.roundRect(0, 0, this.width, this.height, Math.min(radius, this.width / 2, this.height / 2))
      else this._bgGfx.rect(0, 0, this.width, this.height)
      this._bgGfx.fill(parseCssColor(bg))
    } else if (this._bgGfx) {
      this._bgGfx.visible = false
    }

    this._clipMask.clear()
    this._clipMask.rect(0, 0, this.width, this.height)
    this._clipMask.fill({ color: 0xffffff })
    this._pixiObj.mask = this._clipMask

    this._scrollBarGfx.clear()
    if (showScrollBar && this._contentHeight > this.height) {
      const maxScroll = this._contentHeight - this.height
      const barH = Math.max(20, (this.height / this._contentHeight) * this.height)
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
    this._pixiObj.mask = null
    this._clipMask.destroy()
    this._scrollBarGfx.destroy()
    if (this._bgGfx) {
      this._bgGfx.destroy()
      this._bgGfx = null
    }
  }
}
