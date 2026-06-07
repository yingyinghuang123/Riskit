// ─── 登录与用户信息 ──────────────────────────────────────────────────

import type { LoginResult, PlatformAuth } from "../services"
export class WxAuth implements PlatformAuth {
  /** 登录获取 code */
  async login(): Promise<LoginResult | null> {
    return new Promise((resolve) => {
      try {
        wx.login({
          success: (res) => resolve({ code: res.code }),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  /** 获取用户信息 */
  async getUserInfo(): Promise<Record<string, unknown> | null> {
    return new Promise((resolve) => {
      try {
        wx.getUserInfo({
          success: (res) => resolve(res.userInfo as unknown as Record<string, unknown>),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  /** 检查会话是否有效 */
  async checkSession(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        wx.checkSession({
          success: () => resolve(true),
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }

  /** 获取当前授权设置 */
  async getSetting(): Promise<Record<string, boolean>> {
    return new Promise((resolve) => {
      try {
        wx.getSetting({
          success: (res) => resolve(res.authSetting as Record<string, boolean>),
          fail: () => resolve({}),
        })
      } catch {
        resolve({})
      }
    })
  }

  /** 请求授权 */
  async authorize(scope: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        wx.authorize({
          scope,
          success: () => resolve(true),
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }

  destroy(): void {
    // 无需清理
  }
}
