# Scene — 场景与节点

## Node（基类）

所有可见物体的基类，管理变换、场景图、触摸、补间动画。

### 属性

| 属性                 | 类型                     | 默认       | 说明                                            |
| -------------------- | ------------------------ | ---------- | ----------------------------------------------- |
| `x`, `y`             | `number`                 | 0          | 位置                                            |
| `width`, `height`    | `number`                 | 0          | 尺寸                                            |
| `rotation`           | `number`                 | 0          | 旋转角度（度）                                  |
| `scaleX`, `scaleY`   | `number`                 | 1          | 缩放                                            |
| `anchorX`, `anchorY` | `number`                 | 0          | 锚点 (0-1)                                      |
| `alpha`              | `number`                 | 1          | 透明度 (0-1)                                    |
| `visible`            | `boolean`                | true       | 是否可见                                        |
| `active`             | `boolean`                | true       | 是否参与更新                                    |
| `layer`              | `RenderLayer`            | `World`    | 渲染层（映射 PixiJS zIndex，决定绘制顺序）      |
| `updateMode`         | `"scaled" \| "unscaled"` | `"scaled"` | 时间域：scaled 受 timeScale 影响，unscaled 不受 |
| `interactive`        | `boolean`                | false      | 是否响应触摸                                    |
| `tag`                | `string`                 | ''         | 标签                                            |
| `name`               | `string`                 | ''         | 名称                                            |
| `data`               | `Record<string, any>`    | {}         | 自定义数据                                      |
| `parent`             | `Node \| null`           | null       | 父节点                                          |
| `children`           | `readonly Node[]`        | []         | 子节点（只读）                                  |

### 链式 Setter

所有 setter 返回 `this`，支持链式调用：

```typescript
node
  .setPosition(100, 200)
  .setSize(64, 64)
  .setScale(2) // 等比缩放；setScale(2, 3) 分别设
  .setAnchor(0.5) // 等比锚点；setAnchor(0.5, 0) 分别设
  .setAlpha(0.8)
  .setRotation(45)
  .setVisible(true)
  .setActive(true)
  .setInteractive()
  .setTag("enemy")
  .setName("boss")
  .setData("hp", 100)
```

### 场景图

```typescript
node.addChild(child) // 添加子节点
node.removeChild(child) // 移除
node.removeFromParent() // 从父节点移除自己
node.removeAllChildren() // 移除所有子节点
node.findByTag("enemy") // 递归查找所有指定标签的节点 → Node[]
node.findByName("boss") // 递归查找首个指定名称的节点 → Node | null
node.destroy() // 递归销毁自身和所有子节点
```

### 坐标转换

```typescript
node.getWorldTransform() // → [a, b, c, d, tx, ty]
node.localToWorld(lx, ly) // → { x, y }
node.worldToLocal(wx, wy) // → { x, y }
node.getBounds() // → { x, y, width, height }（世界空间 AABB）
node.hitTest(worldX, worldY) // → boolean
```

### 触摸事件

```typescript
node.onTap((data) => {}) // 点击（自动设 interactive=true）
node.onTouchBegin((data) => {}) // 触摸开始
node.onTouchMove((data) => {}) // 触摸移动
node.onTouchEnd((data) => {}) // 触摸结束
// TouchData: { x: number, y: number, id: number }
```

### 补间动画

```typescript
// 简洁版（毫秒）
node.tweenTo({ x: 300, alpha: 0.5 }, 500, "easeOutBack")

// 扩展版
node.tweenToEx(
  { x: 300 },
  {
    duration: 500, // 毫秒
    delay: 100, // 延迟（毫秒）
    easing: "easeOutQuad",
    onComplete: () => {},
    onUpdate: (progress) => {},
  },
)

node.stopTweens() // 停止所有 tween
```

### 生命周期（子类重写）

```typescript
node.update(dt) // 每帧更新
node._syncPixi() // 同步渲染属性到 PixiJS（子类重写实现自定义渲染）
node.onDestroy() // 销毁回调
```

## Scene

继承 Node，场景根节点。场景默认被缓存复用，切换回已访问的场景时不会重新执行 setup，而是触发 `reenter` 事件。

| 属性                   | 类型           | 说明                                                    |
| ---------------------- | -------------- | ------------------------------------------------------- |
| `sceneName`            | `string`       | 场景名称                                                |
| `engine`               | `MiniEngine`   | 引擎引用                                                |
| `add`                  | `NodeFactory`  | 节点工厂                                                |
| `input`                | `InputProxy`   | 输入系统代理                                            |
| `physics`              | `PhysicsProxy` | 物理系统代理                                            |
| `audio`                | `AudioProxy`   | 音频系统代理                                            |
| `timer`                | `TimerProxy`   | 定时器代理                                              |
| `camera`               | `CameraProxy`  | 相机代理                                                |
| `fx`                   | `FxProxy`      | 特效代理                                                |
| `tween`                | `TweenProxy`   | Tween 代理                                              |
| `tween.cancel(target)` |                | 取消某目标的所有 tween                                  |
| `tween.cancelAll()`    |                | 取消全部 tween                                          |
| `tween.pauseAll()`     |                | 暂停全部 tween                                          |
| `tween.resumeAll()`    |                | 恢复全部 tween                                          |
| `tween.activeCount`    | `number`       | 活跃 tween 数量（只读）                                 |
| `ui`                   | `UIFactory`    | UI 工厂（`scene.ui.button()` / `scene.ui.dialog()` 等） |
| `random`               | `Random`       | 场景随机数                                              |

