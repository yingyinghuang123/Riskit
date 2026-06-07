// ─── 广告管理 ──────────────────────────────────────────────────────

import type { BannerPosition, PlatformAds } from "../services"

export class WxAds implements PlatformAds {
  private _videoCache = new Map<string, WxRewardedVideoAd>()
  private _bannerCache = new Map<string, WxBannerAd>()
  private _interstitialCache = new Map<string, WxInterstitialAd>()

  /** 显示激励视频广告，返回是否看完 */
  async showVideo(adUnitId: string): Promise<boolean> {
    try {
      const ad = this._getOrCreateVideo(adUnitId)

      return new Promise<boolean>((resolve) => {
        const onClose = (res: WxRewardedVideoAdOnCloseRes) => {
          ad.offClose(onClose)
          resolve(!!res.isEnded)
        }
        ad.onClose(onClose)

        ad.show().catch(() => {
          // show 失败时尝试 load 后重试
          ad.load()
            .then(() => ad.show())
            .catch(() => {
              ad.offClose(onClose)
              resolve(false)
            })
        })
      })
    } catch {
      return false
    }
  }

  /** 显示 Banner 广告 */
  async showBanner(adUnitId: string, position?: BannerPosition): Promise<boolean> {
    try {
      // 复用或创建
      let banner = this._bannerCache.get(adUnitId)
      if (!banner) {
        const info = wx.getSystemInfoSync()
        banner = wx.createBannerAd({
          adUnitId,
          style: {
            left: position?.left ?? 0,
            top: position?.top ?? info.screenHeight - 80,
            width: position?.width ?? info.screenWidth,
          },
        })
        this._bannerCache.set(adUnitId, banner)
      }
      await banner.show()
      return true
    } catch {
      return false
    }
  }

  /** 隐藏 Banner 广告 */
  hideBanner(adUnitId?: string): this {
    if (adUnitId) {
      const banner = this._bannerCache.get(adUnitId)
      if (banner) banner.hide()
    } else {
      for (const banner of this._bannerCache.values()) {
        banner.hide()
      }
    }
    return this
  }

  /** 显示插屏广告 */
  async showInterstitial(adUnitId: string): Promise<boolean> {
    try {
      let ad = this._interstitialCache.get(adUnitId)
      if (!ad) {
        ad = wx.createInterstitialAd({ adUnitId })
        this._interstitialCache.set(adUnitId, ad)
      }
      await ad.show()
      return true
    } catch {
      return false
    }
  }

  /** 预加载激励视频（提前加载以减少等待） */
  preloadVideo(adUnitId: string): this {
    this._getOrCreateVideo(adUnitId)
    return this
  }

  /** 销毁所有广告实例 */
  destroy(): void {
    for (const ad of this._videoCache.values()) {
      try {
        ad.destroy()
      } catch {
        /* 静默 */
      }
    }
    this._videoCache.clear()

    for (const ad of this._bannerCache.values()) {
      try {
        ad.destroy()
      } catch {
        /* 静默 */
      }
    }
    this._bannerCache.clear()

    for (const ad of this._interstitialCache.values()) {
      try {
        ad.destroy()
      } catch {
        /* 静默 */
      }
    }
    this._interstitialCache.clear()
  }

  private _getOrCreateVideo(adUnitId: string): WxRewardedVideoAd {
    let ad = this._videoCache.get(adUnitId)
    if (!ad) {
      ad = wx.createRewardedVideoAd({ adUnitId })
      this._videoCache.set(adUnitId, ad)
    }
    return ad
  }
}
