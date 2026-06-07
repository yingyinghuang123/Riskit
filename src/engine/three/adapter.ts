/**
 * Three.js 平台适配层
 *
 * Three.js 原生依赖浏览器环境（document, window, Image, XMLHttpRequest 等），
 * 微信小游戏没有这些全局对象。此适配层通过 Platform 抽象提供最小兼容实现。
 *
 * 使用方式：在导入 Three.js 之前调用 installAdapter()
 */

import { getPlatform } from "../platform"

// ─── 全局模拟对象 ─────────────────────────────────────────────

let _installed = false

declare const GameGlobal: any

/** 安装 Three.js 平台适配层 */
export function installAdapter(mainCanvas: WxCanvas): void {
  if (_installed) return
  _installed = true

  const g = (typeof GameGlobal !== "undefined" ? GameGlobal : globalThis) as any

  // ── document 最小子集 ──
  if (!g.document) {
    g.document = createMiniDocument(mainCanvas)
  }

  // ── window 最小子集 ──
  if (!g.window) {
    g.window = g
  }

  // ── HTMLCanvasElement mock ──
  if (!g.HTMLCanvasElement) {
    g.HTMLCanvasElement = WxCanvasProxy
  }

  // ── Image ──
  if (!g.Image) {
    g.Image = WxImageProxy
  }

  // ── XMLHttpRequest ──
  if (!g.XMLHttpRequest) {
    g.XMLHttpRequest = WxXHRProxy
  }

  // ── Blob（存储真实二进制数据，供 URL.createObjectURL 转 data URL） ──
  if (!g.Blob) {
    g.Blob = class Blob {
      _buffer: ArrayBuffer
      type: string
      constructor(parts: any[] = [], options: any = {}) {
        this.type = options.type || ""
        const arrays: Uint8Array[] = []
        for (const part of parts) {
          if (part instanceof ArrayBuffer) {
            arrays.push(new Uint8Array(part))
          } else if (part instanceof Uint8Array) {
            arrays.push(part)
          } else if (ArrayBuffer.isView(part)) {
            arrays.push(new Uint8Array((part as any).buffer, (part as any).byteOffset, (part as any).byteLength))
          } else if (typeof part === "string") {
            const bytes: number[] = []
            for (let i = 0; i < part.length; i++) bytes.push(part.charCodeAt(i) & 0xff)
            arrays.push(new Uint8Array(bytes))
          }
        }
        const totalLen = arrays.reduce((sum, a) => sum + a.length, 0)
        const merged = new Uint8Array(totalLen)
        let offset = 0
        for (const arr of arrays) {
          merged.set(arr, offset)
          offset += arr.length
        }
        this._buffer = merged.buffer
      }
      get size() {
        return this._buffer.byteLength
      }
      arrayBuffer() {
        return Promise.resolve(this._buffer)
      }
    }
  }

  // ── URL（将 Blob 转 data URL，供 Three.js 加载内嵌纹理） ──
  if (!g.URL) {
    g.URL = {
      createObjectURL(blob: any): string {
        if (!blob?._buffer) return ""
        const bytes = new Uint8Array(blob._buffer)
        const type = blob.type || "application/octet-stream"
        let binary = ""
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
        return `data:${type};base64,${miniBtoa(binary)}`
      },
      revokeObjectURL() {},
    }
  }

  // ── performance ──
  if (!g.performance) {
    const platform = getPlatform()
    g.performance = {
      now: () => platform.now(),
    }
  }

  // ── requestAnimationFrame（复用引擎主循环，这里只做兼容） ──
  if (!g.requestAnimationFrame) {
    const p = getPlatform()
    g.requestAnimationFrame = (cb: FrameRequestCallback) => p.requestAnimationFrame(cb as () => void)
  }
  if (!g.cancelAnimationFrame) {
    const p = getPlatform()
    g.cancelAnimationFrame = (id: number) => p.cancelAnimationFrame(id)
  }

  // ── TextDecoder / TextEncoder polyfill ──
  if (!g.TextDecoder) {
    g.TextDecoder = MiniTextDecoder
  }
  if (!g.TextEncoder) {
    g.TextEncoder = MiniTextEncoder
  }

  // ── atob / btoa ──
  if (!g.atob) {
    g.atob = miniAtob
  }
  if (!g.btoa) {
    g.btoa = miniBtoa
  }

  // ── navigator（包含真实设备信息，供 Three.js 做 iOS/Android 特定优化） ──
  if (!g.navigator) {
    const nav = getPlatform().getNavigator()
    g.navigator = { userAgent: nav.userAgent, platform: "miniGame" }
  }
}

// ─── Mini Document ──────────────────────────────────────────────

