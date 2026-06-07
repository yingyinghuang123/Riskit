// ─── BGM 播放器 — 背景音乐 + 淡入淡出 ────────────────────────────

import { getPlatform } from "../platform/platform"

import type { AudioManager } from "./audio-manager"

export interface BGMOptions {
  loop?: boolean
  volume?: number
  fadeDuration?: number
}

export class BGMManager {
  private _audio: any = null
  private _currentSrc: string | null = null
  private _playing = false
  private _fadeTimer: ReturnType<typeof setInterval> | null = null
  private _endHandlers: Array<() => void> = []
  private _offPause: (() => void) | null = null
  private _offResume: (() => void) | null = null
  private _manager: AudioManager

  constructor(manager: AudioManager) {
    this._manager = manager
    this._offPause = manager.onPause(() => {
      if (this._playing && this._audio) this._audio.pause()
    })
    this._offResume = manager.onResume(() => {
      if (this._playing && this._audio) this._audio.play()
    })
  }

  get current(): string | null {
    return this._currentSrc
  }
  get playing(): boolean {
    return this._playing
  }

  play(src: string, options?: BGMOptions): void {
    this._clearFade()
    const a = this._getAudio()
    a.src = src
    a.loop = options?.loop ?? true
    a.volume = (options?.volume ?? 1) * this._manager.getEffectiveBgmVolume()
    a.play()
    this._currentSrc = src
    this._playing = true
  }

  stop(): void {
    this._clearFade()
    if (this._audio) this._audio.stop()
    this._currentSrc = null
    this._playing = false
  }

  pause(): void {
    if (this._audio && this._playing) this._audio.pause()
  }

  resume(): void {
    if (this._audio && this._currentSrc) {
      this._audio.volume = this._manager.getEffectiveBgmVolume()
      this._audio.play()
      this._playing = true
    }
  }

  crossfade(src: string, options?: BGMOptions): void {
    this._clearFade()
    const duration = options?.fadeDuration ?? 1000
    const targetVolume = (options?.volume ?? 1) * this._manager.getEffectiveBgmVolume()
    const step = 50
    const steps = Math.max(1, Math.floor(duration / step))
    let count = 0

    if (!this._audio || !this._playing) {
      this.play(src, { ...options, volume: 0 })
      const a = this._audio
      this._fadeTimer = setInterval(() => {
        count++
        a.volume = targetVolume * (count / steps)
        if (count >= steps) {
          a.volume = targetVolume
          this._clearFade()
        }
      }, step)
      return
    }

    const oldAudio = this._audio
    this._fadeTimer = setInterval(() => {
      count++
      oldAudio.volume = targetVolume * (1 - count / steps)
      if (count >= steps) {
        oldAudio.stop()
        oldAudio.destroy()
        this._clearFade()

        this._audio = null
        this.play(src, { ...options, volume: 0 })
        const a = this._audio
        let c2 = 0
        this._fadeTimer = setInterval(() => {
          c2++
          a.volume = targetVolume * (c2 / steps)
          if (c2 >= steps) {
            a.volume = targetVolume
            this._clearFade()
          }
        }, step)
      }
    }, step)
  }

  seek(position: number): void {
    if (this._audio) this._audio.seek(position)
  }

  onEnd(handler: () => void): void {
    this._endHandlers.push(handler)
  }

  destroy(): void {
    this._clearFade()
    this._offPause?.()
    this._offResume?.()
    if (this._audio) {
      this._audio.stop()
      this._audio.destroy()
      this._audio = null
    }
    this._currentSrc = null
    this._playing = false
    this._endHandlers.length = 0
  }

  private _getAudio(): any {
    if (!this._audio) {
      this._audio = getPlatform().createAudioContext()
      this._audio.onEnded(() => {
        this._playing = false
        for (const fn of this._endHandlers) fn()
      })
      this._audio.onStop(() => {
        this._playing = false
      })
    }
    return this._audio
  }

  private _clearFade(): void {
    if (this._fadeTimer) {
      clearInterval(this._fadeTimer)
      this._fadeTimer = null
    }
  }
}
