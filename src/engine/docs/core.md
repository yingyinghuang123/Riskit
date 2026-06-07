# Core — 引擎核心

## MiniEngine

引擎主类，管理游戏循环、场景、子系统。

```typescript
import { MiniEngine } from './engine'

const game = new MiniEngine({
  width?: number,          // 逻辑宽度（默认屏幕宽度）
  height?: number,         // 逻辑高度（默认屏幕高度）
  backgroundColor?: string, // 背景色（默认 '#1a1a2e'）
  debug?: boolean,         // 调试模式
  maxFPS?: number,         // 最大帧率
})
```

### 属性

| 属性              | 类型                                                      | 说明                                      |
| ----------------- | --------------------------------------------------------- | ----------------------------------------- |
| `screen`          | `ScreenInfo`                                              | `{ width, height, pixelRatio }`           |
| `canvas`          | `WxCanvas`                                                | 主 canvas                                 |
| `gl`              | `WebGLRenderingContext \| WebGL2RenderingContext \| null` | 主 canvas 上的 GL context（引擎自动获取） |
| `data`            | `Record<string, any>`                                     | 全局共享数据                              |
| `random`          | `Random`                                                  | 全局随机数生成器                          |
| `time`            | `TimeInfo`                                                | `{ dt, elapsed, frame, fps }`             |
| `timeScale`       | `number`                                                  | 时间缩放（默认 1）                        |
| `running`         | `boolean`                                                 | 是否运行中                                |
| `paused`          | `boolean`                                                 | 是否暂停                                  |
| `scenes`          | `SceneManager`                                            | 场景管理器                                |
| `backgroundColor` | `string`                                                  | 背景色                                    |
| `webgl`           | `WebGLRendererBridge \| null`                             | 3D 渲染桥                                 |
| `pixi`            | `PixiBridge \| null`                                      | Pixi 渲染桥                               |
| `threeState`      | `"active" \| "suspended" \| "inactive"`                   | Three.js 状态（3D 激活时）                |
| `active3D`        | `boolean`                                                 | 是否处于 3D 模式                          |
| `debug`           | `boolean`                                                 | 调试模式（默认 false）                    |

### 方法

| 方法                            | 说明                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `scene(name, setupFn)`          | 注册场景（简化 API）                                                                                                  |
| `registerSystem(system)`        | ⚠️ **内部 API**，不建议直接调用。用 `createGlobalSystems(engine)` + `installGameSystems(scene, engine, globals)` 代替 |
| `start(sceneName?)`             | 启动引擎                                                                                                              |
| `pause()`                       | 暂停                                                                                                                  |
| `resume()`                      | 恢复                                                                                                                  |
| `destroy()`                     | 销毁引擎                                                                                                              |
| `registerPreRenderHook(fn)`     | 注册渲染前钩子                                                                                                        |
| `registerPrePixiRenderHook(fn)` | 注册 Pixi 渲染前钩子                                                                                                  |
| `render3DViewport(...)`         | 渲染 3D 视口                                                                                                          |
| `suspend3D()`                   | 暂停 3D 渲染                                                                                                          |
| `resume3D()`                    | 恢复 3D 渲染                                                                                                          |

### 事件

```typescript
game.on("ready", () => {})
game.on("pause", () => {})
game.on("resume", () => {})
game.on("destroy", () => {})
game.on("update", (time: TimeInfo) => {})
game.on("resize", (screen: ScreenInfo) => {})
game.on("error", (err: Error) => {})
game.on("prerender", () => {})
game.on("postrender", () => {})
```

## GameLoop

内部游戏循环，dt 自动 clamp 到 `1/15` 秒（防止巨大跳帧）。

```typescript
interface TimeInfo {
  dt: number // 距上帧秒数（已 clamp）
  elapsed: number // 总运行时间（秒）
  frame: number // 总帧数
  fps: number // 当前 FPS
}
```

## EventEmitter

通用事件系统，所有 Node 和 Engine 均继承。

```typescript
emitter.on(event, handler)      // 监听
emitter.once(event, handler)    // 一次性监听
emitter.off(event, handler)     // 移除
emitter.emit(event, data?)      // 触发
emitter.removeAllListeners()    // 清空
```

## FSM（有限状态机）

```typescript
import { FSM } from "./engine"

const fsm = new FSM({
  initial: "idle",
  states: {
    idle: {
      on: { move: "run" }, // 事件 → 目标状态 映射
      enter() {},
      exit() {},
    },
    run: {
      on: { stop: "idle" },
      enter() {},
      after: [2000, "idle"], // 2 秒后自动转移到 idle
    },
  },
})

fsm.send("move") // 触发事件转换
fsm.goto("idle") // 强制跳转到指定状态
fsm.is("idle") // 检查是否处于某状态 → boolean
fsm.update(dt) // 每帧更新（处理 after 自动转移）
fsm.state // 当前状态名（readonly）
```

## createPool（对象池）

```typescript
import { createPool } from "./engine"

const pool = createPool(
  () => ({ x: 0, y: 0, active: false }), // 工厂
  (obj) => {
    obj.active = false
  }, // 重置
)

const obj = pool.get() // 获取
pool.release(obj) // 回收
pool.each(fn) // 遍历活跃对象
pool.releaseAll() // 回收所有活跃对象
pool.activeCount // 当前活跃对象数（readonly）
pool.poolSize // 当前池中可用对象数（readonly）
```