function createMiniDocument(mainCanvas: WxCanvas) {
  const canvasMap = new Map<string, WxCanvas>()

  return {
    createElement(tag: string): any {
      const t = tag.toLowerCase()
      if (t === "canvas") {
        const c = getPlatform().createCanvas()
        return wrapCanvas(c)
      }
      if (t === "img" || t === "image") {
        return new WxImageProxy()
      }
      // 返回空 div-like 对象
      return createDummyElement(t)
    },

    createElementNS(_ns: string, tag: string): any {
      // Three.js 用 createElementNS 创建 canvas 和 svg
      const t = tag.toLowerCase()
      if (t === "canvas") {
        const c = getPlatform().createCanvas()
        return wrapCanvas(c)
      }
      if (t === "img" || t === "image") {
        return new WxImageProxy()
      }
      return createDummyElement(t)
    },

    getElementById(id: string): any {
      if (id === "main" || id === "canvas") {
        return wrapCanvas(mainCanvas)
      }
      return canvasMap.get(id) ?? null
    },

    createTextNode() {
      return {}
    },

    body: {
      appendChild() {},
      removeChild() {},
      style: {},
    },

    head: {
      appendChild() {},
    },

    documentElement: {
      style: {},
    },

    addEventListener() {},
    removeEventListener() {},
  }
}

// ─── Canvas Wrapper ─────────────────────────────────────────────

class WxCanvasProxy {
  _canvas: WxCanvas

  constructor(canvas?: WxCanvas) {
    this._canvas = canvas ?? getPlatform().createCanvas()
  }

  get width() {
    return this._canvas.width
  }
  set width(v: number) {
    this._canvas.width = v
  }
  get height() {
    return this._canvas.height
  }
  set height(v: number) {
    this._canvas.height = v
  }

  getContext(type: string, _attrs?: any) {
    return this._canvas.getContext(type as any)
  }

  toDataURL() {
    return this._canvas.toDataURL?.() ?? ""
  }

  get style() {
    return {} as any
  }
  set style(_v: any) {}

  addEventListener() {}
  removeEventListener() {}
  remove() {}
  getBoundingClientRect() {
    const screen = getPlatform().getScreenInfo()
    return { left: 0, top: 0, width: screen.width, height: screen.height }
  }

  get clientWidth() {
    return this._canvas.width
  }
  get clientHeight() {
    return this._canvas.height
  }
}

function wrapCanvas(c: WxCanvas): WxCanvasProxy {
  return new WxCanvasProxy(c)
}

// ─── Image Proxy ────────────────────────────────────────────────

class WxImageProxy {
  private _wxImg: WxImage

  constructor() {
    this._wxImg = getPlatform().createImage()
  }

  get width() {
    return this._wxImg.width
  }
  get height() {
    return this._wxImg.height
  }
  get naturalWidth() {
    return this._wxImg.width
  }
  get naturalHeight() {
    return this._wxImg.height
  }

  get src() {
    return this._wxImg.src
  }
  set src(v: string) {
    this._wxImg.src = v
  }

  set onload(fn: (() => void) | null) {
    this._wxImg.onload = fn
  }
  get onload() {
    return this._wxImg.onload
  }

  set onerror(fn: ((err: unknown) => void) | null) {
    this._wxImg.onerror = fn
  }
  get onerror() {
    return this._wxImg.onerror
  }

  addEventListener(event: string, fn: (...args: any[]) => void) {
    if (event === "load") this._wxImg.onload = fn
    else if (event === "error") this._wxImg.onerror = fn
  }

  removeEventListener() {}

  /** 供 Three.js TextureLoader 使用 */
  get _wxImageRef(): WxImage {
    return this._wxImg
  }
}

// ─── XMLHttpRequest Proxy ───────────────────────────────────────

class WxXHRProxy {
  private _method = "GET"
  private _url = ""
  private _headers: Record<string, string> = {}
  private _responseType = ""
  private _status = 0
  private _response: any = null
  private _readyState = 0

  onload: (() => void) | null = null
  onerror: ((err: any) => void) | null = null
  onprogress: ((event: any) => void) | null = null
  onreadystatechange: (() => void) | null = null

  get readyState() {
    return this._readyState
  }
  get status() {
    return this._status
  }
  get response() {
    return this._response
  }
  get responseText() {
    return typeof this._response === "string" ? this._response : ""
  }

  get responseType() {
    return this._responseType
  }
  set responseType(v: string) {
    this._responseType = v
  }

  open(method: string, url: string) {
    this._method = method
    this._url = url
    this._readyState = 1
  }

  setRequestHeader(key: string, value: string) {
    this._headers[key] = value
  }

