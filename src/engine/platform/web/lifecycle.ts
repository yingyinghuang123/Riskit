// ─── 浏览器 Lifecycle 实现 ────────────────────────────────────────

import type { PlatformLifecycle } from "../services"

export class WebLifecycle implements PlatformLifecycle {
  private _showHandlers: Array<() => void> = []
  private _hideHandlers: Array<() => void> = []
  private _onVisChange: (() => void) | null = null

  constructor() {
    this._onVisChange = () => {
      if (document.hidden) {
        for (const fn of this._hideHandlers) {
          try {
            fn()
          } catch {
            /* 静默 */
          }
        }
      } else {
        for (const fn of this._showHandlers) {
          try {
            fn()
          } catch {
            /* 静默 */
          }
        }
      }
    }
    document.addEventListener("visibilitychange", this._onVisChange)
  }

  onShow(cb: () => void): void {
    this._showHandlers.push(cb)
  }

  onHide(cb: () => void): void {
    this._hideHandlers.push(cb)
  }

  offShow(cb: () => void): void {
    const idx = this._showHandlers.indexOf(cb)
    if (idx >= 0) this._showHandlers.splice(idx, 1)
  }

  offHide(cb: () => void): void {
    const idx = this._hideHandlers.indexOf(cb)
    if (idx >= 0) this._hideHandlers.splice(idx, 1)
  }

  destroy(): void {
    if (this._onVisChange) {
      document.removeEventListener("visibilitychange", this._onVisChange)
      this._onVisChange = null
    }
    this._showHandlers.length = 0
    this._hideHandlers.length = 0
  }
}
