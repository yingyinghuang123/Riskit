import { Graphics as PixiGraphics } from "pixi.js"
import { UINode } from "./ui-node"

export interface PanelStyle {
  bg?: string
  borderColor?: string
  borderWidth?: number
  radius?: number
}

export class Panel extends UINode {
  clip = false

  private _clipMask: PixiGraphics | null = null

  constructor(x = 0, y = 0, w = 300, h = 200) {
    super()
    this.x = x
    this.y = y
    this.width = w
    this.height = h
  }

  setPanelStyle(style: Partial<PanelStyle>): this {
    const { bg, borderColor, borderWidth, radius } = style
    if (bg != null) this._uiStyle.backgroundColor = bg
    if (borderColor != null) this._uiStyle.borderColor = borderColor
    if (borderWidth != null) this._uiStyle.borderWidth = borderWidth
    if (radius != null) this._uiStyle.borderRadius = radius
    return this
  }

  _syncPixi(): void {
    this._drawBoxPixi()

    if (this.clip && this.width > 0 && this.height > 0) {
      if (!this._clipMask) {
        this._clipMask = new PixiGraphics()
        this._pixiObj.addChild(this._clipMask)
      }
      this._clipMask.clear()
      this._clipMask.rect(0, 0, this.width, this.height)
      this._clipMask.fill({ color: 0xffffff })
      this._pixiObj.mask = this._clipMask
    } else if (this._clipMask) {
      this._pixiObj.mask = null
    }
  }

  onDestroy(): void {
    if (this._clipMask) {
      this._clipMask.destroy()
      this._clipMask = null
    }
  }
}
