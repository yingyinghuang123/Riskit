// ─── 资源管理器 — 加载管线入口 ───────────────────────────────────

import { AssetCache } from './cache'
import { loadImage } from './loader-image'
import { loadAudio } from './loader-audio'
import { loadFont } from './loader-font'
import { loadAtlas, type AtlasAsset } from './loader-atlas'
import { loadSubpackage } from './subpackage'

// ─── 加载配置类型 ──────────────────────────────────────────────

export interface LoadConfig {
  /** 图片 { id: 路径 } */
  images?: Record<string, string>
  /** 图集 { id: 路径(json) } */
  atlas?: Record<string, string>
  /** 音频 { id: 路径 } */
  audio?: Record<string, string>
  /** 字体 { family: 路径 } */
  fonts?: Record<string, string>
  /** 分包名列表 */
  subpackages?: string[]
  /** 进度回调 (loaded, total) */
  onProgress?: (loaded: number, total: number) => void
}

// ─── AssetManager ──────────────────────────────────────────────

export class AssetManager {
  readonly cache = new AssetCache()

  /** 加载资源 */
  async load(config: LoadConfig): Promise<void> {
    const tasks: Array<() => Promise<void>> = []
    let loaded = 0
    let total = 0

    const { images, atlas, audio, fonts, subpackages, onProgress } = config

    // 统计总数
    if (images) total += Object.keys(images).length
    if (atlas) total += Object.keys(atlas).length
    if (audio) total += Object.keys(audio).length
    if (fonts) total += Object.keys(fonts).length
    if (subpackages) total += subpackages.length

    const tick = () => {
      loaded++
      onProgress?.(loaded, total)
    }

    // 分包优先
    if (subpackages) {
      for (const name of subpackages) {
        tasks.push(async () => {
          await loadSubpackage(name)
          tick()
        })
      }
    }

    // 图片
    if (images) {
      for (const [id, src] of Object.entries(images)) {
        tasks.push(async () => {
          try {
            const result = await loadImage(src)
            this.cache.set(id, result.image, 'image', 0, result.width * result.height * 4)
          } catch (e) {
            console.warn(`[Assets] 图片 "${id}" 加载失败:`, e)
          }
          tick()
        })
      }
    }

    // 图集
    if (atlas) {
      for (const [id, src] of Object.entries(atlas)) {
        tasks.push(async () => {
          try {
            const result = await loadAtlas(src)
            this.cache.set(id, result, 'atlas')
          } catch (e) {
            console.warn(`[Assets] 图集 "${id}" 加载失败:`, e)
          }
          tick()
        })
      }
    }

    // 音频
    if (audio) {
      for (const [id, src] of Object.entries(audio)) {
        tasks.push(async () => {
          try {
            const result = await loadAudio(src)
            this.cache.set(id, result, 'audio')
          } catch (e) {
            console.warn(`[Assets] 音频 "${id}" 加载失败:`, e)
          }
          tick()
        })
      }
    }

    // 字体
    if (fonts) {
      for (const [family, src] of Object.entries(fonts)) {
        tasks.push(async () => {
          try {
            const result = await loadFont(src, family)
            this.cache.set(family, result, 'font')
          } catch (e) {
            console.warn(`[Assets] 字体 "${family}" 加载失败:`, e)
          }
          tick()
        })
      }
    }

    // 并行执行
    await Promise.all(tasks.map(fn => fn()))
  }

  /** 获取图片 */
  getImage(id: string): WxImage | undefined {
    return this.cache.get<WxImage>(id)
  }

  /** 获取图集 */
  getAtlas(id: string): AtlasAsset | undefined {
    return this.cache.get<AtlasAsset>(id)
  }

  /** 获取音频 */
  getAudio(id: string): any {
    const asset = this.cache.get<any>(id)
    return asset?.context ?? asset
  }

  /** 卸载单个资源 */
  unload(id: string): void {
    this.cache.release(id)
    this.cache.purge()
  }

  /** 卸载场景相关资源（通过前缀匹配） */
  unloadScene(sceneId: string): void {
    const prefix = `${sceneId}/`
    for (const type of ['image', 'atlas', 'audio', 'font']) {
      for (const id of this.cache.getIdsByType(type)) {
        if (id.startsWith(prefix)) {
          this.cache.release(id)
        }
      }
    }
    this.cache.purge()
  }

  /** 清空所有缓存 */
  clear(): void {
    this.cache.clear()
  }
}
