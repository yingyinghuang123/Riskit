# Physics — 物理系统

轻量级 2D 物理，通过 `scene.physics` 访问。

## 基本用法

```typescript
// 添加物理体
const body = scene.physics.addBody(node, "dynamic") // 'dynamic' | 'static' | 'kinematic'

// 重叠检测（因为是 overlap，不会产生物理分离）
scene.physics.overlap(playerNode, "enemy", (a, b) => {
  // a 和 b 重叠了
})

// collide 和 overlap 行为相同，都是重叠检测，推荐统一使用 overlap
scene.physics.collide(playerNode, groundNode)
```

## PhysicsWorld（直接使用）

```typescript
import { PhysicsWorld } from "./engine"

const world = new PhysicsWorld()
world.gravity = new Vec2(0, 800) // 全局重力（像素/秒²）

const body = world.addBody(node, "dynamic", "rect") // 类型 + 形状
world.removeBody(node)
world.getBody(node) // → PhysicsBody | null
world.ignore(groupA, groupB) // 忽略碰撞组
world.overlap(nodeA, nodeB, callback)
world.raycast(x1, y1, x2, y2, group?) // → Node | null
world.update(dt) // 物理步进
world.destroy() // 销毁世界
```

## PhysicsBody

| 属性           | 类型                                   | 默认        | 说明                               |
| -------------- | -------------------------------------- | ----------- | ---------------------------------- |
| `type`         | `'dynamic' \| 'static' \| 'kinematic'` | `'dynamic'` | 物理类型                           |
| `velocity`     | `Vec2`                                 | (0,0)       | 速度（像素/秒）                    |
| `gravityScale` | `number`                               | 1           | 重力缩放                           |
| `maxVelocity`  | `number`                               | 1000        | 最大速度（像素/秒）                |
| `group`        | `number`                               | 0           | 碰撞分组                           |
| `shapeType`    | `'rect' \| 'circle'`                   | `'rect'`    | 碰撞形状                           |
| `active`       | `boolean`                              | true        | 是否参与物理                       |
| `isTrigger`    | `boolean`                              | false       | 是否为触发器（不产生物理碰撞响应） |
| `bounce`       | `number`                               | 0           | 弹性                               |
| `friction`     | `number`                               | 0           | 摩擦力                             |

```typescript
body.velocity = new Vec2(200, -300)
body.gravityScale = 0 // 无重力
body.group = 1 // 碰撞分组

// 碰撞回调（target 可以是 Node、tag 字符串、或 null 表示任意碰撞）
body.onCollide("enemy", (other) => {
  /* other 是碰撞的 Node */
})
body.onCollide(null, (other) => {
  /* 任意碰撞 */
})

// 链式配置
body.setType("static").setGravity(0).setBounce(0.5).setFriction(0.1).setGroup(2).setTrigger(true)
```
