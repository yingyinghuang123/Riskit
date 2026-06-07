// ─── Container 容器节点 ──────────────────────────────────────────

import { Node } from "./node"
import { Graphics as PixiGraphics } from "pixi.js"

export class Container extends Node {
  /** 裁剪子节点到自身区域 */
  clip = false

  private _clipMask: PixiGraphics | null = null

  _syncPixi(): void {
    if (this.clip && this.width > 0 && this.height > 0) {
      if (!this._clipMask) {
        this._clipMask = new PixiGraphics()
        // mask 添加到 _pixiObj 上（PixiJS 要求 mask 是 displayObject）
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
