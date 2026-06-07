// ─── 云开发模块 ──────────────────────────────────────────────────────

import type { CloudConfig, CloudQuery, CloudResult, CloudWatcher, PlatformCloud } from "../services"
export class WxCloud implements PlatformCloud {
  private _db: WxCloudDatabase | null = null
  private _initialized = false
  private _watchers: Set<WxCloudWatcher> = new Set()

  /** 初始化云开发 */
  init(config: CloudConfig): boolean {
    if (this._initialized) {
      console.warn("[WxCloud] 已初始化，如需切换 env 请先调用 destroy()")
      return true
    }
    try {
      const cloud = wx.cloud
      if (!cloud) return false
      cloud.init({ env: config.env, traceUser: config.traceUser ?? true })
      this._initialized = true
      return true
    } catch {
      return false
    }
  }

  /** 获取 database 实例（懒初始化） */
  private _getDB(): WxCloudDatabase | null {
    if (this._db) return this._db
    if (!this._initialized) {
      console.warn('[WxCloud] 尚未初始化，请先调用 cloud.init({ env: "..." })')
      return null
    }
    try {
      const cloud = wx.cloud
      if (!cloud) return null
      this._db = cloud.database()
      return this._db
    } catch (e) {
      console.warn("[WxCloud] 获取 database 失败", e)
      return null
    }
  }

  /** 从 CloudQuery 构建微信查询链 */
  private _buildQuery(db: WxCloudDatabase, collection: string, query?: CloudQuery): WxCloudQuery | WxCloudCollection {
    let q: WxCloudQuery | WxCloudCollection = db.collection(collection)
    if (query?.where) q = (q as WxCloudCollection).where(query.where)
    if (query?.orderBy) q = q.orderBy(query.orderBy.field, query.orderBy.direction)
    if (query?.skip) q = q.skip(query.skip)
    if (query?.limit) q = q.limit(query.limit)
    return q
  }

  // ─── 数据库 CRUD ───

