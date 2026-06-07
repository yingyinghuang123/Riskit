// ─── 增强 Tween 系统 — 独立于 Node ──────────────────────────────

import { resolveEasing, type EasingFn } from '../utils/math'

export interface TweenConfig {
  target: any
  props: Record<string, number>
  duration?: number
  delay?: number
  easing?: EasingFn | string
  repeat?: number
  yoyo?: boolean
  onUpdate?: (progress: number) => void
  onComplete?: () => void
  onRepeat?: (count: number) => void
}

interface ActiveTween {
  target: any
  startValues: Record<string, number>
  endValues: Record<string, number>
  elapsed: number
  delay: number
  duration: number
  easing: EasingFn
  repeat: number
  repeatCount: number
  yoyo: boolean
  reversed: boolean
  onUpdate?: (progress: number) => void
  onComplete?: () => void
  onRepeat?: (count: number) => void
  paused: boolean
  dead: boolean
  id: number
}

export interface TweenHandle {
  readonly id: number
  pause(): void
  resume(): void
  stop(): void
  readonly done: boolean
}

export class TweenSystem {
  private _tweens: ActiveTween[] = []
  private _nextId = 1

  get activeCount(): number {
    return this._tweens.filter(t => !t.dead).length
  }

  create(config: TweenConfig): TweenHandle {
    const target = config.target
    const startValues: Record<string, number> = {}
    const endValues: Record<string, number> = {}

    for (const key of Object.keys(config.props)) {
      startValues[key] = target[key] ?? 0
      endValues[key] = config.props[key]
    }

    const id = this._nextId++
    const tween: ActiveTween = {
      target,
      startValues,
      endValues,
      elapsed: 0,
      delay: Math.max(0, (config.delay ?? 0) / 1000),
      duration: Math.max(0, (config.duration ?? 300) / 1000),
      easing: resolveEasing(config.easing),
      repeat: config.repeat ?? 0,
      repeatCount: 0,
      yoyo: config.yoyo ?? false,
      reversed: false,
      onUpdate: config.onUpdate,
      onComplete: config.onComplete,
      onRepeat: config.onRepeat,
      paused: false,
      dead: false,
      id,
    }

    this._tweens.push(tween)

    return {
      get id() { return id },
      pause() { tween.paused = true },
      resume() { tween.paused = false },
      stop() { tween.dead = true },
      get done() { return tween.dead },
    }
  }

  stopByTarget(target: any): void {
    for (const t of this._tweens) {
      if (t.target === target) t.dead = true
    }
  }

  stopAll(): void {
    for (const t of this._tweens) t.dead = true
  }

  pauseAll(): void {
    for (const t of this._tweens) t.paused = true
  }

  resumeAll(): void {
    for (const t of this._tweens) t.paused = false
  }

  update(dt: number): void {
    for (let i = this._tweens.length - 1; i >= 0; i--) {
      const t = this._tweens[i]
      if (t.dead) {
        this._tweens.splice(i, 1)
        continue
      }
      if (t.paused) continue

      let remaining = dt
      if (t.delay > 0) {
        t.delay -= remaining
        if (t.delay > 0) continue
        remaining = -t.delay
        t.delay = 0
      }

      t.elapsed += remaining
      const raw = t.duration > 0 ? Math.min(t.elapsed / t.duration, 1) : 1
      const eased = t.easing(t.reversed ? 1 - raw : raw)

      for (const key of Object.keys(t.endValues)) {
        const from = t.startValues[key]
        const to = t.endValues[key]
        t.target[key] = from + (to - from) * eased
      }

      t.onUpdate?.(eased)

      if (raw >= 1) {
        if (t.repeat === -1 || t.repeatCount < t.repeat) {
          t.repeatCount++
          t.elapsed = 0
          if (t.yoyo) t.reversed = !t.reversed
          t.onRepeat?.(t.repeatCount)
        } else {
          t.onComplete?.()
          t.dead = true
        }
      }
    }
  }
}
