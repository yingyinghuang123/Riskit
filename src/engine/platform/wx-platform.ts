// ─── 微信小游戏平台实现 ─────────────────────────────────────
import type {
  Platform,
  ScreenInfo,
  PlatformAudioContext,
  PlatformTouchCallback,
  PlatformKeyCallback,
  PlatformSensorCallback,
  PlatformKeyboardOptions,
} from "./platform"
import { WxStorage } from "./wx/storage"
import { WxHttp, WxWebSocket } from "./wx/network"
import { WxVibrate } from "./wx/vibrate"
import { WxShare } from "./wx/share"
import { WxAuth } from "./wx/auth"
import { WxPayment } from "./wx/payment"
import { WxAds } from "./wx/ads"
import { WxCloud } from "./wx/cloud"
import { WxSocial } from "./wx/social"
import { WxRecorder } from "./wx/recorder"
import { WxAI } from "./wx/ai"

declare const wx: any

function patchCanvas(c: any): any {
  if (!c.style) c.style = {}
  if (!c.addEventListener) c.addEventListener = () => {}
  if (!c.removeEventListener) c.removeEventListener = () => {}
  if (!c.setAttribute) c.setAttribute = () => {}
  if (!c.getAttribute) c.getAttribute = () => null
  if (!c.remove) c.remove = () => {}
  if (!c.getBoundingClientRect) {
    c.getBoundingClientRect = () => ({ left: 0, top: 0, width: c.width || 0, height: c.height || 0 })
  }
  if (!c.clientWidth) Object.defineProperty(c, "clientWidth", { get: () => c.width || 0 })
  if (!c.clientHeight) Object.defineProperty(c, "clientHeight", { get: () => c.height || 0 })
  return c
}

export function createWxPlatform(): Platform {
  const info = wx.getSystemInfoSync()
  const screenInfo: ScreenInfo = {
    width: info.screenWidth,
    height: info.screenHeight,
    pixelRatio: info.pixelRatio,
  }

  return {
    getScreenInfo: () => screenInfo,
    createCanvas: () => patchCanvas(wx.createCanvas()),
    createImage: () => wx.createImage(),
    now: () => Date.now(),
    requestAnimationFrame: (cb) => requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => cancelAnimationFrame(id),

    getWebGLRenderingContext: () => {
      if (typeof WebGLRenderingContext !== "undefined") return WebGLRenderingContext
      // PixiJS 用 `gl instanceof getWebGLRenderingContext()` 判断 WebGL 版本：
      // true → WebGL1, false → WebGL2。必须返回 WebGL1 的构造函数。
      const tmpCanvas = wx.createCanvas()
      const gl1 = tmpCanvas.getContext("webgl")
      if (gl1) return gl1.constructor as unknown as typeof WebGLRenderingContext
      // 极端情况：设备只支持 WebGL2（几乎不可能），仍然返回
      const gl2 = tmpCanvas.getContext("webgl2")
      return gl2!.constructor as unknown as typeof WebGLRenderingContext
    },
    getCanvasRenderingContext2D: () => {
      if (typeof CanvasRenderingContext2D !== "undefined") {
        return CanvasRenderingContext2D as unknown as { prototype: CanvasRenderingContext2D }
      }
      const tmpCanvas = wx.createCanvas()
      const ctx2d = tmpCanvas.getContext("2d")
      return ctx2d!.constructor as unknown as { prototype: CanvasRenderingContext2D }
    },
    getNavigator: () => ({ userAgent: "WeChat MiniGame", gpu: null }),
    getBaseUrl: () => "",
    fetch: (url: string, options?: RequestInit) => {
      return new Promise<Response>((resolve, reject) => {
        wx.request({
          url,
          method: (options?.method as any) || "GET",
          responseType: "arraybuffer",
          success: (res: any) => {
            const headers = new Headers(res.header || {})
            resolve(new Response(res.data, { status: res.statusCode, headers }))
          },
          fail: (err: any) => reject(new Error(err.errMsg)),
        })
      })
    },

    createAudioContext: (): PlatformAudioContext => wx.createInnerAudioContext(),

    onTouchStart: (cb: PlatformTouchCallback) => wx.onTouchStart(cb),
    onTouchMove: (cb: PlatformTouchCallback) => wx.onTouchMove(cb),
    onTouchEnd: (cb: PlatformTouchCallback) => wx.onTouchEnd(cb),
    onTouchCancel: (cb: PlatformTouchCallback) => wx.onTouchCancel(cb),

    onKeyDown: (cb: PlatformKeyCallback) => wx.onKeyDown?.(cb),
    onKeyUp: (cb: PlatformKeyCallback) => wx.onKeyUp?.(cb),

    startAccelerometer: (interval: string) => wx.startAccelerometer({ interval }),
    stopAccelerometer: () => wx.stopAccelerometer({}),
    onAccelerometerChange: (cb: PlatformSensorCallback) => wx.onAccelerometerChange(cb),
    startGyroscope: (interval: string) => wx.startGyroscope({ interval }),
    stopGyroscope: () => wx.stopGyroscope({}),
    onGyroscopeChange: (cb: PlatformSensorCallback) => wx.onGyroscopeChange(cb),

    showKeyboard: (options: PlatformKeyboardOptions) => wx.showKeyboard(options),
    hideKeyboard: () => wx.hideKeyboard({}),
    onKeyboardConfirm: (cb) => wx.onKeyboardConfirm(cb),
    onKeyboardComplete: (cb) => wx.onKeyboardComplete(cb),

    onMemoryWarning: (cb: () => void) => wx.onMemoryWarning(cb),

    loadFont: (src: string) => wx.loadFont(src) ?? null,
    getUserDataPath: () => wx.env.USER_DATA_PATH as string,
    readFile: (path: string, encoding?: string): Promise<any> => {
      return new Promise((resolve, reject) => {
        const fs = wx.getFileSystemManager()
        fs.readFile({
          filePath: path,
          encoding: encoding as any,
          success: (res: any) => resolve(res.data),
          fail: (err: any) => reject(new Error(err.errMsg ?? "readFile failed")),
        })
      })
    },

    loadSubpackage: (name: string, onProgress?: (loaded: number, total: number) => void): Promise<void> => {
      return new Promise((resolve) => {
        const task = wx.loadSubpackage({
          name,
          success: () => resolve(),
          fail: (err: any) => {
            console.warn(`[Subpackage] 分包 "${name}" 加载失败: ${err?.errMsg ?? err}`)
            resolve()
          },
        })
        if (task && onProgress) {
          task.onProgressUpdate?.((res: any) => onProgress(res.progress ?? 0, 100))
        }
      })
    },
    storage: new WxStorage(),
    http: new WxHttp(),
    websocket: new WxWebSocket(),
    vibrate: new WxVibrate(),
    share: new WxShare(),
    auth: new WxAuth(),
    payment: new WxPayment(),
    ads: new WxAds(),
    cloud: new WxCloud(),
    social: new WxSocial(),
    recorder: new WxRecorder(),
    ai: new WxAI(),
  }
}
