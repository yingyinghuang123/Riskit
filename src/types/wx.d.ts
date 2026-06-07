/** 微信小游戏 API 类型定义 - https://developers.weixin.qq.com/minigame/dev/api/ */

interface WxSafeArea {
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

interface WxSystemInfo {
  screenWidth: number
  screenHeight: number
  windowWidth: number
  windowHeight: number
  pixelRatio: number
  platform: string
  language: string
  version: string
  SDKVersion: string
  brand: string
  model: string
  /** 系统版本 */
  system: string
  /** 客户端基础库版本 */
  benchmarkLevel: number
  /** 状态栏高度（px） */
  statusBarHeight: number
  /** 安全区域 */
  safeArea: WxSafeArea
  /** 用户设置的字号大小 */
  fontSizeSetting: number
  /** 设备方向 */
  deviceOrientation: "portrait" | "landscape"
  /** 主题模式 */
  theme: "light" | "dark"
  /** 是否已打开调试 */
  enableDebug: boolean
  /** 相册授权 */
  albumAuthorized: boolean
  /** 摄像头授权 */
  cameraAuthorized: boolean
  /** 定位授权 */
  locationAuthorized: boolean
  /** 麦克风授权 */
  microphoneAuthorized: boolean
  /** 通知授权 */
  notificationAuthorized: boolean
  /** 蓝牙开关 */
  bluetoothEnabled: boolean
  /** 定位开关 */
  locationEnabled: boolean
  /** Wi-Fi 开关 */
  wifiEnabled: boolean
}

interface WxTouch {
  identifier: number
  clientX: number
  clientY: number
  pageX: number
  pageY: number
}

interface WxTouchEvent {
  touches: WxTouch[]
  changedTouches: WxTouch[]
  timeStamp: number
}

interface WxCanvas {
  width: number
  height: number
  getContext(contextType: "2d"): CanvasRenderingContext2D | null
  getContext(contextType: "webgl", attrs?: WebGLContextAttributes): WebGLRenderingContext | null
  getContext(contextType: "webgl2", attrs?: WebGLContextAttributes): WebGL2RenderingContext | null
  toDataURL(type?: string, quality?: number): string
  toTempFilePath(options?: {
    x?: number
    y?: number
    width?: number
    height?: number
    destWidth?: number
    destHeight?: number
    fileType?: string
    quality?: number
    success?: (res: { tempFilePath: string }) => void
    fail?: (err: Error) => void
  }): void
}

interface WxImage {
  src: string
  width: number
  height: number
  onload: (() => void) | null
  onerror: ((err: unknown) => void) | null
}

interface WxInnerAudioContext {
  src: string
  startTime: number
  autoplay: boolean
  loop: boolean
  volume: number
  duration: number
  currentTime: number
  paused: boolean
  play(): void
  pause(): void
  stop(): void
  seek(position: number): void
  destroy(): void
  onCanplay(callback: () => void): void
  onPlay(callback: () => void): void
  onPause(callback: () => void): void
  onStop(callback: () => void): void
  onEnded(callback: () => void): void
  onError(callback: (err: { errCode: number; errMsg: string }) => void): void
  offCanplay(callback?: () => void): void
  offPlay(callback?: () => void): void
  offPause(callback?: () => void): void
  offStop(callback?: () => void): void
  offEnded(callback?: () => void): void
  offError(callback?: (err: { errCode: number; errMsg: string }) => void): void
}

/** 广告错误信息 */
interface WxAdError {
  errMsg: string
  errCode: number
}

/** 激励视频广告关闭回调参数 */
interface WxRewardedVideoAdOnCloseRes {
  /** 用户是否完整观看了视频（只有 isEnded 为 true 才应发放奖励） */
  isEnded: boolean
}

/** 激励视频广告实例 */
interface WxRewardedVideoAd {
  /** 显示广告（返回 Promise，可能因无库存等原因失败） */
  show(): Promise<void>
  /** 主动加载广告（通常自动加载，失败后可手动调用） */
  load(): Promise<void>
  /** 销毁广告实例 */
  destroy(): void
  /** 广告加载成功回调 */
  onLoad(callback: () => void): void
  /** 取消广告加载成功回调 */
  offLoad(callback?: () => void): void
  /** 广告加载失败回调 */
  onError(callback: (err: WxAdError) => void): void
  /** 取消广告加载失败回调 */
  offError(callback?: (err: WxAdError) => void): void
  /** 广告关闭回调（检查 isEnded 判断是否发放奖励） */
  onClose(callback: (res: WxRewardedVideoAdOnCloseRes) => void): void
  /** 取消广告关闭回调 */
  offClose(callback?: (res: WxRewardedVideoAdOnCloseRes) => void): void
}

/** 创建激励视频广告的参数 */
interface WxCreateRewardedVideoAdOption {
  /** 广告单元 ID（在微信公众平台申请） */
  adUnitId: string
  /** 是否启用多例模式（默认 false，建议保持单例复用） */
  multiton?: boolean
}

/** Banner 广告实例 */
interface WxBannerAd {
  show(): Promise<void>
  hide(): void
  destroy(): void
  onResize(callback: (res: { width: number; height: number }) => void): void
  offResize(callback?: (res: { width: number; height: number }) => void): void
  onLoad(callback: () => void): void
  offLoad(callback?: () => void): void
  onError(callback: (err: WxAdError) => void): void
  offError(callback?: (err: WxAdError) => void): void
  style: { left: number; top: number; width: number; height: number; realWidth: number; realHeight: number }
}

/** 插屏广告实例 */
interface WxInterstitialAd {
  show(): Promise<void>
  load(): Promise<void>
  destroy(): void
  onLoad(callback: () => void): void
  offLoad(callback?: () => void): void
  onError(callback: (err: WxAdError) => void): void
  offError(callback?: (err: WxAdError) => void): void
  onClose(callback: () => void): void
  offClose(callback?: () => void): void
}

interface WxMenuButtonBoundingClientRect {
  width: number
  height: number
  top: number
  right: number
  bottom: number
  left: number
}

interface WxShareAppMessageOption {
  title?: string
  imageUrl?: string
  query?: string
  imageUrlId?: string
}

interface WxLoadSubpackageTask {
  onProgressUpdate(
    callback: (res: { progress: number; totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void,
  ): void
}

/** 文件状态信息 */
interface WxStats {
  mode: number
  size: number
  lastAccessedTime: number
  lastModifiedTime: number
  isDirectory(): boolean
  isFile(): boolean
}

/** 文件系统管理器 */
interface WxFileSystemManager {
  readFile(options: {
    filePath: string
    encoding?:
      | "ascii"
      | "base64"
      | "binary"
      | "hex"
      | "ucs2"
      | "ucs-2"
      | "utf16le"
      | "utf-16le"
      | "utf-8"
      | "utf8"
      | "latin1"
    position?: number
    length?: number
    success?: (res: { data: string | ArrayBuffer }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  readFileSync(filePath: string, encoding?: string, position?: number, length?: number): string | ArrayBuffer
  writeFile(options: {
    filePath: string
    data: string | ArrayBuffer
    encoding?: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  writeFileSync(filePath: string, data: string | ArrayBuffer, encoding?: string): void
  appendFile(options: {
    filePath: string
    data: string | ArrayBuffer
    encoding?: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  appendFileSync(filePath: string, data: string | ArrayBuffer, encoding?: string): void
  unlink(options: {
    filePath: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  unlinkSync(filePath: string): void
  mkdir(options: {
    dirPath: string
    recursive?: boolean
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  mkdirSync(dirPath: string, recursive?: boolean): void
  rmdir(options: {
    dirPath: string
    recursive?: boolean
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  rmdirSync(dirPath: string, recursive?: boolean): void
  readdir(options: {
    dirPath: string
    success?: (res: { files: string[] }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  readdirSync(dirPath: string): string[]
  stat(options: {
    path: string
    recursive?: boolean
    success?: (res: { stats: WxStats | Record<string, WxStats> }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  statSync(path: string, recursive?: boolean): WxStats | Record<string, WxStats>
  access(options: {
    path: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  accessSync(path: string): void
  copyFile(options: {
    srcPath: string
    destPath: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  copyFileSync(srcPath: string, destPath: string): void
  rename(options: {
    oldPath: string
    newPath: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  renameSync(oldPath: string, newPath: string): void
}

/** 网络请求任务 */
interface WxRequestTask {
  abort(): void
  onHeadersReceived(callback: (res: { header: Record<string, string> }) => void): void
  offHeadersReceived(callback?: (res: { header: Record<string, string> }) => void): void
}

/** 开放数据域上下文 */
interface WxOpenDataContext {
  canvas: WxCanvas
  postMessage(msg: Record<string, unknown>): void
}

/** 授权设置 */
interface WxAuthSetting {
  "scope.userInfo"?: boolean
  "scope.userLocation"?: boolean
  "scope.writePhotosAlbum"?: boolean
  "scope.record"?: boolean
  [key: string]: boolean | undefined
}

/** WebSocket 任务 */
interface WxSocketTask {
  send(options: {
    data: string | ArrayBuffer
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  close(options?: {
    code?: number
    reason?: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  onOpen(callback: (res: { header: Record<string, string> }) => void): void
  onClose(callback: (res: { code: number; reason: string }) => void): void
  onError(callback: (res: { errMsg: string }) => void): void
  onMessage(callback: (res: { data: string | ArrayBuffer }) => void): void
}

/** 下载任务 */
interface WxDownloadTask {
  abort(): void
  onProgressUpdate(
    callback: (res: { progress: number; totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void,
  ): void
  offProgressUpdate(
    callback?: (res: { progress: number; totalBytesWritten: number; totalBytesExpectedToWrite: number }) => void,
  ): void
  onHeadersReceived(callback: (res: { header: Record<string, string> }) => void): void
  offHeadersReceived(callback?: (res: { header: Record<string, string> }) => void): void
}

/** 上传任务 */
interface WxUploadTask {
  abort(): void
  onProgressUpdate(
    callback: (res: { progress: number; totalBytesSent: number; totalBytesExpectedToSend: number }) => void,
  ): void
  offProgressUpdate(
    callback?: (res: { progress: number; totalBytesSent: number; totalBytesExpectedToSend: number }) => void,
  ): void
  onHeadersReceived(callback: (res: { header: Record<string, string> }) => void): void
  offHeadersReceived(callback?: (res: { header: Record<string, string> }) => void): void
}

/** 更新管理器 */
interface WxUpdateManager {
  onCheckForUpdate(callback: (res: { hasUpdate: boolean }) => void): void
  onUpdateReady(callback: () => void): void
  onUpdateFailed(callback: (err: { errMsg: string }) => void): void
  applyUpdate(): void
}

/** 用户信息 */
interface WxUserInfo {
  nickName: string
  avatarUrl: string
  gender: 0 | 1 | 2
  country: string
  province: string
  city: string
  language: "en" | "zh_CN" | "zh_TW"
}

/** 用户信息按钮 */
interface WxUserInfoButton {
  show(): void
  hide(): void
  destroy(): void
  onTap(
    callback: (res: {
      userInfo?: WxUserInfo
      rawData?: string
      signature?: string
      encryptedData?: string
      iv?: string
      errMsg: string
    }) => void,
  ): void
  offTap(
    callback?: (res: {
      userInfo?: WxUserInfo
      rawData?: string
      signature?: string
      encryptedData?: string
      iv?: string
      errMsg: string
    }) => void,
  ): void
  type: string
  text: string
  image: string
  style: {
    left: number
    top: number
    width: number
    height: number
    backgroundColor: string
    borderColor: string
    borderWidth: number
    borderRadius: number
    color: string
    textAlign: string
    fontSize: number
    lineHeight: number
  }
}

/** 游戏圈按钮 */
interface WxGameClubButton {
  show(): void
  hide(): void
  destroy(): void
  onTap(callback: () => void): void
  offTap(callback?: () => void): void
  style: { left: number; top: number; width: number; height: number }
}

/** 视频播放器 */
interface WxVideo {
  src: string
  duration: number
  width: number
  height: number
  autoplay: boolean
  loop: boolean
  muted: boolean
  objectFit: "contain" | "cover" | "fill"
  play(): void
  pause(): void
  stop(): void
  seek(time: number): void
  requestFullScreen(options?: { direction?: 0 | 90 | -90 }): void
  exitFullScreen(): void
  destroy(): void
  onPlay(callback: () => void): void
  onPause(callback: () => void): void
  onEnded(callback: () => void): void
  onError(callback: (err: { errMsg: string }) => void): void
  onTimeUpdate(callback: (res: { position: number; duration: number }) => void): void
  offPlay(callback?: () => void): void
  offPause(callback?: () => void): void
  offEnded(callback?: () => void): void
  offError(callback?: (err: { errMsg: string }) => void): void
  offTimeUpdate(callback?: (res: { position: number; duration: number }) => void): void
}

/** 录音管理器 */
interface WxRecorderManager {
  start(options?: {
    duration?: number
    sampleRate?: number
    numberOfChannels?: 1 | 2
    encodeBitRate?: number
    format?: "mp3" | "aac" | "wav" | "PCM"
  }): void
  pause(): void
  resume(): void
  stop(): void
  onStart(callback: () => void): void
  onPause(callback: () => void): void
  onResume(callback: () => void): void
  onStop(callback: (res: { tempFilePath: string; duration: number; fileSize: number }) => void): void
  onError(callback: (err: { errMsg: string }) => void): void
  onFrameRecorded(callback: (res: { frameBuffer: ArrayBuffer; isLastFrame: boolean }) => void): void
}

/** 游戏录屏 */
interface WxGameRecorder {
  start(options?: { duration?: number; bitrate?: number; fps?: number; gop?: number }): void
  pause(): void
  resume(): void
  stop(): Promise<{ duration: number }>
  abort(): void
  on(event: string, callback: (...args: unknown[]) => void): void
  off(event: string, callback?: (...args: unknown[]) => void): void
  isFrameSupported(): boolean
}

/** 游戏录屏分享按钮 */
interface WxGameRecorderShareButton {
  show(): void
  hide(): void
  destroy(): void
  onTap(callback: () => void): void
  offTap(callback?: () => void): void
  style: { left: number; top: number }
}

/** 原生模板广告 */
interface WxCustomAd {
  show(): Promise<void>
  hide(): void
  destroy(): void
  onLoad(callback: () => void): void
  offLoad(callback?: () => void): void
  onError(callback: (err: WxAdError) => void): void
  offError(callback?: (err: WxAdError) => void): void
  onClose(callback: () => void): void
  offClose(callback?: () => void): void
  isShow(): boolean
}

/** 推荐 Banner */
interface WxGameBanner {
  show(): void
  hide(): void
  destroy(): void
  onResize(callback: (res: { width: number; height: number }) => void): void
  offResize(callback?: (res: { width: number; height: number }) => void): void
  onLoad(callback: () => void): void
  offLoad(callback?: () => void): void
  onError(callback: (err: { errMsg: string; errCode: number }) => void): void
  offError(callback?: (err: { errMsg: string; errCode: number }) => void): void
  style: { left: number; top: number }
}

/** 推荐弹窗 */
interface WxGamePortal {
  show(): void
  hide(): void
  destroy(): void
  onLoad(callback: () => void): void
  offLoad(callback?: () => void): void
  onError(callback: (err: { errMsg: string; errCode: number }) => void): void
  offError(callback?: (err: { errMsg: string; errCode: number }) => void): void
  onClose(callback: () => void): void
  offClose(callback?: () => void): void
}

/** 推荐图标 */
interface WxGameIcon {
  show(): void
  hide(): void
  destroy(): void
  onLoad(callback: () => void): void
  offLoad(callback?: () => void): void
  onError(callback: (err: { errMsg: string; errCode: number }) => void): void
  offError(callback?: (err: { errMsg: string; errCode: number }) => void): void
}

/** 窗口信息 */
interface WxWindowInfo {
  /** 像素比 */
  pixelRatio: number
  /** 屏幕宽度（px） */
  screenWidth: number
  /** 屏幕高度（px） */
  screenHeight: number
  /** 可使用窗口宽度（px） */
  windowWidth: number
  /** 可使用窗口高度（px） */
  windowHeight: number
  /** 状态栏高度（px） */
  statusBarHeight: number
  /** 安全区域 */
  safeArea: WxSafeArea
  /** 屏幕方向 */
  screenTop: number
}

/** 设备信息 */
interface WxDeviceInfo {
  /** 设备品牌 */
  brand: string
  /** 设备型号 */
  model: string
  /** 操作系统及版本 */
  system: string
  /** 客户端平台 */
  platform: string
  /** 设备性能等级（仅 Android，-1 为未测评） */
  benchmarkLevel: number
  /** 内存大小（MB） */
  memorySize: number
}

/** 小程序基础信息 */
interface WxAppBaseInfo {
  /** 客户端基础库版本 */
  SDKVersion: string
  /** 微信设置的语言 */
  language: string
  /** 微信版本号 */
  version: string
  /** 主题模式 */
  theme: "light" | "dark"
  /** 是否已打开调试 */
  enableDebug: boolean
}

/** 图片信息 */
interface WxImageInfo {
  /** 图片原始宽度（px） */
  width: number
  /** 图片原始高度（px） */
  height: number
  /** 图片本地路径 */
  path: string
  /** 图片方向 */
  orientation: "up" | "down" | "left" | "right" | "up-mirrored" | "down-mirrored" | "left-mirrored" | "right-mirrored"
  /** 图片格式 */
  type: string
}

/** 启动参数 */
interface WxLaunchOption {
  scene: number
  query: Record<string, string>
  shareTicket?: string
  referrerInfo?: { appId: string; extraData?: Record<string, unknown> }
}

/** Worker 线程 */
interface WxWorker {
  postMessage(msg: Record<string, unknown>): void
  onMessage(callback: (res: { message: Record<string, unknown> }) => void): void
  terminate(): void
}

/** 云开发数据库文档变更类型 */
interface WxCloudDocChange {
  id: string
  dataType: "init" | "update" | "replace" | "add" | "remove"
  doc: Record<string, unknown>
  updatedFields?: Record<string, unknown>
  removedFields?: string[]
}

/** 云开发数据库快照 */
interface WxCloudSnapshot {
  id: number
  docChanges: WxCloudDocChange[]
  docs: Array<Record<string, unknown>>
  type: "init" | string
}

/** 云开发实时监听器 */
interface WxCloudWatcher {
  close(): void
}

/** 云开发数据库查询引用 */
interface WxCloudQuery {
  get(options?: {
    success?: (res: { data: Array<Record<string, unknown>>; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
  }): void
  count(options?: {
    success?: (res: { total: number; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
  }): void
  orderBy(field: string, order: "asc" | "desc"): WxCloudQuery
  limit(count: number): WxCloudQuery
  skip(count: number): WxCloudQuery
  field(projection: Record<string, boolean | number>): WxCloudQuery
  watch(options: {
    onChange: (snapshot: WxCloudSnapshot) => void
    onError?: (err: { errMsg: string; errCode?: number }) => void
  }): WxCloudWatcher
}

/** 云开发数据库集合引用 */
interface WxCloudCollection {
  add(options: {
    data: Record<string, unknown>
    success?: (res: { _id: string; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
  }): void
  doc(id: string): {
    get(options?: {
      success?: (res: { data: Record<string, unknown>; errMsg: string }) => void
      fail?: (err: { errMsg: string }) => void
    }): void
    update(options: {
      data: Record<string, unknown>
      success?: (res: { stats: { updated: number }; errMsg: string }) => void
      fail?: (err: { errMsg: string }) => void
    }): void
    remove(options?: {
      success?: (res: { stats: { removed: number }; errMsg: string }) => void
      fail?: (err: { errMsg: string }) => void
    }): void
  }
  where(condition: Record<string, unknown>): WxCloudQuery
  orderBy(field: string, order: "asc" | "desc"): WxCloudQuery
  limit(count: number): WxCloudQuery
  skip(count: number): WxCloudQuery
  field(projection: Record<string, boolean | number>): WxCloudQuery
  get(options?: {
    success?: (res: { data: Array<Record<string, unknown>>; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
  }): void
  count(options?: {
    success?: (res: { total: number; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
  }): void
  watch(options: {
    onChange: (snapshot: WxCloudSnapshot) => void
    onError?: (err: { errMsg: string; errCode?: number }) => void
  }): WxCloudWatcher
}

/** 云开发数据库 */
interface WxCloudDatabase {
  collection(name: string): WxCloudCollection
  command: {
    eq(val: unknown): unknown
    neq(val: unknown): unknown
    lt(val: unknown): unknown
    lte(val: unknown): unknown
    gt(val: unknown): unknown
    gte(val: unknown): unknown
    in(arr: unknown[]): unknown
    nin(arr: unknown[]): unknown
    exists(flag: boolean): unknown
    inc(val: number): unknown
    mul(val: number): unknown
    remove(): unknown
    push(...args: unknown[]): unknown
    pop(): unknown
    shift(): unknown
    unshift(...args: unknown[]): unknown
    set(val: unknown): unknown
  }
  serverDate(options?: { offset?: number }): unknown
  Geo: unknown
  RegExp(options: { regexp: string; options?: string }): unknown
}

/** 云开发实例 */
interface WxCloud {
  /** 初始化云开发 */
  init(config: { env: string; traceUser?: boolean }): void
  /** 获取数据库引用 */
  database(config?: { env?: string }): WxCloudDatabase
  /** 调用云函数 */
  callFunction(options: {
    name: string
    data?: Record<string, unknown>
    success?: (res: { result: unknown; errMsg: string; requestID: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 上传文件到云存储 */
  uploadFile(options: {
    cloudPath: string
    filePath: string
    success?: (res: { fileID: string; statusCode: number; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 获取临时文件 URL */
  getTempFileURL(options: {
    fileList: string[]
    success?: (res: {
      fileList: Array<{ fileID: string; tempFileURL: string; status: number; errMsg: string }>
    }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 删除云存储文件 */
  deleteFile(options: {
    fileList: string[]
    success?: (res: { fileList: Array<{ fileID: string; status: number; errMsg: string }> }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 下载文件 */
  downloadFile(options: {
    fileID: string
    success?: (res: { tempFilePath: string; statusCode: number; errMsg: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
}

interface Wx {
  createCanvas(): WxCanvas

  // ── 云开发 ──
  cloud: WxCloud
  /** 创建离屏画布 */
  createOffscreenCanvas(options?: { type?: "webgl" | "2d"; width?: number; height?: number }): WxCanvas
  createImage(): WxImage
  createInnerAudioContext(): WxInnerAudioContext
  getSystemInfoSync(): WxSystemInfo
  /** 异步获取系统信息 */
  getSystemInfo(options?: {
    success?: (res: WxSystemInfo) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 获取窗口信息 */
  getWindowInfo(): WxWindowInfo
  /** 获取设备信息 */
  getDeviceInfo(): WxDeviceInfo
  /** 获取小程序基础信息 */
  getAppBaseInfo(): WxAppBaseInfo
  // ── 帧回调 ──
  requestAnimationFrame(callback: () => void): number
  cancelAnimationFrame(requestID: number): void

  onTouchStart(callback: (event: WxTouchEvent) => void): void
  onTouchMove(callback: (event: WxTouchEvent) => void): void
  onTouchEnd(callback: (event: WxTouchEvent) => void): void
  onTouchCancel(callback: (event: WxTouchEvent) => void): void
  offTouchStart(callback?: (event: WxTouchEvent) => void): void
  offTouchMove(callback?: (event: WxTouchEvent) => void): void
  offTouchEnd(callback?: (event: WxTouchEvent) => void): void
  offTouchCancel(callback?: (event: WxTouchEvent) => void): void

  // ── PC 端键盘事件 ──
  /** 监听键盘按下事件（PC 端） */
  onKeyDown(callback: (res: { code: string; key: string; timeStamp: number }) => void): void
  /** 取消监听键盘按下事件 */
  offKeyDown(callback?: (res: { code: string; key: string; timeStamp: number }) => void): void
  /** 监听键盘弹起事件（PC 端） */
  onKeyUp(callback: (res: { code: string; key: string; timeStamp: number }) => void): void
  /** 取消监听键盘弹起事件 */
  offKeyUp(callback?: (res: { code: string; key: string; timeStamp: number }) => void): void

  setStorageSync(key: string, data: unknown): void
  getStorageSync<T = unknown>(key: string): T
  removeStorageSync(key: string): void
  clearStorageSync(): void
  showToast(options: { title: string; icon?: "success" | "error" | "loading" | "none"; duration?: number }): void
  hideToast(): void
  showModal(options: {
    title?: string
    content?: string
    showCancel?: boolean
    cancelText?: string
    confirmText?: string
    success?: (res: { confirm: boolean; cancel: boolean }) => void
  }): void
  createRewardedVideoAd(option: WxCreateRewardedVideoAdOption): WxRewardedVideoAd

  getMenuButtonBoundingClientRect(): WxMenuButtonBoundingClientRect

  vibrateShort(options?: {
    type?: "heavy" | "medium" | "light"
    success?: () => void
    fail?: (err: { errMsg: string }) => void
  }): void
  vibrateLong(options?: { success?: () => void; fail?: (err: { errMsg: string }) => void }): void

  showShareMenu(options?: {
    withShareTicket?: boolean
    menus?: string[]
    success?: () => void
    fail?: (err: { errMsg: string }) => void
  }): void
  onShareAppMessage(callback: () => WxShareAppMessageOption): void
  offShareAppMessage(callback?: () => WxShareAppMessageOption): void
  shareAppMessage(options?: WxShareAppMessageOption): void

  loadSubpackage(options: {
    name: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): WxLoadSubpackageTask

  onAudioInterruptionBegin(callback: () => void): void
  offAudioInterruptionBegin(callback?: () => void): void
  onAudioInterruptionEnd(callback: () => void): void
  offAudioInterruptionEnd(callback?: () => void): void

  // ── 文件系统 ──
  getFileSystemManager(): WxFileSystemManager
  env: { USER_DATA_PATH: string }

  // ── 生命周期 ──
  onShow(callback: (res: { query: Record<string, string>; shareTicket?: string; scene?: number }) => void): void
  offShow(callback?: (res: { query: Record<string, string>; shareTicket?: string; scene?: number }) => void): void
  onHide(callback: () => void): void
  offHide(callback?: () => void): void
  exitMiniProgram(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 重启当前小程序 */
  restartMiniProgram(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 屏幕 ──
  setKeepScreenOn(options: {
    keepScreenOn: boolean
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 监听窗口尺寸变化事件 */
  onWindowResize(callback: (res: { windowWidth: number; windowHeight: number }) => void): void
  /** 取消监听窗口尺寸变化事件 */
  offWindowResize(callback?: (res: { windowWidth: number; windowHeight: number }) => void): void
  /** 设置屏幕亮度 */
  setScreenBrightness(options: {
    /** 屏幕亮度值（0~1 之间） */
    value: number
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 获取屏幕亮度 */
  getScreenBrightness(options: {
    success?: (res: { value: number }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 性能 ──
  getPerformance(): { now(): number; mark(name: string): void; clearMarks(name?: string): void }
  triggerGC(): void

  // ── 剪贴板 ──
  setClipboardData(options: {
    data: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  getClipboardData(options: {
    success?: (res: { data: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 网络状态 ──
  getNetworkType(options: {
    success?: (res: { networkType: "wifi" | "2g" | "3g" | "4g" | "5g" | "unknown" | "none" }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  onNetworkStatusChange(callback: (res: { isConnected: boolean; networkType: string }) => void): void
  offNetworkStatusChange(callback?: (res: { isConnected: boolean; networkType: string }) => void): void

  // ── 网络请求 ──
  request(options: {
    url: string
    method?: "GET" | "POST" | "PUT" | "DELETE" | "OPTIONS" | "HEAD" | "TRACE" | "CONNECT"
    data?: string | Record<string, unknown> | ArrayBuffer
    header?: Record<string, string>
    dataType?: "json" | string
    responseType?: "text" | "arraybuffer"
    timeout?: number
    success?: (res: { data: unknown; statusCode: number; header: Record<string, string> }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): WxRequestTask

  // ── 用户登录 ──
  login(options?: {
    timeout?: number
    success?: (res: { code: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  checkSession(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 授权设置 ──
  getSetting(options: {
    success?: (res: { authSetting: WxAuthSetting }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  openSetting(options?: {
    success?: (res: { authSetting: WxAuthSetting }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  authorize(options: {
    scope: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 支付 ──
  requestMidasPayment(options: {
    mode: "game"
    env?: 0 | 1
    offerId: string
    currencyType: "CNY"
    buyQuantity: number
    platform?: "android"
    zoneId?: string
    success?: (res: { errMsg: string }) => void
    fail?: (err: { errMsg: string; errCode: number }) => void
    complete?: () => void
  }): void

  // ── 开放数据域 ──
  getOpenDataContext(): WxOpenDataContext
  postMessage(msg: Record<string, unknown>): void

  // ── UI 补充 ──
  showLoading(options: {
    title: string
    mask?: boolean
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  hideLoading(options?: { success?: () => void; fail?: (err: { errMsg: string }) => void; complete?: () => void }): void
  showActionSheet(options: {
    itemList: string[]
    itemColor?: string
    success?: (res: { tapIndex: number }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 广告 ──
  createBannerAd(options: {
    adUnitId: string
    adIntervals?: number
    style: { left: number; top: number; width: number; height?: number }
  }): WxBannerAd
  createInterstitialAd(options: { adUnitId: string }): WxInterstitialAd
  createCustomAd(options: {
    adUnitId: string
    adIntervals?: number
    style: { left: number; top: number; fixed?: boolean }
  }): WxCustomAd
  createGameBanner(options: { adUnitId: string; style: { left: number; top: number } }): WxGameBanner
  createGamePortal(options: { adUnitId: string }): WxGamePortal
  createGameIcon(options: { adUnitId: string; count: number; style: { left: number; top: number } }): WxGameIcon

  // ── WebSocket ──
  connectSocket(options: {
    url: string
    header?: Record<string, string>
    protocols?: string[]
    tcpNoDelay?: boolean
    perMessageDeflate?: boolean
    timeout?: number
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): WxSocketTask

  // ── 下载/上传 ──
  downloadFile(options: {
    url: string
    header?: Record<string, string>
    filePath?: string
    timeout?: number
    success?: (res: { tempFilePath: string; filePath: string; statusCode: number }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): WxDownloadTask
  uploadFile(options: {
    url: string
    filePath: string
    name: string
    header?: Record<string, string>
    formData?: Record<string, string>
    timeout?: number
    success?: (res: { data: string; statusCode: number }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): WxUploadTask

  // ── 更新管理 ──
  getUpdateManager(): WxUpdateManager

  // ── 内存警告 ──
  onMemoryWarning(callback: (res: { level: 5 | 10 | 15 }) => void): void
  offMemoryWarning(callback?: (res: { level: 5 | 10 | 15 }) => void): void

  // ── 启动参数 ──
  getLaunchOptionsSync(): WxLaunchOption
  getEnterOptionsSync(): WxLaunchOption

  // ── 全局错误 ──
  onError(callback: (res: { message: string; stack: string }) => void): void
  offError(callback?: (res: { message: string; stack: string }) => void): void
  onUnhandledRejection(callback: (res: { reason: string; promise: Promise<unknown> }) => void): void
  offUnhandledRejection(callback?: (res: { reason: string; promise: Promise<unknown> }) => void): void

  // ── 帧率 ──
  setPreferredFramesPerSecond(fps: number): void

  // ── 软键盘 ──
  showKeyboard(options: {
    defaultValue?: string
    maxLength?: number
    multiple?: boolean
    confirmHold?: boolean
    confirmType?: "send" | "search" | "next" | "go" | "done"
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  hideKeyboard(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  updateKeyboard(options: {
    value: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  onKeyboardInput(callback: (res: { value: string }) => void): void
  offKeyboardInput(callback?: (res: { value: string }) => void): void
  onKeyboardConfirm(callback: (res: { value: string }) => void): void
  offKeyboardConfirm(callback?: (res: { value: string }) => void): void
  onKeyboardComplete(callback: (res: { value: string }) => void): void
  offKeyboardComplete(callback?: (res: { value: string }) => void): void
  onKeyboardHeightChange(callback: (res: { height: number }) => void): void
  offKeyboardHeightChange(callback?: (res: { height: number }) => void): void

  // ── 异步存储 ──
  setStorage(options: {
    key: string
    data: unknown
    encrypt?: boolean
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  getStorage(options: {
    key: string
    encrypt?: boolean
    success?: (res: { data: unknown }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  removeStorage(options: {
    key: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  clearStorage(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  getStorageInfo(options: {
    success?: (res: { keys: string[]; currentSize: number; limitSize: number }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  getStorageInfoSync(): { keys: string[]; currentSize: number; limitSize: number }

  // ── 加速计 ──
  startAccelerometer(options?: {
    interval?: "game" | "ui" | "normal"
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  stopAccelerometer(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  onAccelerometerChange(callback: (res: { x: number; y: number; z: number }) => void): void
  offAccelerometerChange(callback?: (res: { x: number; y: number; z: number }) => void): void

  // ── 罗盘 ──
  startCompass(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  stopCompass(options?: { success?: () => void; fail?: (err: { errMsg: string }) => void; complete?: () => void }): void
  onCompassChange(callback: (res: { direction: number; accuracy: number | string }) => void): void
  offCompassChange(callback?: (res: { direction: number; accuracy: number | string }) => void): void

  // ── 设备方向 ──
  startDeviceMotionListening(options?: {
    interval?: "game" | "ui" | "normal"
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  stopDeviceMotionListening(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  onDeviceMotionChange(callback: (res: { alpha: number; beta: number; gamma: number }) => void): void
  offDeviceMotionChange(callback?: (res: { alpha: number; beta: number; gamma: number }) => void): void

  // ── 陀螺仪 ──
  startGyroscope(options?: {
    interval?: "game" | "ui" | "normal"
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  stopGyroscope(options?: {
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  onGyroscopeChange(callback: (res: { x: number; y: number; z: number }) => void): void
  offGyroscopeChange(callback?: (res: { x: number; y: number; z: number }) => void): void

  // ── 转屏 ──
  /** 监听横竖屏切换事件 */
  onDeviceOrientationChange(callback: (res: { value: "portrait" | "landscape" | "landscapeReverse" }) => void): void
  /** 取消监听横竖屏切换事件 */
  offDeviceOrientationChange(callback?: (res: { value: "portrait" | "landscape" | "landscapeReverse" }) => void): void
  /** 设置屏幕方向 */
  setDeviceOrientation(options: {
    value: "portrait" | "landscape" | "landscapeReverse"
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 电池 ──
  /** 获取设备电量（异步） */
  getBatteryInfo(options: {
    success?: (res: { level: number; isCharging: boolean }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 获取设备电量（同步） */
  getBatteryInfoSync(): { level: number; isCharging: boolean }

  // ── 用户信息 ──
  getUserInfo(options: {
    withCredentials?: boolean
    lang?: "en" | "zh_CN" | "zh_TW"
    success?: (res: {
      userInfo: WxUserInfo
      rawData: string
      signature: string
      encryptedData: string
      iv: string
    }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  createUserInfoButton(options: {
    type: "text" | "image"
    text?: string
    image?: string
    style: {
      left: number
      top: number
      width: number
      height: number
      backgroundColor?: string
      borderColor?: string
      borderWidth?: number
      borderRadius?: number
      color?: string
      textAlign?: string
      fontSize?: number
      lineHeight?: number
    }
  }): WxUserInfoButton

  // ── 跳转小程序 ──
  navigateToMiniProgram(options: {
    appId: string
    path?: string
    extraData?: Record<string, unknown>
    envVersion?: "develop" | "trial" | "release"
    shortLink?: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 数据上报 ──
  reportAnalytics(eventName: string, data: Record<string, unknown>): void
  reportMonitor(name: string, value: number): void
  reportPerformance(id: number, value: number, dimensions?: string | string[]): void

  // ── 游戏圈 ──
  createGameClubButton(options: {
    type: "text" | "image"
    text?: string
    image?: string
    icon?: "green" | "white" | "dark" | "light"
    style: { left: number; top: number; width: number; height: number }
  }): WxGameClubButton

  // ── 订阅消息 ──
  requestSubscribeMessage(options: {
    tmplIds: string[]
    success?: (res: Record<string, "accept" | "reject" | "ban">) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  requestSubscribeSystemMessage(options: {
    msgTypeList: string[]
    success?: (res: Record<string, "accept" | "reject" | "ban">) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 视频 ──
  createVideo(options: {
    x?: number
    y?: number
    width?: number
    height?: number
    src: string
    poster?: string
    autoplay?: boolean
    loop?: boolean
    muted?: boolean
    objectFit?: "contain" | "cover" | "fill"
    controls?: boolean
    showCenterPlayBtn?: boolean
    enableProgressGesture?: boolean
  }): WxVideo

  // ── 录音 ──
  getRecorderManager(): WxRecorderManager

  // ── 游戏录屏 ──
  createGameRecorder(): WxGameRecorder
  createGameRecorderShareButton(options: {
    style?: { left?: number; top?: number }
    shareMessageTitle?: string
    shareMessageExtra?: Record<string, unknown>
  }): WxGameRecorderShareButton

  // ── Worker ──
  createWorker(scriptPath: string, options?: { useExperimentalWorker?: boolean }): WxWorker

  // ── 基础 ──
  /** 判断小程序的 API、回调、参数、组件等是否在当前版本可用 */
  canIUse(schema: string): boolean
  /** 将 Base64 字符串转成 ArrayBuffer */
  base64ToArrayBuffer(base64: string): ArrayBuffer
  /** 将 ArrayBuffer 转成 Base64 字符串 */
  arrayBufferToBase64(arrayBuffer: ArrayBuffer): string

  // ── 调试 ──
  /** 设置是否打开调试开关（正式版也可打开） */
  setEnableDebug(options: {
    enableDebug: boolean
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 截屏 ──
  /** 监听用户主动截屏事件 */
  onUserCaptureScreen(callback: () => void): void
  /** 取消监听用户主动截屏事件 */
  offUserCaptureScreen(callback?: () => void): void

  // ── 图片 ──
  /** 保存图片到系统相册（需用户授权 scope.writePhotosAlbum） */
  saveImageToPhotosAlbum(options: {
    filePath: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 在新页面中全屏预览图片 */
  previewImage(options: {
    urls: string[]
    current?: string
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 获取图片信息 */
  getImageInfo(options: {
    src: string
    success?: (res: WxImageInfo) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 压缩图片 */
  compressImage(options: {
    src: string
    /** 压缩质量（0~100） */
    quality?: number
    success?: (res: { tempFilePath: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void

  // ── 分享补充 ──
  /** 获取转发详细信息 */
  getShareInfo(options: {
    shareTicket: string
    timeout?: number
    success?: (res: { encryptedData: string; iv: string; cloudID?: string }) => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 更新转发属性 */
  updateShareMenu(options?: {
    withShareTicket?: boolean
    isUpdatableMessage?: boolean
    activityId?: string
    templateInfo?: { parameterList: Array<{ name: string; value: string }> }
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
  /** 隐藏转发按钮 */
  hideShareMenu(options?: {
    menus?: string[]
    success?: () => void
    fail?: (err: { errMsg: string }) => void
    complete?: () => void
  }): void
}

declare const wx: Wx

// 微信小游戏全局 API（不在 wx 对象上）
declare function requestAnimationFrame(callback: () => void): number
declare function cancelAnimationFrame(requestID: number): void
