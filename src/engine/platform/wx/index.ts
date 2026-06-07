// ─── WxPlatform 主类 + 统一导出 ──────────────────────────────────

import type { MiniEngine } from "../../engine"
import { WxShare } from "./share"
import { WxSocial } from "./social"
import { WxAds } from "./ads"
import { WxAuth } from "./auth"
import { WxStorage } from "./storage"
import { WxPayment } from "./payment"
import { WxHttp, WxWebSocket } from "./network"
import { WxLifecycle } from "./lifecycle"
import { WxAI } from "./ai"
import { WxRecorder } from "./recorder"
import { WxVibrate } from "./vibrate"
import { WxCloud } from "./cloud"

export class WxPlatform {
  readonly share = new WxShare()
  readonly social = new WxSocial()
  readonly ads = new WxAds()
  readonly auth = new WxAuth()
  readonly storage = new WxStorage()
  readonly payment = new WxPayment()
  readonly http = new WxHttp()
  readonly websocket = new WxWebSocket()
  readonly ai = new WxAI()
  readonly recorder = new WxRecorder()
  readonly vibrate = new WxVibrate()
  readonly cloud = new WxCloud()

  private _lifecycle = new WxLifecycle()

  /** 初始化并挂载到引擎 */
  init(engine: MiniEngine): this {
    this._lifecycle.init(engine, this.share)
    // 挂载到 engine 上，使 game.wx 可用
    ;(engine as any).wx = this
    return this
  }

  destroy(): void {
    this._lifecycle.destroy()
    this.share.destroy()
    this.social.destroy()
    this.ads.destroy()
    this.auth.destroy()
    this.storage.destroy()
    this.payment.destroy()
    this.http.destroy()
    this.websocket.destroy()
    this.ai.destroy()
    this.recorder.destroy()
    this.vibrate.destroy()
    this.cloud.destroy()
  }
}

// ─── 统一导出 ──────────────────────────────────────────────────────

export { WxShare } from "./share"
export { WxSocial } from "./social"
export { WxAds } from "./ads"
export { WxAuth } from "./auth"
export { WxStorage } from "./storage"
export { WxPayment } from "./payment"
export { WxHttp, WxWebSocket } from "./network"
export { WxLifecycle } from "./lifecycle"
export { WxAI } from "./ai"
export { WxRecorder } from "./recorder"
export { WxVibrate } from "./vibrate"
export { WxCloud } from "./cloud"

// 类型统一从 platform/services 导出
export type {
  ShareOptions,
  ShareReceiveCallback,
  FriendData,
  BannerPosition,
  LoginResult,
  StorageInfo,
  PurchaseOptions,
  HttpOptions,
  HttpResponse,
  WebSocketClient,
  InferenceSession,
  RecorderOptions,
  RecorderResult,
  VibrateType,
  CloudConfig,
  CloudQuery,
  CloudResult,
  CloudWatcher,
} from "../services"
