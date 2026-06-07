// ─── 平台服务接口定义 ─────────────────────────────────────────

// ── Storage ──

export interface StorageInfo {
  keys: string[]
  currentSize: number
  limitSize: number
}

export interface PlatformStorage {
  save(key: string, data: unknown): boolean
  load<T = unknown>(key: string, defaultValue?: T): T | null
  saveAsync(key: string, data: unknown, encrypt?: boolean): Promise<boolean>
  loadAsync<T = unknown>(key: string, encrypt?: boolean): Promise<T | null>
  remove(key: string): boolean
  clear(): boolean
  getInfo(): StorageInfo
  destroy(): void
}

// ── HTTP ──

export interface HttpOptions {
  header?: Record<string, string>
  timeout?: number
  responseType?: "text" | "arraybuffer"
}

export interface HttpResponse<T = unknown> {
  data: T
  statusCode: number
  header: Record<string, string>
}

export interface PlatformHttp {
  get<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T> | null>
  post<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<HttpResponse<T> | null>
  put<T = unknown>(url: string, data?: unknown, options?: HttpOptions): Promise<HttpResponse<T> | null>
  delete<T = unknown>(url: string, options?: HttpOptions): Promise<HttpResponse<T> | null>
  destroy(): void
}

// ── WebSocket ──

export interface WebSocketClient {
  send(data: string | ArrayBuffer): void
  onMessage(fn: (data: string | ArrayBuffer) => void): this
  onClose(fn: (code: number, reason: string) => void): this
  onError(fn: (msg: string) => void): this
  close(code?: number, reason?: string): void
}

export interface PlatformWebSocket {
  connect(url: string, options?: { header?: Record<string, string>; protocols?: string[] }): WebSocketClient
  destroy(): void
}

// ── Lifecycle ──

export interface PlatformLifecycle {
  onShow(cb: () => void): void
  onHide(cb: () => void): void
  offShow(cb: () => void): void
  offHide(cb: () => void): void
  destroy(): void
}

// ── Vibrate ──

export type VibrateType = "light" | "medium" | "heavy" | "long"

export interface PlatformVibrate {
  vibrate(type?: VibrateType): void
  destroy(): void
}

// ── Share ──

export interface ShareOptions {
  title?: string
  imageUrl?: string
  query?: string
  imageUrlId?: string
}

export type ShareReceiveCallback = (query: Record<string, string>) => void

export interface PlatformShare {
  enable(defaultOptions?: ShareOptions): this
  disable(): this
  send(options?: ShareOptions): void
  setDefault(options: ShareOptions): this
  onReceive(fn: ShareReceiveCallback): this
  offReceive(fn?: ShareReceiveCallback): this
  destroy(): void
}

// ── Auth ──

export interface LoginResult {
  code: string
}

export interface PlatformAuth {
  login(): Promise<LoginResult | null>
  getUserInfo(): Promise<Record<string, unknown> | null>
  checkSession(): Promise<boolean>
  getSetting(): Promise<Record<string, boolean>>
  authorize(scope: string): Promise<boolean>
  destroy(): void
}

// ── Payment ──

export interface PurchaseOptions {
  offerId: string
  quantity: number
  zoneId?: string
  env?: 0 | 1
}

export interface PlatformPayment {
  purchase(options: PurchaseOptions): Promise<boolean>
  destroy(): void
}

// ── Ads ──

export interface BannerPosition {
  left?: number
  top?: number
  width?: number
}

export interface PlatformAds {
  showVideo(adUnitId: string): Promise<boolean>
  showBanner(adUnitId: string, position?: BannerPosition): Promise<boolean>
  hideBanner(adUnitId?: string): this
  showInterstitial(adUnitId: string): Promise<boolean>
  preloadVideo(adUnitId: string): this
  destroy(): void
}

// ── Cloud ──

export interface CloudConfig {
  env: string
  traceUser?: boolean
}

export interface CloudQuery {
  where?: Record<string, unknown>
  orderBy?: { field: string; direction: "asc" | "desc" }
  limit?: number
  skip?: number
}

export interface CloudResult<T = unknown> {
  data: T
  errMsg: string
}

export interface CloudWatcher {
  close(): void
}

export interface PlatformCloud {
  init(config: CloudConfig): boolean
  add(collection: string, data: Record<string, unknown>): Promise<string | null>
  get<T = Record<string, unknown>>(collection: string, query?: CloudQuery): Promise<T[]>
  getById<T = Record<string, unknown>>(collection: string, id: string): Promise<T | null>
  update(collection: string, id: string, data: Record<string, unknown>): Promise<boolean>
  remove(collection: string, id: string): Promise<boolean>
  count(collection: string, query?: CloudQuery): Promise<number>
  saveUserData(data: Record<string, unknown>): Promise<boolean>
  loadUserData<T = Record<string, unknown>>(): Promise<T | null>
  getLeaderboard<T = Record<string, unknown>>(collection: string, field: string, limit?: number): Promise<T[]>
  watch(
    collection: string,
    query: Record<string, unknown>,
    onChange: (snapshot: unknown) => void,
    onError?: (err: Error) => void,
  ): CloudWatcher
  callFunction<T = unknown>(name: string, data?: Record<string, unknown>): Promise<CloudResult<T> | null>
  uploadFile(cloudPath: string, filePath: string): Promise<string | null>
  getFileUrl(fileId: string): Promise<string | null>
  deleteFile(fileId: string): Promise<boolean>
  destroy(): void
}

// ── Social ──

export interface FriendData {
  avatarUrl: string
  nickname: string
  openid: string
  data: Record<string, string>
}

export interface PlatformSocial {
  setScore(value: number): Promise<boolean>
  setData(key: string, value: string | number): Promise<boolean>
  getFriends(): Promise<FriendData[]>
  showRankList(): this
  postMessage(data: Record<string, unknown>): this
  onMessage(fn: (data: Record<string, unknown>) => void): this
  offMessage(fn?: (data: Record<string, unknown>) => void): this
  destroy(): void
}

// ── Recorder ──

export interface RecorderOptions {
  duration?: number
  bitrate?: number
  fps?: number
  gop?: number
}

export interface RecorderResult {
  duration: number
}

export interface PlatformRecorder {
  start(options?: RecorderOptions): boolean
  stop(): Promise<RecorderResult | null>
  pause(): boolean
  resume(): boolean
  abort(): void
  readonly isRecording: boolean
  destroy(): void
}

// ── AI ──

export interface InferenceSession {
  run(input: Record<string, unknown>): Promise<Record<string, unknown> | null>
  destroy(): void
}

export interface PlatformAI {
  createSession(modelPath: string): Promise<InferenceSession | null>
  destroy(): void
}
