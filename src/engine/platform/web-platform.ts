// ─── 浏览器平台实现 ─────────────────────────────────────────
import type {
  Platform,
  ScreenInfo,
  PlatformAudioContext,
  PlatformTouchCallback,
  PlatformKeyCallback,
  PlatformSensorCallback,
  PlatformKeyboardOptions,
} from "./platform"
import { WebStorage } from "./web/storage"
import { WebHttp } from "./web/http"
import { WebWebSocket } from "./web/websocket"
import { WebLifecycle } from "./web/lifecycle"
import { WebVibrate } from "./web/vibrate"

function createHtmlAudioContext(): PlatformAudioContext {
  const audio = new Audio()
  let _onEnded: (() => void) | null = null
  let _onStop: (() => void) | null = null
  let _onCanplay: (() => void) | null = null
  let _onError: ((err: any) => void) | null = null

  audio.addEventListener("ended", () => _onEnded?.())
  audio.addEventListener("canplaythrough", () => _onCanplay?.())
  audio.addEventListener("error", (e) => _onError?.(e))

  return {
    get src() {
      return audio.src
    },
    set src(v: string) {
      audio.src = v
    },
    get loop() {
      return audio.loop
    },
    set loop(v: boolean) {
      audio.loop = v
    },
    get volume() {
      return audio.volume
    },
    set volume(v: number) {
      audio.volume = Math.max(0, Math.min(1, v))
    },
    play() {
      audio.play().catch(() => {})
    },
    pause() {
      audio.pause()
    },
    stop() {
      audio.pause()
      audio.currentTime = 0
      _onStop?.()
    },
    seek(position: number) {
      audio.currentTime = position
    },
    destroy() {
      audio.pause()
      audio.src = ""
      _onEnded = null
      _onStop = null
      _onCanplay = null
      _onError = null
    },
    onEnded(cb) {
      _onEnded = cb
    },
    onStop(cb) {
      _onStop = cb
    },
    onCanplay(cb) {
      _onCanplay = cb
    },
    onError(cb) {
      _onError = cb
    },
    offCanplay() {
      _onCanplay = null
    },
    offError() {
      _onError = null
    },
  }
}

export interface WebPlatformOptions {
  /** 覆盖 devicePixelRatio（PieBox 预览面板传入，降低 GPU 负载） */
  dpr?: number
}

