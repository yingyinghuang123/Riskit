# MiniEngine — 微信小游戏引擎

轻量级 2D/3D 微信小游戏引擎，Canvas 2D + Three.js r183 混合渲染。

## 目录结构

```
engine/
├── core/           组装层（engine, scene, scene-manager, factory, game-systems）
├── nodes/          纯节点类（node, sprite, text, graphics, container）
├── utils/          基础工具（events, math, color, loop, pool, fsm, gpu-destroy-queue）
├── platform/       平台抽象（wx-platform, web-platform, polyfills）
├── render/         渲染后端（pixi-bridge, webgl-renderer, camera2d, rtt-sprite）
├── ui/             UI 控件（button, slider, dialog, scroll-view 等）
├── input/          输入系统（触摸/手势/键盘/手柄/传感器）
├── physics/        物理系统（Planck.js 后端）
├── audio/          音频系统（BGM + SFX）
├── animation/      动画系统（tween, sprite-anim, anim-fsm）
├── particle/       粒子系统（emitter + presets）
├── assets/         资源管理（加载/缓存/分包）
├── three/          3D 渲染（Three.js 适配层）
├── debug/          调试工具（fps-meter, stats, inspector）
└── docs/           API 文档
```

### 依赖分层

```
Layer 0: utils/ + platform/     基础工具 + 平台抽象
Layer 1: render/                渲染后端
Layer 2: nodes/                 纯节点类（依赖 utils/ + render/）
Layer 3: ui/                    UI 控件（依赖 nodes/，不依赖 core/）
Layer 4: input/ physics/ audio/ animation/ particle/ three/ assets/
Layer 5: core/                  组装层（引用所有层）
Layer 6: debug/                 调试工具
```

低层不得引用高层。

## 快速入门

```typescript
import { MiniEngine, SceneManager, createGlobalSystems, installGameSystems } from "./engine"

const engine = new MiniEngine({ backgroundColor: "#1a1a2e" })
engine.scenes = new SceneManager(engine)
const globals = createGlobalSystems(engine)

engine.scene("main", (scene) => {
  const sys = installGameSystems(scene, engine, globals)

  scene.add.text("Hello MiniEngine", 375, 400, {
    fontSize: 42,
    color: "#fff",
    align: "center",
    bold: true,
  })

  scene.ui.button("开始游戏", 375, 700, () => {
    engine.scenes.goto("game", { type: "fade", duration: 400 })
  })
})

engine.start("main")
```

### 系统分层

| 层级       | 系统                                             | 生命周期        | 说明                                                          |
| ---------- | ------------------------------------------------ | --------------- | ------------------------------------------------------------- |
| **全局**   | `InputManager`, `AudioManager`, `BGM`, `SFX`     | 游戏全程        | `createGlobalSystems(engine)` 创建一次，场景切换时自动 rebind |
| **场景级** | `PhysicsWorld`, `TweenSystem`, `Particles`, `FX` | 随场景创建/销毁 | `installGameSystems(scene, engine, globals)` 每场景调用       |

## API 文档索引

| 模块       | 文档                              | 核心 API                                                                                       |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| 引擎核心   | [core.md](docs/core.md)           | `MiniEngine`, `GameLoop`, `EventEmitter`, `FSM`                                                |
| 场景与节点 | [scene.md](docs/scene.md)         | `Node`, `Scene`, `SceneManager`, `Sprite`, `TextNode`, `Graphics`, `Container`                 |
| 节点工厂   | [factory.md](docs/factory.md)     | `scene.add.*`（NodeFactory）, `scene.ui.*`（UIFactory）                                        |
| 输入系统   | [input.md](docs/input.md)         | `InputManager` — 触摸/手势/键盘/手柄/传感器/软键盘                                             |
| 物理系统   | [physics.md](docs/physics.md)     | `PhysicsWorld`, `PhysicsBody` — 2D 碰撞检测与响应                                              |
| 音频系统   | [audio.md](docs/audio.md)         | `AudioManager`, `BGMManager`, `SFXPool`                                                        |
| 动画系统   | [animation.md](docs/animation.md) | `TweenSystem`, `SpriteAnimPlayer`, `AnimFSM`                                                   |
| 粒子系统   | [particle.md](docs/particle.md)   | `ParticleEmitter`, `FxPresets`（爆炸/火花/烟雾/拖尾/彩纸/雨/雪）                               |
| UI 系统    | [ui.md](docs/ui.md)               | `Button`, `Label`, `Panel`, `ProgressBar`, `Slider`, `Toggle`, `Dialog`, `Toast`, `ScrollView` |
| 资源管理   | [assets.md](docs/assets.md)       | `AssetManager` — 图片/音频/图集/字体/分包加载                                                  |
| 渲染系统   | [render.md](docs/render.md)       | `Camera2D`, `SpriteSheet`, `RenderLayer`                                                       |
| 3D 渲染    | [three.md](docs/three.md)         | Three.js r183 + wx 适配层, `Camera3D`, `loadGLTF`                                              |
| 数学工具   | [math.md](docs/math.md)           | `Vec2`, `Random`, `Easing`, `clamp/lerp/distance` 等                                           |
| 微信平台   | [wx.md](docs/wx.md)               | `WxPlatform` — 分享/社交/广告/登录/存储/支付/网络/云开发/AI/录屏/振动                          |
| 云开发     | [cloud.md](docs/cloud.md)         | `WxCloud` — 云数据库/云函数/云存储/实时监听                                                    |
| 调试工具   | [debug.md](docs/debug.md)         | `FpsMeter`, `Stats`, `Inspector`                                                               |