> 子系统代理在调用 `installGameSystems(scene, engine, globals)` 后可用。其中 `globals` 由 `createGlobalSystems(engine)` 创建。

### 方法

```typescript
scene.onUpdate((dt: number) => {
  // 每帧更新回调，随场景生命周期自动清理
  // 可多次调用注册多个回调
})
```

### 场景事件

```typescript
// 场景被缓存复用时触发（非首次进入）
scene.on("reenter", () => {
  // 全局系统已 rebind、场景级系统已 reset
  // 需要在此重新注册手势/键盘回调
})
```

## SceneManager

```typescript
const scenes = new SceneManager(engine)

scenes.register("menu", setupFn) // 注册
scenes.goto("game", { type: "fade", duration: 500 }) // 切换（替换栈顶，旧场景缓存复用）
scenes.goto("game", { destroy: true }) // 切换并销毁旧场景（不缓存）
scenes.push("pause") // 压入（保留下层）
scenes.pop({ type: "slideRight" }) // 弹出（始终销毁弹出的场景）
scenes.current // 当前场景
scenes.depth // 栈深度
scenes.transitioning // boolean — 是否正在过渡中
```

### 场景缓存

场景默认缓存复用。`goto('name')` 切换时，旧场景调用 `onExit()` 后保留在内存中。下次 `goto` 回来时直接复用实例，触发 `reenter` 事件而非重新 setup.

- `goto('name')` — 旧场景缓存，可复用
- `goto('name', { destroy: true })` — 旧场景销毁，释放内存
- `pop()` — 弹出的场景始终销毁

### 过渡类型

`'none'` | `'fade'` | `'slideLeft'` | `'slideRight'` | `'slideUp'` | `'slideDown'` | `'zoom'` | `'circle'`

## Sprite

继承 Node，显示纹理图片。

```typescript
const sp = scene.add.sprite(texture, x, y)
  .setTexture(img)
  .setSrcRect(sx, sy, sw, sh)    // 裁剪区域
  .setFlip(true, false)          // 水平/垂直翻转
  .setTint('#ff0000')            // 色调叠加

// 帧动画
sp.addAnimation('run', {
  frames: [{ sx: 0, sy: 0, sw: 64, sh: 64 }, ...],
  frameTime: 0.1,    // 秒
  loop: true,
  onComplete: () => {},
})
sp.play('run')
sp.stop()
sp.currentAnimation  // 当前动画名
sp.isPlaying         // 是否播放中
sp.frameIndex        // 当前帧索引
```

## TextNode

继承 Node，支持自动换行、描边、阴影、数据绑定。

```typescript
const txt = scene.add.text("Score: 0", 10, 10, {
  fontSize: 32,
  fontFamily: "sans-serif",
  color: "#ffffff",
  align: "left", // 'left' | 'center' | 'right'
  bold: true,
  maxWidth: 300, // 自动换行宽度
  lineHeight: 40,
  shadow: { color: "#000", offsetX: 2, offsetY: 2, blur: 4 },
  stroke: { color: "#000", width: 3 },
})

txt.setText("Score: 100")
txt.setFontSize(48)
txt.setColor("#ff0")
txt.setAlign("center")
txt.setBold()
txt.setShadow("#000", 2, 2, 4)
txt.setStroke("#000", 3)
txt.bindTo(() => `HP: ${player.hp}`) // 每帧自动更新
```

## Graphics

继承 Node，程序化绘制。所有方法链式调用，命令缓存。

```typescript
const gfx = scene.add.graphics(0, 0)
gfx
  .clear()
  .fillRect(0, 0, 100, 50, "#ff0")
  .strokeRect(0, 0, 100, 50, "#f00", 2)
  .fillCircle(50, 50, 20, "#0f0")
  .strokeCircle(50, 50, 20, "#00f", 2)
  .fillRoundRect(0, 0, 100, 50, 8, "#fff")
  .line(0, 0, 100, 100, "#f00", 2)
  .fillArc(50, 50, 30, 0, Math.PI, "#ff0")
  .polygon([0, 0, 50, 50, 100, 0], "#f0f", true)
  .progressBar(0, 0, 200, 20, 0.7, "#333", "#0f0") // r 默认 0（直角），传 4 则圆角
```

## Container

继承 Node，纯容器。可选裁剪。

```typescript
const c = scene.add.container(100, 100)
c.clip = true // 裁剪子节点到自身区域
c.setSize(200, 200)
c.addChild(someNode)
```
