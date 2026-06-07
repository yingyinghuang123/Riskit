// ─── 字体加载器 ─────────────────────────────────────────────────
import { getPlatform } from "../platform/platform"

export interface FontAsset {
  family: string
  src: string
}

export function loadFont(src: string, family?: string): Promise<FontAsset> {
  return new Promise((resolve) => {
    try {
      const fontFamily = family ?? `font_${Date.now()}`
      const result = getPlatform().loadFont(src)
      if (result) {
        resolve({ family: result, src })
      } else {
        resolve({ family: fontFamily, src })
      }
    } catch {
      console.warn(`[Font] 字体加载失败，降级使用系统字体: ${src}`)
      resolve({ family: "sans-serif", src })
    }
  })
}
