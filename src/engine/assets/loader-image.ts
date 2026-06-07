// ─── 图片加载器 ─────────────────────────────────────────────────

import { getPlatform } from '../platform/platform'

export interface ImageLoadResult {
  image: WxImage
  width: number
  height: number
}

/** 加载单张图片 */
export function loadImage(src: string): Promise<ImageLoadResult> {
  return new Promise((resolve, reject) => {
    try {
      const platform = getPlatform()
      const img = platform.createImage()
      img.onload = () => {
        resolve({
          image: img,
          width: img.width,
          height: img.height,
        })
      }
      img.onerror = (err: any) => {
        reject(new Error(`图片加载失败: ${src} — ${err?.message ?? err}`))
      }
      img.src = src
    } catch (e) {
      reject(new Error(`图片加载异常: ${src} — ${e}`))
    }
  })
}
