# Animation — 动画系统

## Node 内置 Tween

每个节点自带补间动画，最简用法：

```typescript
node.tweenTo({ x: 300, alpha: 0.5 }, 500, "easeOutBack")
node.tweenToEx({ y: 100 }, { duration: 300, delay: 100, onComplete: () => {} })
node.stopTweens()
```

## TweenSystem（独立系统）

通过 `scene.tween` 代理或直接使用。

```typescript
// 通过场景代理
scene.tween.to(target, { x: 100 }, { duration: 500, easing: "easeOutQuad" })
await scene.tween.async(target, { y: 200 }, { duration: 300 })
scene.tween.cancel(target) // 取消某目标的所有 tween
scene.tween.cancelAll() // 取消全部
scene.tween.pauseAll() // 暂停全部
scene.tween.resumeAll() // 恢复全部
scene.tween.activeCount // 当前活跃 tween 数量（只读）
```

### 直接使用 TweenSystem

```typescript
import { TweenSystem } from "./engine"

const tweens = new TweenSystem()
const handle = tweens.create({
  target: obj,
  props: { x: 100, y: 200 },
  duration: 500, // 毫秒
  delay: 100, // 毫秒
  easing: "easeOutQuad", // 字符串或函数
  repeat: 3, // 重复次数（-1 无限）
  yoyo: true, // 来回播放
  onUpdate: (progress) => {},
  onComplete: () => {},
  onRepeat: (count) => {},
})

handle.pause()
handle.resume()
handle.stop()
handle.done // boolean
handle.id // number
```

## Easing 函数

```
linear
easeInQuad / easeOutQuad / easeInOutQuad
easeInCubic / easeOutCubic / easeInOutCubic
easeInBack / easeOutBack / easeInOutBack
easeOutElastic / easeOutBounce
easeInSine / easeOutSine / easeInOutSine
```

可用字符串传入，也可用 `Easing.easeOutBack` 函数引用。

## Sprite 帧动画（内置）

Sprite 节点自带帧动画系统，通过 `addAnimation` + `play` 使用。帧定义为裁剪区域对象。

```typescript
sprite.addAnimation("run", {
  frames: [
    { sx: 0, sy: 0, sw: 64, sh: 64 },
    { sx: 64, sy: 0, sw: 64, sh: 64 },
  ],
  frameTime: 0.1, // 秒（默认 0.1）
  loop: true, // 默认 true
  onComplete: () => {}, // loop=false 时播放完触发
})
sprite.play("run")
sprite.stop()
sprite.currentAnimation // 当前动画名
sprite.isPlaying // 是否播放中
sprite.frameIndex // 当前帧索引
```

> 另有独立的 `SpriteAnimPlayer` 类（`animation/sprite-anim.ts`），其 frames 为字符串数组（帧名），用于与 SpriteSheet 配合的高级用法，与 Sprite 内置帧动画是两套独立 API。

## AnimFSM

动画状态机，将动画播放与状态转换绑定。

```typescript
import { createAnimFSM } from "./engine"

const fsm = createAnimFSM({
  initial: "idle",
  states: {
    idle: {
      animation: "idle",
      on: { move: "run" },
      enter() {
        sprite.play("idle")
      },
    },
    run: {
      animation: "run",
      on: { jump: "jump", stop: "idle" },
      enter() {
        sprite.play("run")
      },
    },
    jump: {
      animation: "jump",
      next: "idle", // 播放完自动转到 idle
      enter() {
        sprite.play("jump")
      },
    },
  },
})

fsm.send("move") // 触发事件转换
fsm.goto("idle") // 直接跳转
fsm.state // 当前状态名
fsm.onChange((from, to) => {}) // 状态变化回调
```
