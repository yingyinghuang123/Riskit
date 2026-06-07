// ─── 软键盘 — 微信文本输入 ──────────────────────────────────────

import { getPlatform } from "../platform/platform"

export interface TextInputOptions {
  defaultValue?: string
  maxLength?: number
  multiple?: boolean
  confirmType?: "send" | "search" | "next" | "go" | "done"
}

export class SoftKeyboard {
  private _bound = false
  private _resolveInput: ((value: string) => void) | null = null

  textInput(options?: TextInputOptions): Promise<string> {
    return new Promise<string>((resolve) => {
      this._resolveInput = resolve
      this._ensureBound()

      getPlatform().showKeyboard({
        defaultValue: options?.defaultValue ?? "",
        maxLength: options?.maxLength ?? 140,
        multiple: options?.multiple ?? false,
        confirmHold: false,
        confirmType: options?.confirmType ?? "done",
      })
    })
  }

  hide(): void {
    try {
      getPlatform().hideKeyboard()
    } catch {
      /* ignore */
    }
  }

  destroy(): void {
    this.hide()
    this._resolveInput = null
  }

  private _ensureBound(): void {
    if (this._bound) return
    this._bound = true
    const platform = getPlatform()

    platform.onKeyboardConfirm((res: { value: string }) => {
      if (this._resolveInput) {
        this._resolveInput(res.value)
        this._resolveInput = null
      }
      this.hide()
    })

    platform.onKeyboardComplete(() => {
      if (this._resolveInput) {
        this._resolveInput("")
        this._resolveInput = null
      }
    })
  }
}
