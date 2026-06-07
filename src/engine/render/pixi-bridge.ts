// ─── PixiJS 渲染桥接 — 管理 PixiJS renderer 和 stage ──────────────

import "pixi.js/unsafe-eval"
import { WebGLRenderer, Container as PixiContainer } from "pixi.js"
import { installPixiAdapter } from "./pixi-adapter"

export interface PixiBridge {
  readonly renderer: WebGLRenderer
  readonly stage: PixiContainer
  render(clear?: boolean): void
  resize(width: number, height: number): void
  resetState(): void
  destroy(): void
}

export interface PixiBridgeOptions {
  canvas: HTMLCanvasElement | WxCanvas
  width: number
  height: number
  /** 外部 WebGL context（与 Three.js 共享时传入） */
  context?: WebGLRenderingContext | WebGL2RenderingContext | null
  backgroundColor?: string
}

export async function createPixiBridge(options: PixiBridgeOptions): Promise<PixiBridge> {
  installPixiAdapter()

  const renderer = new WebGLRenderer()

  const initOptions: Record<string, unknown> = {
    width: options.width,
    height: options.height,
    antialias: true,
    backgroundAlpha: 1,
    clearBeforeRender: !options.context,
  }

  if (options.context) {
    initOptions.context = options.context
    initOptions.canvas = options.canvas as HTMLCanvasElement
    initOptions.clearBeforeRender = false
  } else {
    initOptions.canvas = options.canvas as HTMLCanvasElement
  }

  if (options.backgroundColor) {
    initOptions.background = options.backgroundColor
  }

  await renderer.init(initOptions)

  const stage = new PixiContainer()
  stage.sortableChildren = true

  return {
    renderer,
    stage,

    render(clear?: boolean) {
      // 3D + 2D 混合渲染时 clear=false：不清屏，且设置背景透明以保留 Three.js 渲染内容。
      // 纯 2D 渲染时 clear=true：正常清屏并填充背景色。
      const shouldClear = clear ?? true
      if (!shouldClear) {
        renderer.background.alpha = 0
      } else {
        renderer.background.alpha = 1
      }
      renderer.render({ container: stage, clear: shouldClear })
    },

    resize(width: number, height: number) {
      renderer.resize(width, height)
    },

    resetState() {
      renderer.resetState()
      // Three.js resetState 后 GPU 侧 texture unit 绑定状态不确定,
      // 但 PixiJS resetState 只重置 JS 缓存（以为是 EMPTY.source）,
      // 导致后续 bindSource 跳过实际 gl.bindTexture。
      // 将 _boundTextures 全部设为 null 强制下次 bindSource 走 gl.bindTexture。
      const texSys = (renderer as any).texture
      if (texSys?._boundTextures) {
        texSys._boundTextures.fill(null)
      }
    },

    destroy() {
      renderer.destroy()
      stage.destroy({ children: true })
    },
  }
}