export function createWebPlatform(canvas: HTMLCanvasElement, options?: WebPlatformOptions): Platform {
  const screenInfo: ScreenInfo = {
    width: canvas.clientWidth || canvas.width,
    height: canvas.clientHeight || canvas.height,
    pixelRatio: options?.dpr ?? window.devicePixelRatio ?? 1,
  }

  // 将页面坐标转换为 canvas 逻辑坐标（引擎节点坐标系 = 逻辑坐标，不含 dpr）
  function toLocal(clientX: number, clientY: number): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (clientX - rect.left) * (screenInfo.width / rect.width),
      y: (clientY - rect.top) * (screenInfo.height / rect.height),
    }
  }

  function convertTouchEvent(e: TouchEvent): import("./platform").PlatformTouchEvent {
    const changedTouches = Array.from(e.changedTouches).map(t => {
      const local = toLocal(t.clientX, t.clientY)
      return { identifier: t.identifier, clientX: local.x, clientY: local.y }
    })
    return { changedTouches }
  }

  let _mainCanvasReturned = false
  const _keyboardConfirmCbs: Array<(res: { value: string }) => void> = []
  const _keyboardCompleteCbs: Array<() => void> = []

  return {
    getScreenInfo: () => screenInfo,
    createCanvas: () => {
      // 第一次调用返回主屏 canvas（对齐微信 wx.createCanvas 行为）
      if (!_mainCanvasReturned) {
        _mainCanvasReturned = true
        return canvas as unknown as WxCanvas
      }
      return document.createElement("canvas") as unknown as WxCanvas
    },
    createImage: () => new Image() as unknown as WxImage,
    now: () => Date.now(),
    requestAnimationFrame: (cb) => window.requestAnimationFrame(cb),
    cancelAnimationFrame: (id) => window.cancelAnimationFrame(id),

    getWebGLRenderingContext: () => WebGLRenderingContext,
    getCanvasRenderingContext2D: () => CanvasRenderingContext2D as unknown as { prototype: CanvasRenderingContext2D },
    getNavigator: () => ({ userAgent: navigator.userAgent, gpu: (navigator as any).gpu ?? null }),
    getBaseUrl: () => window.location.origin,
    fetch: (url, options) => window.fetch(url, options),

    createAudioContext: () => createHtmlAudioContext(),

    onTouchStart(cb: PlatformTouchCallback) {
      canvas.addEventListener("touchstart", (e) => cb(convertTouchEvent(e)))
      canvas.addEventListener("mousedown", (e) => {
        const p = toLocal(e.clientX, e.clientY)
        cb({ changedTouches: [{ identifier: 0, clientX: p.x, clientY: p.y }] })
      })
    },
    onTouchMove(cb: PlatformTouchCallback) {
      canvas.addEventListener("touchmove", (e) => cb(convertTouchEvent(e)))
      canvas.addEventListener("mousemove", (e) => {
        if (e.buttons & 1) {
          const p = toLocal(e.clientX, e.clientY)
          cb({ changedTouches: [{ identifier: 0, clientX: p.x, clientY: p.y }] })
        }
      })
    },
    onTouchEnd(cb: PlatformTouchCallback) {
      canvas.addEventListener("touchend", (e) => cb(convertTouchEvent(e)))
      canvas.addEventListener("mouseup", (e) => {
        const p = toLocal(e.clientX, e.clientY)
        cb({ changedTouches: [{ identifier: 0, clientX: p.x, clientY: p.y }] })
      })
    },
    onTouchCancel(cb: PlatformTouchCallback) {
      canvas.addEventListener("touchcancel", (e) => cb(convertTouchEvent(e)))
    },

    onKeyDown(cb: PlatformKeyCallback) {
      window.addEventListener("keydown", (e) => cb({ code: e.code, key: e.key }))
    },
    onKeyUp(cb: PlatformKeyCallback) {
      window.addEventListener("keyup", (e) => cb({ code: e.code, key: e.key }))
    },

    startAccelerometer() {},
    stopAccelerometer() {},
    onAccelerometerChange(_cb: PlatformSensorCallback) {},
    startGyroscope() {},
    stopGyroscope() {},
    onGyroscopeChange(_cb: PlatformSensorCallback) {},

    showKeyboard(options: PlatformKeyboardOptions) {
      // Web fallback: use prompt() to simulate wx.showKeyboard
      const value = window.prompt('请输入房间号', options.defaultValue || '')
      if (value !== null) {
        // user confirmed
        for (const cb of _keyboardConfirmCbs) cb({ value })
      } else {
        // user cancelled
        for (const cb of _keyboardCompleteCbs) cb()
      }
    },
    hideKeyboard() {},
    onKeyboardConfirm(cb: (res: { value: string }) => void) { _keyboardConfirmCbs.push(cb) },
    onKeyboardComplete(cb: () => void) { _keyboardCompleteCbs.push(cb) },

    onMemoryWarning(_cb: () => void) {},

    loadFont(_src: string): string | null {
      return null
    },
    async readFile(url: string, encoding?: string): Promise<any> {
      const r = await window.fetch(url)
      return encoding ? r.text() : r.arrayBuffer()
    },
    getUserDataPath: () => "",

    storage: new WebStorage(),
    http: new WebHttp(),
    websocket: new WebWebSocket(),
    lifecycle: new WebLifecycle(),
    vibrate: new WebVibrate(),
  }
}
