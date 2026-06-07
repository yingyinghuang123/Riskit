// ─── 性能统计面板 ──────────────────────────────────────────────────

import type { MiniEngine } from "../core/engine"

export interface StatsSnapshot {
  fps: number
  nodeCount: number
  drawCalls: number
  memoryMB: number
}

export class Stats {
  private _engine: MiniEngine | null = null
  private _visible = false
  private _nodeCount = 0
  private _drawCalls = 0

  init(engine: MiniEngine): this {
    this._engine = engine
    if (engine.debug) {
      this.show()
    }
    return this
  }

  show(): this {
    this._visible = true
    return this
  }

  hide(): this {
    this._visible = false
    return this
  }

  /** 手动设置统计值（由各子系统上报） */
  report(nodeCount: number, drawCalls: number): void {
    this._nodeCount = nodeCount
    this._drawCalls = drawCalls
  }

  /** 获取当前快照 */
  snapshot(): StatsSnapshot {
    return {
      fps: this._engine?.time.fps ?? 0,
      nodeCount: this._nodeCount,
      drawCalls: this._drawCalls,
      memoryMB: this._estimateMemory(),
    }
  }

  /** 在 postrender 阶段调用 */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this._visible || !this._engine) return

    const snap = this.snapshot()
    const lines = [`Nodes: ${snap.nodeCount}`, `Draw: ~${snap.drawCalls}`, `Mem: ~${snap.memoryMB.toFixed(1)}MB`]

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const pr = this._engine.screen.pixelRatio
    const fontSize = 11 * pr
    const lineH = fontSize + 2 * pr
    const x = 8 * pr
    const y = 30 * pr
    const padding = 4 * pr

    ctx.font = `${fontSize}px monospace`

    let maxW = 0
    for (const line of lines) {
      const w = ctx.measureText(line).width
      if (w > maxW) maxW = w
    }

    const boxW = maxW + padding * 2
    const boxH = lines.length * lineH + padding * 2

    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.fillRect(x, y, boxW, boxH)

    ctx.fillStyle = "#aaddff"
    ctx.textBaseline = "top"
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], x + padding, y + padding + i * lineH)
    }

    ctx.restore()
  }

  destroy(): void {
    this._engine = null
    this._visible = false
  }

  private _estimateMemory(): number {
    try {
      if (typeof (performance as any).memory !== "undefined") {
        return (performance as any).memory.usedJSHeapSize / (1024 * 1024)
      }
    } catch {
      /* 静默 */
    }
    return 0
  }
}
