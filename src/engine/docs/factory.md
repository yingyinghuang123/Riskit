# Factory — 节点工厂

引擎提供两类工厂方法：`scene.add.*` 用于创建基础场景节点，`scene.ui.*` 用于创建 UI 控件。

## 基础节点 (NodeFactory)

通过 `scene.add.*` 创建节点并自动添加到场景。

```typescript
scene.add.node(x?, y?)                          // 通用空节点
scene.add.sprite(texture?, x?, y?)               // 精灵 (支持图片路径或 CanvasImageSource)
scene.add.text(content, x?, y?, style?)          // 文本
scene.add.container(x?, y?)                       // 容器 (用于节点分组)
scene.add.graphics(x?, y?)                        // 程序化绘制 (矩形、圆、线条等)

// 扩展节点 (由子系统提供，未注入时返回占位节点)
scene.add.particles(x, y, config?)               // 粒子发射器
scene.add.tilemap(data, options?)                 // 瓦片地图
scene.add.mesh(geometry?, material?)              // 3D 网格 (Three.js)
```

## UI 控件 (UIFactory)

通过 `scene.ui.*` 创建 UI 组件。UI 工厂由 `installGameSystems()` 初始化并注入到场景。

### 基础控件

```typescript
scene.ui.button(text, x?, y?, onClick?)          // 按钮
scene.ui.label(text, x?, y?, style?)             // 标签 (支持背景和内边距)
scene.ui.panel(x?, y?, w?, h?, style?)           // 面板 (容器背景)
scene.ui.progressBar(x?, y?, w?, h?, style?)     // 进度条
scene.ui.slider(x?, y?, w?, style?)              // 滑块
scene.ui.toggle(x?, y?, value?)                   // 开关
```

### 交互与布局

```typescript
scene.ui.dialog(config): Promise<number>         // 模态对话框 (返回点击按钮索引)
scene.ui.confirm(text): Promise<boolean>         // 确认框 (返回是否点击确定)
scene.ui.toast(text, duration?)                  // 吐司提示
scene.ui.vbox(x, y, opts, children)              // 垂直布局容器
scene.ui.hbox(x, y, opts, children)              // 水平布局容器
```

## 完整示例

```typescript
import { installGameSystems } from "./engine"

scenes.register("game", (scene) => {
  const sys = installGameSystems(scene, game, globals)

  // 1. 使用 scene.add 创建游戏世界节点
  const bg = scene.add.graphics().fillRect(0, 0, game.screen.width, game.screen.height, "#1a1a2e")

  const player = scene.add.sprite("assets/hero.png", 200, 400).setAnchor(0.5).setInteractive()

  // 2. 使用 scene.ui 创建 UI 界面
  const scoreLabel = scene.ui.label("Score: 0", 20, 20).bindTo(() => `Score: ${scene.data.score ?? 0}`)

  scene.ui.button("暂停", 20, 80, () => {
    scene.ui.confirm("确定要暂停吗？").then((ok) => {
      if (ok) game.pause()
    })
  })
})
```
