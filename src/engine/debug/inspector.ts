// ─── 节点检视器 ────────────────────────────────────────────────────

import type { MiniEngine } from "../core/engine"

export class Inspector {
  private _engine: MiniEngine | null = null
  private _visible = false
  private _showBounds = true
  private _showTree = false

  init(engine: MiniEngine): this {
    this._engine = engine
    return this
  }

  show(options?: { bounds?: boolean; tree?: boolean }): this {
    this._visible = true
    this._showBounds = options?.bounds ?? true
    this._showTree = options?.tree ?? false
    return this
  }

  hide(): this {
    this._visible = false
    return this
  }

  /** 在 postrender 阶段调用 */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this._visible || !this._engine) return

    ctx.save()

    const pr = this._engine.screen.pixelRatio
    ctx.setTransform(pr, 0, 0, pr, 0, 0)

    // 遍历当前场景的节点，绘制包围盒
    if (this._showBounds) {
      try {
        const sceneManager = (this._engine as any)._sceneManager
        const currentScene = sceneManager?.current
        if (currentScene) {
          this._renderNodeBounds(ctx, currentScene.root || currentScene)
        }
      } catch {
        /* 静默 */
      }
    }

    // 节点树信息
    if (this._showTree) {
      this._renderTree(ctx)
    }

    ctx.restore()
  }

  destroy(): void {
    this._engine = null
    this._visible = false
  }

  private _renderNodeBounds(ctx: CanvasRenderingContext2D, node: any, depth = 0): void {
    if (!node || !node.visible) return

    // 绘制当前节点包围盒
    if (node.width > 0 && node.height > 0) {
      const colors = ["#ff004455", "#00ff4455", "#0044ff55", "#ffff0055", "#ff00ff55"]
      ctx.strokeStyle = colors[depth % colors.length]
      ctx.lineWidth = 1
      ctx.strokeRect(node.x ?? 0, node.y ?? 0, node.width, node.height)
    }

    // 递归子节点
    const children = node.children || node._children
    if (children) {
      for (const child of children) {
        this._renderNodeBounds(ctx, child, depth + 1)
      }
    }
  }

  private _renderTree(ctx: CanvasRenderingContext2D): void {
    if (!this._engine) return

    const pr = this._engine.screen.pixelRatio
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const sw = this._engine.screen.width * pr
    const fontSize = 10 * pr
    const lineH = fontSize + 2 * pr
    const x = sw - 160 * pr
    const y = 8 * pr

    ctx.font = `${fontSize}px monospace`
    ctx.fillStyle = "rgba(0,0,0,0.7)"
    ctx.fillRect(x, y, 152 * pr, 120 * pr)

    ctx.fillStyle = "#88ff88"
    ctx.textBaseline = "top"

    let lineIdx = 0
    try {
      const sceneManager = (this._engine as any)._sceneManager
      const scene = sceneManager?.current
      if (scene) {
        const root = scene.root || scene
        this._printNode(ctx, root, x + 4 * pr, y + 4 * pr, lineH, 0, lineIdx, 8)
      }
    } catch {
      /* 静默 */
    }
  }

  private _printNode(
    ctx: CanvasRenderingContext2D,
    node: any,
    x: number,
    y: number,
    lineH: number,
    indent: number,
    lineIdx: number,
    maxLines: number,
  ): number {
    if (lineIdx >= maxLines) return lineIdx

    const name = node.name || node.constructor?.name || "Node"
    const prefix = " ".repeat(indent * 2)
    ctx.fillText(`${prefix}${name}`, x, y + lineIdx * lineH)
    lineIdx++

    const children = node.children || node._children
    if (children) {
      for (const child of children) {
        if (lineIdx >= maxLines) break
        lineIdx = this._printNode(ctx, child, x, y, lineH, indent + 1, lineIdx, maxLines)
      }
    }

    return lineIdx
  }
}
