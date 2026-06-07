// ─── 振动反馈 ──────────────────────────────────────────────────────

import type { VibrateType, PlatformVibrate } from "../services"
export class WxVibrate implements PlatformVibrate {
  /** 触发振动反馈 */
  vibrate(type: VibrateType = "medium"): void {
    try {
      if (type === "long") {
        wx.vibrateLong()
      } else {
        wx.vibrateShort({ type })
      }
    } catch {
      /* 静默 */
    }
  }

  destroy(): void {
    // 无需清理
  }
}
