# Math — 数学工具

## 基础函数

```typescript
import {
  clamp, lerp, inverseLerp, remap,
  distance, distanceSq,
  degToRad, radToDeg, angleBetween,
  wrap, approxEqual,
} from './engine'

clamp(value, min, max)                    // 限制范围
lerp(a, b, t)                             // 线性插值
inverseLerp(a, b, value)                  // 反向插值 → t
remap(inMin, inMax, outMin, outMax, v)    // 重映射
distance(x1, y1, x2, y2)                 // 两点距离
distanceSq(x1, y1, x2, y2)              // 两点距离平方（免 sqrt）
degToRad(deg)                             // 度→弧度
radToDeg(rad)                             // 弧度→度
angleBetween(x1, y1, x2, y2)            // 两点间角度（弧度）
wrap(value, min, max)                     // 循环包裹
approxEqual(a, b, epsilon?)              // 近似相等
```

## Vec2

```typescript
import { Vec2 } from './engine'

const v = new Vec2(3, 4)
v.set(x, y)           // 设置
v.copy(other)          // 复制
v.clone()              // 克隆
v.add(other)           // 加
v.sub(other)           // 减
v.scale(s)             // 缩放
v.normalize()          // 归一化
v.length()             // 长度
v.lengthSq()           // 长度平方
v.distanceTo(other)    // 到另一点的距离
v.angle()              // 方向角
v.angleTo(other)       // 到另一点的方向角
v.lerp(other, t)       // 插值
v.dot(other)           // 点积
v.cross(other)         // 叉积
v.rotate(angle)        // 旋转

Vec2.fromAngle(angle, length?)   // 从角度创建
Vec2.ZERO / ONE / UP / DOWN / LEFT / RIGHT  // 常量
```

## Random

可种子随机数生成器。

```typescript
import { Random } from './engine'

const rng = new Random(seed?)     // 不传 seed 则随机
rng.next()                         // [0, 1)
rng.int(min, max)                  // 整数 [min, max]
rng.float(min, max)                // 浮点 [min, max)
rng.x(width)                       // [0, width)
rng.y(height)                      // [0, height)
rng.pick(array)                    // 随机取一个
rng.chance(0.3)                    // 30% 概率 → boolean
rng.angle()                        // [0, 2π)
rng.color()                        // 随机 hex 颜色
rng.shuffle(array)                 // Fisher-Yates 洗牌
rng.direction()                    // 随机单位 Vec2
rng.insideCircle(radius)           // 圆内随机 Vec2
```

> `scene.random` 和 `game.random` 各自持有一个 Random 实例。

## Easing

详见 [animation.md](animation.md)。
