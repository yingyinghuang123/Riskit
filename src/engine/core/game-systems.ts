// ─── 游戏系统集成 — 全局系统 + 场景级系统两层架构 ──────────────

import { InputManager } from "../input/input-manager"
import { PhysicsWorld } from "../physics/physics-world"
import { AudioManager } from "../audio/audio-manager"
import { BGMManager } from "../audio/bgm"
import { SFXPool } from "../audio/sfx"
import { TweenSystem } from "../animation/tween"
import { ParticleEmitter } from "../particle/emitter"
import type { Scene } from "./scene"
import type { Node } from "../nodes/node"
import type { MiniEngine } from "./engine"
import { UIFactory } from "../ui/factory"

// ─── 全局系统（跨场景共享，在 game.ts 顶层创建一次） ──────────────

export interface GlobalSystems {
  input: InputManager
  audioManager: AudioManager
  bgm: BGMManager
  sfx: SFXPool
  /** 切换输入系统指向的场景 */
  bindScene(scene: Scene): void
  /** 全局 update（仅 input.update） */
  update(dt: number): void
  /** 全局 endFrame（清除 justPressed 等帧末状态） */
  endFrame(): void
  destroy(): void
}

/** 创建全局系统（InputManager + AudioManager + BGM + SFX），在 game.ts 顶层调用一次 */
export function createGlobalSystems(engine: MiniEngine): GlobalSystems {
  const inputMgr = new InputManager()
  const audioMgr = new AudioManager()
  const bgmPlayer = new BGMManager(audioMgr)
  const sfxMgr = new SFXPool(audioMgr)

  return {
    input: inputMgr,
    audioManager: audioMgr,
    bgm: bgmPlayer,
    sfx: sfxMgr,

    bindScene(scene: Scene) {
      inputMgr.init(scene)
      scene.input = inputMgr as any
      scene.audio = {
        play(id: string, options?: { loop?: boolean; volume?: number }) {
          if (options?.loop) {
            bgmPlayer.play(id, options)
          } else {
            sfxMgr.play(id, options?.volume)
          }
        },
        stop() {
          bgmPlayer.stop()
          sfxMgr.stopAll()
        },
        pauseAll() {
          audioMgr.pauseAll()
        },
        resumeAll() {
          audioMgr.resumeAll()
        },
      }
    },

    update(dt: number) {
      inputMgr.update(dt)
    },

    endFrame() {
      inputMgr.endFrame()
    },

    destroy() {
      inputMgr.destroy()
      audioMgr.destroy()
      bgmPlayer.destroy()
      sfxMgr.destroy()
    },
  }
}

// ─── 场景级系统配置 ────────────────────────────────────────────

export interface SceneSystemsConfig {
  physics?: boolean
  tween?: boolean
  fx?: boolean
}

// ─── 场景级系统（每场景独立，随场景生命周期创建/销毁） ────────────

export interface SceneSystems {
  physics: PhysicsWorld | null
  tween: TweenSystem | null
  particles: ParticleEmitter[]
  update(dt: number): void
  destroy(): void
}

