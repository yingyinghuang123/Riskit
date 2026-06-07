# Three.js — 3D 渲染

内置 Three.js r183，自带平台适配层。通过 Platform 抽象层模拟浏览器 DOM API，2D overlay 通过原生 GL blit 合成，不经过 Three.js 材质管线。

## 完整 3D 游戏示例

```typescript
// src/game.ts — 3D 游戏入口
import "./polyfills"
import {
  MiniEngine,
  SceneManager,
  createWebGLBridge,
  createCamera3DState,
  updateCamera3D,
  installAdapter,
  createGlobalSystems,
  installGameSystems,
} from "./engine"
import * as THREE from "./engine/three"

// ① 创建引擎（主 canvas 自动获取 WebGL context）
const engine = new MiniEngine({ backgroundColor: "#0a0a1a" })

// ② 安装适配层（必须在 Three.js 使用前）
installAdapter(engine.canvas)

// ③ 创建 WebGL bridge（顶层一次性创建，不要在场景内创建）
const bridge = createWebGLBridge()
bridge.init(engine.canvas, engine.screen, THREE)
engine.webgl = bridge

engine.scenes = new SceneManager(engine)
const globals = createGlobalSystems(engine)

const { width: W, height: H } = engine.screen

engine.scene("game", (scene) => {
  const sys = installGameSystems(scene, engine, globals)

  if (!bridge.ready) {
    scene.add.text("3D 初始化失败", W / 2, H / 2, {
      fontSize: 24,
      color: "#ff4444",
      align: "center",
    })
    return
  }

  // ④ 激活 3D 模式（告诉引擎用透明 overlay 混合 2D HUD）
  engine.active3D = true

  // 设置 3D 场景
  bridge.scene.background = new THREE.Color(0x87ceeb)

  const cube = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x4a90d9 }))
  bridge.scene.add(cube)

  const hemi = new THREE.HemisphereLight(0x88bbff, 0x445522, 0.6)
  bridge.scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xffffff, 1.0)
  sun.position.set(30, 50, 20)
  bridge.scene.add(sun)

  // 相机
  const cam3d = createCamera3DState({
    fov: 60,
    aspect: W / H,
    position: { x: 0, y: 5, z: 10 },
    lookAt: { x: 0, y: 0, z: 0 },
  })

  // 场景级系统已由 installGameSystems 自动绑定
  scene.onUpdate((dt: number) => {
    cube.rotation.y += dt
    updateCamera3D(cam3d, dt)
    bridge.syncCamera(cam3d)
  })

  // 2D UI 叠加在 3D 之上（自动处理）
  scene.add.text("3D Demo", W / 2, 40, {
    fontSize: 24,
    color: "#fff",
    align: "center",
    bold: true,
  })

  scene.add.button("退出", 60, 30, () => {
    engine.active3D = false // ⑤ 离开 3D 场景时关闭
    engine.scenes.goto("menu", { type: "fade", duration: 400 })
  })
})

engine.start("game")
```

## 关键规则

| 规则                         | 说明                                                          |
| ---------------------------- | ------------------------------------------------------------- |
| bridge 在 game.ts 顶层创建   | **禁止**在场景 setup 内创建（会重复创建 context）             |
| `engine.active3D = true`     | 进入 3D 场景时设置，引擎使用透明混合模式叠加 2D HUD           |
| `engine.active3D = false`    | 离开 3D 场景时设置，引擎切回 opaque 2D 渲染，自动清空 3D 对象 |
| 不要手动调 `bridge.render()` | 引擎每帧自动调用                                              |
| `bridge.syncCamera(cam3d)`   | 每帧更新相机同步                                              |

## 安装适配层

```typescript
import { installAdapter } from "./engine"

// 必须在使用 Three.js 之前调用
installAdapter(engine.canvas)
```

适配层提供 `document.createElement('canvas')`, `window`, `Image`, `XMLHttpRequest`, `TextDecoder`, `atob/btoa`, `performance.now` 等最小 DOM 模拟。

## WebGL 渲染桥

```typescript
import { createWebGLBridge } from "./engine"

const bridge = createWebGLBridge()
bridge.init(engine.canvas, engine.screen, THREE)
engine.webgl = bridge // 注册后引擎自动每帧渲染 + 合成

bridge.ready // boolean - 是否初始化成功
bridge.scene // Three.js Scene
bridge.camera // Three.js PerspectiveCamera
bridge.threeRenderer // Three.js WebGLRenderer
bridge.glCanvas // WebGL 使用的 canvas
bridge.isPrimary // 是否占用主 canvas（引擎默认 WebGL 优先，通常为 true）
```

渲染流程（引擎自动执行）：

- **3D 激活时**：2D HUD 渲染到 offscreen → Three.js 渲染 3D → 原生 GL blit 叠加 2D（透明混合）
- **3D 未激活时**：2D 渲染到 offscreen → 原生 GL blit 直出（opaque，无 3D 渲染）

## 3D 相机

```typescript
import { createCamera3DState, enableOrbit, follow3D, updateCamera3D } from "./engine"

const cam3d = createCamera3DState({
  position: { x: 0, y: 5, z: 10 },
  lookAt: { x: 0, y: 0, z: 0 },
  fov: 60,
})

// 跟随目标
follow3D(cam3d, target, { x: 0, y: 6, z: -12 }, 0.08)

// 每帧更新（在场景 setup 内应使用 scene.onUpdate 代替 engine.on）
scene.onUpdate((dt: number) => {
  updateCamera3D(cam3d, dt)
  bridge.syncCamera(cam3d)
})
```

## 加载 GLTF 模型

```typescript
import { loadGLTF } from "./engine"

const result = await loadGLTF("assets/model.glb", {
  basePath: "assets/",
})
bridge.scene.add(result.scene)
```

## 注意事项

- 引擎主 canvas 始终优先获取 WebGL2/WebGL context，无需手动配置
- 微信环境不支持 WebGL2 时自动降级到 WebGL1
- 纹理加载通过 Platform 抽象层（微信环境用 `wx.createImage()`，浏览器用原生 `Image`）
- 适配层通过 Platform 接口模拟 Three.js 所需的最小 DOM API
- 2D overlay 使用原生 GL passthrough shader 合成，不经过 Three.js 的 colorSpace / toneMapping 管线
- 纹理上传策略自动检测：优先 `texImage2D(canvas)`，不兼容时降级到 `getImageData() + Uint8Array`
