// ─── Node 基类 — 场景图核心 ──────────────────────────────────────

import { EventEmitter } from "../utils/events"
import { clamp, resolveEasing, type EasingFn } from "../utils/math"
import { deferGpuDestroy } from "../utils/gpu-destroy-queue"
import { Container as PixiContainer } from "pixi.js"
import { RenderLayer } from "../render/layers"
// ─── 类型定义 ───────────────────────────────────────────────────

export interface NodeEvents {
  added: Node
  removed: Node
  destroy: void
  tap: TouchData
  touchbegin: TouchData
  touchmove: TouchData
  touchend: TouchData
}

export interface TouchData {
  x: number
  y: number
  id: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface TweenOptions {
  duration?: number
  easing?: EasingFn | string
  delay?: number
  onComplete?: () => void
  onUpdate?: (progress: number) => void
}

interface ActiveNodeTween {
  startValues: Record<string, number>
  endValues: Record<string, number>
  elapsed: number
  delay: number
  duration: number
  easing: EasingFn
  onComplete?: () => void
  onUpdate?: (progress: number) => void
  dead: boolean
}

// ─── Node 基类 ──────────────────────────────────────────────────

export class Node extends EventEmitter<NodeEvents> {
  // ── 变换 ──
  x = 0
  y = 0
  width = 0
  height = 0
  rotation = 0
  scaleX = 1
  scaleY = 1
  anchorX = 0
  anchorY = 0
  alpha = 1
  visible = true
  active = true

  /** 渲染层（映射到 PixiJS zIndex，决定绘制顺序） */
  layer: RenderLayer = RenderLayer.World

  /** 时间域：'scaled' 受 timeScale 影响（游戏逻辑），'unscaled' 使用 wall-clock time（UI/动画） */
  updateMode: "scaled" | "unscaled" = "scaled"

  /** 是否响应触摸 */
  interactive = false

  /** 节点标签 */
  tag = ""

  /** 节点名称 */
  name = ""

  /** 自定义数据 */
  data: Record<string, any> = {}

  // ── 场景图 ──
  parent: Node | null = null
  readonly children: Node[] = []

  // ── PixiJS display object ──
  /** 对应的 PixiJS 显示对象，子类可覆盖为更具体类型 */
  _pixiObj: PixiContainer

  // ── 内部 ──
  private _tweens: ActiveNodeTween[] = []
  private _destroyed = false
  // ── 链式 setter ────────────────────────────────────────────────

  constructor() {
    super()
    this._pixiObj = new PixiContainer()
  }

  setPosition(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  setSize(width: number, height: number): this {
    this.width = width
    this.height = height
    return this
  }

  setScale(x: number, y?: number): this {
    this.scaleX = x
    this.scaleY = y ?? x
    return this
  }

  setAnchor(x: number, y?: number): this {
    this.anchorX = x
    this.anchorY = y ?? x
    return this
  }

  setAlpha(alpha: number): this {
    this.alpha = clamp(alpha, 0, 1)
    return this
  }

  setRotation(degrees: number): this {
    this.rotation = degrees
    return this
  }

  setVisible(visible: boolean): this {
    this.visible = visible
    return this
  }

  setActive(active: boolean): this {
    this.active = active
    return this
  }

  setInteractive(interactive = true): this {
    this.interactive = interactive
    return this
  }

  setTag(tag: string): this {
    this.tag = tag
    return this
  }

  setName(name: string): this {
    this.name = name
    return this
  }

  setData(key: string, value: any): this {
    this.data[key] = value
    return this
  }

  // ── 场景图操作 ─────────────────────────────────────────────────

  addChild(child: Node): this {
    if (child.parent === this) return this
    if (child.parent) {
      child.parent.removeChild(child)
    }
    child.parent = this
    this.children.push(child)
    this._pixiObj.addChild(child._pixiObj)
    this.emit("added", child)
    return this
  }

  removeChild(child: Node): this {
    const idx = this.children.indexOf(child)
    if (idx !== -1) {
      this.children.splice(idx, 1)
      child.parent = null
      if (child._pixiObj.parent === this._pixiObj) {
        this._pixiObj.removeChild(child._pixiObj)
      }
      this.emit("removed", child)
    }
    return this
  }

  removeFromParent(): this {
    this.parent?.removeChild(this)
    return this
  }

  removeAllChildren(): this {
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].parent = null
    }
    this.children.length = 0
    this._pixiObj.removeChildren()
    return this
  }

  /** 按标签查找子节点 */
  findByTag(tag: string): Node[] {
    const result: Node[] = []
    this._findByTag(tag, result)
    return result
  }

