// ─── 音频加载器 ─────────────────────────────────────────────────

import { getPlatform, type PlatformAudioContext } from "../platform/platform"

export interface AudioAsset {
  context: PlatformAudioContext
  src: string
}

/** 加载音频，预加载到可播放状态 */
export function loadAudio(src: string): Promise<AudioAsset> {
  return new Promise((resolve, reject) => {
    try {
      const ctx = getPlatform().createAudioContext()
      ctx.src = src

      const onCanplay = () => {
        cleanup()
        resolve({ context: ctx, src })
      }
      const onError = (err: any) => {
        cleanup()
        reject(new Error(`音频加载失败: ${src} — ${err?.errMsg ?? err}`))
      }
      const cleanup = () => {
        ctx.offCanplay(onCanplay)
        ctx.offError(onError)
      }

      ctx.onCanplay(onCanplay)
      ctx.onError(onError)
    } catch (e) {
      reject(new Error(`音频加载异常: ${src} — ${e}`))
    }
  })
}
