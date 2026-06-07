// ─── 物理体（Planck.js 后端） ─────────────────────────────────────

import { Vec2 } from '../utils/math'
import type { Node } from '../nodes/node'
import type { Shape, ShapeType } from './shapes'
import type { Body as PlanckBody, Fixture as PlanckFixture } from 'planck'

/** 像素/米换算常量 */
export const PPM = 30

export type BodyType = 'dynamic' | 'static' | 'kinematic'

export class PhysicsBody {
  node: Node
  type: BodyType = 'dynamic'

  /** 最大速度（像素/秒） */
  maxVelocity = 1000

  /** 碰撞形状类型 */
  shape: Shape | null = null
  shapeType: ShapeType = 'rect'

  /** 碰撞分组 */
  group = 0

  /** 碰撞回调 */
  private _collideHandlers: Array<{ target: Node | string | null; callback: (other: Node) => void }> = []

  /** 是否存活 */
  active = true

  /** Planck.js 内部引用 */
  _planckBody: PlanckBody | null = null
  _planckFixture: PlanckFixture | null = null

  constructor(node: Node) {
    this.node = node
  }

  // ── 速度（像素/秒 ↔ Planck m/s） ───────────────────────────────

  get velocity(): Vec2 {
    if (!this._planckBody) return new Vec2()
    const v = this._planckBody.getLinearVelocity()
    return new Vec2(v.x * PPM, v.y * PPM)
  }

  set velocity(v: { x: number; y: number }) {
    if (!this._planckBody) return
    this._planckBody.setLinearVelocity({ x: v.x / PPM, y: v.y / PPM })
  }

  // ── 弹力 ────────────────────────────────────────────────────────

  get bounce(): number {
    return this._planckFixture?.getRestitution() ?? 0
  }

  set bounce(val: number) {
    this._planckFixture?.setRestitution(val)
  }

  // ── 摩擦力 ──────────────────────────────────────────────────────

  get friction(): number {
    return this._planckFixture?.getFriction() ?? 0
  }

  set friction(val: number) {
    this._planckFixture?.setFriction(val)
  }

  // ── 重力倍率 ────────────────────────────────────────────────────

  get gravityScale(): number {
    return this._planckBody?.getGravityScale() ?? 1
  }

  set gravityScale(val: number) {
    this._planckBody?.setGravityScale(val)
  }

  // ── 触发器 ──────────────────────────────────────────────────────

  get isTrigger(): boolean {
    return this._planckFixture?.isSensor() ?? false
  }

  set isTrigger(val: boolean) {
    this._planckFixture?.setSensor(val)
  }

  // ── 链式配置 ────────────────────────────────────────────────────

  setType(type: BodyType): this {
    this.type = type
    if (this._planckBody) {
      this._planckBody.setType(type)
    }
    return this
  }

  setGravity(scale: number): this {
    this.gravityScale = scale
    return this
  }

  setBounce(bounce: number): this {
    this.bounce = bounce
    return this
  }

  setFriction(friction: number): this {
    this.friction = friction
    return this
  }

  setGroup(group: number): this {
    this.group = group
    return this
  }

  setTrigger(trigger = true): this {
    this.isTrigger = trigger
    return this
  }

  /** 注册碰撞回调 */
  onCollide(target: Node | string | null, callback: (other: Node) => void): this {
    this._collideHandlers.push({ target, callback })
    return this
  }

  /** 触发碰撞回调 */
  _fireCollide(other: Node): void {
    for (const h of this._collideHandlers) {
      if (h.target === null ||
          h.target === other ||
          (typeof h.target === 'string' && other.tag === h.target)) {
        h.callback(other)
      }
    }
  }

  /** 根据节点尺寸自动生成碰撞形状（用于外部查询） */
  autoShape(): Shape {
    const bounds = this.node.getBounds()
    if (this.shapeType === 'circle') {
      const r = Math.max(bounds.width, bounds.height) / 2
      return {
        type: 'circle',
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
        radius: r,
      }
    }
    return {
      type: 'rect',
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    }
  }

  /** 获取当前碰撞形状 */
  getShape(): Shape {
    if (this.shape) return this.shape
    return this.autoShape()
  }

  destroy(): void {
    this.active = false
    this._collideHandlers.length = 0
    // Planck body 的销毁由 PhysicsWorld 处理
    this._planckBody = null
    this._planckFixture = null
  }
}
