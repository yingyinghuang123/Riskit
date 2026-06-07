import {
  CanvasSource,
  Graphics as PixiGraphics,
  ImageSource,
  Sprite as PixiSprite,
  Text as PixiText,
  TextStyle as PixiTextStyle,
  Texture as PixiTexture,
} from "pixi.js"
import { UINode } from "./ui-node"
import { parseCssColor } from "../utils/color"
import { deferGpuDestroy } from "../utils/gpu-destroy-queue"

export interface ButtonStyle {
  bg?: string
  fg?: string
  radius?: number
  fontSize?: number
  fontFamily?: string
  bold?: boolean
  padding?: number | [number, number]
  pressScale?: number
  disabledBg?: string
  disabledFg?: string
  image?: CanvasImageSource
}

type ButtonState = "normal" | "pressed" | "disabled"

export class Button extends UINode {
  private _label = ""
  private _style: ButtonStyle = {}
  private _state: ButtonState = "normal"
  private _onClick: (() => void) | null = null
  private _autoSize = true

  private _bgGfx: PixiGraphics
  private _labelText: PixiText
  private _imageSprite: PixiSprite | null = null
  private _textureCache = new Map<CanvasImageSource, PixiTexture>()

  private _pressScaleApplied = false

  constructor(text = "", x = 0, y = 0, onClick?: () => void) {
    super()
    this._label = text
    this.x = x
    this.y = y
    this._onClick = onClick ?? null
    this.anchorX = 0.5
    this.anchorY = 0.5

    this._style = {
      bg: "#4a90d9",
      fg: "#ffffff",
      radius: 8,
      fontSize: 28,
      fontFamily: "sans-serif",
      bold: true,
      padding: [12, 32],
      pressScale: 0.95,
    }

    this._estimateSize(text)

    this._bgGfx = new PixiGraphics()
    this._labelText = new PixiText()
    this._labelText.anchor.set(0.5, 0.5)
    this._pixiObj.addChild(this._bgGfx)
    this._pixiObj.addChild(this._labelText)

    this.on("touchbegin", () => {
      if (this._state === "disabled") return
      this._state = "pressed"
      this._applyPressScale(true)
    })
    this.on("touchend", () => {
      if (this._state === "disabled") return
      this._state = "normal"
      this._applyPressScale(false)
    })
    this.on("tap", () => {
      if (this._state === "disabled") return
      this._onClick?.()
    })
  }

  setText(text: string): this {
    this._label = text
    this._autoSize = true
    return this
  }

  setStyle(style: Partial<ButtonStyle>): this {
    Object.assign(this._style, style)
    this._autoSize = true
    return this
  }

  setSize(width: number, height: number): this {
    this.width = width
    this.height = height
    this._autoSize = false
    return this
  }

  onClick(fn: () => void): this {
    this._onClick = fn
    return this
  }

  setDisabled(disabled = true): this {
    if (disabled) {
      this._state = "disabled"
      this._applyPressScale(false)
    } else {
      this._state = "normal"
    }
    return this
  }

  get disabled(): boolean {
    return this._state === "disabled"
  }

  get label(): string {
    return this._label
  }

  get state(): ButtonState {
    return this._state
  }

  private _estimateSize(text: string): void {
    const fontSize = this._style.fontSize ?? 28
    const padding = this._style.padding ?? [12, 32]
    const [py, px] = Array.isArray(padding) ? padding : [padding, padding]
    let estW = 0
    for (let i = 0; i < text.length; i++) {
      estW += text.charCodeAt(i) > 0x2e80 ? fontSize : fontSize * 0.6
    }
    this.width = estW + px * 2
    this.height = fontSize + py * 2
  }

  _syncPixi(): void {
    const {
      bg = "#4a90d9",
      fg = "#ffffff",
      radius = 8,
      fontSize = 28,
      fontFamily = "sans-serif",
      bold = true,
      padding = [12, 32],
      disabledBg = "#888888",
      disabledFg = "#cccccc",
      image,
    } = this._style

    const [py, px] = Array.isArray(padding) ? padding : [padding, padding]
    const isDisabled = this._state === "disabled"

    this._labelText.text = this._label
    this._labelText.style = new PixiTextStyle({
      fontSize,
      fontFamily,
      fontWeight: bold ? "bold" : "normal",
      fill: isDisabled ? disabledFg : fg,
      align: "center",
    })

    if (this._autoSize && !image) {
      this.width = this._labelText.width + px * 2
      this.height = fontSize + py * 2
      this._autoSize = false
    }

    if (image) {
      if (!this._imageSprite) {
        this._imageSprite = new PixiSprite()
        this._imageSprite.anchor.set(0, 0)
        this._pixiObj.addChild(this._imageSprite)
      }
      const texture = this._getOrCreateTexture(image)
      this._imageSprite.texture = texture
      this._imageSprite.width = this.width
      this._imageSprite.height = this.height
      this._imageSprite.visible = true
      this._imageSprite.alpha = isDisabled ? 0.5 : 1
      this._bgGfx.visible = false
      this._labelText.visible = false
      return
    }

    if (this._imageSprite) this._imageSprite.visible = false

    const w = Math.max(0, this.width)
    const h = Math.max(0, this.height)
    const r = radius > 0 ? Math.min(radius, w / 2, h / 2) : 0

    this._bgGfx.visible = true
    this._labelText.visible = true
    this._bgGfx.clear()
    if (w > 0 && h > 0) {
      if (r > 0) this._bgGfx.roundRect(0, 0, w, h, r)
      else this._bgGfx.rect(0, 0, w, h)
      this._bgGfx.fill(parseCssColor(isDisabled ? disabledBg : bg))
    }

    this._labelText.x = w / 2
    this._labelText.y = h / 2
  }

  onDestroy(): void {
    for (const texture of this._textureCache.values()) {
      deferGpuDestroy(() => texture.destroy(true))
    }
    this._textureCache.clear()
  }

  private _applyPressScale(pressed: boolean): void {
    const pressScale = this._style.pressScale ?? 0.95
    if (pressed && !this._pressScaleApplied) {
      this.scaleX *= pressScale
      this.scaleY *= pressScale
      this._pressScaleApplied = true
      return
    }
    if (!pressed && this._pressScaleApplied && pressScale > 0) {
      this.scaleX /= pressScale
      this.scaleY /= pressScale
      this._pressScaleApplied = false
    }
  }

  private _getOrCreateTexture(image: CanvasImageSource): PixiTexture {
    const cached = this._textureCache.get(image)
    if (cached) return cached
    const source = this._isCanvasLike(image)
      ? new CanvasSource({ resource: image })
      : new ImageSource({ resource: image })
    const texture = new PixiTexture({ source })
    this._textureCache.set(image, texture)
    return texture
  }

  private _isCanvasLike(image: CanvasImageSource): boolean {
    const maybeCanvas = image as { getContext?: (...args: unknown[]) => unknown }
    return typeof maybeCanvas.getContext === "function"
  }
}
