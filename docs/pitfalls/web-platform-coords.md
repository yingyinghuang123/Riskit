# web-platform 触摸坐标与引擎逻辑坐标系不匹配

- **日期**: 2026-04-27（2次复现）
- **关键词**: clientX, clientY, getBoundingClientRect, web-platform.ts, hit-test, dpr, pixelRatio
- **影响范围**: src/engine/platform/web-platform.ts

## 现象

在桌面浏览器中，点击按钮无任何响应。所有 UI 交互失效。

## 根因（两次踩坑）

1. **偏移问题**（第 1 次）：直接传递 `clientX/clientY`（页面坐标），canvas 居中时坐标有偏移。修复：加入 `getBoundingClientRect()` 转换。
2. **dpr 缩放问题**（第 2 次）：`toLocal()` 把坐标映射到 canvas buffer 空间（乘了 dpr），但引擎节点坐标系是逻辑坐标（不含 dpr）。PixiJS stage 的 `scale.set(pr, pr)` 只在渲染时放大，不影响 hitTest。

## 关键坐标系关系

```
canvas.width  = screen.width × dpr   (buffer 空间)
canvas.style  = screen.width px        (CSS 空间)
engine.screen = screen.width            (逻辑空间 = 节点坐标系)
PixiJS stage  = scale(dpr)              (渲染时将逻辑坐标放大到 buffer)
```

**触摸坐标必须转换到逻辑坐标**，不是 buffer 坐标。

## 修复

`toLocal()` 使用 `screenInfo.width / rect.width` 而不是 `canvas.width / rect.width`：

```ts
x: (clientX - rect.left) * (screenInfo.width / rect.width)
y: (clientY - rect.top) * (screenInfo.height / rect.height)
```

## 验证

点击菜单按钮能正常响应，不论 dpr 是多少。
