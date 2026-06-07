import { Graphics as PixiGraphics } from "pixi.js"
import { Node } from "../nodes/node"
import { RenderLayer } from "../render/layers"
import { parseCssColor } from "../utils/color"

export interface UIStyle {
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number | [number, number, number, number]
  margin?: number | [number, number, number, number]
}

export interface Padding {
  top: number
  right: number
  bottom: number
  left: number
}

export class UINode extends Node {
  layer = RenderLayer.UI
  protected _uiStyle: UIStyle = {}
  blockTouch = true
  protected _boxGfx: PixiGraphics | null = null

  constructor() {
    super()
    this.interactive = true
    this.updateMode = "unscaled"
  }

  setUIStyle(style: Partial<UIStyle>): this {
    Object.assign(this._uiStyle, style)
    return this
  }

  get backgroundColor(): string | undefined {
    return this._uiStyle.backgroundColor
  }
  set backgroundColor(v: string | undefined) {
    this._uiStyle.backgroundColor = v
  }

  get borderColor(): string | undefined {
    return this._uiStyle.borderColor
  }
  set borderColor(v: string | undefined) {
    this._uiStyle.borderColor = v
  }

  get borderWidth(): number {
    return this._uiStyle.borderWidth ?? 0
  }
  set borderWidth(v: number) {
    this._uiStyle.borderWidth = v
  }

  get borderRadius(): number {
    return this._uiStyle.borderRadius ?? 0
  }
  set borderRadius(v: number) {
    this._uiStyle.borderRadius = v
  }

  getPadding(): Padding {
    const p = this._uiStyle.padding
    if (p == null) return { top: 0, right: 0, bottom: 0, left: 0 }
    if (typeof p === "number") return { top: p, right: p, bottom: p, left: p }
    return { top: p[0], right: p[1], bottom: p[2], left: p[3] }
  }

  getMargin(): Padding {
    const m = this._uiStyle.margin
    if (m == null) return { top: 0, right: 0, bottom: 0, left: 0 }
    if (typeof m === "number") return { top: m, right: m, bottom: m, left: m }
    return { top: m[0], right: m[1], bottom: m[2], left: m[3] }
  }

  protected _drawBoxPixi(): void {
    const { backgroundColor, borderColor, borderWidth = 0, borderRadius = 0 } = this._uiStyle
    const w = this.width
    const h = this.height
    if (!backgroundColor && !borderColor) {
      if (this._boxGfx) this._boxGfx.visible = false
      return
    }

    if (w <= 0 || h <= 0) {
      if (this._boxGfx) this._boxGfx.visible = false
      return
    }

    if (!this._boxGfx) {
      this._boxGfx = new PixiGraphics()
      this._pixiObj.addChildAt(this._boxGfx, 0)
    }

    const gfx = this._boxGfx
    gfx.visible = true
    gfx.clear()

    const r = borderRadius > 0 ? Math.min(borderRadius, w / 2, h / 2) : 0

    if (backgroundColor) {
      if (r > 0) gfx.roundRect(0, 0, w, h, r)
      else gfx.rect(0, 0, w, h)
      gfx.fill({ color: parseCssColor(backgroundColor).color, alpha: parseCssColor(backgroundColor).alpha })
    }

    if (borderColor && borderWidth > 0) {
      if (r > 0) gfx.roundRect(0, 0, w, h, r)
      else gfx.rect(0, 0, w, h)
      gfx.stroke({
        color: parseCssColor(borderColor).color,
        alpha: parseCssColor(borderColor).alpha,
        width: borderWidth,
      })
    }
  }

  _syncPixi(): void {
    this._drawBoxPixi()
  }

  hitTest(worldX: number, worldY: number): boolean {
    if (!this.visible) return false
    const local = this.worldToLocal(worldX, worldY)
    return local.x >= 0 && local.x <= this.width && local.y >= 0 && local.y <= this.height
  }
}
