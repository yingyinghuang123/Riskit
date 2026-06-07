// ─── 虚拟支付 ──────────────────────────────────────────────────────

import type { PurchaseOptions, PlatformPayment } from "../services"

export class WxPayment implements PlatformPayment {
  /** 发起虚拟支付 */
  async purchase(options: PurchaseOptions): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        wx.requestMidasPayment({
          mode: "game",
          env: options.env ?? 0,
          offerId: options.offerId,
          currencyType: "CNY",
          buyQuantity: options.quantity,
          zoneId: options.zoneId,
          success: () => resolve(true),
          fail: () => resolve(false),
        })
      } catch {
        resolve(false)
      }
    })
  }

  destroy(): void {
    // 无需清理
  }
}
