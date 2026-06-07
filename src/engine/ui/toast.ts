import { Graphics as PixiGraphics, Text as PixiText, TextStyle as PixiTextStyle } from "pixi.js"
import { UINode } from "./ui-node"
import { RenderLayer } from "../render/layers"

interface ToastItem {
  text: string
  duration: number
  elapsed: number
  alpha: number
}

export class Toast extends UINode {
  private _queue: ToastItem[] = []
  private _current: ToastItem | null = null
  private _screenW = 750
  private _screenH = 1334

  private _pillGfx: PixiGraphics
  private _toastText: PixiText

  constructor(screenW = 750, screenH = 1334) {
    super()
    this._screenW = screenW
    this._screenH = screenH
    this.layer = RenderLayer.Overlay
    this.interactive = false
    this.visible = true

    this._pillGfx = new PixiGraphics()
    this._toastText = new PixiText()
    this._toastText.anchor.set(0.5, 0.5)
    this._pixiObj.addChild(this._pillGfx)
    this._pixiObj.addChild(this._toastText)
  }

  show(text: string, duration = 2): void {
    this._queue.push({ text, duration, elapsed: 0, alpha: 0 })
    if (!this._current) this._next()
  }

  private _next(): void {
    if (this._queue.length === 0) {
      this._current = null
      return
    }
    this._current = this._queue.shift() ?? null
  }

  update(dt: number): void {
    if (!this._current) return
    const item = this._current

    item.elapsed += dt

    const fadeIn = 0.2
    const fadeOut = 0.3
    if (item.elapsed < fadeIn) {
      item.alpha = item.elapsed / fadeIn
    } else if (item.elapsed < item.duration - fadeOut) {
      item.alpha = 1
    } else if (item.elapsed < item.duration) {
      item.alpha = (item.duration - item.elapsed) / fadeOut
    } else {
      this._next()
    }
  }

  _syncPixi(): void {
    if (!this._current || this._current.alpha <= 0) {
      this._pillGfx.visible = false
      this._toastText.visible = false
      return
    }

    const item = this._current
    const fontSize = 26
    this._toastText.text = item.text
    this._toastText.style = new PixiTextStyle({
      fontSize,
      fontFamily: "sans-serif",
      fill: "#ffffff",
      align: "center",
    })

    const textW = this._toastText.width
    const padX = 32
    const padY = 14
    const w = textW + padX * 2
    const h = fontSize + padY * 2
    const x = (this._screenW - w) / 2
    const y = this._screenH * 0.4

    this._pillGfx.visible = true
    this._toastText.visible = true
    this._pillGfx.alpha = item.alpha
    this._toastText.alpha = item.alpha

    this._pillGfx.clear()
    this._pillGfx.roundRect(x, y, w, h, h / 2)
    this._pillGfx.fill({ color: 0x000000 })

    this._toastText.x = x + w / 2
    this._toastText.y = y + h / 2
  }
}
