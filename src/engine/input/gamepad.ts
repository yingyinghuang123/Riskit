// ─── 手柄输入 ─────────────────────────────────────────────────────

export interface StickState {
  x: number
  y: number
}

export interface GamepadButtonState {
  isDown: boolean
  justPressed: boolean
  justReleased: boolean
}

export class GamepadInput {
  readonly leftStick: StickState = { x: 0, y: 0 }
  readonly rightStick: StickState = { x: 0, y: 0 }

  private _buttons = new Map<string, GamepadButtonState>()

  button(name: string): GamepadButtonState {
    let state = this._buttons.get(name)
    if (!state) {
      state = { isDown: false, justPressed: false, justReleased: false }
      this._buttons.set(name, state)
    }
    return state
  }

  update(): void {
    try {
      const gamepads: any[] = (wx as any).getGamepads?.() ?? []
      const gp = gamepads[0]
      if (!gp) return

      if (gp.axes?.length >= 2) {
        this.leftStick.x = gp.axes[0] ?? 0
        this.leftStick.y = gp.axes[1] ?? 0
      }
      if (gp.axes?.length >= 4) {
        this.rightStick.x = gp.axes[2] ?? 0
        this.rightStick.y = gp.axes[3] ?? 0
      }

      const names = ['A', 'B', 'X', 'Y', 'LB', 'RB', 'LT', 'RT', 'Back', 'Start', 'LS', 'RS', 'Up', 'Down', 'Left', 'Right']
      if (gp.buttons) {
        for (let i = 0; i < Math.min(gp.buttons.length, names.length); i++) {
          const pressed = typeof gp.buttons[i] === 'object' ? gp.buttons[i].pressed : !!gp.buttons[i]
          const state = this.button(names[i])
          const wasDown = state.isDown
          state.isDown = pressed
          state.justPressed = pressed && !wasDown
          state.justReleased = !pressed && wasDown
        }
      }
    } catch { /* 不支持 */ }
  }

  endFrame(): void {
    for (const [, state] of this._buttons) {
      state.justPressed = false
      state.justReleased = false
    }
  }

  destroy(): void {
    this._buttons.clear()
  }
}