/** 为场景安装场景级子系统（PhysicsWorld + TweenSystem + Particles + FX），并绑定全局系统 */
export function installGameSystems(
  scene: Scene,
  engine: MiniEngine,
  globals: GlobalSystems,
  config: SceneSystemsConfig = {},
): SceneSystems {
  const enableAll = Object.keys(config).length === 0

  // ── 绑定全局系统到当前场景 ──
  globals.bindScene(scene)

  const { width: screenW, height: screenH } = engine.screen
  scene.ui = new UIFactory(scene, screenW, screenH)

  let physicsWorld: PhysicsWorld | null = null
  let tweenSys: TweenSystem | null = null
  const particles: ParticleEmitter[] = []

  // ── 物理系统（场景级） ──
  if (enableAll || config.physics !== false) {
    physicsWorld = new PhysicsWorld()
    scene.physics = {
      addBody(node: Node, options?: any) {
        const type = options?.type ?? options ?? "dynamic"
        const shape = options?.shape ?? "rect"
        return physicsWorld!.addBody(node, type, shape)
      },
      removeBody(node: Node) {
        physicsWorld!.removeBody(node)
      },
      overlap(a: Node, b: Node, callback: () => void) {
        physicsWorld!.overlap(a, b, callback)
      },
      collide(a: Node, b: Node, callback?: () => void) {
        // 注意：当前实现等同 overlap（仅检测重叠并触发回调），不做物理分离。
        // 真正的碰撞响应由 Planck.js 的 begin-contact 事件处理（PhysicsBody.onCollide）。
        physicsWorld!.overlap(a, b, callback ?? (() => {}))
      },
    }
    ;(scene as any)._physicsWorld = physicsWorld
  }

  // ── Tween 系统（场景级） ──
  if (enableAll || config.tween !== false) {
    tweenSys = new TweenSystem()
    scene.tween = {
      to(target: any, props: Record<string, number>, cfg: any) {
        tweenSys!.create({ target, props, ...cfg })
      },
      async(target: any, props: Record<string, number>, cfg: any) {
        return new Promise<void>((resolve) => {
          tweenSys!.create({ target, props, ...cfg, onComplete: resolve })
        })
      },
      cancel(target: any) {
        tweenSys!.stopByTarget(target)
      },
      cancelAll() {
        tweenSys!.stopAll()
      },
      pauseAll() {
        tweenSys!.pauseAll()
      },
      resumeAll() {
        tweenSys!.resumeAll()
      },
      get activeCount() {
        return tweenSys!.activeCount
      },
    }
  }

  // ── 粒子 & FX 系统（场景级） ──
  if (enableAll || config.fx !== false) {
    scene.fx = {
      screenShake(intensity = 5, duration = 300) {
        ;(scene as any)._shakeState = { intensity, duration: duration / 1000, elapsed: 0 }
      },
      screenFlash(color = "#ffffff", duration = 200) {
        ;(scene as any)._flashState = { color, duration: duration / 1000, elapsed: 0 }
      },
      slowMotion(scale = 0.3, duration = 1000) {
        const original = engine.timeScale
        engine.timeScale = scale
        setTimeout(() => {
          engine.timeScale = original
        }, duration)
      },
      freezeFrame(duration = 100) {
        const original = engine.timeScale
        engine.timeScale = 0
        setTimeout(() => {
          engine.timeScale = original
        }, duration)
      },
    }
  }

  const systems: SceneSystems = {
    physics: physicsWorld,
    tween: tweenSys,
    particles,

    update(dt: number) {
      physicsWorld?.update(dt)
      tweenSys?.update(dt)

      for (let i = particles.length - 1; i >= 0; i--) {
        const e = particles[i]
        e.update(dt)
        if (e.finished && !e.active) {
          e.destroy()
          particles.splice(i, 1)
        }
      }
    },

    destroy() {
      physicsWorld?.destroy()
      for (const e of particles) e.destroy()
      particles.length = 0
    },
  }

  // 自动绑定场景生命周期，场景销毁时自动清理场景级子系统
  scene._gameSystems = {
    onEnter() {
      // 场景复用时 rebind 全局系统到当前场景
      globals.bindScene(scene)
      // 重置场景级系统状态（清理上一轮残留的物理体/tween/粒子）
      physicsWorld?.destroy()
      if (enableAll || config.physics !== false) {
        physicsWorld = new PhysicsWorld()
        scene.physics = {
          addBody(node: Node, options?: any) {
            const type = options?.type ?? options ?? "dynamic"
            const shape = options?.shape ?? "rect"
            return physicsWorld!.addBody(node, type, shape)
          },
          removeBody(node: Node) {
            physicsWorld!.removeBody(node)
          },
          overlap(a: Node, b: Node, callback: () => void) {
            physicsWorld!.overlap(a, b, callback)
          },
          collide(a: Node, b: Node, callback?: () => void) {
            physicsWorld!.overlap(a, b, callback ?? (() => {}))
          },
        }
        ;(scene as any)._physicsWorld = physicsWorld
        systems.physics = physicsWorld
      }
      tweenSys?.stopAll()
      for (const e of particles) e.destroy()
      particles.length = 0
    },
    endFrame() {
      globals.endFrame()
    },
    destroy() {
      systems.destroy()
      // 注意：不销毁 globals，它们跨场景共享
    },
  }

  // 自动驱动：将 update 挂载到场景帧循环（endFrame 由 SceneManager 在更新后调用）
  scene.onUpdate((dt: number) => {
    globals.update(dt)
    systems.update(dt)
  })

  return systems
}
