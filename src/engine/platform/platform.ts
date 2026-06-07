// ─── 统一平台适配层 ─────────────────────────────────────────
import type {
  PlatformStorage,
  PlatformHttp,
  PlatformWebSocket,
  PlatformLifecycle,
  PlatformVibrate,
  PlatformShare,
  PlatformAuth,
  PlatformPayment,
  PlatformAds,
  PlatformCloud,
  PlatformSocial,
  PlatformRecorder,
  PlatformAI,
} from "./services"

export interface ScreenInfo {
  width: number
  height: number
  pixelRatio: number
}

// ── 音频上下文（引擎内部统一接口，对齐微信 InnerAudioContext 子集）──
export interface PlatformAudioContext {
  src: string
  loop: boolean
  volume: number
  play(): void
  pause(): void
  stop(): void
  seek(position: number): void
  destroy(): void
  onEnded(cb: () => void): void
  onStop(cb: () => void): void
  onCanplay(cb: () => void): void
  onError(cb: (err: any) => void): void
  offCanplay(cb: () => void): void
  offError(cb: (err: any) => void): void
}

// ── 触摸事件（引擎内部统一格式）──
export interface PlatformTouchEvent {
  changedTouches: Array<{ identifier: number; clientX: number; clientY: number }>
}

export type PlatformTouchCallback = (e: PlatformTouchEvent) => void

// ── 键盘事件 ──
export type PlatformKeyCallback = (res: { code: string; key: string }) => void

// ── 传感器回调 ──
export type PlatformSensorCallback = (data: { x: number; y: number; z: number }) => void

// ── 软键盘选项 ──
export interface PlatformKeyboardOptions {
  defaultValue?: string
  maxLength?: number
  multiple?: boolean
  confirmHold?: boolean
  confirmType?: string
}

export interface Platform {
  // ── 基础能力（引擎核心使用）──
  getScreenInfo(): ScreenInfo
  createCanvas(): WxCanvas
  createImage(): WxImage
  now(): number
  requestAnimationFrame(cb: () => void): number
  cancelAnimationFrame(id: number): void

  // ── 渲染能力（PixiJS / Three.js 适配用）──
  getWebGLRenderingContext(): typeof WebGLRenderingContext
  getCanvasRenderingContext2D(): { prototype: CanvasRenderingContext2D }
  getNavigator(): { userAgent: string; gpu: unknown | null }
  getBaseUrl(): string
  fetch(url: string, options?: RequestInit): Promise<Response>

  // ── 音频能力 ──
  createAudioContext(): PlatformAudioContext

  // ── 输入能力 — 触摸 ──
  onTouchStart(cb: PlatformTouchCallback): void
  onTouchMove(cb: PlatformTouchCallback): void
  onTouchEnd(cb: PlatformTouchCallback): void
  onTouchCancel(cb: PlatformTouchCallback): void

  // ── 输入能力 — 键盘 ──
  onKeyDown(cb: PlatformKeyCallback): void
  onKeyUp(cb: PlatformKeyCallback): void

  // ── 输入能力 — 传感器 ──
  startAccelerometer(interval: string): void
  stopAccelerometer(): void
  onAccelerometerChange(cb: PlatformSensorCallback): void
  startGyroscope(interval: string): void
  stopGyroscope(): void
  onGyroscopeChange(cb: PlatformSensorCallback): void

  // ── 输入能力 — 软键盘 ──
  showKeyboard(options: PlatformKeyboardOptions): void
  hideKeyboard(): void
  onKeyboardConfirm(cb: (res: { value: string }) => void): void
  onKeyboardComplete(cb: () => void): void

  // ── 系统能力 ──
  onMemoryWarning(cb: () => void): void

  // ── 资源能力 ──
  loadFont(src: string): string | null
  readFile(path: string, encoding: string): Promise<string>
  readFile(path: string): Promise<ArrayBuffer>
  getUserDataPath(): string
  loadSubpackage?(name: string, onProgress?: (loaded: number, total: number) => void): Promise<void>

  // ── 平台服务（高层能力，按需实现）──
  readonly storage?: PlatformStorage
  readonly http?: PlatformHttp
  readonly websocket?: PlatformWebSocket
  readonly lifecycle?: PlatformLifecycle
  readonly vibrate?: PlatformVibrate
  readonly share?: PlatformShare
  readonly auth?: PlatformAuth
  readonly payment?: PlatformPayment
  readonly ads?: PlatformAds
  readonly cloud?: PlatformCloud
  readonly social?: PlatformSocial
  readonly recorder?: PlatformRecorder
  readonly ai?: PlatformAI
}

let _platform: Platform | null = null

export function getPlatform(): Platform {
  if (!_platform) {
    throw new Error("Platform not initialized. Call setPlatform() before using engine.")
  }
  return _platform
}

export function setPlatform(platform: Platform): void {
  _platform = platform
}

export function hasPlatform(): boolean {
  return _platform !== null
}
