// ─── Sprite 节点 ─────────────────────────────────────────────────

import { CanvasSource, ImageSource, Rectangle, Sprite as PixiSprite, Texture as PixiTexture } from "pixi.js"
import { Node } from "./node"
import { FSM, type FSMConfig } from "../utils/fsm"
import { cssColorToNumber } from "../utils/color"
import { deferGpuDestroy } from "../utils/gpu-destroy-queue"

// ─── 精灵帧动画类型 ─────────────────────────────────────────────

export interface SpriteFrame {
  /** 帧图像（或与 sprite 共用纹理时的裁剪区域） */
  image?: CanvasImageSource
  /** 裁剪区域 sx, sy, sw, sh */
  sx?: number
  sy?: number
  sw?: number
  sh?: number
}

export interface SpriteAnimation {
  frames: SpriteFrame[]
  /** 帧间隔（秒），默认 0.1 */
  frameTime?: number
  /** 是否循环，默认 true */
  loop?: boolean
  /** 播放结束回调 */
  onComplete?: () => void
}

interface ActiveFrameState {
  image: CanvasImageSource | null
  sx: number
  sy: number
  sw: number
  sh: number
  useSrc: boolean
}

interface SourceSize {
  width: number
  height: number
}

// ─── Sprite ─────────────────────────────────────────────────────

export class Sprite extends Node {
  /** 纹理图像 */
  texture: CanvasImageSource | null = null

  /** 纹理裁剪区域（null 表示使用整个纹理） */
  srcX = 0
  srcY = 0
  srcWidth = 0
  srcHeight = 0
  useSrcRect = false

  /** 翻转 */
  flipX = false
  flipY = false

  /** 色调覆盖（null 表示不叠色） */
  tint: string | null = null

  // ── 动画系统 ──
  private _animations = new Map<string, SpriteAnimation>()
  private _currentAnim: SpriteAnimation | null = null
  private _currentAnimName = ""
  private _frameIndex = 0
  private _frameTimer = 0
  private _playing = false

  /** 缓存 CanvasImageSource -> PixiTexture，避免每帧重复创建 */
  private _textureCache = new Map<CanvasImageSource, PixiTexture>()
  private _frameTextureCache = new Map<string, PixiTexture>()
  private _textureIds = new WeakMap<object, number>()
  private _nextTextureId = 1

  /** 动画状态机（可选，高级用法） */
  animFSM: FSM | null = null

  constructor(texture?: CanvasImageSource, x = 0, y = 0) {
    super()
    this._pixiObj = new PixiSprite()
    this.anchorX = 0.5
    this.anchorY = 0.5

    if (texture) {
      this.texture = texture
      const { width, height } = this._getSourceSize(texture)
      this.width = width
      this.height = height
    }
    this.x = x
    this.y = y
  }

  // ── 链式配置 ──────────────────────────────────────────────────

  setTexture(texture: CanvasImageSource): this {
    this.texture = texture
    const { width, height } = this._getSourceSize(texture)
    if (!this.width) this.width = width
    if (!this.height) this.height = height
    return this
  }

  setSrcRect(sx: number, sy: number, sw: number, sh: number): this {
    this.srcX = sx
    this.srcY = sy
    this.srcWidth = sw
    this.srcHeight = sh
    this.useSrcRect = true
    return this
  }

  setFlip(flipX: boolean, flipY = false): this {
    this.flipX = flipX
    this.flipY = flipY
    return this
  }

  setTint(color: string | null): this {
    this.tint = color
    return this
  }

  // ── 帧动画 ────────────────────────────────────────────────────

  addAnimation(name: string, anim: SpriteAnimation): this {
    this._animations.set(name, anim)
    return this
  }

  play(name: string, restart = false): this {
    if (this._currentAnimName === name && this._playing && !restart) return this
    const anim = this._animations.get(name)
    if (!anim) return this
    this._currentAnim = anim
    this._currentAnimName = name
    this._frameIndex = 0
    this._frameTimer = 0
    this._playing = true
    return this
  }

  stop(): this {
    this._playing = false
    return this
  }

  get currentAnimation(): string {
    return this._currentAnimName
  }

  get isPlaying(): boolean {
    return this._playing
  }

  get frameIndex(): number {
    return this._frameIndex
  }

  // ── 动画状态机快捷创建 ─────────────────────────────────────────

  createAnimFSM<S extends string, E extends string>(config: FSMConfig<S, E>): this {
    this.animFSM = new FSM(config)
    return this
  }

  // ── 生命周期 ──────────────────────────────────────────────────

  update(dt: number): void {
    // 更新帧动画
    if (this._playing && this._currentAnim) {
      const anim = this._currentAnim
      const frameTime = anim.frameTime ?? 0.1
      this._frameTimer += dt

      while (this._frameTimer >= frameTime && this._playing) {
        this._frameTimer -= frameTime
        this._frameIndex++
        if (this._frameIndex >= anim.frames.length) {
          if (anim.loop !== false) {
            this._frameIndex = 0
          } else {
            this._frameIndex = anim.frames.length - 1
            this._playing = false
            anim.onComplete?.()
          }
        }
      }
    }

    // 更新动画状态机
    this.animFSM?.update(dt)
  }

