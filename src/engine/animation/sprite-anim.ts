// ─── 精灵帧动画 — 帧序列与工具 ──────────────────────────────────

export interface SpriteAnimConfig {
  name: string
  frames: string[]
  fps?: number
  loop?: boolean
}

/** 展开帧模式 (e.g. "run_{1..8}" => ["run_1","run_2",...,"run_8"]) */
export function expandFramePattern(pattern: string): string[] {
  const match = pattern.match(/^(.+)\{(\d+)\.\.(\d+)\}(.*)$/)
  if (!match) return [pattern]
  const [, prefix, startStr, endStr, suffix] = match
  const start = parseInt(startStr, 10)
  const end = parseInt(endStr, 10)
  const pad = startStr.length
  const result: string[] = []
  for (let i = start; i <= end; i++) {
    result.push(prefix + String(i).padStart(pad, '0') + suffix)
  }
  return result
}

/** 从 sprite sheet 帧名创建动画帧 */
export function createAnimFramesFromSheet(prefix: string, count: number, suffix = '.png'): string[] {
  const frames: string[] = []
  for (let i = 0; i < count; i++) {
    frames.push(prefix + i + suffix)
  }
  return frames
}

/** 批量添加动画 (返回帧动画 Map) */
export function addAnimations(configs: SpriteAnimConfig[]): Map<string, SpriteAnimConfig> {
  const map = new Map<string, SpriteAnimConfig>()
  for (const config of configs) {
    map.set(config.name, {
      ...config,
      fps: config.fps ?? 12,
      loop: config.loop ?? true,
    })
  }
  return map
}

/** 帧动画播放器 */
export class SpriteAnimPlayer {
  private _animations = new Map<string, SpriteAnimConfig>()
  private _current: SpriteAnimConfig | null = null
  private _frameIndex = 0
  private _elapsed = 0
  private _playing = false
  private _paused = false
  private _frameCallbacks: Array<(frame: string, index: number) => void> = []
  private _completeCallbacks: Array<(name: string) => void> = []

  get frameIndex(): number { return this._frameIndex }
  get currentFrame(): string { return this._current ? this._current.frames[this._frameIndex] : '' }
  get playing(): boolean { return this._playing }
  get currentAnim(): string | null { return this._current?.name ?? null }

  addAnimation(config: SpriteAnimConfig): void {
    this._animations.set(config.name, {
      ...config,
      fps: config.fps ?? 12,
      loop: config.loop ?? true,
    })
  }

  play(name: string, force = false): void {
    if (!force && this._current?.name === name && this._playing) return
    const anim = this._animations.get(name)
    if (!anim) return
    this._current = anim
    this._frameIndex = 0
    this._elapsed = 0
    this._playing = true
    this._paused = false
    this._notifyFrame()
  }

  stop(): void {
    this._playing = false
    this._paused = false
    this._frameIndex = 0
    this._elapsed = 0
  }

  pause(): void { this._paused = true }
  resume(): void { this._paused = false }

  onFrameChange(handler: (frame: string, index: number) => void): void {
    this._frameCallbacks.push(handler)
  }

  onComplete(handler: (name: string) => void): void {
    this._completeCallbacks.push(handler)
  }

  update(dt: number): void {
    if (!this._playing || this._paused || !this._current) return

    const fps = this._current.fps ?? 12
    const frameDuration = 1 / fps
    this._elapsed += dt

    while (this._elapsed >= frameDuration) {
      this._elapsed -= frameDuration
      this._frameIndex++

      if (this._frameIndex >= this._current.frames.length) {
        if (this._current.loop !== false) {
          this._frameIndex = 0
        } else {
          this._frameIndex = this._current.frames.length - 1
          this._playing = false
          const name = this._current.name
          for (const fn of this._completeCallbacks) fn(name)
          return
        }
      }
      this._notifyFrame()
    }
  }

  private _notifyFrame(): void {
    if (!this._current) return
    const frame = this._current.frames[this._frameIndex]
    for (const fn of this._frameCallbacks) fn(frame, this._frameIndex)
  }
}
