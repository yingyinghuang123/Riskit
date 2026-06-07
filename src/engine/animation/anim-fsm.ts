// ─── 动画状态机 — FSM + 精灵动画联动 ────────────────────────────

import { SpriteAnimPlayer } from './sprite-anim'

export interface AnimState {
  animation: string
  on?: Record<string, string>
  next?: string
  enter?: () => void
  exit?: () => void
}

export interface AnimFSMConfig {
  initial: string
  states: Record<string, AnimState>
}

export class AnimFSM {
  private _config: AnimFSMConfig
  private _player: SpriteAnimPlayer
  private _state: string
  private _changeHandlers: Array<(from: string, to: string) => void> = []

  constructor(config: AnimFSMConfig, player: SpriteAnimPlayer) {
    this._config = config
    this._player = player
    this._state = config.initial

    player.onComplete(() => {
      const sc = this._config.states[this._state]
      if (sc?.next) this._transition(sc.next)
    })

    this._enterState(config.initial)
  }

  get state(): string { return this._state }

  send(event: string): void {
    const sc = this._config.states[this._state]
    if (!sc?.on) return
    const next = sc.on[event]
    if (next) this._transition(next)
  }

  goto(state: string): void {
    this._transition(state)
  }

  update(dt: number): void {
    this._player.update(dt)
  }

  onChange(handler: (from: string, to: string) => void): void {
    this._changeHandlers.push(handler)
  }

  private _transition(next: string): void {
    if (next === this._state) return
    const sc = this._config.states[next]
    if (!sc) return

    const prev = this._state
    this._config.states[this._state]?.exit?.()
    this._state = next
    this._enterState(next)
    for (const fn of this._changeHandlers) fn(prev, next)
  }

  private _enterState(state: string): void {
    const sc = this._config.states[state]
    if (!sc) return
    sc.enter?.()
    this._player.play(sc.animation)
  }
}

/** 快捷创建 AnimFSM（自动创建 SpriteAnimPlayer） */
export function createAnimFSM(config: AnimFSMConfig, player?: SpriteAnimPlayer): AnimFSM {
  return new AnimFSM(config, player ?? new SpriteAnimPlayer())
}

/** 别名 */
export const animFSM = createAnimFSM
