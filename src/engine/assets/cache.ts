import { getPlatform } from "../platform/platform"

// ─── 资源缓存 — 引用计数 + 内存管理 ──────────────────────────────

export interface CacheEntry<T = any> {
  id: string
  data: T
  type: string
  refCount: number
  priority: number
  size?: number
}

export class AssetCache {
  private _entries = new Map<string, CacheEntry>()
  private _memoryWarning = false

  constructor() {
    try {
      getPlatform().onMemoryWarning(() => {
        this._memoryWarning = true
        this.purge()
      })
    } catch {
      /* 平台不支持 */
    }
  }

  /** 存入缓存 */
  set<T>(id: string, data: T, type: string, priority = 0, size?: number): void {
    const existing = this._entries.get(id)
    if (existing) {
      existing.data = data
      existing.refCount++
      return
    }
    this._entries.set(id, { id, data, type, refCount: 1, priority, size })
  }

  /** 获取资源 */
  get<T>(id: string): T | undefined {
    return this._entries.get(id)?.data as T | undefined
  }

  /** 是否存在 */
  has(id: string): boolean {
    return this._entries.has(id)
  }

  /** 增加引用计数 */
  retain(id: string): void {
    const entry = this._entries.get(id)
    if (entry) entry.refCount++
  }

  /** 减少引用计数 */
  release(id: string): void {
    const entry = this._entries.get(id)
    if (entry) {
      entry.refCount = Math.max(0, entry.refCount - 1)
    }
  }

  /** 释放单个资源 */
  remove(id: string): boolean {
    return this._entries.delete(id)
  }

  /** 清理无引用资源 */
  purge(forceLowPriority = false): number {
    let count = 0
    const threshold = forceLowPriority || this._memoryWarning ? 1 : 0

    for (const [id, entry] of this._entries) {
      if (entry.refCount <= 0 && entry.priority <= threshold) {
        this._entries.delete(id)
        count++
      }
    }

    if (this._memoryWarning) {
      this._memoryWarning = false
    }
    return count
  }

  /** 清空所有缓存 */
  clear(): void {
    this._entries.clear()
  }

  /** 按类型获取所有 ID */
  getIdsByType(type: string): string[] {
    const ids: string[] = []
    for (const [id, entry] of this._entries) {
      if (entry.type === type) ids.push(id)
    }
    return ids
  }

  /** 缓存大小 */
  get size(): number {
    return this._entries.size
  }

  /** 估算总内存（如果有 size 字段） */
  get estimatedMemory(): number {
    let total = 0
    for (const entry of this._entries.values()) {
      total += entry.size ?? 0
    }
    return total
  }
}