  send(body?: any) {
    const url = this._url
    const responseType = this._responseType
    const platform = getPlatform()

    // 本地文件（wxfile:// 前缀、用户数据目录、或相对路径）
    const userDataPath = platform.getUserDataPath()
    const isLocal =
      url.startsWith("wxfile://") ||
      (userDataPath && url.startsWith(userDataPath)) ||
      (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:"))
    if (isLocal) {
      const encoding = responseType === "arraybuffer" ? "binary" : "utf-8"
      platform
        .readFile(url, encoding)
        .then((data) => {
          this._status = 200
          this._response = data
          this._readyState = 4
          this.onreadystatechange?.()
          this.onload?.()
        })
        .catch((err) => {
          this._status = 404
          this._readyState = 4
          this.onreadystatechange?.()
          this.onerror?.(err)
        })
      return
    }

    // 网络请求
    platform
      .fetch(url, {
        method: this._method,
        headers: this._headers,
        body: body ?? undefined,
      })
      .then(async (res) => {
        this._status = res.status
        this._response =
          responseType === "arraybuffer"
            ? await res.arrayBuffer()
            : responseType === "json"
              ? await res.json()
              : await res.text()
        this._readyState = 4
        this.onreadystatechange?.()
        this.onload?.()
      })
      .catch((err) => {
        this._status = 0
        this._readyState = 4
        this.onreadystatechange?.()
        this.onerror?.(err)
      })
  }

  abort() {}
  getResponseHeader() {
    return null
  }
  getAllResponseHeaders() {
    return ""
  }
}

// ─── TextDecoder / TextEncoder ──────────────────────────────────

class MiniTextDecoder {
  encoding: string

  constructor(encoding = "utf-8") {
    this.encoding = encoding
  }

  decode(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
    // 简单 UTF-8 解码
    let result = ""
    let i = 0
    while (i < bytes.length) {
      const b = bytes[i]
      if (b < 0x80) {
        result += String.fromCharCode(b)
        i++
      } else if (b < 0xe0) {
        result += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f))
        i += 2
      } else if (b < 0xf0) {
        result += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f))
        i += 3
      } else {
        const cp =
          ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)
        // Surrogate pair
        const offset = cp - 0x10000
        result += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff))
        i += 4
      }
    }
    return result
  }
}

class MiniTextEncoder {
  encoding = "utf-8"

  encode(str: string): Uint8Array {
    const bytes: number[] = []
    for (let i = 0; i < str.length; i++) {
      let cp = str.charCodeAt(i)
      if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < str.length) {
        const lo = str.charCodeAt(i + 1)
        if (lo >= 0xdc00 && lo <= 0xdfff) {
          cp = ((cp - 0xd800) << 10) + (lo - 0xdc00) + 0x10000
          i++
        }
      }
      if (cp < 0x80) {
        bytes.push(cp)
      } else if (cp < 0x800) {
        bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
      } else if (cp < 0x10000) {
        bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
      } else {
        bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
      }
    }
    return new Uint8Array(bytes)
  }
}

// ─── Dummy Element ──────────────────────────────────────────────

function createDummyElement(tag: string): any {
  return {
    tagName: tag.toUpperCase(),
    style: {},
    childNodes: [],
    appendChild() {},
    removeChild() {},
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() {
      return null
    },
    getBoundingClientRect() {
      return { left: 0, top: 0, width: 0, height: 0 }
    },
    get clientWidth() {
      return 0
    },
    get clientHeight() {
      return 0
    },
  }
}

// ─── atob / btoa polyfill ───────────────────────────────────────

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

function miniAtob(input: string): string {
  let output = ""
  let i = 0
  const str = input.replace(/[^A-Za-z0-9+/=]/g, "")
  while (i < str.length) {
    const a = B64.indexOf(str.charAt(i++))
    const b = B64.indexOf(str.charAt(i++))
    const c = B64.indexOf(str.charAt(i++))
    const d = B64.indexOf(str.charAt(i++))
    output += String.fromCharCode(((a << 2) | (b >> 4)) & 0xff)
    if (c !== 64) output += String.fromCharCode(((b << 4) | (c >> 2)) & 0xff)
    if (d !== 64) output += String.fromCharCode(((c << 6) | d) & 0xff)
  }
  return output
}

function miniBtoa(input: string): string {
  let output = ""
  let i = 0
  while (i < input.length) {
    const a = input.charCodeAt(i++) & 0xff
    const b = i < input.length ? input.charCodeAt(i++) & 0xff : NaN
    const c = i < input.length ? input.charCodeAt(i++) & 0xff : NaN
    output += B64.charAt(a >> 2)
    output += B64.charAt(((a & 3) << 4) | (isNaN(b) ? 0 : b >> 4))
    output += isNaN(b) ? "=" : B64.charAt(((b & 15) << 2) | (isNaN(c) ? 0 : c >> 6))
    output += isNaN(c) ? "=" : B64.charAt(c & 63)
  }
  return output
}