  _syncPixi(): void {
    const sprite = this._pixiObj as PixiSprite
    const state = this._getActiveFrameState()
    const image = state.image

    if (!image) {
      // 纹理未加载时：用空纹理代替 renderable=false，保证 children（fallback graphics）仍然渲染
      sprite.texture = PixiTexture.EMPTY
      return
    }
    sprite.renderable = true
    sprite.texture = this._resolveTexture(image, state)

    // 计算从纹理原始尺寸到目标 width/height 的缩放比
    const texW = sprite.texture.width || 1
    const texH = sprite.texture.height || 1
    const sizeScaleX = this.width / texW
    const sizeScaleY = this.height / texH

    // Sprite 用自己的 anchor 替代 Node._syncTransform 设置的 pivot
    sprite.anchor.set(this.anchorX, this.anchorY)
    sprite.pivot.set(0, 0)

    const flipScaleX = this.flipX ? -1 : 1
    const flipScaleY = this.flipY ? -1 : 1
    sprite.scale.set(sizeScaleX * this.scaleX * flipScaleX, sizeScaleY * this.scaleY * flipScaleY)

    sprite.tint = this.tint ? cssColorToNumber(this.tint) : 0xffffff
  }

  onDestroy(): void {
    for (const texture of this._frameTextureCache.values()) {
      deferGpuDestroy(() => texture.destroy(false))
    }
    this._frameTextureCache.clear()

    for (const texture of this._textureCache.values()) {
      deferGpuDestroy(() => texture.destroy(true))
    }
    this._textureCache.clear()
  }

  private _getActiveFrameState(): ActiveFrameState {
    let image = this.texture
    let sx = this.srcX
    let sy = this.srcY
    let sw = this.srcWidth
    let sh = this.srcHeight
    let useSrc = this.useSrcRect

    if (this._currentAnim && this._playing) {
      const frame = this._currentAnim.frames[this._frameIndex]
      if (frame) {
        if (frame.image) image = frame.image
        if (frame.sx !== undefined) {
          sx = frame.sx
          sy = frame.sy ?? 0
          sw = frame.sw ?? 0
          sh = frame.sh ?? 0
          useSrc = true
        }
      }
    }

    return { image, sx, sy, sw, sh, useSrc }
  }

  private _resolveTexture(image: CanvasImageSource, state: ActiveFrameState): PixiTexture {
    const baseTexture = this._getOrCreateBaseTexture(image)
    if (!state.useSrc || state.sw <= 0 || state.sh <= 0) {
      return baseTexture
    }

    const textureId = this._getTextureId(image)
    const frameKey = `${textureId}:${state.sx},${state.sy},${state.sw},${state.sh}`
    const cachedFrameTexture = this._frameTextureCache.get(frameKey)
    if (cachedFrameTexture) {
      return cachedFrameTexture
    }

    const frameTexture = new PixiTexture({
      source: baseTexture.source,
      frame: new Rectangle(state.sx, state.sy, state.sw, state.sh),
    })
    this._frameTextureCache.set(frameKey, frameTexture)
    return frameTexture
  }

  private _getOrCreateBaseTexture(image: CanvasImageSource): PixiTexture {
    const cached = this._textureCache.get(image)
    if (cached) {
      return cached
    }

    const source = this._isCanvasLike(image)
      ? new CanvasSource({ resource: image })
      : new ImageSource({ resource: image })
    const texture = new PixiTexture({ source })
    this._textureCache.set(image, texture)
    return texture
  }

  private _isCanvasLike(image: CanvasImageSource): boolean {
    const maybeCanvas = image as { getContext?: (...args: unknown[]) => unknown }
    return typeof maybeCanvas.getContext === "function"
  }

  private _getTextureId(image: CanvasImageSource): number {
    const keyObject = image as object
    const id = this._textureIds.get(keyObject)
    if (id !== undefined) {
      return id
    }

    const nextId = this._nextTextureId++
    this._textureIds.set(keyObject, nextId)
    return nextId
  }

  private _getSourceSize(source: CanvasImageSource): SourceSize {
    const maybeSized = source as { width?: number; height?: number; videoWidth?: number; videoHeight?: number }
    const width =
      typeof maybeSized.width === "number"
        ? maybeSized.width
        : typeof maybeSized.videoWidth === "number"
          ? maybeSized.videoWidth
          : 0
    const height =
      typeof maybeSized.height === "number"
        ? maybeSized.height
        : typeof maybeSized.videoHeight === "number"
          ? maybeSized.videoHeight
          : 0
    return { width, height }
  }
}
