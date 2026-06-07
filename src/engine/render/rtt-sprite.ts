import { Sprite as PixiSprite, Texture, BufferImageSource } from "pixi.js"
import { deferGpuDestroy } from "../utils/gpu-destroy-queue"
import type { WebGLRendererBridge } from "./webgl-renderer"

export interface RTTSprite {
  /** PixiJS Sprite — 添加到场景图中参与 2D 排序 */
  readonly sprite: PixiSprite
  readonly pixelWidth: number
  readonly pixelHeight: number
  /** 刷新纹理：渲染 3D → 上传到 PixiJS。在 preRenderHook 中调用 */
  update(): void
  resize(width: number, height: number): void
  dispose(): void
}

/**
 * 创建 RTT Sprite：Three.js 3D 渲染内容 → PixiJS Sprite。
 * 使用 BufferImageSource（readPixels → flipY → upload）。
 */
export function createRTTSprite(
  webgl: WebGLRendererBridge,
  pixelRatio: number,
  width: number,
  height: number,
): RTTSprite {
  const pr = pixelRatio
  let pixelW = Math.max(1, Math.round(width * pr))
  let pixelH = Math.max(1, Math.round(height * pr))

  const source = new BufferImageSource({
    resource: new Uint8Array(pixelW * pixelH * 4),
    width: pixelW,
    height: pixelH,
  })
  const texture = new Texture({ source })
  const sprite = new PixiSprite(texture)
  sprite.width = width
  sprite.height = height
  let _disposed = false

  // 可复用的 flipY 临时行缓冲
  let _rowBuf = new Uint8Array(pixelW * 4)

  return {
    sprite,
    get pixelWidth() {
      return pixelW
    },
    get pixelHeight() {
      return pixelH
    },

    update() {
      if (_disposed) return
      const bridge = webgl
      if (!bridge?.ready) return

      const renderer = bridge.threeRenderer
      const scene3D = bridge.scene

      const savedBg = scene3D.background
      const savedAlpha = renderer.getClearAlpha()
      scene3D.background = null
      renderer.setClearColor(0x000000, 0)

      renderer.resetState()
      bridge.renderToTexture(pixelW, pixelH)
      renderer.resetState()

      scene3D.background = savedBg
      if (savedBg) {
        renderer.setClearColor(savedBg, savedAlpha)
      }

      const pixels = bridge.getRenderTargetPixels()
      if (!pixels) return

      flipY(pixels, pixelW, pixelH, _rowBuf)
      source.resource = pixels
      source.update()
    },

    resize(w: number, h: number) {
      if (_disposed) return
      pixelW = Math.max(1, Math.round(w * pr))
      pixelH = Math.max(1, Math.round(h * pr))
      source.resize(pixelW, pixelH)
      sprite.width = w
      sprite.height = h
      _rowBuf = new Uint8Array(pixelW * 4)
    },

    dispose() {
      if (_disposed) return
      _disposed = true
      deferGpuDestroy(() => {
        sprite.destroy()
        texture.destroy(true)
      })
    },
  }
}

// ─── Y 轴翻转：OpenGL FBO bottom-up → PixiJS top-down ──────────

function flipY(data: Uint8Array, w: number, h: number, tmp: Uint8Array): void {
  const rowSize = w * 4
  const halfH = h >> 1
  for (let y = 0; y < halfH; y++) {
    const topOff = y * rowSize
    const botOff = (h - 1 - y) * rowSize
    tmp.set(data.subarray(topOff, topOff + rowSize))
    data.set(data.subarray(botOff, botOff + rowSize), topOff)
    data.set(tmp, botOff)
  }
}
