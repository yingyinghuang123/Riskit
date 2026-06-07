// ─── 前后台生命周期自动管理 ────────────────────────────────────────

import type { MiniEngine } from "../../engine"
import type { WxShare } from "./share"

export class WxLifecycle {
  private _engine: MiniEngine | null = null
  private _share: WxShare | null = null
  private _onShowHandler:
    | ((res: { query: Record<string, string>; shareTicket?: string; scene?: number }) => void)
    | null = null
  private _onHideHandler: (() => void) | null = null
  private _wasRunning = false

  /** 初始化生命周期管理，绑定引擎实例 */
  init(engine: MiniEngine, share?: WxShare): this {
    this._engine = engine
    this._share = share ?? null

    this._onHideHandler = () => {
      if (!this._engine) return
      this._wasRunning = this._engine.running && !this._engine.paused
      if (this._wasRunning) {
        this._engine.pause()
      }
    }

    this._onShowHandler = (res) => {
      if (!this._engine) return
      if (this._wasRunning) {
        this._engine.resume()
      }
      // 通知分享模块
      if (res.query && Object.keys(res.query).length > 0) {
        this._share?._notifyReceive(res.query)
      }
    }

    try {
      wx.onHide(this._onHideHandler)
      wx.onShow(this._onShowHandler)
    } catch {
      /* 静默 */
    }

    return this
  }

  destroy(): void {
    if (this._onHideHandler) {
      try {
        wx.offHide(this._onHideHandler)
      } catch {
        /* 静默 */
      }
      this._onHideHandler = null
    }
    if (this._onShowHandler) {
      try {
        wx.offShow(this._onShowHandler)
      } catch {
        /* 静默 */
      }
      this._onShowHandler = null
    }
    this._engine = null
    this._share = null
  }
}
