# Render — 渲染系统

## 渲染层级

```typescript
import { RenderLayer } from "./engine"

RenderLayer.Background // 0
RenderLayer.World // 100
RenderLayer.Foreground // 200
RenderLayer.UI // 300
RenderLayer.Overlay // 400
```

## Camera2D

```typescript
import { createCamera2D } from "./engine"

const cam = createCamera2D({
  viewportWidth: 750,
  viewportHeight: 1334,
})

cam.x = 100 // 相机位置（世界坐标）
cam.y = 200
cam.zoom = 1.5 // 缩放
cam.rotation = 0 // 旋转（弧度）

// 属性（只读，供渲染器使用）
cam.flashAlpha // 闪白透明度
cam.flashColor // 闪白颜色
cam.shakeOffsetX // 震动偏移 X
cam.shakeOffsetY // 震动偏移 Y

// 方法
cam.follow(node, {
  // 跟随目标
  lerp: 0.1, // 插值系数 0~1
  offsetX: 0,
  offsetY: -100,
  deadZoneWidth: 50,
  deadZoneHeight: 50,
})

cam.shake(10, 0.3) // 震动 (强度, 持续秒)
cam.zoomTo(2, 0.5) // 缩放到目标值 (比例, 持续秒)
cam.flash("#fff", 0.2) // 闪烁 (颜色, 持续秒)
cam.update(dt)

cam.worldToScreen(wx, wy) // 世界坐标 -> 屏幕坐标
cam.screenToWorld(sx, sy) // 屏幕坐标 -> 世界坐标
cam.isVisible(x, y, w, h) // 视口裁剪
cam.getViewBounds() // 获取当前视口的世界坐标范围 { left, top, right, bottom }
```

## Canvas2DContext（底层）

引擎内部使用的 Canvas 2D 封装。支持渐变、阴影、混合模式、裁剪、九宫格等。通常通过 Node 渲染系统自动调用，无需直接使用。

## SpriteSheet

```typescript
import { createSpriteSheet, createSpriteAnimator } from "./engine"

const sheet = createSpriteSheet(image, jsonData) // TexturePacker JSON Hash
const frame = sheet.frame("hero_run_01") // → SpriteFrame | null
sheet.frameNames() // → string[]
sheet.drawFrame(ctx, "hero_run_01", x, y, w?, h?) // 绘制帧到 canvas

// 动画控制器（不依赖 sheet，直接传动画定义）
const animator = createSpriteAnimator({
  run: { frames: ["hero_run_01", "hero_run_02", "hero_run_03"], fps: 12, loop: true },
  idle: { frames: ["hero_idle_01", "hero_idle_02"], fps: 8, loop: true },
})
animator.play("run")
animator.update(dt)
animator.currentFrame // 当前帧名
animator.finished // 是否播完（非循环）
animator.stop()
```

## 3D 相关

详见 [three.md](three.md)。
