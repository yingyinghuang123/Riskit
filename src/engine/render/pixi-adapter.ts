// ─── PixiJS v8 DOMAdapter + TextureSource Polyfill ──────────────
//
// 将引擎 Platform 接口映射到 PixiJS 的 Adapter 接口，
// 并修补 TextureSource 的类型检测，让微信小游戏环境下
// WxCanvas / WxImage 能被 PixiJS 正确识别为纹理源。

import { DOMAdapter, CanvasSource, ImageSource, CanvasTextMetrics } from "pixi.js"
import { getPlatform } from "../platform/platform"

let _installed = false

export function installPixiAdapter(): void {
  if (_installed) return
  _installed = true

  const platform = getPlatform()

  DOMAdapter.set({
    createCanvas: (width?: number, height?: number) => {
      const canvas = platform.createCanvas()
      if (width !== undefined) canvas.width = width
      if (height !== undefined) canvas.height = height
      return canvas as unknown as HTMLCanvasElement
    },

    createImage: () => platform.createImage() as unknown as HTMLImageElement,

    getCanvasRenderingContext2D: () => platform.getCanvasRenderingContext2D() as any,

    getWebGLRenderingContext: () => platform.getWebGLRenderingContext(),

    getNavigator: () => platform.getNavigator() as any,

    getBaseUrl: () => platform.getBaseUrl(),

    getFontFaceSet: () => null,

    fetch: (url: RequestInfo, options?: RequestInit) => platform.fetch(String(url), options),

    parseXML: (xml: string) => {
      if (typeof DOMParser !== "undefined") {
        return new DOMParser().parseFromString(xml, "text/xml")
      }
      return { documentElement: null } as unknown as Document
    },
  })

  patchTextureSourceDetection()

  // 微信小游戏的 textLetterSpacing 虽然存在于 context prototype 上，
  // 但实现不完整：设置后（即使为 "0px"）会导致 context.measureText() 返回 NaN width。
  // PixiJS 的 _measureText 只要 experimentalLetterSpacingSupported=true，
  // 就会设置 context.textLetterSpacing="0px"（即使 experimentalLetterSpacing=false），
  // 从而触发微信的 bug。必须同时禁用两个标志才能完全跳过 letterSpacing 代路径。
  CanvasTextMetrics.experimentalLetterSpacing = false
  ;(CanvasTextMetrics as any)._experimentalLetterSpacingSupported = false
}

/**
 * 微信小游戏没有 HTMLCanvasElement / HTMLImageElement 全局构造函数，
 * PixiJS 的 CanvasSource.test() / ImageSource.test() 通过 instanceof 检查
 * 会全部返回 false，导致 Texture.from(resource) 无法自动识别纹理源。
 *
 * 这里用鸭子类型检测替代 instanceof，让 WxCanvas 和 WxImage 通过检查。
 */
function patchTextureSourceDetection(): void {
  const hasHTMLCanvas = typeof globalThis.HTMLCanvasElement !== "undefined"
  const hasHTMLImage = typeof globalThis.HTMLImageElement !== "undefined"

  if (!hasHTMLCanvas) {
    CanvasSource.test = (resource: any): boolean => {
      return !!resource && typeof resource.getContext === "function" && typeof resource.width === "number"
    }
  }

  if (!hasHTMLImage) {
    ImageSource.test = (resource: any): boolean => {
      return (
        !!resource &&
        typeof resource.src === "string" &&
        typeof resource.width === "number" &&
        typeof resource.onload !== "undefined"
      )
    }
  }
}
