import { Text as PixiText } from "pixi.js"
import { UINode } from "./ui-node"
import { buildPixiTextStyle, type TextStyleOptions } from "../render/text-style"

export type LabelStyle = TextStyleOptions

export class Label extends UINode {
  private _text = ""
  private _labelStyle: LabelStyle = {}
  private _dirty = true
  private _bindFn: (() => string) | null = null
  private _labelText: PixiText

  constructor(text = "", x = 0, y = 0, style?: LabelStyle) {
    super()
    this._text = text
    this.x = x
    this.y = y
    if (style) this._labelStyle = { ...style }
    this.interactive = false

    this._labelText = new PixiText()
    this._labelText.anchor.set(0, 0)
    this._pixiObj.addChild(this._labelText)
  }

  get text(): string {
    return this._text
  }

  set text(v: string) {
    if (this._text !== v) {
      this._text = v
      this._dirty = true
    }
  }

  setText(text: string): this {
    this.text = text
    return this
  }

  setLabelStyle(style: Partial<LabelStyle>): this {
    Object.assign(this._labelStyle, style)
    this._dirty = true
    return this
  }

  setColor(color: string): this {
    this._labelStyle.color = color
    this._dirty = true
    return this
  }

  setFontSize(size: number): this {
    this._labelStyle.fontSize = size
    this._dirty = true
    return this
  }

  setAlign(align: CanvasTextAlign): this {
    this._labelStyle.align = align
    this._dirty = true
    return this
  }

  setBold(bold = true): this {
    this._labelStyle.bold = bold
    this._dirty = true
    return this
  }

  setMaxWidth(w: number): this {
    this._labelStyle.maxWidth = w
    this._dirty = true
    return this
  }

  bindTo(fn: () => string): this {
    this._bindFn = fn
    return this
  }

  update(_dt: number): void {
    if (this._bindFn) {
      try {
        const v = this._bindFn()
        if (v !== this._text) {
          this._text = v
          this._dirty = true
        }
      } catch {
        return
      }
    }
  }

  _syncPixi(): void {
    this._drawBoxPixi()

    if (this._dirty) {
      this._labelText.style = buildPixiTextStyle(this._labelStyle)
      this._dirty = false
    }

    this._labelText.text = this._text
    this._labelText.anchor.set(this.anchorX, this.anchorY)
    this._labelText.pivot.set(0, 0)

    this.width = this._labelText.width
    this.height = this._labelText.height
  }
}
