// ─── 分享模块 ──────────────────────────────────────────────────────

import type { ShareOptions, ShareReceiveCallback, PlatformShare } from "../services"
export class WxShare implements PlatformShare {
  private _enabled = false
  private _defaultOptions: ShareOptions = {}
  private _receiveCallbacks: ShareReceiveCallback[] = []
  private _shareMenuCallback: (() => ShareOptions) | null = null

  /** 开启右上角分享按钮 */
  enable(defaultOptions?: ShareOptions): this {
    if (this._enabled) return this
    this._enabled = true
    if (defaultOptions) this._defaultOptions = defaultOptions

    try {
      wx.showShareMenu({ withShareTicket: true, menus: ["shareAppMessage", "shareTimeline"] })
    } catch {
      /* 静默 */
    }

    this._shareMenuCallback = () => ({
      title: this._defaultOptions.title,
      imageUrl: this._defaultOptions.imageUrl,
      query: this._defaultOptions.query,
      imageUrlId: this._defaultOptions.imageUrlId,
    })
    try {
      wx.onShareAppMessage(this._shareMenuCallback)
    } catch {
      /* 静默 */
    }

    return this
  }

  /** 关闭分享 */
  disable(): this {
    if (!this._enabled) return this
    this._enabled = false
    try {
      wx.hideShareMenu()
    } catch {
      /* 静默 */
    }
    if (this._shareMenuCallback) {
      try {
        wx.offShareAppMessage(this._shareMenuCallback)
      } catch {
        /* 静默 */
      }
      this._shareMenuCallback = null
    }
    return this
  }

  /** 主动分享 */
  send(options?: ShareOptions): void {
    try {
      wx.shareAppMessage({
        title: options?.title ?? this._defaultOptions.title,
        imageUrl: options?.imageUrl ?? this._defaultOptions.imageUrl,
        query: options?.query ?? this._defaultOptions.query,
      })
    } catch {
      /* 静默 */
    }
  }

  /** 设置默认分享内容 */
  setDefault(options: ShareOptions): this {
    this._defaultOptions = { ...this._defaultOptions, ...options }
    return this
  }

  /** 被分享打开时回调 */
  onReceive(fn: ShareReceiveCallback): this {
    this._receiveCallbacks.push(fn)
    return this
  }

  /** 取消接收回调 */
  offReceive(fn?: ShareReceiveCallback): this {
    if (fn) {
      const idx = this._receiveCallbacks.indexOf(fn)
      if (idx >= 0) this._receiveCallbacks.splice(idx, 1)
    } else {
      this._receiveCallbacks.length = 0
    }
    return this
  }

  /** 内部：触发分享接收回调（由 lifecycle 调用） */
  _notifyReceive(query: Record<string, string>): void {
    for (const cb of this._receiveCallbacks) {
      try {
        cb(query)
      } catch {
        /* 静默 */
      }
    }
  }

  destroy(): void {
    this.disable()
    this._receiveCallbacks.length = 0
    this._defaultOptions = {}
  }
}
