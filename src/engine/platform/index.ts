// ─── Platform 适配层统一导出 ──────────────────────────────────

export { getPlatform, setPlatform, hasPlatform } from "./platform"
export type {
  Platform,
  ScreenInfo,
  PlatformAudioContext,
  PlatformTouchEvent,
  PlatformTouchCallback,
  PlatformKeyCallback,
  PlatformSensorCallback,
  PlatformKeyboardOptions,
} from "./platform"

export { createWxPlatform } from "./wx-platform"
export { createWebPlatform } from "./web-platform"

export type {
  StorageInfo,
  PlatformStorage,
  HttpOptions,
  HttpResponse,
  PlatformHttp,
  WebSocketClient,
  PlatformWebSocket,
  PlatformLifecycle,
  VibrateType,
  PlatformVibrate,
  ShareOptions,
  ShareReceiveCallback,
  PlatformShare,
  LoginResult,
  PlatformAuth,
  PurchaseOptions,
  PlatformPayment,
  BannerPosition,
  PlatformAds,
  CloudConfig,
  CloudQuery,
  CloudResult,
  CloudWatcher,
  PlatformCloud,
  FriendData,
  PlatformSocial,
  RecorderOptions,
  RecorderResult,
  PlatformRecorder,
  InferenceSession,
  PlatformAI,
} from "./services"

export { WebStorage, WebHttp, WebWebSocket, WebLifecycle, WebVibrate } from "./web"
