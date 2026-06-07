// ─── Scene 场景节点 ──────────────────────────────────────────────

import { Node } from "../nodes/node"
import { Random } from "../utils/math"
import type { MiniEngine } from "./engine"
import type { NodeFactory } from "./factory"
import type { UIFactory } from "../ui/factory"

// ─── 子系统代理接口（占位，由其他模块实现） ────────────────────────

export interface InputProxy {
  readonly x: number
  readonly y: number
  readonly isDown: boolean
  justPressed(): boolean
  justReleased(): boolean
}

export interface PhysicsProxy {
  addBody(node: Node, options?: any): any
  removeBody(node: Node): void
  overlap(a: Node, b: Node, callback: () => void): void
  collide(a: Node, b: Node, callback?: () => void): void
}

export interface AudioProxy {
  play(id: string, options?: { loop?: boolean; volume?: number }): any
  stop(id?: string): void
  pauseAll(): void
  resumeAll(): void
}

export interface TimerProxy {
  delay(ms: number, callback: () => void): { cancel(): void }
  interval(ms: number, callback: () => void): { cancel(): void }
  wait(ms: number): Promise<void>
  cancelAll(): void
}

export interface CameraProxy {
  x: number
  y: number
  zoom: number
  follow(node: Node, options?: any): void
  shake(intensity?: number, duration?: number): void
  flash(color?: string, duration?: number): void
}

export interface FxProxy {
  screenShake(intensity?: number, duration?: number): void
  screenFlash(color?: string, duration?: number): void
  slowMotion(scale?: number, duration?: number): void
  freezeFrame(duration?: number): void
}

export interface TweenProxy {
  to(target: any, props: Record<string, number>, config: any): any
  async(target: any, props: Record<string, number>, config: any): Promise<void>
  cancel(target: any): void
  cancelAll(): void
  pauseAll(): void
  resumeAll(): void
  readonly activeCount: number
}

// ─── Scene 类 ───────────────────────────────────────────────────

export type SceneSetupFn = (scene: Scene) => void

export class Scene extends Node {
  /** 引擎引用 */
  engine: MiniEngine | null = null

  /** 节点工厂 */
  add!: NodeFactory

  /** UI 工厂 */
  ui!: UIFactory

  /** 输入子系统代理 */
  input: InputProxy | null = null

  /** 物理子系统代理 */
  physics: PhysicsProxy | null = null

  /** 音频子系统代理 */
  audio: AudioProxy | null = null

  /** 定时器子系统代理 */
  timer: TimerProxy | null = null

  /** 相机子系统代理 */
  camera: CameraProxy | null = null

  /** 特效子系统代理 */
  fx: FxProxy | null = null

  /** Tween 子系统代理 */
  tween: TweenProxy | null = null

  /** 场景随机数 */
  random: Random

  /** 场景名称 */
  sceneName = ""

  /** 用户的 setup 函数 */
  private _setupFn: SceneSetupFn | null = null

  /** 场景绑定的游戏子系统（由 installGameSystems 注入） */
  _gameSystems: { onEnter?(): void; endFrame?(): void; destroy(): void } | null = null
  private _setupDone = false
  private _updateCallbacks: Array<(dt: number) => void> = []

  constructor(name = "") {
    super()
    this.sceneName = name
    this.random = new Random()
  }

  /** 设置 setup 函数 */
  setSetup(fn: SceneSetupFn): this {
    this._setupFn = fn
    return this
  }

  /** 进入场景时调用（首次进入执行 setup，重新进入触发 reenter 事件） */
  onEnter(): void {
    if (!this._setupDone && this._setupFn) {
      this._setupFn(this)
      this._setupDone = true
    } else if (this._setupDone) {
      // 场景复用：先通知子系统 rebind + reset，再触发用户的 reenter 事件
      this._gameSystems?.onEnter?.()
      this.emit("reenter" as any)
    }
  }

  /** 离开场景时调用 */
  onExit(): void {
    this.timer?.cancelAll()
    // 子节点不销毁，保留状态以便重新进入
  }

  /** 销毁场景（释放所有资源） */
  onDestroy(): void {
    this.timer?.cancelAll()
    this._gameSystems?.destroy()
    this._gameSystems = null
    this._updateCallbacks.length = 0
    this.removeAllChildren()
  }

  /** 注册每帧更新回调，随场景生命周期自动清理 */
  onUpdate(callback: (dt: number) => void): this {
    this._updateCallbacks.push(callback)
    return this
  }

  /** 重写 Node.update，触发所有注册的更新回调 */
  override update(dt: number): void {
    for (let i = 0; i < this._updateCallbacks.length; i++) {
      this._updateCallbacks[i](dt)
    }
  }
}
