// ─── 开放数据域 / 排行榜 ──────────────────────────────────────────

import type { FriendData, PlatformSocial } from "../services"

type MessageHandler = (data: Record<string, unknown>) => void

export class WxSocial implements PlatformSocial {
  private _openDataContext: WxOpenDataContext | null = null
  private _messageHandlers: MessageHandler[] = []

  /** 上报分数到排行榜 */
  async setScore(value: number): Promise<boolean> {
    return this._setCloudStorage([
      { key: "score", value: JSON.stringify({ wxgame: { score: value, update_time: Date.now() } }) },
    ])
  }

  /** 上报自定义 KV 数据 */
  async setData(key: string, value: string | number): Promise<boolean> {
    return this._setCloudStorage([
      { key, value: JSON.stringify({ wxgame: { score: 0, update_time: Date.now() }, custom: value }) },
    ])
  }

  /** 获取好友排行数据 */
  async getFriends(): Promise<FriendData[]> {
    return new Promise((resolve) => {
      try {
        ;(wx as any).getFriendCloudStorage({
          keyList: ["score"],
          success: (res: any) => {
            const friends: FriendData[] = (res.data || []).map((item: any) => ({
              avatarUrl: item.avatarUrl || "",
              nickname: item.nickname || "",
              openid: item.openid || "",
              data: (item.KVDataList || []).reduce(
                (acc: Record<string, string>, kv: any) => {
                  acc[kv.key] = kv.value
                  return acc
                },
                {} as Record<string, string>,
              ),
            }))
            resolve(friends)
          },
          fail: () => resolve([]),
        })
      } catch {
        resolve([])
      }
    })
  }

  /** 显示好友排行（向开放数据域发消息） */
  showRankList(): this {
    this.postMessage({ type: "showRankList" })
    return this
  }

  /** 向开放数据域发送消息 */
  postMessage(data: Record<string, unknown>): this {
    try {
      if (!this._openDataContext) {
        this._openDataContext = wx.getOpenDataContext()
      }
      this._openDataContext.postMessage(data)
    } catch {
      /* 静默 */
    }
    return this
  }

  /** 监听来自开放数据域的消息 */
  onMessage(fn: MessageHandler): this {
    this._messageHandlers.push(fn)
    return this
  }

  /** 取消消息监听 */
  offMessage(fn?: MessageHandler): this {
    if (fn) {
      const idx = this._messageHandlers.indexOf(fn)
      if (idx >= 0) this._messageHandlers.splice(idx, 1)
    } else {
      this._messageHandlers.length = 0
    }
    return this
  }

  /** 获取开放数据域 Canvas（用于渲染排行榜） */
  getCanvas(): WxCanvas | null {
    try {
      if (!this._openDataContext) {
        this._openDataContext = wx.getOpenDataContext()
      }
      return this._openDataContext.canvas
    } catch {
      return null
    }
  }

  destroy(): void {
    this._messageHandlers.length = 0
    this._openDataContext = null
  }

  private async _setCloudStorage(kvList: Array<{ key: string; value: string }>): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        ;(wx as any).setUserCloudStorage({
          KVDataList: kvList,
          success: () => resolve(true),
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }
}
