# UI — 用户界面系统

所有 UI 组件继承 `UINode`（继承 Node），默认 `interactive=true`、`layer=RenderLayer.UI`。

## UINode（基类）

```typescript
uiNode.setUIStyle({
  backgroundColor: "#333",
  borderColor: "#fff",
  borderWidth: 2,
  borderRadius: 8,
  padding: 10, // 数字或 [top, right, bottom, left]
  margin: 5,
})
uiNode.blockTouch = true // 阻断触摸传递
```

## Button

```typescript
const btn = scene.ui.button("Play", 200, 400, () => {
  console.log("clicked")
})

btn.setText("Restart")
btn.setStyle({
  bg: "#4a90d9",
  fg: "#ffffff",
  radius: 8,
  fontSize: 28,
  fontFamily: "Arial",
  bold: true,
  padding: [12, 32],
  pressScale: 0.95,
  disabledBg: "#888",
  disabledFg: "#ccc",
  image: texture, // 图片按钮模式
})
btn.onClick(() => {})
btn.setDisabled(true)
btn.disabled // boolean
btn.label // 当前文本
```

## Label

```typescript
const lbl = scene.ui.label("Score: 0", 10, 10, {
  fontSize: 24,
  color: "#fff",
})
```

## Panel

```typescript
const panel = scene.ui.panel(50, 50, 300, 200, {
  // PanelStyle
})
panel.addChild(someNode)
```

## ProgressBar

```typescript
const bar = scene.ui.progressBar(20, 60, 200, 16)
bar.setBarStyle({
  /* ProgressBarStyle */
})
// progressBar(x?, y?, w?, h?, style?)
```

## Slider

```typescript
const slider = scene.ui.slider(20, 100, 200)
slider.setSliderStyle({
  /* SliderStyle */
})
```

## Toggle

```typescript
const toggle = scene.ui.toggle(20, 140, false)
// toggle.value → boolean
```

## Dialog

```typescript
const idx = await scene.ui.dialog({
  title: "确认",
  content: "是否退出游戏？",
  buttons: ["取消", "确认"],
  maskClose: true,
  maskColor: "rgba(0,0,0,0.5)",
  width: 400,
  bg: "#fff",
  radius: 12,
  titleSize: 32,
  contentSize: 24,
})
// idx: 0=取消, 1=确认

// 快捷确认框
const ok = await scene.ui.confirm("确定要删除吗？")
```

## Toast

```typescript
scene.ui.toast("保存成功", 2000) // 文本, 毫秒
```

## 布局

```typescript
import { vbox, hbox } from "./engine"

// 垂直排列 (x, y, opts, children)
scene.ui.vbox(x, y, { gap: 10, align: "center" }, [node1, node2, node3])

// 水平排列 (x, y, opts, children)
scene.ui.hbox(x, y, { gap: 10, align: "center" }, [node1, node2])

// 也可作为独立函数导入使用
vbox(x, y, { gap: 10 }, [node1, node2])
```

## ScrollView

```typescript
import { ScrollView } from "./engine"

const scroll = new ScrollView(0, 0, 300, 400, {
  bg: "#222",
  radius: 8,
  elasticity: 0.5,
  showScrollBar: true,
})
scroll.addItem(someNode)
scroll.scrollTo(100, true)
scroll.scrollY // 当前滚动位置
scroll.contentHeight // 内容总高度
scene.addChild(scroll)
```

## VirtualList

大列表虚拟滚动。

```typescript
import { VirtualList } from "./engine"

const list = new VirtualList(0, 0, 300, 400, {
  itemHeight: 60,
  itemCount: 1000,
  renderItem: (index) => {
    const node = new Node()
    // 渲染第 index 项
    return node
  },
  buffer: 2,
  bg: "#111",
})
list.setItemCount(2000)
list.scrollToIndex(50, true)
list.scrollY
list.totalHeight
scene.addChild(list)
```
