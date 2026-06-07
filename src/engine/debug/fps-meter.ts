// ─── FPS 计数器 ────────────────────────────────────────────────────

import type { MiniEngine } from "../core/engine"

export class FpsMeter {
  private _engine: MiniEngine | null = null
  private _visible = false

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

  /** 在 postrender 阶段调用 */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this._visible || !this._engine) return

    const fps = this._engine.time.fps
    const text = `FPS: ${fps}`

    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    const pr = this._engine.screen.pixelRatio
    const x = 8 * pr
    const y = 8 * pr
    const fontSize = 12 * pr

    ctx.font = `bold ${fontSize}px monospace`
    const metrics = ctx.measureText(text)
    const w = metrics.width + 8 * pr
    const h = fontSize + 6 * pr

    ctx.fillStyle = "rgba(0,0,0,0.6)"
    ctx.fillRect(x, y, w, h)

    ctx.fillStyle = fps >= 50 ? "#4caf50" : fps >= 30 ? "#ff9800" : "#f44336"
    ctx.textBaseline = "top"
    ctx.fillText(text, x + 4 * pr, y + 3 * pr)

    ctx.restore()
  }

  destroy(): void {
    this._engine = null
    this._visible = false
  }
}
