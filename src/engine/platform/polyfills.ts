// ─── 微信小游戏环境 polyfill ─────────────────────────────────────
// 必须在 PixiJS / Three.js 等库加载前执行（作为 engine/index.ts 的第一个 import）。
//
// 目标：把微信小游戏环境补齐成浏览器全局对象最小子集，
// 让第三方库的模块顶层代码（import 阶段）能安全执行。
//
// three/adapter.ts 的 installAdapter() 会在 Platform 就绪后
// 用完整版（含 canvas 代理、Image 代理等）覆盖此处的空壳。

const g = globalThis as any

// ── window（PixiJS / Three.js 都可能访问 globalThis.window）──
if (typeof g.window === "undefined") {
  g.window = g
}

// ── document 最小空壳 ──
// PixiJS v8 模块加载时顶层代码直接访问 document.createElement 等。
// installAdapter() 会用 createMiniDocument(mainCanvas) 覆盖。
if (typeof g.document === "undefined") {
  const hasWx = typeof g.wx !== "undefined" && typeof g.wx.createCanvas === "function"

  const wrapCanvas = (c: any) => {
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

  const dummyEl = (tag = "div") => ({
    tagName: tag.toUpperCase(),
    style: {},
    childNodes: [] as any[],
    children: [] as any[],
    innerHTML: "",
    innerText: "",
    textContent: "",
    isConnected: false,
    parentNode: null as any,
    parentElement: null as any,
    getContext() { return null },
    appendChild(child: any) { this.childNodes.push(child); return child },
    removeChild(child: any) {
      const i = this.childNodes.indexOf(child)
      if (i >= 0) this.childNodes.splice(i, 1)
      return child
    },
    contains(child: any) { return this.childNodes.includes(child) },
    remove() {},
    cloneNode() { return dummyEl(tag) },
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() { return true },
    setAttribute() {},
    getAttribute() { return null },
    hasAttribute() { return false },
    getBoundingClientRect() { return { left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0, x: 0, y: 0 } },
    focus() {},
    blur() {},
    get clientWidth() { return 0 },
    get clientHeight() { return 0 },
  })

  g.document = {
    createElement(tag: string) {
      if (hasWx && tag.toLowerCase() === "canvas") return wrapCanvas(g.wx.createCanvas())
      return dummyEl()
    },
    createElementNS(_ns: string, tag: string) {
      if (hasWx && tag.toLowerCase() === "canvas") return wrapCanvas(g.wx.createCanvas())
      return dummyEl()
    },
    createTextNode() { return {} },
    getElementById() { return null },
    body: { appendChild() {}, removeChild() {}, style: {} },
    head: { appendChild() {} },
    documentElement: { style: {} },
    addEventListener() {},
    removeEventListener() {},
  }
}

// ── performance（PixiJS 初始化时直接访问 performance.now()）──
if (typeof g.performance === "undefined") {
  const wxPerf = typeof g.wx !== "undefined" && typeof g.wx.getPerformance === "function"
    ? g.wx.getPerformance()
    : null
  g.performance = {
    now: wxPerf ? () => wxPerf.now() : () => Date.now(),
    timing: {},
    getEntries() { return [] },
    getEntriesByName() { return [] },
    getEntriesByType() { return [] },
    mark() {},
    measure() {},
    clearMarks() {},
    clearMeasures() {},
  }
}

// ── requestAnimationFrame / cancelAnimationFrame ──
// PixiJS Ticker 在模块初始化时可能引用。微信小游戏全局已有，但部分旧基础库缺失。
if (typeof g.requestAnimationFrame === "undefined") {
  g.requestAnimationFrame = (cb: () => void) => setTimeout(cb, 16)
}
if (typeof g.cancelAnimationFrame === "undefined") {
  g.cancelAnimationFrame = (id: number) => clearTimeout(id)
}

// ── DOMException（AbortController 和 Three.js 需要）──
if (typeof g.DOMException === "undefined") {
  g.DOMException = class DOMException extends Error {
    code: number
    constructor(message = "", name = "Error") {
      super(message)
      this.name = name
      this.code = 0
    }
  }
}

// ── AbortController（Three.js LoadingManager 在模块初始化时创建）──
if (typeof g.AbortController === "undefined") {
  const AbortSignal = class {
    aborted = false
    reason: unknown = undefined
    private _listeners: Array<() => void> = []
    addEventListener(_event: string, cb: () => void) {
      this._listeners.push(cb)
    }
    removeEventListener(_event: string, cb: () => void) {
      const i = this._listeners.indexOf(cb)
      if (i >= 0) this._listeners.splice(i, 1)
    }
    dispatchEvent() {
      return true
    }
    onabort: (() => void) | null = null
    throwIfAborted() {
      if (this.aborted) throw this.reason
    }
  }

  g.AbortController = class {
    signal = new AbortSignal()
    abort(reason?: unknown) {
      const sig = this.signal as any
      if (sig.aborted) return
      sig.aborted = true
      sig.reason = reason ?? new g.DOMException("The operation was aborted.", "AbortError")
      sig.onabort?.()
      for (const cb of sig._listeners) cb()
    }
  }
}

// ── HTMLCanvasElement（Three.js 在纹理处理中直接用 instanceof 无 typeof guard）──
if (typeof g.HTMLCanvasElement === "undefined") {
  g.HTMLCanvasElement = class HTMLCanvasElement {}
}

// ── HTMLImageElement（Three.js 用 typeof guard + instanceof）──
if (typeof g.HTMLImageElement === "undefined") {
  g.HTMLImageElement = class HTMLImageElement {}
}

// ── HTMLVideoElement（Three.js 用 typeof guard + instanceof）──
if (typeof g.HTMLVideoElement === "undefined") {
  g.HTMLVideoElement = class HTMLVideoElement {}
}

// ── ImageBitmap（Three.js 用 typeof guard + instanceof）──
if (typeof g.ImageBitmap === "undefined") {
  g.ImageBitmap = class ImageBitmap {}
}

// ── OffscreenCanvas（Three.js 用 typeof guard）──
if (typeof g.OffscreenCanvas === "undefined") {
  g.OffscreenCanvas = class OffscreenCanvas {
    width: number
    height: number
    constructor(w = 0, h = 0) {
      this.width = w
      this.height = h
    }
    getContext() {
      return null
    }
  }
}

// ── CustomEvent（Three.js devtools 集成使用）──
if (typeof g.CustomEvent === "undefined") {
  g.CustomEvent = class CustomEvent {
    type: string
    detail: unknown
    constructor(type: string, opts?: { detail?: unknown }) {
      this.type = type
      this.detail = opts?.detail
    }
  }
}

// ── navigator（PixiJS 的 isMobile / EventSystem 直接访问 globalThis.navigator）──
if (typeof g.navigator === "undefined") {
  g.navigator = {
    userAgent: "WeChat MiniGame",
    platform: "",
    maxTouchPoints: 10,
    language: "zh-CN",
    languages: ["zh-CN"],
    onLine: true,
    // PixiJS EventSystem 检测 msPointerEnabled
    msPointerEnabled: false,
    msMaxTouchPoints: 0,
  }
}

// ── Intl（PixiJS CanvasTextMetrics.graphemeSegmenter 访问 Intl.Segmenter）──
// 微信小游戏真机无 Intl 全局对象，typeof Intl?.Segmenter 会直接 ReferenceError。
// 提供空壳让 PixiJS 回退到 [...str] 分割。
if (typeof g.Intl === "undefined") {
  g.Intl = {}
}

// ── TextDecoder / TextEncoder（Three.js glTF loader 等使用）──
if (typeof g.TextDecoder === "undefined") {
  g.TextDecoder = class TextDecoder {
    encoding: string
    constructor(encoding = "utf-8") { this.encoding = encoding }
    decode(buffer: ArrayBuffer | Uint8Array): string {
      const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
      let result = ""
      let i = 0
      while (i < bytes.length) {
        const b = bytes[i]
        if (b < 0x80) { result += String.fromCharCode(b); i++ }
        else if (b < 0xe0) { result += String.fromCharCode(((b & 0x1f) << 6) | (bytes[i + 1] & 0x3f)); i += 2 }
        else if (b < 0xf0) { result += String.fromCharCode(((b & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f)); i += 3 }
        else {
          const cp = ((b & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12) | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f)
          const offset = cp - 0x10000
          result += String.fromCharCode(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff))
          i += 4
        }
      }
      return result
    }
  }
}

if (typeof g.TextEncoder === "undefined") {
  g.TextEncoder = class TextEncoder {
    encoding = "utf-8"
    encode(str: string): Uint8Array {
      const bytes: number[] = []
      for (let i = 0; i < str.length; i++) {
        let cp = str.charCodeAt(i)
        if (cp >= 0xd800 && cp <= 0xdbff && i + 1 < str.length) {
          const lo = str.charCodeAt(i + 1)
          if (lo >= 0xdc00 && lo <= 0xdfff) { cp = ((cp - 0xd800) << 10) + (lo - 0xdc00) + 0x10000; i++ }
        }
        if (cp < 0x80) bytes.push(cp)
        else if (cp < 0x800) bytes.push(0xc0 | (cp >> 6), 0x80 | (cp & 0x3f))
        else if (cp < 0x10000) bytes.push(0xe0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
        else bytes.push(0xf0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3f), 0x80 | ((cp >> 6) & 0x3f), 0x80 | (cp & 0x3f))
      }
      return new Uint8Array(bytes)
    }
  }
}

// ── atob / btoa（Three.js base64 纹理解码）──
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="

if (typeof g.atob === "undefined") {
  g.atob = (input: string): string => {
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
}

if (typeof g.btoa === "undefined") {
  g.btoa = (input: string): string => {
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
}
