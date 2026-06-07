import { Graphics as PixiGraphics } from "pixi.js"
import { UINode } from "./ui-node"
import { clamp } from "../utils/math"
import { parseCssColor } from "../utils/color"

export interface SliderStyle {
  trackBg?: string
  trackFg?: string
  trackHeight?: number
  thumbColor?: string
  thumbRadius?: number
  thumbBorder?: string
}

export class Slider extends UINode {
  private _value = 0
  min = 0
  max = 1
  private _style: SliderStyle = {}
  private _dragging = false
  private _onChange: ((value: number) => void) | null = null

  private _sliderGfx: PixiGraphics

  constructor(x = 0, y = 0, w = 200) {
    super()
    this.x = x
    this.y = y
    this.width = w
    this.height = 40
    this.anchorY = 0.5

    this._style = {
      trackBg: "#555555",
      trackFg: "#4a90d9",
      trackHeight: 6,
      thumbColor: "#ffffff",
      thumbRadius: 14,
      thumbBorder: "#4a90d9",
    }

    this._sliderGfx = new PixiGraphics()
    this._pixiObj.addChild(this._sliderGfx)

    this.on("touchbegin", (e) => {
      this._dragging = true
      this._updateFromTouch(e.x)
    })
    this.on("touchmove", (e) => {
      if (this._dragging) this._updateFromTouch(e.x)
    })
    this.on("touchend", () => {
      this._dragging = false
    })
  }

  get value(): number {
    return this._value
  }

  set value(v: number) {
    const clamped = clamp(v, this.min, this.max)
    if (this._value !== clamped) {
      this._value = clamped
      this._onChange?.(this._value)
    }
  }

  setValue(v: number): this {
    this.value = v
    return this
  }

  setRange(min: number, max: number): this {
    this.min = min
    this.max = max
    this._value = clamp(this._value, min, max)
    return this
  }

  setSliderStyle(style: Partial<SliderStyle>): this {
    Object.assign(this._style, style)
    return this
  }

  onChange(fn: (value: number) => void): this {
    this._onChange = fn
    return this
  }

  private _updateFromTouch(worldX: number): void {
    const local = this.worldToLocal(worldX, 0)
    const ratio = clamp(local.x / this.width, 0, 1)
    this.value = this.min + ratio * (this.max - this.min)
  }

  private _getNormalized(): number {
    const range = this.max - this.min
    return range > 0 ? (this._value - this.min) / range : 0
  }

  _syncPixi(): void {
    const {
      trackBg = "#555555",
      trackFg = "#4a90d9",
      trackHeight = 6,
      thumbColor = "#ffffff",
      thumbRadius = 14,
      thumbBorder = "#4a90d9",
    } = this._style

    const w = this.width
    const h = this.height
    const cy = h / 2
    const ty = cy - trackHeight / 2
    const norm = this._getNormalized()
    const thumbX = norm * w

    this._sliderGfx.clear()

    this._sliderGfx.roundRect(0, ty, w, trackHeight, trackHeight / 2)
    this._sliderGfx.fill(parseCssColor(trackBg))

    if (thumbX > 0) {
      this._sliderGfx.roundRect(0, ty, thumbX, trackHeight, trackHeight / 2)
      this._sliderGfx.fill(parseCssColor(trackFg))
    }

    this._sliderGfx.circle(thumbX, cy, thumbRadius)
    this._sliderGfx.fill(parseCssColor(thumbColor))

    if (thumbBorder) {
      this._sliderGfx.circle(thumbX, cy, thumbRadius)
      this._sliderGfx.stroke({ ...parseCssColor(thumbBorder), width: 2 })
    }
  }
}
