import { Text as PixiText } from "pixi.js"
import { Node } from "./node"
import { buildPixiTextStyle, type TextStyleOptions } from "../render/text-style"

export type TextStyle = TextStyleOptions

export class TextNode extends Node {
  private _text = ""
  private _style: TextStyle = {}
  private _dirty = true
  private _bindFn: (() => string) | null = null

  constructor(text = "", x = 0, y = 0, style: TextStyle = {}) {
    super()
    this._pixiObj = new PixiText()
    this._text = text
    this.x = x
    this.y = y
    this._style = { ...style }
    this._dirty = true
  }

  // ── 属性 ──────────────────────────────────────────────────────

  get text(): string {
    return this._text
  }

  set text(value: string) {
    if (this._text !== value) {
      this._text = value
      this._dirty = true
    }
  }

  get style(): TextStyle {
    return this._style
  }

  // ── 链式配置 ──────────────────────────────────────────────────

  setText(text: string): this {
    this.text = text
    return this
  }

  setStyle(style: Partial<TextStyle>): this {
    Object.assign(this._style, style)
    this._dirty = true
    return this
  }

  setFontSize(size: number): this {
    this._style.fontSize = size
    this._dirty = true
    return this
  }

  setColor(color: string): this {
    this._style.color = color
    this._dirty = true
    return this
  }

  setAlign(align: CanvasTextAlign): this {
    this._style.align = align
    this._dirty = true
    return this
  }

  setBold(bold = true): this {
    this._style.bold = bold
    this._dirty = true
    return this
  }

  setShadow(color: string, offsetX = 2, offsetY = 2, blur = 0): this {
    this._style.shadow = { color, offsetX, offsetY, blur }
    this._dirty = true
    return this
  }

  setStroke(color: string, width = 2): this {
    this._style.stroke = { color, width }
    this._dirty = true
    return this
  }

  /** 数据绑定：每帧自动更新文本 */
  bindTo(fn: () => string): this {
    this._bindFn = fn
    return this
  }

  // ── 生命周期 ──────────────────────────────────────────────────

  update(_dt: number): void {
    if (this._bindFn) {
      const newText = this._bindFn()
      if (newText !== this._text) {
        this._text = newText
        this._dirty = true
      }
    }
  }

  _syncPixi(): void {
    const pixiText = this._pixiObj as PixiText

    if (this._dirty) {
      pixiText.style = buildPixiTextStyle(this._style)
      this._dirty = false
    }

    pixiText.text = this._text
    // Canvas2D textAlign 语义映射：align 决定锚点 x
    const alignAnchorX =
      this._style.align === "center" ? 0.5 : this._style.align === "right" || this._style.align === "end" ? 1 : 0
    pixiText.anchor.set(this.anchorX || alignAnchorX, this.anchorY)
    pixiText.pivot.set(0, 0)

    const pw = pixiText.width
    const ph = pixiText.height
    if (Number.isFinite(pw)) this.width = pw
    if (Number.isFinite(ph)) this.height = ph
  }
}
