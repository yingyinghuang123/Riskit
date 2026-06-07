// ─── MiniEngine 主类 ─────────────────────────────────────────────

import { EventEmitter } from "../utils/events"
import { GameLoop, type TimeInfo } from "../utils/loop"
import { getPlatform, type ScreenInfo } from "../platform/platform"
import { Random } from "../utils/math"
import type { SceneManager } from "./scene-manager"
import type { WebGLRendererBridge } from "../render/webgl-renderer"
import type { PixiBridge } from "../render/pixi-bridge"
import { flushGpuDestroyQueue } from "../utils/gpu-destroy-queue"

// ─── 引擎事件类型 ───────────────────────────────────────────────

export interface EngineEvents {
  ready: void
  pause: void
  resume: void
  destroy: void
  update: TimeInfo
  prerender: void
  postrender: void
  resize: ScreenInfo
  error: Error
}

// ─── 引擎配置 ───────────────────────────────────────────────────

export interface EngineConfig {
  width?: number
  height?: number
  backgroundColor?: string
  debug?: boolean
  maxFPS?: number
}

type RenderPass = (engine: MiniEngine) => void

// ─── 引擎主类 ───────────────────────────────────────────────────

export class MiniEngine extends EventEmitter<EngineEvents> {
  readonly screen: ScreenInfo
  readonly canvas: WxCanvas
  /** 全局共享数据，AI 可以直接读写 */
  readonly data: Record<string, any> = {}

  /** 全局随机数 */
  readonly random: Random

  /** 背景色 */
  backgroundColor: string

  /** 调试模式 */
  debug: boolean

  /** 时间缩放 */
  timeScale = 1

  private _loop: GameLoop
  private _sceneManager: SceneManager | null = null
  private _webglBridge: WebGLRendererBridge | null = null
  private _destroyed = false
  private _systems: Array<{ update?: (dt: number) => void; destroy?: () => void }> = []

  /** 主 canvas 上的 GL context */
  private _gl: WebGLRenderingContext | WebGL2RenderingContext | null = null

  private _3DState: "active" | "suspended" | "inactive" = "inactive"

  /** PixiJS 渲染桥接（异步初始化，start() 后可用） */
  private _pixiBridge: PixiBridge | null = null
  private _pixiReady = false
  private _preRenderHooks: RenderPass[] = []
  private _rendered3DInFrame = false

  constructor(config: EngineConfig = {}) {
    super()
    const platform = getPlatform()
    const sysScreen = platform.getScreenInfo()

    this.screen = {
      width: config.width ?? sysScreen.width,
      height: config.height ?? sysScreen.height,
      pixelRatio: sysScreen.pixelRatio,
    }

    this.canvas = platform.createCanvas()
    this.canvas.width = this.screen.width * this.screen.pixelRatio
    this.canvas.height = this.screen.height * this.screen.pixelRatio

    const glAttrs = { stencil: true, alpha: false, antialias: true }
    const gl = this.canvas.getContext("webgl2", glAttrs) || this.canvas.getContext("webgl", glAttrs)
    this._gl = gl as WebGLRenderingContext | WebGL2RenderingContext | null

    this.backgroundColor = config.backgroundColor ?? "#1a1a2e"
    this.debug = config.debug ?? false
    this.random = new Random()

    this._loop = new GameLoop((time) => this._tick(time))
  }

  get time(): TimeInfo {
    return this._loop.time
  }

  get scenes(): SceneManager {
    if (!this._sceneManager) {
      throw new Error("[MiniEngine] SceneManager not initialized")
    }
    return this._sceneManager
  }

  set scenes(manager: SceneManager) {
    this._sceneManager = manager
  }

  get gl(): WebGLRenderingContext | WebGL2RenderingContext | null {
    return this._gl
  }

  get webgl(): WebGLRendererBridge | null {
    return this._webglBridge
  }

  set webgl(bridge: WebGLRendererBridge | null) {
    this._webglBridge = bridge
  }

  /** @deprecated Use render3DToTexture + PixiJS Sprite instead. Kept for mode-A (fullscreen 3D background). */
  render3DViewport(x: number, y: number, width: number, height: number): void {
    const bridge = this._webglBridge
    if (this._3DState !== "active" || !bridge?.ready) return
    bridge.renderViewport(x, y, width, height)
    this._rendered3DInFrame = true
  }

  get pixi(): PixiBridge | null {
    return this._pixiBridge
  }

  /** 3D 子系统状态：active（渲染中）、suspended（暂停渲染保留资源）、inactive（已释放） */
  get threeState(): "active" | "suspended" | "inactive" {
    return this._3DState
  }

  /** 3D 是否正在渲染（兼容旧 API） */
  get active3D(): boolean {
    return this._3DState === "active"
  }

  /**
   * 设置 3D 状态（兼容旧 boolean API）。
   * - true  → active（开始渲染）
   * - false → inactive（停止渲染 + 释放所有 3D 资源）
   * 如需暂停渲染但保留资源，使用 suspend3D() / resume3D()。
   */
  set active3D(v: boolean) {
    if (v) {
      this._3DState = "active"
    } else {
      this._dispose3DResources()
      this._3DState = "inactive"
    }
  }

  /** 暂停 3D 渲染，保留所有资源（可零开销恢复） */
  suspend3D(): void {
    if (this._3DState === "active") this._3DState = "suspended"
  }

  /** 恢复 3D 渲染（从 suspended 状态） */
  resume3D(): void {
    if (this._3DState === "suspended") this._3DState = "active"
  }

