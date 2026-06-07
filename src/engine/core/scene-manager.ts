// ─── 场景管理器 — 场景栈 + 过渡动画 ─────────────────────────────

import { Graphics as PixiGraphics } from "pixi.js"
import { Scene, type SceneSetupFn } from "./scene"
import { NodeFactory } from "./factory"
import type { MiniEngine } from "./engine"
import { clamp } from "../utils/math"

// ─── 过渡动画类型 ───────────────────────────────────────────────

export type TransitionType = "none" | "fade" | "slideLeft" | "slideRight" | "slideUp" | "slideDown" | "zoom" | "circle"

export interface TransitionConfig {
  type?: TransitionType
  duration?: number
  /** goto 时是否销毁旧场景（默认 false，保留在内存中可复用） */
  destroy?: boolean
  /** goto 时是否清空整个场景栈并销毁所有旧场景（默认 false）。
   *  典型用途：从 push 出的叠加场景直接回主菜单，需要同时销毁栈底的游戏场景 */
  clearStack?: boolean
}

// ─── 场景管理器 ─────────────────────────────────────────────────

export class SceneManager {
  private _engine: MiniEngine
  private _scenes = new Map<string, SceneSetupFn>()
  private _cache = new Map<string, Scene>()
  private _stack: Scene[] = []
  private _transition: {
    type: TransitionType
    duration: number
    elapsed: number
    outScene: Scene | null
    inScene: Scene
    destroyOut: boolean
    mask: PixiGraphics | null
  } | null = null

  constructor(engine: MiniEngine) {
    this._engine = engine
  }

  /** 当前活跃场景 */
  get current(): Scene | null {
    return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null
  }

  /** 场景栈深度 */
  get depth(): number {
    return this._stack.length
  }

  /** 是否正在执行过渡动画 */
  get transitioning(): boolean {
    return this._transition !== null
  }

  /** 注册场景 */
  register(name: string, setup: SceneSetupFn): this {
    this._scenes.set(name, setup)
    return this
  }

  /** 切换到场景（替换栈顶，或清空整个栈） */
  goto(name: string, transition?: TransitionConfig): this {
    const setup = this._scenes.get(name)
    if (!setup) {
      console.error(`[SceneManager] 未注册的场景: ${name}`)
      return this
    }

    const oldScene = this.current
    const shouldDestroy = transition?.destroy ?? false
    const shouldClearStack = transition?.clearStack ?? false
    const newScene = this._resolveScene(name, setup)

    // clearStack: 销毁栈中所有旧场景（栈顶由过渡动画/destroy 处理，这里只处理栈底部分）
    if (shouldClearStack && this._stack.length > 1) {
      // 栈底 → 栈顶倒数第二个：都需要销毁
      for (let i = 0; i < this._stack.length - 1; i++) {
        const scene = this._stack[i]
        if (scene === newScene) continue
        scene.onExit()
        scene.onDestroy()
        this._cache.delete(scene.sceneName)
      }
    }

    // 替换栈（clearStack 时清空栈，否则只替换栈顶）
    if (shouldClearStack) {
      this._stack = [newScene]
    } else if (this._stack.length > 0) {
      this._stack[this._stack.length - 1] = newScene
    } else {
      this._stack.push(newScene)
    }

    // clearStack 隐含 destroy 栈顶旧场景
    const destroyOut = shouldDestroy || shouldClearStack

    if (transition?.type && transition.type !== "none" && oldScene) {
      this._startTransition(oldScene, newScene, transition, destroyOut)
    } else {
      oldScene?.onExit()
      if (destroyOut && oldScene) {
        oldScene.onDestroy()
        this._cache.delete(oldScene.sceneName)
      }
      newScene.onEnter()
    }

    return this
  }

  /** 压入场景（保留下层） */
  push(name: string, transition?: TransitionConfig): this {
    const setup = this._scenes.get(name)
    if (!setup) {
      console.error(`[SceneManager] 未注册的场景: ${name}`)
      return this
    }

    const newScene = this._resolveScene(name, setup)
    const oldScene = this.current

    if (transition?.type && transition.type !== "none" && oldScene) {
      this._startTransition(oldScene, newScene, transition)
      this._stack.push(newScene)
    } else {
      oldScene?.onExit()
      this._stack.push(newScene)
      newScene.onEnter()
    }

    return this
  }

  /** 弹出栈顶场景 */
  pop(transition?: TransitionConfig): this {
    if (this._stack.length <= 1) return this

    const oldScene = this._stack.pop()!
    const newScene = this.current!

    if (transition?.type && transition.type !== "none") {
      this._startTransition(oldScene, newScene, transition, true)
    } else {
      oldScene.onExit()
      oldScene.onDestroy()
      this._cache.delete(oldScene.sceneName)
      newScene.onEnter()
    }

    return this
  }

  /** 更新当前场景 */
  update(dt: number, rawDt?: number): void {
    if (this._transition) {
      this._updateTransition(rawDt ?? dt)
    }

    const scene = this.current
    if (scene?.active) {
      scene._updateTree(dt, rawDt)
    }

    // endFrame 在场景更新后调用（清除 justPressed 等帧末状态）
    if (scene?._gameSystems) {
      scene._gameSystems.endFrame?.()
    }
  }

  /** 同步场景节点树到 PixiJS display objects */
  syncPixi(): void {
    const scene = this.current
    if (scene?.visible) {
      scene._syncTree()
    }

    if (this._transition?.outScene?.visible) {
      this._transition.outScene._syncTree()
    }

    if (this._transition) {
      this._applyTransitionVisuals()
    }
  }

