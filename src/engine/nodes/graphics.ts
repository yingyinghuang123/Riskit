// ─── Graphics 程序化绘制节点 ─────────────────────────────────────

import { Graphics as PixiGraphics } from "pixi.js"
import { Node } from "./node"
import { parseCssColor } from "../utils/color"

type DrawCommand =
  | { type: "fillRect"; x: number; y: number; w: number; h: number; color: string }
  | { type: "strokeRect"; x: number; y: number; w: number; h: number; color: string; lineWidth: number }
  | { type: "fillCircle"; x: number; y: number; r: number; color: string }
  | { type: "strokeCircle"; x: number; y: number; r: number; color: string; lineWidth: number }
  | { type: "fillRoundRect"; x: number; y: number; w: number; h: number; r: number; color: string }
  | { type: "line"; x1: number; y1: number; x2: number; y2: number; color: string; lineWidth: number }
  | { type: "fillArc"; x: number; y: number; r: number; start: number; end: number; color: string }
  | { type: "polygon"; points: number[]; color: string; fill: boolean; lineWidth: number }

export class Graphics extends Node {
  private _commands: DrawCommand[] = []
  private _commandsDirty = true

  constructor() {
    super()
    this._pixiObj = new PixiGraphics()
  }
  /** 清除所有绘制命令 */
  clear(): this {
    this._commands.length = 0
    this._commandsDirty = true
    return this
  }

  fillRect(x: number, y: number, w: number, h: number, color: string): this {
    this._commands.push({ type: "fillRect", x, y, w, h, color })
    this._commandsDirty = true
    return this
  }

  strokeRect(x: number, y: number, w: number, h: number, color: string, lineWidth = 1): this {
    this._commands.push({ type: "strokeRect", x, y, w, h, color, lineWidth })
    this._commandsDirty = true
    return this
  }

  fillCircle(x: number, y: number, r: number, color: string): this {
    this._commands.push({ type: "fillCircle", x, y, r, color })
    this._commandsDirty = true
    return this
  }

  strokeCircle(x: number, y: number, r: number, color: string, lineWidth = 1): this {
    this._commands.push({ type: "strokeCircle", x, y, r, color, lineWidth })
    this._commandsDirty = true
    return this
  }

  fillRoundRect(x: number, y: number, w: number, h: number, r: number, color: string): this {
    this._commands.push({ type: "fillRoundRect", x, y, w, h, r, color })
    this._commandsDirty = true
    return this
  }

  line(x1: number, y1: number, x2: number, y2: number, color: string, lineWidth = 1): this {
    this._commands.push({ type: "line", x1, y1, x2, y2, color, lineWidth })
    this._commandsDirty = true
    return this
  }

  fillArc(x: number, y: number, r: number, start: number, end: number, color: string): this {
    this._commands.push({ type: "fillArc", x, y, r, start, end, color })
    this._commandsDirty = true
    return this
  }

  polygon(points: number[], color: string, fill = true, lineWidth = 1): this {
    this._commands.push({ type: "polygon", points, color, fill, lineWidth })
    this._commandsDirty = true
    return this
  }

  /** 画进度条 */
  progressBar(
    x: number,
    y: number,
    w: number,
    h: number,
    progress: number,
    bgColor: string,
    fillColor: string,
    r = 0,
  ): this {
    if (r > 0) {
      this.fillRoundRect(x, y, w, h, r, bgColor)
      const pw = Math.max(0, Math.min(1, progress)) * w
      if (pw > 0) this.fillRoundRect(x, y, pw, h, r, fillColor)
    } else {
      this.fillRect(x, y, w, h, bgColor)
      const pw = Math.max(0, Math.min(1, progress)) * w
      if (pw > 0) this.fillRect(x, y, pw, h, fillColor)
    }
    return this
  }

  _syncPixi(): void {
    if (!this._commandsDirty) return

    const gfx = this._pixiObj as PixiGraphics
    gfx.clear()

    for (const cmd of this._commands) {
      const c = parseCssColor(cmd.color)
      switch (cmd.type) {
        case "fillRect":
          gfx.rect(cmd.x, cmd.y, cmd.w, cmd.h)
          gfx.fill({ color: c.color, alpha: c.alpha })
          break

        case "strokeRect":
          gfx.rect(cmd.x, cmd.y, cmd.w, cmd.h)
          gfx.stroke({ color: c.color, alpha: c.alpha, width: cmd.lineWidth })
          break

        case "fillCircle":
          gfx.circle(cmd.x, cmd.y, cmd.r)
          gfx.fill({ color: c.color, alpha: c.alpha })
          break

        case "strokeCircle":
          gfx.circle(cmd.x, cmd.y, cmd.r)
          gfx.stroke({ color: c.color, alpha: c.alpha, width: cmd.lineWidth })
          break

        case "fillRoundRect":
          gfx.roundRect(cmd.x, cmd.y, cmd.w, cmd.h, cmd.r)
          gfx.fill({ color: c.color, alpha: c.alpha })
          break

        case "line":
          gfx.moveTo(cmd.x1, cmd.y1)
          gfx.lineTo(cmd.x2, cmd.y2)
          gfx.stroke({ color: c.color, alpha: c.alpha, width: cmd.lineWidth })
          break

        case "fillArc":
          gfx.moveTo(cmd.x, cmd.y)
          gfx.arc(cmd.x, cmd.y, cmd.r, cmd.start, cmd.end)
          gfx.closePath()
          gfx.fill({ color: c.color, alpha: c.alpha })
          break

        case "polygon": {
          const pts = cmd.points
          if (pts.length < 4) break

          gfx.moveTo(pts[0], pts[1])
          for (let i = 2; i < pts.length; i += 2) {
            gfx.lineTo(pts[i], pts[i + 1])
          }
          gfx.closePath()

          if (cmd.fill) {
            gfx.fill({ color: c.color, alpha: c.alpha })
          } else {
            gfx.stroke({ color: c.color, alpha: c.alpha, width: cmd.lineWidth })
          }
          break
        }
      }
    }

    this._commandsDirty = false
  }
}
