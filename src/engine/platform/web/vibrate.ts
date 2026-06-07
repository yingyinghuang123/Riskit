// ─── 浏览器振动实现（Vibration API） ─────────────────────────────

import type { VibrateType, PlatformVibrate } from "../services"

const VIBRATE_DURATION: Record<VibrateType, number> = {
  light: 10,
  medium: 20,
  heavy: 40,
  long: 400,
}

export class WebVibrate implements PlatformVibrate {
  vibrate(type: VibrateType = "medium"): void {
    try {
      navigator.vibrate?.(VIBRATE_DURATION[type])
    } catch {
      /* 静默 */
    }
  }

  destroy(): void {}
}