  /** 添加数据 */
  async add(collection: string, data: Record<string, unknown>): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const db = this._getDB()
        if (!db) {
          resolve(null)
          return
        }
        db.collection(collection).add({
          data,
          success: (res) => resolve(res._id),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  /** 查询数据 */
  async get<T = Record<string, unknown>>(collection: string, query?: CloudQuery): Promise<T[]> {
    return new Promise((resolve) => {
      try {
        const db = this._getDB()
        if (!db) {
          resolve([])
          return
        }
        const q = this._buildQuery(db, collection, query)
        q.get({
          success: (res) => resolve(res.data as T[]),
          fail: () => resolve([]),
        })
      } catch {
        resolve([])
      }
    })
  }

  /** 查询单条（按 _id） */
  async getById<T = Record<string, unknown>>(collection: string, id: string): Promise<T | null> {
    return new Promise((resolve) => {
      try {
        const db = this._getDB()
        if (!db) {
          resolve(null)
          return
        }
        db.collection(collection)
          .doc(id)
          .get({
            success: (res) => resolve(res.data as T),
            fail: () => resolve(null),
          })
      } catch {
        resolve(null)
      }
    })
  }

  /** 更新数据 */
  async update(collection: string, id: string, data: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const db = this._getDB()
        if (!db) {
          resolve(false)
          return
        }
        db.collection(collection)
          .doc(id)
          .update({
            data,
            success: () => resolve(true),
            fail: () => resolve(false),
          })
      } catch {
        resolve(false)
      }
    })
  }

  /** 删除数据 */
  async remove(collection: string, id: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const db = this._getDB()
        if (!db) {
          resolve(false)
          return
        }
        db.collection(collection)
          .doc(id)
          .remove({
            success: () => resolve(true),
            fail: () => resolve(false),
          })
      } catch {
        resolve(false)
      }
    })
  }

  /** 计数 */
  async count(collection: string, query?: CloudQuery): Promise<number> {
    return new Promise((resolve) => {
      try {
        const db = this._getDB()
        if (!db) {
          resolve(0)
          return
        }
        const q = this._buildQuery(db, collection, query ? { where: query.where } : undefined)
        q.count({
          success: (res) => resolve(res.total),
          fail: () => resolve(0),
        })
      } catch {
        resolve(0)
      }
    })
  }

  // ─── 用户数据快捷方法 ───

  /** 保存当前用户数据（自动关联 openid） */
  async saveUserData(data: Record<string, unknown>): Promise<boolean> {
    try {
      const existing = await this.get<{ _id: string }>("user_data", {
        where: { _openid: "{openid}" },
        limit: 1,
      })
      if (existing.length > 0) {
        return await this.update("user_data", existing[0]._id, data)
      } else {
        const id = await this.add("user_data", data)
        return id !== null
      }
    } catch {
      return false
    }
  }

  /** 加载当前用户数据 */
  async loadUserData<T = Record<string, unknown>>(): Promise<T | null> {
    try {
      const results = await this.get<T>("user_data", { where: { _openid: "{openid}" }, limit: 1 })
      return results.length > 0 ? results[0] : null
    } catch {
      return null
    }
  }

  // ─── 排行榜 ───

  /** 获取排行榜（按指定字段降序） */
  async getLeaderboard<T = Record<string, unknown>>(collection: string, field: string, limit = 10): Promise<T[]> {
    return this.get<T>(collection, {
      orderBy: { field, direction: "desc" },
      limit,
    })
  }

  // ─── 实时监听 ───

  /** 监听集合变化 */
  watch(
    collection: string,
    query: Record<string, unknown>,
    onChange: (snapshot: WxCloudSnapshot) => void,
    onError?: (err: Error) => void,
  ): CloudWatcher {
    try {
      const db = this._getDB()
      if (!db) {
        return { close: () => {} }
      }
      const raw = db
        .collection(collection)
        .where(query)
        .watch({
          onChange,
          onError: onError ? (e: { errMsg: string }) => onError(new Error(e.errMsg)) : undefined,
        })
      this._watchers.add(raw)
      // 包装 watcher 以便用户手动关闭时自动清理
      const watcher: CloudWatcher = {
        close: () => {
          raw.close()
          this._watchers.delete(raw)
        },
      }
      return watcher
    } catch {
      return { close: () => {} }
    }
  }

  // ─── 云函数 ───

  /** 调用云函数 */
  async callFunction<T = unknown>(name: string, data?: Record<string, unknown>): Promise<CloudResult<T> | null> {
    return new Promise((resolve) => {
      try {
        const cloud = wx.cloud
        if (!cloud) {
          resolve(null)
          return
        }
        cloud.callFunction({
          name,
          data,
          success: (res) => resolve({ data: res.result as T, errMsg: res.errMsg }),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  // ─── 云存储 ───

  /** 上传文件 */
  async uploadFile(cloudPath: string, filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const cloud = wx.cloud
        if (!cloud) {
          resolve(null)
          return
        }
        cloud.uploadFile({
          cloudPath,
          filePath,
          success: (res) => resolve(res.fileID),
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  /** 获取临时文件 URL */
  async getFileUrl(fileId: string): Promise<string | null> {
    return new Promise((resolve) => {
      try {
        const cloud = wx.cloud
        if (!cloud) {
          resolve(null)
          return
        }
        cloud.getTempFileURL({
          fileList: [fileId],
          success: (res) => {
            if (res.fileList.length > 0 && res.fileList[0].status === 0) {
              resolve(res.fileList[0].tempFileURL)
            } else {
              resolve(null)
            }
          },
          fail: () => resolve(null),
        })
      } catch {
        resolve(null)
      }
    })
  }

  /** 删除文件 */
  async deleteFile(fileId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const cloud = wx.cloud
        if (!cloud) {
          resolve(false)
          return
        }
        cloud.deleteFile({
          fileList: [fileId],
          success: (res) => {
            if (res.fileList.length > 0 && res.fileList[0].status === 0) {
              resolve(true)
            } else {
              resolve(false)
            }
          },
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }

  /** 销毁：关闭所有 watcher 并释放资源 */
  destroy(): void {
    for (const raw of this._watchers) {
      try {
        raw.close()
      } catch {
        /* 静默 */
      }
    }
    this._watchers.clear()
    this._db = null
    this._initialized = false
  }
}
