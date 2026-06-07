// ─── 存档管理 ──────────────────────────────────────────────────────

import type { StorageInfo, PlatformStorage } from "../services"

export class WxStorage implements PlatformStorage {
  /** 同步保存 */
  save(key: string, data: unknown): boolean {
    try {
      wx.setStorageSync(key, data)
      return true
    } catch {
      return false
    }
  }

  /** 同步读取 */
  load<T = unknown>(key: string, defaultValue?: T): T | null {
    try {
      const val = wx.getStorageSync<T>(key)
      return val !== undefined ? val : (defaultValue ?? null)
    } catch {
      return defaultValue ?? null
    }
  }

  /** 异步保存（可加密） */
  async saveAsync(key: string, data: unknown, encrypt = false): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        wx.setStorage({
          key,
          data,
          encrypt,
          success: () => resolve(true),
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }

  /** 异步读取（可加密） */
  async loadAsync<T = unknown>(key: string, encrypt = false): Promise<T | null> {
    return new Promise((resolve) => {
      try {
        wx.getStorage({
          key,
          encrypt,
          success: (res) => resolve(res.data as T),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  /** 删除指定键 */
  remove(key: string): boolean {
    try {
      wx.removeStorageSync(key)
      return true
    } catch {
      return false
    }
  }

  /** 清空所有数据 */
  clear(): boolean {
    try {
      wx.clearStorageSync()
      return true
    } catch {
      return false
    }
  }

  /** 获取存储信息 */
  getInfo(): StorageInfo {
    try {
      return wx.getStorageInfoSync()
    } catch {
      return { keys: [], currentSize: 0, limitSize: 0 }
    }
  }

  destroy(): void {
    // 无需清理
  }
}
