import { Graphics as PixiGraphics, Text as PixiText, TextStyle as PixiTextStyle } from "pixi.js"
import { UINode } from "./ui-node"
import { Node } from "../nodes/node"
import { Button } from "./button"
import { RenderLayer } from "../render/layers"
import { parseCssColor } from "../utils/color"

export interface DialogConfig {
  title?: string
  content?: string
  buttons?: string[]
  maskClose?: boolean
  maskColor?: string
  width?: number
  bg?: string
  radius?: number
  titleSize?: number
  contentSize?: number
}

export class Dialog extends UINode {
  private _config: DialogConfig = {}
  private _resolve: ((index: number) => void) | null = null
  private _panel: Node | null = null
  private _opening = true
  private _openProgress = 0

  private _maskGfx: PixiGraphics
  private _panelGfx: PixiGraphics | null = null
  private _titleText: PixiText | null = null
  private _contentText: PixiText | null = null

  constructor(config: DialogConfig = {}) {
    super()
    this._config = {
      buttons: ["确定"],
      maskClose: false,
      maskColor: "rgba(0,0,0,0.5)",
      width: 500,
      bg: "#2a2a3e",
      radius: 16,
      titleSize: 32,
      contentSize: 24,
      ...config,
    }
    this.layer = RenderLayer.Overlay
    this.interactive = true
    this.blockTouch = true

    this._maskGfx = new PixiGraphics()
    this._pixiObj.addChild(this._maskGfx)
  }

  show(screenW: number, screenH: number): Promise<number> {
    this.x = 0
    this.y = 0
    this.width = screenW
    this.height = screenH
    this._opening = true
    this._openProgress = 0
    this.visible = true

    const panelW = this._config.width ?? 500
    const panelH = this._calcPanelHeight()
    const panelX = (screenW - panelW) / 2
    const panelY = (screenH - panelH) / 2

    if (this._panel) this.removeChild(this._panel)
    const panel = new Node()
    panel.x = panelX
    panel.y = panelY
    panel.width = panelW
    panel.height = panelH
    this._panel = panel
    this.addChild(panel)

    this._panelGfx = new PixiGraphics()
    this._titleText = new PixiText()
    this._titleText.anchor.set(0.5, 0)
    this._contentText = new PixiText()
    this._contentText.anchor.set(0.5, 0)
    panel._pixiObj.addChild(this._panelGfx)
    panel._pixiObj.addChild(this._titleText)
    panel._pixiObj.addChild(this._contentText)

    const btnNames = this._config.buttons ?? ["确定"]
    const btnSpacing = 20
    const btnW = (panelW - 60 - (btnNames.length - 1) * btnSpacing) / btnNames.length
    for (let i = 0; i < btnNames.length; i++) {
      const btnX = 30 + i * (btnW + btnSpacing) + btnW / 2
      const btnY = panelH - 30 - 44 + 22
      const btn = new Button(btnNames[i], btnX, btnY, () => this._close(i))
      btn.setStyle({ radius: 8, fontSize: 24, padding: [10, 20] })
      btn.setSize(btnW, 44)
      panel.addChild(btn)
    }

    if (this._config.maskClose) {
      this.on("tap", (e) => {
        if (!this._panel) return
        const left = this._panel.x
        const top = this._panel.y
        if (e.x < left || e.x > left + panelW || e.y < top || e.y > top + panelH) this._close(-1)
      })
    }

    return new Promise<number>((resolve) => {
      this._resolve = resolve
    })
  }

  private _close(index: number): void {
    this._resolve?.(index)
    this._resolve = null
    this._panel = null
    this._panelGfx = null
    this._titleText = null
    this._contentText = null
    this.destroy()
  }

  private _calcPanelHeight(): number {
    const { title, content, titleSize = 32, contentSize = 24 } = this._config
    let h = 30
    if (title) h += titleSize + 20
    if (content) {
      const panelW = this._config.width ?? 500
      const charsPerLine = Math.max(1, Math.floor((panelW - 60) / (contentSize * 0.6)))
      const lines = content.split("\n").reduce((sum, p) => sum + Math.max(1, Math.ceil(p.length / charsPerLine)), 0)
      h += contentSize * 1.4 * lines + 20
    }
    h += 44 + 30
    return Math.max(200, h)
  }

  update(dt: number): void {
    if (this._opening && this._openProgress < 1) this._openProgress = Math.min(1, this._openProgress + dt * 6)
    this.alpha = this._openProgress

    if (this._panel) {
      const scale = 0.8 + 0.2 * this._openProgress
      this._panel.scaleX = scale
      this._panel.scaleY = scale
    }
  }

  _syncPixi(): void {
    const maskColor = this._config.maskColor ?? "rgba(0,0,0,0.5)"
    this._maskGfx.clear()
    this._maskGfx.rect(0, 0, this.width, this.height)
    this._maskGfx.fill(parseCssColor(maskColor))
    this._maskGfx.alpha = parseCssColor(maskColor).alpha

    if (!this._panel || !this._panelGfx || !this._titleText || !this._contentText) return

    const panelW = this._config.width ?? 500
    const panelH = this._calcPanelHeight()
    const radius = this._config.radius ?? 16
    const title = this._config.title ?? ""
    const content = this._config.content ?? ""
    const titleSize = this._config.titleSize ?? 32
    const contentSize = this._config.contentSize ?? 24

    this._panelGfx.clear()
    this._panelGfx.roundRect(0, 0, panelW, panelH, Math.min(radius, panelW / 2, panelH / 2))
    this._panelGfx.fill(parseCssColor(this._config.bg ?? "#2a2a3e"))

    this._titleText.visible = title.length > 0
    this._titleText.text = title
    this._titleText.x = panelW / 2
    this._titleText.y = 30
    this._titleText.style = new PixiTextStyle({
      fontSize: titleSize,
      fontFamily: "sans-serif",
      fontWeight: "bold",
      fill: "#ffffff",
      align: "center",
    })

    this._contentText.visible = content.length > 0
    this._contentText.text = content
    this._contentText.x = panelW / 2
    this._contentText.y = title ? titleSize + 50 : 30
    this._contentText.style = new PixiTextStyle({
      fontSize: contentSize,
      fontFamily: "sans-serif",
      fill: "#cccccc",
      align: "center",
      wordWrap: true,
      wordWrapWidth: panelW - 60,
      lineHeight: contentSize * 1.4,
    })
  }
}
