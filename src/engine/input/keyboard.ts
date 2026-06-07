import { getPlatform } from "../platform/platform"

// ─── 键盘输入（PC 端） ──────────────────────────────────────────

export interface KeyState {
  isDown: boolean
  justPressed: boolean
  justReleased: boolean
}

export class Keyboard {
  private _keys = new Map<string, KeyState>()
  private _handlers: Array<{ code: string; callback: (down: boolean) => void }> = []
  private _anyHandlers: Array<(code: string, down: boolean) => void> = []
  private _bound = false

  key(code: string): KeyState {
    let state = this._keys.get(code)
    if (!state) {
      state = { isDown: false, justPressed: false, justReleased: false }
      this._keys.set(code, state)
    }
    return state
  }

  onKey(code: string, callback: (down: boolean) => void): void {
    this._handlers.push({ code, callback })
  }

  onAnyKey(callback: (code: string, down: boolean) => void): void {
    this._anyHandlers.push(callback)
  }

  get left(): boolean {
    return this.key("ArrowLeft").isDown
  }
  get right(): boolean {
    return this.key("ArrowRight").isDown
  }
  get up(): boolean {
    return this.key("ArrowUp").isDown
  }
  get down(): boolean {
    return this.key("ArrowDown").isDown
  }
  get space(): boolean {
    return this.key("Space").isDown
  }

  bind(): void {
    if (this._bound) return
    this._bound = true
    try {
      const platform = getPlatform()
      platform.onKeyDown((res: any) => this._handleDown(res.code || res.key || ""))
      platform.onKeyUp((res: any) => this._handleUp(res.code || res.key || ""))
    } catch {
      /* 平台不支持 */
    }
  }

  endFrame(): void {
    for (const [, state] of this._keys) {
      state.justPressed = false
      state.justReleased = false
    }
  }

  /** 清空所有注册的按键回调（场景切换时调用，保留底层事件绑定和按键状态） */
  clearCallbacks(): void {
    this._handlers.length = 0
    this._anyHandlers.length = 0
  }

  destroy(): void {
    this._keys.clear()
    this._handlers.length = 0
    this._anyHandlers.length = 0
  }

  private _handleDown(code: string): void {
    const state = this.key(code)
    if (!state.isDown) {
      state.isDown = true
      state.justPressed = true
    }
    for (const h of this._handlers) if (h.code === code) h.callback(true)
    for (const fn of this._anyHandlers) fn(code, true)
  }

  private _handleUp(code: string): void {
    const state = this.key(code)
    state.isDown = false
    state.justReleased = true
    for (const h of this._handlers) if (h.code === code) h.callback(false)
    for (const fn of this._anyHandlers) fn(code, false)
  }
}