  /** 释放所有 3D 资源 */
  private _dispose3DResources(): void {
    if (!this._webglBridge?.scene) return
    const s = this._webglBridge.scene
    s.traverse((obj: any) => {
      if (obj.geometry) obj.geometry.dispose()
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const mat of mats) {
          for (const key of Object.keys(mat)) {
            const v = mat[key]
            if (v && typeof v === "object" && typeof v.dispose === "function" && v.isTexture) {
              v.dispose()
            }
          }
          mat.dispose()
        }
      }
    })
    while (s.children.length > 0) s.remove(s.children[0])
  }

  scene(name: string, setup: (scene: any) => void): this {
    if (this._sceneManager) {
      this._sceneManager.register(name, setup)
    }
    return this
  }

  /** @internal */
  registerSystem(system: { update?: (dt: number) => void; destroy?: () => void }): this {
    this._systems.push(system)
    return this
  }

  /** Register a hook that runs before rendering (e.g. pre-render logic). */
  registerPreRenderHook(hook: RenderPass): void {
    this._preRenderHooks.push(hook)
  }

  /** @deprecated Use registerPreRenderHook instead */
  registerPrePixiRenderHook(hook: RenderPass): void {
    this._preRenderHooks.push(hook)
  }

  async start(sceneName?: string): Promise<this> {
    if (this._destroyed) return this

    await this._initPixi()

    this._loop.start()
    if (sceneName && this._sceneManager) {
      this._sceneManager.goto(sceneName)
    }
    this.emit("ready")
    return this
  }

  pause(): this {
    this._loop.pause()
    this.emit("pause")
    return this
  }

  resume(): this {
    this._loop.resume()
    this.emit("resume")
    return this
  }

  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true
    this._loop.stop()
    for (const sys of this._systems) {
      sys.destroy?.()
    }
    this._systems.length = 0
    this._sceneManager = null

    this._pixiBridge?.destroy()
    this._pixiBridge = null
    this._pixiReady = false

    this.emit("destroy")
    this.removeAllListeners()
  }

  get running(): boolean {
    return this._loop.running
  }

  get paused(): boolean {
    return this._loop.paused
  }

  private async _initPixi(): Promise<void> {
    if (this._pixiReady) return

    const { createPixiBridge } = await import("../render/pixi-bridge")

    // 显式传入预获取的 GL context，确保 2D+3D 共享同一 context
    const context = this._gl ?? undefined
    this._pixiBridge = await createPixiBridge({
      canvas: this.canvas,
      width: this.canvas.width,
      height: this.canvas.height,
      context: context ?? null,
      backgroundColor: this.backgroundColor,
    })
    this._pixiReady = true
  }

  private _tick(time: TimeInfo): void {
    const dt = time.dt * this.timeScale

    for (let i = 0; i < this._systems.length; i++) {
      this._systems[i].update?.(dt)
    }

    this._sceneManager?.update(dt, time.dt)

    this.emit("update", time)

    this.emit("prerender")
    this._render()
    this.emit("postrender")
  }

  private _render(): void {
    const pb = this._pixiBridge
    if (!this._pixiReady || !pb) return

    const pr = this.screen.pixelRatio
    const threeBridge = this._webglBridge
    const has3D = !!(threeBridge?.ready && this._3DState === "active")

    // 确保当前场景的 PixiJS 对象挂载到 stage
    this._mountCurrentScene(pb)
    pb.stage.scale.set(pr, pr)

    // 执行预渲染钩子（场景可在此更新 Three.js 对象、RTT 等）
    for (let i = 0; i < this._preRenderHooks.length; i++) {
      try {
        this._preRenderHooks[i](this)
      } catch (error) {
        this.emit("error", error instanceof Error ? error : new Error(String(error)))
      }
    }

    this._rendered3DInFrame = false

    // ── 3D 渲染 pass（Three.js）──────────────────────────────
    // 严格遵循 PixiJS v8.7+ 官方模式（three_basic-integration.ts）：
    //   threeRenderer.resetState() → threeRenderer.render()
    //   pixiRenderer.resetState()  → pixiRenderer.render()
    if (has3D) {
      threeBridge!.threeRenderer.resetState()
      flushGpuDestroyQueue()
      threeBridge!.render()
      this._rendered3DInFrame = true
      threeBridge!.threeRenderer.resetState()
    } else {
      flushGpuDestroyQueue()
    }

    // ── 2D 渲染 pass（PixiJS）──────────────────────────────
    pb.resetState()

    // 同步引擎节点树到 PixiJS display objects
    this._sceneManager?.syncPixi()

    // 本帧有 3D 全屏渲染时不清屏（保留 Three.js 渲染内容），否则按纯 2D 流程清屏
    pb.render(!this._rendered3DInFrame)
  }

  /** 确保当前场景 _pixiObj 挂到 stage（场景切换时自动更换） */
  private _lastMountedScene: import("./scene").Scene | null = null
  private _mountCurrentScene(pb: PixiBridge): void {
    const scene = this._sceneManager?.current ?? null
    if (scene === this._lastMountedScene) return

    // 过渡动画期间，stage 由 SceneManager._startTransition 管理，
    // 此处只更新跟踪状态，不操作 stage（避免破坏过渡动画布局）。
    if (this._sceneManager?.transitioning) {
      this._lastMountedScene = scene
      return
    }

    // 移除旧场景的 PixiJS 对象
    if (this._lastMountedScene) {
      const oldObj = this._lastMountedScene._pixiObj
      if (oldObj.parent === pb.stage) {
        pb.stage.removeChild(oldObj)
      }
    }

    // 挂载新场景
    if (scene) {
      pb.stage.addChild(scene._pixiObj)
    }

    this._lastMountedScene = scene
  }
}
