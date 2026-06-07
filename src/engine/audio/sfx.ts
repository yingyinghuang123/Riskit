// ─── SFX 管理器 — 音效池 + 并发控制 ──────────────────────────────

import { getPlatform } from "../platform/platform"

import type { AudioManager } from "./audio-manager"

export interface SFXOptions {
  maxConcurrent?: number
  poolSize?: number
}

interface SfxInstance {
  audio: any
  src: string
  busy: boolean
}

export class SFXPool {
  private _pool: SfxInstance[] = []
  private _activeCounts = new Map<string, number>()
  private _idMap = new Map<number, SfxInstance>()
  private _nextId = 1
  private _maxConcurrent: number
  private _poolSize: number
  private _manager: AudioManager
  private _offPause: (() => void) | null = null
  private _offResume: (() => void) | null = null

  constructor(manager: AudioManager, options?: SFXOptions) {
    this._manager = manager
    this._maxConcurrent = options?.maxConcurrent ?? 4
    this._poolSize = options?.poolSize ?? 16

    this._offPause = manager.onPause(() => {
      for (const inst of this._pool) {
        if (inst.busy) inst.audio.pause()
      }
    })
    this._offResume = manager.onResume(() => {
      for (const inst of this._pool) {
        if (inst.busy) inst.audio.play()
      }
    })
  }

  play(src: string, volume?: number): number {
    const count = this._activeCounts.get(src) ?? 0
    if (count >= this._maxConcurrent) return -1

    const inst = this._getFromPool(src)
    if (!inst) return -1

    inst.busy = true
    this._activeCounts.set(src, count + 1)

    const effective = this._manager.getEffectiveSfxVolume()
    inst.audio.volume = (volume ?? 1) * effective
    inst.audio.seek(0)
    inst.audio.play()

    const id = this._nextId++
    this._idMap.set(id, inst)
    return id
  }

  stop(id: number): void {
    const inst = this._idMap.get(id)
    if (inst && inst.busy) {
      inst.audio.stop()
      this._release(inst)
    }
    this._idMap.delete(id)
  }

  stopAll(): void {
    for (const inst of this._pool) {
      if (inst.busy) {
        inst.audio.stop()
        this._release(inst)
      }
    }
    this._idMap.clear()
  }

  preload(src: string, count = 1): void {
    for (let i = 0; i < count && this._pool.length < this._poolSize; i++) {
      this._pool.push(this._createInstance(src))
    }
  }

  destroy(): void {
    this._offPause?.()
    this._offResume?.()
    for (const inst of this._pool) {
      inst.audio.stop()
      inst.audio.destroy()
    }
    this._pool.length = 0
    this._activeCounts.clear()
    this._idMap.clear()
  }

  private _createInstance(src: string): SfxInstance {
    const audio = getPlatform().createAudioContext()
    audio.src = src
    const inst: SfxInstance = { audio, src, busy: false }
    audio.onEnded(() => {
      this._release(inst)
    })
    audio.onStop(() => {
      this._release(inst)
    })
    return inst
  }

  private _release(inst: SfxInstance): void {
    inst.busy = false
    const count = this._activeCounts.get(inst.src) ?? 0
    if (count > 0) this._activeCounts.set(inst.src, count - 1)
  }

  private _getFromPool(src: string): SfxInstance | null {
    for (const inst of this._pool) {
      if (!inst.busy && inst.src === src) return inst
    }
    for (const inst of this._pool) {
      if (!inst.busy) {
        inst.audio.src = src
        inst.src = src
        return inst
      }
    }
    if (this._pool.length < this._poolSize) {
      const inst = this._createInstance(src)
      this._pool.push(inst)
      return inst
    }
    return null
  }
}
