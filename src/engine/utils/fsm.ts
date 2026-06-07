// ─── 有限状态机 ──────────────────────────────────────────────────

export interface FSMConfig<S extends string, E extends string> {
  initial: S
  states: {
    [K in S]?: {
      /** 事件触发转移: { event: nextState } */
      on?: Partial<Record<E, S>>
      /** 进入状态时回调 */
      enter?: () => void
      /** 离开状态时回调 */
      exit?: () => void
      /** 自动延迟转移: [毫秒, 目标状态] */
      after?: [number, S]
    }
  }
}

export class FSM<S extends string = string, E extends string = string> {
  private _state: S
  private _config: FSMConfig<S, E>
  private _timer: number = 0
  private _timerTarget: S | null = null
  private _timerDuration: number = 0

  constructor(config: FSMConfig<S, E>) {
    this._config = config
    this._state = config.initial
    this._enterState(config.initial)
  }

  get state(): S {
    return this._state
  }

  /** 检查是否处于某个状态 */
  is(state: S): boolean {
    return this._state === state
  }

  /** 发送事件，触发状态转移 */
  send(event: E): this {
    const stateConfig = this._config.states[this._state]
    if (!stateConfig?.on) return this
    const next = stateConfig.on[event]
    if (next !== undefined) {
      this._transition(next)
    }
    return this
  }

  /** 强制切换到指定状态 */
  goto(state: S): this {
    if (state !== this._state) {
      this._transition(state)
    }
    return this
  }

  /** 每帧更新（处理 after 自动转移） */
  update(dt: number): void {
    if (this._timerTarget !== null) {
      this._timer += dt * 1000
      if (this._timer >= this._timerDuration) {
        const target = this._timerTarget
        this._timerTarget = null
        this._transition(target)
      }
    }
  }

  private _transition(next: S): void {
    const oldConfig = this._config.states[this._state]
    oldConfig?.exit?.()
    this._state = next
    this._timerTarget = null
    this._enterState(next)
  }

  private _enterState(state: S): void {
    const stateConfig = this._config.states[state]
    stateConfig?.enter?.()
    if (stateConfig?.after) {
      this._timerDuration = stateConfig.after[0]
      this._timerTarget = stateConfig.after[1]
      this._timer = 0
    }
  }
}
