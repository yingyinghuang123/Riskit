import { Graphics as PixiGraphics } from "pixi.js"
import { UINode } from "./ui-node"
import { clamp } from "../utils/math"
import { parseCssColor } from "../utils/color"

export interface ProgressBarStyle {
  fg?: string
  bg?: string
  radius?: number
  borderColor?: string
  borderWidth?: number
}

export class ProgressBar extends UINode {
  private _value = 0
  private _displayValue = 0
  private _targetValue = 0
  private _style: ProgressBarStyle = {}
  animSpeed = 3

  private _barGfx: PixiGraphics

  constructor(x = 0, y = 0, w = 200, h = 20) {
    super()
    this.x = x
    this.y = y
    this.width = w
    this.height = h
    this.interactive = false
    this._style = { fg: "#4a90d9", bg: "#333333", radius: 0 }

    this._barGfx = new PixiGraphics()
    this._pixiObj.addChild(this._barGfx)
  }

  get value(): number {
    return this._value
  }

  set value(v: number) {
    this._value = clamp(v, 0, 1)
    this._targetValue = this._value
  }

  setValue(v: number): this {
    this.value = v
    return this
  }

  setBarStyle(style: Partial<ProgressBarStyle>): this {
    Object.assign(this._style, style)
    return this
  }

  update(dt: number): void {
    if (this._displayValue !== this._targetValue) {
      if (this.animSpeed <= 0) {
        this._displayValue = this._targetValue
      } else {
        const diff = this._targetValue - this._displayValue
        const step = this.animSpeed * dt
        if (Math.abs(diff) <= step) {
          this._displayValue = this._targetValue
        } else {
          this._displayValue += Math.sign(diff) * step
        }
      }
    }
  }

  _syncPixi(): void {
    const { fg = "#4a90d9", bg = "#333333", radius = 0, borderColor, borderWidth = 1 } = this._style
    const w = this.width
    const h = this.height
    const r = radius > 0 ? Math.min(radius, h / 2) : 0

    this._barGfx.clear()
    if (w <= 0 || h <= 0) return

    if (r > 0) this._barGfx.roundRect(0, 0, w, h, r)
    else this._barGfx.rect(0, 0, w, h)
    this._barGfx.fill(parseCssColor(bg))

    const fw = w * clamp(this._displayValue, 0, 1)
    if (fw > 0) {
      const fr = r > 0 ? Math.min(r, fw / 2) : 0
      if (fr > 0) this._barGfx.roundRect(0, 0, fw, h, fr)
      else this._barGfx.rect(0, 0, fw, h)
      this._barGfx.fill(parseCssColor(fg))
    }

    if (borderColor && borderWidth > 0) {
      if (r > 0) this._barGfx.roundRect(0, 0, w, h, r)
      else this._barGfx.rect(0, 0, w, h)
      this._barGfx.stroke({ ...parseCssColor(borderColor), width: borderWidth })
    }
  }
}
