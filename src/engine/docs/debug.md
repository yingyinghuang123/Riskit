# Debug — 调试工具

## FpsMeter

屏幕 FPS 显示。

```typescript
import { FpsMeter } from "./engine"

const fps = new FpsMeter()
fps.init(engine) // 绑定引擎
fps.show() // 显示（自动每帧渲染）
fps.hide() // 隐藏
fps.destroy() // 销毁
```

## Stats

性能统计快照。

```typescript
import { Stats } from "./engine"

const stats = new Stats()
stats.init(engine)
stats.show()
stats.hide()
const snap = stats.snapshot()
// snap: { fps, nodeCount, drawCalls, memoryMB }
stats.destroy()
```

## Inspector

节点调试检查器。

```typescript
import { Inspector } from "./engine"

const inspector = new Inspector()
inspector.init(engine)
inspector.show({ bounds: true, tree: true }) // 可选参数
inspector.hide()
inspector.destroy()
```
