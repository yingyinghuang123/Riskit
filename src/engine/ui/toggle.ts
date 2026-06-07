import { Graphics as PixiGraphics } from "pixi.js"
import { UINode } from "./ui-node"
import { lerp } from "../utils/math"
import { parseCssColor } from "../utils/color"

export interface ToggleStyle {
  onColor?: string
  offColor?: string
  thumbColor?: string
  width?: number
  height?: number
}

export class Toggle extends UINode {
  private _value = false
  private _thumbPos = 0
  private _style: ToggleStyle = {}
  private _onChange: ((value: boolean) => void) | null = null

  private _toggleGfx: PixiGraphics

  constructor(x = 0, y = 0, value = false) {
    super()
    this.x = x
    this.y = y
    this._value = value
    this._thumbPos = value ? 1 : 0
    this.width = 52
    this.height = 30

    this._style = { onColor: "#4a90d9", offColor: "#999999", thumbColor: "#ffffff" }

    this._toggleGfx = new PixiGraphics()
    this._pixiObj.addChild(this._toggleGfx)

    this.on("tap", () => {
      this._value = !this._value
      this._onChange?.(this._value)
    })
  }

  get value(): boolean {
    return this._value
  }

  set value(v: boolean) {
    if (this._value !== v) {
      this._value = v
      this._onChange?.(this._value)
    }
  }

  setValue(v: boolean): this {
    this.value = v
    return this
  }

  setToggleStyle(style: Partial<ToggleStyle>): this {
    Object.assign(this._style, style)
    if (style.width) this.width = style.width
    if (style.height) this.height = style.height
    return this
  }

  onChange(fn: (value: boolean) => void): this {
    this._onChange = fn
    return this
  }

  update(dt: number): void {
    const target = this._value ? 1 : 0
    if (Math.abs(this._thumbPos - target) > 0.01) {
      this._thumbPos = lerp(this._thumbPos, target, Math.min(1, dt * 12))
    } else {
      this._thumbPos = target
    }
  }

  _syncPixi(): void {
    const { onColor = "#4a90d9", offColor = "#999999", thumbColor = "#ffffff" } = this._style
    const w = this.width
    const h = this.height
    const r = h / 2
    const thumbR = r - 3
    const travel = w - h

    const bgColor = this._thumbPos > 0.5 ? onColor : offColor
    const thumbX = r + this._thumbPos * travel

    this._toggleGfx.clear()

    this._toggleGfx.roundRect(0, 0, w, h, r)
    this._toggleGfx.fill(parseCssColor(bgColor))

    this._toggleGfx.circle(thumbX, r, thumbR)
    this._toggleGfx.fill(parseCssColor(thumbColor))
  }
}
