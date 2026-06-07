# Particle — 粒子系统

## ParticleEmitter

```typescript
import { ParticleEmitter } from './engine'

const emitter = new ParticleEmitter({
  x: 200, y: 300,
  emitShape: 'point',      // 'point' | 'rect' | 'circle'
  emitWidth: 100,           // rect 发射宽度
  emitHeight: 50,           // rect 发射高度
  emitRadius: 30,           // circle 发射半径
  rate: 10,                 // 每秒发射数（持续发射）
  burst: 30,                // 一次性发射数
  duration: 2,              // 发射持续时间（秒，0=无限）
  lifeMin: 0.3, lifeMax: 1.0,   // 粒子寿命范围
  speedMin: 50, speedMax: 200,   // 速度范围
  angleMin: 0, angleMax: Math.PI * 2,  // 方向范围
  gravityX: 0, gravityY: 200,   // 重力
  sizeStart: 6, sizeEnd: 0,     // 尺寸变化
  alphaStart: 1, alphaEnd: 0,   // 透明度变化
  rotationSpeed: 2,              // 旋转速度
  colors: ['#ff4400', '#ffcc00'], // 颜色（随机选一个）
  texture: img,                   // 粒子纹理（可选）
  blendMode: 'lighter',          // 'source-over' | 'lighter' | 'multiply' | 'screen'
})

emitter.burst(20)     // 手动发射一批
emitter.x = 300       // 更新位置
emitter.active = false // 暂停
emitter.reset()        // 重置
emitter.destroy()      // 销毁
emitter.particleCount  // 当前粒子数
emitter.finished       // 是否已完成
```

## FxPresets（预设特效）

```typescript
import { FxPresets } from './engine'

FxPresets.explode(x, y, opts?)     // 爆炸
FxPresets.sparkle(x, y, opts?)     // 火花
FxPresets.smoke(x, y, opts?)       // 烟雾
FxPresets.trail(x, y, opts?)       // 拖尾
FxPresets.confetti(x, y, opts?)    // 彩纸
FxPresets.rain(x, y, opts?)        // 雨
FxPresets.snow(x, y, opts?)        // 雪
```

每个预设返回 `ParticleEmitter`，可通过 `opts` 覆盖任意配置。

## 屏幕特效（通过 scene.fx）

```typescript
scene.fx.screenShake(5, 300)          // 强度, 毫秒
scene.fx.screenFlash('#ffffff', 200)  // 颜色, 毫秒
scene.fx.slowMotion(0.3, 1000)        // 缩放, 毫秒
scene.fx.freezeFrame(100)             // 毫秒
```
