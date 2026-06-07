/**
 * 精灵表/图集
 * 支持 TexturePacker JSON (hash) 格式
 */

export interface SpriteFrame {
  /** 帧名 */
  name: string
  /** 在图集中的位置 */
  x: number
  y: number
  w: number
  h: number
  /** 是否旋转 90° */
  rotated: boolean
  /** 是否裁切过 */
  trimmed: boolean
  /** 裁切前源矩形 */
  sourceW: number
  sourceH: number
  /** 裁切偏移 */
  offsetX: number
  offsetY: number
}

export interface SpriteAnimation {
  /** 帧名数组 */
  frames: string[]
  /** 帧率（默认 12） */
  fps?: number
  /** 是否循环（默认 true） */
  loop?: boolean
}

/** TexturePacker JSON Hash 格式 */
interface TPJsonHash {
  frames: Record<string, {
    frame: { x: number; y: number; w: number; h: number }
    rotated: boolean
    trimmed: boolean
    spriteSourceSize: { x: number; y: number; w: number; h: number }
    sourceSize: { w: number; h: number }
  }>
  meta: {
    image: string
    size: { w: number; h: number }
    scale: string
  }
}

export interface SpriteSheet {
  /** 图集纹理 */
  readonly image: WxImage
  /** 获取帧信息 */
  frame(name: string): SpriteFrame | null
  /** 获取所有帧名 */
  frameNames(): string[]
  /** 绘制帧到 Canvas */
  drawFrame(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, w?: number, h?: number): void
}

export interface SpriteAnimator {
  /** 当前帧名 */
  readonly currentFrame: string
  /** 是否播放完毕（非循环动画） */
  readonly finished: boolean
  /** 播放动画 */
  play(animationName: string): void
  /** 更新 */
  update(dt: number): void
  /** 停止 */
  stop(): void
}

/** 从 TexturePacker JSON Hash 格式数据创建精灵表 */
export function createSpriteSheet(image: WxImage, jsonData: TPJsonHash): SpriteSheet {
  const frames = new Map<string, SpriteFrame>()

  for (const [name, data] of Object.entries(jsonData.frames)) {
    frames.set(name, {
      name,
      x: data.frame.x,
      y: data.frame.y,
      w: data.frame.w,
      h: data.frame.h,
      rotated: data.rotated,
      trimmed: data.trimmed,
      sourceW: data.sourceSize.w,
      sourceH: data.sourceSize.h,
      offsetX: data.spriteSourceSize.x,
      offsetY: data.spriteSourceSize.y,
    })
  }

  return {
    image,

    frame(name) {
      return frames.get(name) ?? null
    },

    frameNames() {
      return Array.from(frames.keys())
    },

    drawFrame(ctx, name, x, y, w?, h?) {
      const f = frames.get(name)
      if (!f) return

      const img = image as unknown as CanvasImageSource
      const dw = w ?? f.sourceW
      const dh = h ?? f.sourceH

      if (f.rotated) {
        ctx.save()
        ctx.translate(x + dw / 2, y + dh / 2)
        ctx.rotate(-Math.PI / 2)
        ctx.drawImage(img, f.x, f.y, f.h, f.w, -dh / 2, -dw / 2, dh, dw)
        ctx.restore()
      } else {
        ctx.drawImage(img, f.x, f.y, f.w, f.h, x, y, dw, dh)
      }
    },
  }
}

/** 创建精灵动画控制器 */
export function createSpriteAnimator(animations: Record<string, SpriteAnimation>): SpriteAnimator {
  let currentAnim: SpriteAnimation | null = null
  let currentAnimName = ""
  let frameIndex = 0
  let elapsed = 0
  let _finished = false
  let playing = false

  return {
    get currentFrame() {
      if (!currentAnim) return ""
      return currentAnim.frames[frameIndex] ?? ""
    },

    get finished() {
      return _finished
    },

    play(animationName) {
      const anim = animations[animationName]
      if (!anim) return
      if (currentAnimName === animationName && playing) return
      currentAnim = anim
      currentAnimName = animationName
      frameIndex = 0
      elapsed = 0
      _finished = false
      playing = true
    },

    update(dt) {
      if (!currentAnim || !playing || _finished) return

      const fps = currentAnim.fps ?? 12
      const frameDuration = 1 / fps
      elapsed += dt

      while (elapsed >= frameDuration) {
        elapsed -= frameDuration
        frameIndex++

        if (frameIndex >= currentAnim.frames.length) {
          if (currentAnim.loop !== false) {
            frameIndex = 0
          } else {
            frameIndex = currentAnim.frames.length - 1
            _finished = true
            playing = false
            break
          }
        }
      }
    },

    stop() {
      playing = false
    },
  }
}