  /** 获取或创建场景实例（缓存复用） */
  private _resolveScene(name: string, setup: SceneSetupFn): Scene {
    const cached = this._cache.get(name)
    if (cached) return cached

    const scene = new Scene(name)
    scene.engine = this._engine
    scene.width = this._engine.screen.width
    scene.height = this._engine.screen.height
    scene.add = new NodeFactory(scene)
    scene.setSetup(setup)
    this._cache.set(name, scene)
    return scene
  }

  private _startTransition(outScene: Scene, inScene: Scene, config: TransitionConfig, destroyOut = false): void {
    this._transition = {
      type: config.type ?? "fade",
      duration: (config.duration ?? 300) / 1000,
      elapsed: 0,
      outScene,
      inScene,
      destroyOut,
      mask: null,
    }

    const stage = this._engine.pixi?.stage
    if (stage) {
      const outObj = outScene._pixiObj
      const inObj = inScene._pixiObj

      // 确保两个场景都在 stage 上：outScene 在下层，inScene 在上层
      if (outObj.parent === stage) stage.removeChild(outObj)
      if (inObj.parent === stage) stage.removeChild(inObj)
      stage.addChild(outObj)
      stage.addChild(inObj)
    }

    this._resetScenePixiProps(outScene)
    this._resetScenePixiProps(inScene)
    this._applyTransitionVisuals(0)
    inScene.onEnter()
  }

  private _updateTransition(dt: number): void {
    if (!this._transition) return
    this._transition.elapsed += dt
    this._applyTransitionVisuals()

    if (this._transition.elapsed >= this._transition.duration) {
      this._applyTransitionVisuals(1)

      const out = this._transition.outScene
      const inScene = this._transition.inScene
      const shouldDestroy = this._transition.destroyOut

      this._clearTransitionMask()
      this._resetScenePixiProps(out)
      this._resetScenePixiProps(inScene)

      const stage = this._engine.pixi?.stage
      if (out && stage && out._pixiObj.parent === stage) {
        stage.removeChild(out._pixiObj)
      }

      out?.onExit()
      if (shouldDestroy && out) {
        out.onDestroy()
        this._cache.delete(out.sceneName)
      }

      this._transition = null
    }
  }

  private _applyTransitionVisuals(forceProgress?: number): void {
    if (!this._transition) return

    const { type, elapsed, duration, outScene, inScene } = this._transition
    const progress = forceProgress ?? clamp(duration > 0 ? elapsed / duration : 1, 0, 1)
    const w = this._engine.screen.width
    const h = this._engine.screen.height

    this._clearTransitionMask()
    this._resetScenePixiProps(outScene)
    this._resetScenePixiProps(inScene)

    switch (type) {
      case "fade": {
        if (outScene) outScene._pixiObj.alpha = 1 - progress
        inScene._pixiObj.alpha = progress
        break
      }

      case "slideLeft": {
        if (outScene) outScene._pixiObj.position.set(-w * progress, 0)
        inScene._pixiObj.position.set(w * (1 - progress), 0)
        break
      }

      case "slideRight": {
        if (outScene) outScene._pixiObj.position.set(w * progress, 0)
        inScene._pixiObj.position.set(-w * (1 - progress), 0)
        break
      }

      case "slideUp": {
        if (outScene) outScene._pixiObj.position.set(0, -h * progress)
        inScene._pixiObj.position.set(0, h * (1 - progress))
        break
      }

      case "slideDown": {
        if (outScene) outScene._pixiObj.position.set(0, h * progress)
        inScene._pixiObj.position.set(0, -h * (1 - progress))
        break
      }

      case "zoom": {
        if (outScene) {
          outScene._pixiObj.position.set(w / 2, h / 2)
          outScene._pixiObj.pivot.set(w / 2, h / 2)
          outScene._pixiObj.scale.set(1 + progress * 0.5, 1 + progress * 0.5)
          outScene._pixiObj.alpha = 1 - progress
        }

        inScene._pixiObj.position.set(w / 2, h / 2)
        inScene._pixiObj.pivot.set(w / 2, h / 2)
        inScene._pixiObj.scale.set(0.5 + progress * 0.5, 0.5 + progress * 0.5)
        inScene._pixiObj.alpha = progress
        break
      }

      case "circle": {
        const stage = this._engine.pixi?.stage
        if (!stage) break

        let mask = this._transition.mask
        if (!mask) {
          mask = new PixiGraphics()
          this._transition.mask = mask
          stage.addChild(mask)
        } else if (mask.parent !== stage) {
          stage.addChild(mask)
        }

        const maxR = Math.sqrt(w * w + h * h) / 2
        mask.clear()
        mask.circle(w / 2, h / 2, maxR * progress)
        mask.fill({ color: 0xffffff })
        inScene._pixiObj.mask = mask
        break
      }

      default:
        break
    }
  }

  private _clearTransitionMask(): void {
    if (!this._transition?.mask) return

    this._transition.inScene._pixiObj.mask = null
    const mask = this._transition.mask
    if (mask.parent) {
      mask.parent.removeChild(mask)
    }
    mask.destroy()
    this._transition.mask = null
  }

  private _resetScenePixiProps(scene: Scene | null): void {
    if (!scene) return
    const p = scene._pixiObj
    p.alpha = 1
    p.position.set(0, 0)
    p.scale.set(1, 1)
    p.pivot.set(0, 0)
    p.mask = null
  }
}
