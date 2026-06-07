# Input — 输入系统

通过 `scene.input` 访问（需先调用 `installGameSystems`）。InputManager 是全局单例，由 `createGlobalSystems(engine)` 创建，场景切换时自动 rebind 到当前场景。

## 指针状态

```typescript
scene.input.x               // 触摸 x
scene.input.y               // 触摸 y
scene.input.isDown           // 当前按下
scene.input.justPressed()    // 本帧刚按下
scene.input.justReleased()   // 本帧刚抬起
scene.input.pointer          // 完整 PointerState 对象
```

### PointerState

| 属性 | 类型 | 说明 |
|---|---|---|
| `x`, `y` | `number` | 当前坐标 |
| `isDown` | `boolean` | 是否按下 |
| `justPressed` | `boolean` | 本帧刚按下 |
| `justReleased` | `boolean` | 本帧刚抬起 |

## 手势

```typescript
scene.input.onTap((x, y) => {})                                    // 单击
scene.input.onDoubleTap((x, y) => {})                              // 双击
scene.input.onSwipe('left', () => {})                               // 方向滑动
scene.input.onSwipe('any', (dir) => {})                             // 任意滑动
scene.input.onDrag(node, (dx, dy, x, y) => {}, onEnd?)             // 拖拽
scene.input.onPinch((scale, cx, cy) => {})                          // 双指缩放
scene.input.onLongPress(node, () => {})                             // 长按
```

滑动方向：`'left'` | `'right'` | `'up'` | `'down'` | `'any'`

## 节点触摸

```typescript
node.onTap((data) => {})           // 点击（自动 interactive=true）
node.onTouchBegin((data) => {})
node.onTouchMove((data) => {})
node.onTouchEnd((data) => {})
// TouchData: { x, y, id }
```

## 键盘（PC 调试用）

```typescript
const state = scene.input.key('ArrowLeft')   // → KeyState
state.isDown                                   // 按下中
state.justPressed                              // 本帧刚按下
state.justReleased                             // 本帧刚抬起

scene.input.onKey('Space', (down) => {})       // 按下/抬起回调
```

## 手柄

```typescript
scene.input.leftStick      // { x, y, magnitude }
scene.input.rightStick
scene.input.button('A')    // { isDown, justPressed, justReleased }
```

## 传感器

```typescript
scene.input.enableAccelerometer('game')     // 启用加速计
scene.input.enableGyroscope('game')         // 启用陀螺仪
scene.input.accelerometer   // { x, y, z }
scene.input.gyroscope       // { x, y, z }
```

## 软键盘

```typescript
const text = await scene.input.textInput({
  defaultValue?: string,
  maxLength?: number,
  multiple?: boolean,
  confirmType?: string,
})
```

## 场景切换行为

InputManager 是全局单例，场景切换时引擎会自动：

1. 清空上一场景注册的手势/键盘回调（`onTap`、`onSwipe`、`onDrag`、`onKey` 等）
2. 重置进行中的手势追踪状态（拖拽、长按计时器、捏合距离等）
3. 将 InputManager rebind 到新场景

**重要**：场景复用（缓存场景被重新进入）时，需要在 `reenter` 事件中重新注册手势/键盘回调：

```typescript
engine.scene('game', (scene) => {
  const sys = installGameSystems(scene, engine, globals)

  // 首次进入时注册
  registerInputCallbacks(scene)

  // 场景复用时重新注册（回调已被清空）
  scene.on('reenter', () => {
    registerInputCallbacks(scene)
  })
})

function registerInputCallbacks(scene: Scene) {
  scene.input.onSwipe('left', () => { /* ... */ })
  scene.input.onKey('Space', (down) => { /* ... */ })
}
```

> 节点触摸事件（`node.onTap` 等）不受影响，因为它们绑定在节点自身的 EventEmitter 上。
