// ─── scene.ui.* UI 工厂 ──────────────────────────────────────────

import { Button } from "./button"
import { Label, type LabelStyle } from "./label"
import { Panel, type PanelStyle } from "./panel"
import { ProgressBar, type ProgressBarStyle } from "./progress-bar"
import { Slider, type SliderStyle } from "./slider"
import { Toggle } from "./toggle"
import { Dialog, type DialogConfig } from "./dialog"
import { Toast } from "./toast"
import { vbox, hbox, type LayoutOptions } from "./layout"
import { Node } from "../nodes/node"

export class UIFactory {
  private _root: Node
  private _screenW: number
  private _screenH: number
  private _toast: Toast | null = null

  constructor(root: Node, screenW: number, screenH: number) {
    this._root = root
    this._screenW = screenW
    this._screenH = screenH
  }

  // ── 控件创建 ──────────────────────────────────────────────────

  button(text: string, x = 0, y = 0, onClick?: () => void): Button {
    const btn = new Button(text, x, y, onClick)
    this._root.addChild(btn)
    return btn
  }

  label(text: string, x = 0, y = 0, style?: LabelStyle): Label {
    const lbl = new Label(text, x, y, style)
    this._root.addChild(lbl)
    return lbl
  }

  panel(x = 0, y = 0, w = 300, h = 200, style?: PanelStyle): Panel {
    const p = new Panel(x, y, w, h)
    if (style) p.setPanelStyle(style)
    this._root.addChild(p)
    return p
  }

  progressBar(x = 0, y = 0, w = 200, h = 20, style?: ProgressBarStyle): ProgressBar {
    const bar = new ProgressBar(x, y, w, h)
    if (style) bar.setBarStyle(style)
    this._root.addChild(bar)
    return bar
  }

  slider(x = 0, y = 0, w = 200, style?: SliderStyle): Slider {
    const s = new Slider(x, y, w)
    if (style) s.setSliderStyle(style)
    this._root.addChild(s)
    return s
  }

  toggle(x = 0, y = 0, value = false): Toggle {
    const t = new Toggle(x, y, value)
    this._root.addChild(t)
    return t
  }

  // ── 弹窗 / Toast / 布局 ──────────────────────────────────────

  dialog(config: DialogConfig): Promise<number> {
    const dlg = new Dialog(config)
    this._root.addChild(dlg)
    return dlg.show(this._screenW, this._screenH)
  }

  async confirm(text: string): Promise<boolean> {
    const dlg = new Dialog({
      content: text,
      buttons: ["取消", "确定"],
    })
    this._root.addChild(dlg)
    const idx = await dlg.show(this._screenW, this._screenH)
    return idx === 1
  }

  toast(text: string, duration?: number): void {
    if (!this._toast) {
      this._toast = new Toast(this._screenW, this._screenH)
      this._root.addChild(this._toast)
    }
    this._toast.show(text, duration)
  }

  vbox(x: number, y: number, opts: LayoutOptions, children: Node[]): Node {
    const node = vbox(x, y, opts, children)
    this._root.addChild(node)
    return node
  }

  hbox(x: number, y: number, opts: LayoutOptions, children: Node[]): Node {
    const node = hbox(x, y, opts, children)
    this._root.addChild(node)
    return node
  }
}
