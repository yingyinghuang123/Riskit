// ─── 图集加载器 (TexturePacker JSON + 图片) ─────────────────────

import { getPlatform } from "../platform/platform"
import { loadImage } from "./loader-image"

export interface AtlasFrame {
  x: number
  y: number
  w: number
  h: number
  /** 原始尺寸 */
  sourceW?: number
  sourceH?: number
  /** 偏移 */
  offsetX?: number
  offsetY?: number
}

export interface AtlasAsset {
  image: WxImage
  frames: Map<string, AtlasFrame>
  src: string
}

/** TexturePacker JSON 格式 */
interface TPJsonData {
  frames:
    | Record<
        string,
        {
          frame: { x: number; y: number; w: number; h: number }
          sourceSize?: { w: number; h: number }
          spriteSourceSize?: { x: number; y: number }
        }
      >
    | Array<{
        filename: string
        frame: { x: number; y: number; w: number; h: number }
        sourceSize?: { w: number; h: number }
        spriteSourceSize?: { x: number; y: number }
      }>
  meta?: { image?: string }
}

/** 加载图集 */
export async function loadAtlas(jsonSrc: string): Promise<AtlasAsset> {
  try {
    // 读取 JSON
    const jsonStr = await readFile(jsonSrc)
    const json: TPJsonData = JSON.parse(jsonStr)

    // 推断图片路径
    let imgSrc = json.meta?.image
    if (!imgSrc) {
      imgSrc = jsonSrc.replace(/\.json$/i, ".png")
    } else if (!imgSrc.startsWith("/") && !imgSrc.startsWith("http")) {
      // 相对路径
      const dir = jsonSrc.substring(0, jsonSrc.lastIndexOf("/") + 1)
      imgSrc = dir + imgSrc
    }

    // 加载图片
    const { image } = await loadImage(imgSrc)

    // 解析帧数据
    const frames = new Map<string, AtlasFrame>()
    const rawFrames = json.frames

    if (Array.isArray(rawFrames)) {
      for (const f of rawFrames) {
        frames.set(f.filename, {
          x: f.frame.x,
          y: f.frame.y,
          w: f.frame.w,
          h: f.frame.h,
          sourceW: f.sourceSize?.w,
          sourceH: f.sourceSize?.h,
          offsetX: f.spriteSourceSize?.x,
          offsetY: f.spriteSourceSize?.y,
        })
      }
    } else {
      for (const [name, f] of Object.entries(rawFrames)) {
        frames.set(name, {
          x: f.frame.x,
          y: f.frame.y,
          w: f.frame.w,
          h: f.frame.h,
          sourceW: f.sourceSize?.w,
          sourceH: f.sourceSize?.h,
          offsetX: f.spriteSourceSize?.x,
          offsetY: f.spriteSourceSize?.y,
        })
      }
    }

    return { image, frames, src: jsonSrc }
  } catch (e) {
    throw new Error(`图集加载失败: ${jsonSrc} — ${e}`)
  }
}

function readFile(path: string): Promise<string> {
  return getPlatform().readFile(path, "utf-8")
}
