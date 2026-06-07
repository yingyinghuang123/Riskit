// ─── 主循环 ──────────────────────────────────────────────────────

import { getPlatform } from '../platform/platform'

export interface TimeInfo {
  /** 距上一帧的秒数（已 clamp） */
  dt: number
  /** 游戏运行总时间（秒） */
  elapsed: number
  /** 总帧数 */
  frame: number
  /** 当前 FPS */
  fps: number
}

export type TickFn = (time: TimeInfo) => void

const MAX_DT = 1 / 15
const FPS_SAMPLE_FRAMES = 30

export class GameLoop {
  private _running = false
  private _paused = false
  private _lastTime = 0
  private _elapsed = 0
  private _frame = 0
  private _rafId = 0
  private _tick: TickFn
  private _fps = 60
  private _fpsAccum = 0
  private _fpsSamples = 0

  readonly time: TimeInfo = { dt: 0, elapsed: 0, frame: 0, fps: 60 }

  constructor(tick: TickFn) {
    this._tick = tick
  }

  start(): void {
    if (this._running) return
    this._running = true
    this._paused = false
    const platform = getPlatform()
    this._lastTime = platform.now()
    this._elapsed = 0
    this._frame = 0
    this._fps = 60
    this._fpsAccum = 0
    this._fpsSamples = 0

    const step = () => {
      if (!this._running) return

      const now = platform.now()
      let dt = (now - this._lastTime) / 1000
      this._lastTime = now

      if (dt > MAX_DT) dt = MAX_DT
      if (dt < 0) dt = 0

      if (!this._paused) {
        this._elapsed += dt
        this._frame++

        // FPS 计算
        this._fpsAccum += dt
        this._fpsSamples++
        if (this._fpsSamples >= FPS_SAMPLE_FRAMES) {
          this._fps = Math.round(this._fpsSamples / this._fpsAccum)
          this._fpsAccum = 0
          this._fpsSamples = 0
        }

        this.time.dt = dt
        this.time.elapsed = this._elapsed
        this.time.frame = this._frame
        this.time.fps = this._fps

        this._tick(this.time)
      }

      this._rafId = platform.requestAnimationFrame(step)
    }

    this._rafId = platform.requestAnimationFrame(step)
  }

  stop(): void {
    this._running = false
    if (this._rafId) {
      getPlatform().cancelAnimationFrame(this._rafId)
      this._rafId = 0
    }
  }

  pause(): void {
    this._paused = true
  }

  resume(): void {
    if (this._paused) {
      this._paused = false
      this._lastTime = getPlatform().now()
    }
  }

  get running(): boolean {
    return this._running
  }

  get paused(): boolean {
    return this._paused
  }
}
