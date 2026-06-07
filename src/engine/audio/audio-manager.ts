// ─── 音频管理器 — 主音量 / 静音 ────────────────────────────────────

export class AudioManager {
  private _masterVolume = 1
  private _bgmVolume = 1
  private _sfxVolume = 1
  private _muted = false
  private _paused = false

  private _pauseHandlers: Array<() => void> = []
  private _resumeHandlers: Array<() => void> = []

  get masterVolume() { return this._masterVolume }
  set masterVolume(v: number) { this._masterVolume = Math.max(0, Math.min(1, v)) }

  get bgmVolume() { return this._bgmVolume }
  set bgmVolume(v: number) { this._bgmVolume = Math.max(0, Math.min(1, v)) }

  get sfxVolume() { return this._sfxVolume }
  set sfxVolume(v: number) { this._sfxVolume = Math.max(0, Math.min(1, v)) }

  get muted() { return this._muted }
  set muted(v: boolean) { this._muted = v }

  getEffectiveBgmVolume(): number {
    return this._muted ? 0 : this._masterVolume * this._bgmVolume
  }

  getEffectiveSfxVolume(): number {
    return this._muted ? 0 : this._masterVolume * this._sfxVolume
  }

  pauseAll(): void {
    if (this._paused) return
    this._paused = true
    for (const fn of this._pauseHandlers) fn()
  }

  resumeAll(): void {
    if (!this._paused) return
    this._paused = false
    for (const fn of this._resumeHandlers) fn()
  }

  onPause(handler: () => void): () => void {
    this._pauseHandlers.push(handler)
    return () => {
      const idx = this._pauseHandlers.indexOf(handler)
      if (idx !== -1) this._pauseHandlers.splice(idx, 1)
    }
  }

  onResume(handler: () => void): () => void {
    this._resumeHandlers.push(handler)
    return () => {
      const idx = this._resumeHandlers.indexOf(handler)
      if (idx !== -1) this._resumeHandlers.splice(idx, 1)
    }
  }

  destroy(): void {
    this._pauseHandlers.length = 0
    this._resumeHandlers.length = 0
  }
}
