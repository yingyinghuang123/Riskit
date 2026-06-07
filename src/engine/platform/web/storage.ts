// ─── 浏览器 Storage 实现（localStorage） ─────────────────────────

import type { StorageInfo, PlatformStorage } from "../services"

export class WebStorage implements PlatformStorage {
  save(key: string, data: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  }

  load<T = unknown>(key: string, defaultValue?: T): T | null {
    try {
      const val = localStorage.getItem(key)
      if (val === null) return defaultValue ?? null
      return JSON.parse(val) as T
    } catch {
      return defaultValue ?? null
    }
  }

  async saveAsync(key: string, data: unknown, _encrypt?: boolean): Promise<boolean> {
    return this.save(key, data)
  }

  async loadAsync<T = unknown>(key: string, _encrypt?: boolean): Promise<T | null> {
    return this.load<T>(key)
  }

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }

  clear(): boolean {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  }

  getInfo(): StorageInfo {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) keys.push(key)
    }
    // localStorage 容量约 5MB，无法精确获取已用空间
    return { keys, currentSize: 0, limitSize: 5 * 1024 * 1024 }
  }

  destroy(): void {
    // 无需清理
  }
}