  private _findByTag(tag: string, result: Node[]): void {
    for (const child of this.children) {
      if (child.tag === tag) result.push(child)
      child._findByTag(tag, result)
    }
  }

  /** 按名称查找子节点（首个） */
  findByName(name: string): Node | null {
    for (const child of this.children) {
      if (child.name === name) return child
      const found = child.findByName(name)
      if (found) return found
    }
    return null
  }

  // ── 坐标转换 ──────────────────────────────────────────────────

  /** 获取世界变换矩阵 [a, b, c, d, tx, ty] */
  getWorldTransform(): [number, number, number, number, number, number] {
    const rad = (this.rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    let a = cos * this.scaleX
    let b = sin * this.scaleX
    let c = -sin * this.scaleY
    let d = cos * this.scaleY
    let tx = this.x - (this.anchorX * this.width * a + this.anchorY * this.height * c)
    let ty = this.y - (this.anchorX * this.width * b + this.anchorY * this.height * d)

    if (this.parent) {
      const [pa, pb, pc, pd, ptx, pty] = this.parent.getWorldTransform()
      const na = a * pa + b * pc
      const nb = a * pb + b * pd
      const nc = c * pa + d * pc
      const nd = c * pb + d * pd
      const ntx = tx * pa + ty * pc + ptx
      const nty = tx * pb + ty * pd + pty
      return [na, nb, nc, nd, ntx, nty]
    }

    return [a, b, c, d, tx, ty]
  }

  /** 本地坐标转世界坐标 */
  localToWorld(lx: number, ly: number): { x: number; y: number } {
    const [a, b, c, d, tx, ty] = this.getWorldTransform()
    return {
      x: lx * a + ly * c + tx,
      y: lx * b + ly * d + ty,
    }
  }

  /** 世界坐标转本地坐标 */
  worldToLocal(wx: number, wy: number): { x: number; y: number } {
    const [a, b, c, d, tx, ty] = this.getWorldTransform()
    const det = a * d - b * c
    if (Math.abs(det) < 1e-10) return { x: 0, y: 0 }
    const invDet = 1 / det
    const dx = wx - tx
    const dy = wy - ty
    return {
      x: (dx * d - dy * c) * invDet,
      y: (dy * a - dx * b) * invDet,
    }
  }

  /** 获取世界空间包围盒 (AABB) */
  getBounds(): Bounds {
    const [a, b, c, d, tx, ty] = this.getWorldTransform()
    const w = this.width
    const h = this.height

    // 四个角点
    const x0 = tx,
      y0 = ty
    const x1 = w * a + tx,
      y1 = w * b + ty
    const x2 = h * c + tx,
      y2 = h * d + ty
    const x3 = w * a + h * c + tx,
      y3 = w * b + h * d + ty

    const minX = Math.min(x0, x1, x2, x3)
    const minY = Math.min(y0, y1, y2, y3)
    const maxX = Math.max(x0, x1, x2, x3)
    const maxY = Math.max(y0, y1, y2, y3)

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
  }

  /** 触摸命中测试 */
  hitTest(worldX: number, worldY: number): boolean {
    if (!this.visible || !this.interactive) return false
    const local = this.worldToLocal(worldX, worldY)
    return local.x >= 0 && local.x <= this.width && local.y >= 0 && local.y <= this.height
  }

  // ── 触摸事件快捷方法 ───────────────────────────────────────────

  onTap(handler: (data: TouchData) => void): this {
    this.interactive = true
    this.on("tap", handler)
    return this
  }

  onTouchBegin(handler: (data: TouchData) => void): this {
    this.interactive = true
    this.on("touchbegin", handler)
    return this
  }

  onTouchMove(handler: (data: TouchData) => void): this {
    this.interactive = true
    this.on("touchmove", handler)
    return this
  }

  onTouchEnd(handler: (data: TouchData) => void): this {
    this.interactive = true
    this.on("touchend", handler)
    return this
  }

  // ── Tween 快捷方法 ────────────────────────────────────────────

  /** 补间动画到目标属性值 */
  tweenTo(
    props: Partial<Record<"x" | "y" | "scaleX" | "scaleY" | "rotation" | "alpha" | "width" | "height", number>>,
    duration = 300,
    easing?: EasingFn | string,
  ): this {
    return this.tweenToEx(props, { duration, easing })
  }

  /** 补间动画（扩展版） */
  tweenToEx(props: Record<string, number>, options: TweenOptions = {}): this {
    const startValues: Record<string, number> = {}
    const endValues: Record<string, number> = {}

    for (const key of Object.keys(props)) {
      startValues[key] = (this as any)[key] ?? 0
      endValues[key] = props[key]
    }

    const entry: ActiveNodeTween = {
      startValues,
      endValues,
      elapsed: 0,
      delay: Math.max(0, options.delay ?? 0),
      duration: Math.max(0, options.duration ?? 300) / 1000,
      easing: resolveEasing(options.easing),
      onComplete: options.onComplete,
      onUpdate: options.onUpdate,
      dead: false,
    }

    this._tweens.push(entry)
    return this
  }

  /** 停止所有该节点上的 tween */
  stopTweens(): this {
    for (const t of this._tweens) t.dead = true
    return this
  }

  // ── 生命周期（子类重写） ───────────────────────────────────────

  /** 每帧更新 */
  update(_dt: number): void {
    // 子类重写
  }

  /** 同步渲染属性到 PixiJS 对象（子类重写） */
  _syncPixi(): void {
    // 子类重写
  }

  /** 销毁时回调 */
  onDestroy(): void {
    // 子类重写
  }

  // ── 引擎内部遍历 ──────────────────────────────────────────────

  /**
   * 递归更新（引擎内部调用）
   * @param scaledDt - 受 timeScale 影响的 dt（游戏逻辑用）
   * @param rawDt    - 原始 wall-clock dt（UI/动画用，默认等于 scaledDt）
   */
  _updateTree(scaledDt: number, rawDt?: number): void {
    if (!this.active) return

    const effectiveDt = this.updateMode === "unscaled" ? (rawDt ?? scaledDt) : scaledDt

    // 更新本节点的 tween
    this._updateTweens(effectiveDt)

    // 更新自身逻辑
    this.update(effectiveDt)

    // 递归更新子节点（透传双 dt，由子节点自己决定用哪个）
    for (let i = 0; i < this.children.length; i++) {
      this.children[i]._updateTree(scaledDt, rawDt)
    }
  }

  /** 递归同步到 PixiJS（引擎内部调用） */
  _syncTree(): void {
    if (!this.visible) {
      this._pixiObj.visible = false
      return
    }

    this._syncTransform()
    this._syncPixi()

    for (let i = 0; i < this.children.length; i++) {
      this.children[i]._syncTree()
    }
  }

  /** 同步变换属性到 PixiJS 对象 */
  _syncTransform(): void {
    const p = this._pixiObj
    p.position.set(this.x, this.y)
    p.scale.set(this.scaleX, this.scaleY)
    p.rotation = (this.rotation * Math.PI) / 180
    p.alpha = this.alpha
    p.visible = this.visible
    p.pivot.set(this.anchorX * this.width, this.anchorY * this.height)
    p.zIndex = this.layer
  }

  /** 更新节点上的补间动画 */
  private _updateTweens(dt: number): void {
    if (this._tweens.length === 0) return

    for (let i = this._tweens.length - 1; i >= 0; i--) {
      const t = this._tweens[i]
      if (t.dead) {
        this._tweens.splice(i, 1)
        continue
      }

      let remaining = dt
      if (t.delay > 0) {
        t.delay -= remaining
        if (t.delay > 0) continue
        remaining = -t.delay
        t.delay = 0
      }

      t.elapsed += remaining
      const raw = t.duration > 0 ? Math.min(t.elapsed / t.duration, 1) : 1
      const eased = t.easing(raw)

      for (const key of Object.keys(t.endValues)) {
        const from = t.startValues[key]
        const to = t.endValues[key]
        ;(this as any)[key] = from + (to - from) * eased
      }

      t.onUpdate?.(eased)

      if (raw >= 1) {
        t.onComplete?.()
        t.dead = true
      }
    }
  }

  /** 递归收集可交互节点（从叶到根，支持事件冒泡） */
  _collectInteractiveAt(worldX: number, worldY: number, result: Node[]): void {
    // 先检查子节点（从后往前，上层优先）
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i]._collectInteractiveAt(worldX, worldY, result)
    }
    // 再检查自身
    if (this.hitTest(worldX, worldY)) {
      result.push(this)
    }
  }

  /** 销毁节点 */
  destroy(): void {
    if (this._destroyed) return
    this._destroyed = true

    // 递归销毁子节点
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].destroy()
    }
    this.children.length = 0

    this.onDestroy()
    this.removeFromParent()
    this.removeAllListeners()
    this._tweens.length = 0

    const pixiObj = this._pixiObj
    deferGpuDestroy(() => pixiObj.destroy({ children: true }))
  }

  get destroyed(): boolean {
    return this._destroyed
  }
}
