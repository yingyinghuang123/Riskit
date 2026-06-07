// ─── 物理世界（Planck.js 后端） — scene.physics 入口 ─────────────

import * as planck from "planck"
import { Vec2 } from "../utils/math"
import { Node } from "../nodes/node"
import { PhysicsBody, PPM, type BodyType } from "./body"
import { testShapes } from "./collision"
import type { ShapeType } from "./shapes"

export { PPM } from "./body"

interface OverlapPair {
  a: Node | string
  b: Node | string
  callback: (nodeA: Node, nodeB: Node) => void
}

interface IgnorePair {
  a: number
  b: number
}

// Planck body → PhysicsBody 的映射（存储在 userData 中）
function getPhysicsBody(planckBody: planck.Body): PhysicsBody | null {
  return planckBody.getUserData() as PhysicsBody | null
}

export class PhysicsWorld {
  private _world: planck.World
  private _bodies: PhysicsBody[] = []
  private _overlaps: OverlapPair[] = []
  private _ignores: IgnorePair[] = []
  private _gravityPixels = new Vec2(0, 800)

  constructor() {
    // 默认重力 800 px/s² → 换算为 m/s²
    this._world = new planck.World({
      gravity: { x: 0, y: this._gravityPixels.y / PPM },
    })

    // 注册碰撞事件
    this._world.on("begin-contact", (contact: planck.Contact) => {
      this._handleContact(contact)
    })
  }

  /** 全局重力（像素/秒²） */
  get gravity(): Vec2 {
    return this._gravityPixels
  }

  set gravity(v: { x: number; y: number }) {
    this._gravityPixels.x = v.x
    this._gravityPixels.y = v.y
    this._world.setGravity({ x: v.x / PPM, y: v.y / PPM })
  }

  /** 为节点添加物理体 */
  addBody(node: Node, type: BodyType = "dynamic", shapeType: ShapeType = "rect"): PhysicsBody {
    // 检查是否已有
    const existing = this._bodies.find((b) => b.node === node)
    if (existing) {
      existing.setType(type)
      existing.shapeType = shapeType
      this._recreateFixture(existing)
      return existing
    }

    const body = new PhysicsBody(node)
    body.type = type
    body.shapeType = shapeType

    // 创建 Planck body
    const bounds = node.getBounds()
    let cx: number, cy: number

    if (node.anchorX === 0.5 && node.anchorY === 0.5) {
      cx = node.x
      cy = node.y
    } else {
      cx = bounds.x + bounds.width / 2
      cy = bounds.y + bounds.height / 2
    }

    const planckBody = this._world.createBody({
      type: type,
      position: { x: cx / PPM, y: cy / PPM },
      userData: body,
    })

    body._planckBody = planckBody

    // 创建 fixture
    this._createFixture(body, bounds.width, bounds.height)

    this._bodies.push(body)
    return body
  }

  /** 移除物理体 */
  removeBody(node: Node): void {
    const idx = this._bodies.findIndex((b) => b.node === node)
    if (idx !== -1) {
      const body = this._bodies[idx]
      if (body._planckBody) {
        this._world.destroyBody(body._planckBody)
      }
      body.destroy()
      this._bodies.splice(idx, 1)
    }
  }

  /** 获取节点的物理体 */
  getBody(node: Node): PhysicsBody | null {
    return this._bodies.find((b) => b.node === node) ?? null
  }

  /** 忽略两个碰撞分组 */
  ignore(groupA: number, groupB: number): void {
    this._ignores.push({ a: groupA, b: groupB })
  }

  /** 注册重叠检测回调 */
  overlap(a: Node | string, b: Node | string, callback: (nodeA: Node, nodeB: Node) => void): void {
    this._overlaps.push({ a, b, callback })
  }

  /** 射线检测 */
  raycast(x1: number, y1: number, x2: number, y2: number, group?: number): Node | null {
    let closestNode: Node | null = null
    let closestFraction = 1.0

    this._world.rayCast(
      { x: x1 / PPM, y: y1 / PPM },
      { x: x2 / PPM, y: y2 / PPM },
      (fixture: planck.Fixture, _point: planck.Vec2Value, _normal: planck.Vec2Value, fraction: number) => {
        const pb = getPhysicsBody(fixture.getBody())
        if (!pb || !pb.active) return -1
        if (group !== undefined && pb.group !== group) return -1

        if (fraction < closestFraction) {
          closestFraction = fraction
          closestNode = pb.node
        }
        return fraction // 逐步裁剪到最近
      },
    )

    return closestNode
  }

  /** 每帧物理更新 */
  update(dt: number): void {
    // 清理已销毁的节点
    for (let i = this._bodies.length - 1; i >= 0; i--) {
      if (this._bodies[i].node.destroyed) {
        const body = this._bodies[i]
        if (body._planckBody) {
          this._world.destroyBody(body._planckBody)
        }
        body.destroy()
        this._bodies.splice(i, 1)
      }
    }

    // kinematic 体：step 前将 Node 位置同步到 Planck
    for (const b of this._bodies) {
      if (!b.active || b.type !== "kinematic" || !b._planckBody) continue
      const bounds = b.node.getBounds()
      const cx = bounds.x + bounds.width / 2
      const cy = bounds.y + bounds.height / 2
      b._planckBody.setPosition({ x: cx / PPM, y: cy / PPM })
    }

    // Planck 物理步进（固定时间步长，8 速度迭代，3 位置迭代）
    this._world.step(dt, 8, 3)

    // dynamic 体：step 后将 Planck 位置同步回 Node
    for (const b of this._bodies) {
      if (!b.active || b.type !== "dynamic" || !b._planckBody) continue

      const pos = b._planckBody.getPosition()
      const bounds = b.node.getBounds()

      if (b.node.anchorX === 0.5 && b.node.anchorY === 0.5) {
        b.node.x = pos.x * PPM
        b.node.y = pos.y * PPM
      } else {
        b.node.x = pos.x * PPM - bounds.width / 2
        b.node.y = pos.y * PPM - bounds.height / 2
      }

      // 限速
      const v = b._planckBody.getLinearVelocity()
      const maxV = b.maxVelocity / PPM
      let clamped = false
      let vx = v.x,
        vy = v.y
      if (vx > maxV) {
        vx = maxV
        clamped = true
      } else if (vx < -maxV) {
        vx = -maxV
        clamped = true
      }
      if (vy > maxV) {
        vy = maxV
        clamped = true
      } else if (vy < -maxV) {
        vy = -maxV
        clamped = true
      }
      if (clamped) {
        b._planckBody.setLinearVelocity({ x: vx, y: vy })
      }
    }

    // 重叠检测（使用独立几何工具，保持兼容）
    for (const pair of this._overlaps) {
      const aBodies = this._resolveBodies(pair.a)
      const bBodies = this._resolveBodies(pair.b)

      for (const ba of aBodies) {
        for (const bb of bBodies) {
          if (ba === bb) continue
          const sa = ba.getShape()
          const sb = bb.getShape()
          const result = testShapes(sa, sb)
          if (result.hit) {
            pair.callback(ba.node, bb.node)
          }
        }
      }
    }

    this._world.clearForces()
  }

  destroy(): void {
    for (const b of this._bodies) {
      if (b._planckBody) {
        this._world.destroyBody(b._planckBody)
      }
      b.destroy()
    }
    this._bodies.length = 0
    this._overlaps.length = 0
    this._ignores.length = 0
  }

  // ── 内部方法 ────────────────────────────────────────────────────

  private _createFixture(body: PhysicsBody, width: number, height: number): void {
    if (!body._planckBody) return

    let shape: planck.Shape
    if (body.shapeType === "circle") {
      const r = Math.max(width, height) / 2
      shape = new planck.Circle(r / PPM)
    } else {
      shape = new planck.Box(width / 2 / PPM, height / 2 / PPM)
    }

    body._planckFixture = body._planckBody.createFixture({
      shape,
      density: body.type === "dynamic" ? 1.0 : 0.0,
      friction: 0.0,
      restitution: 0.0,
      isSensor: false,
    })
  }

  private _recreateFixture(body: PhysicsBody): void {
    if (!body._planckBody) return
    if (body._planckFixture) {
      body._planckBody.destroyFixture(body._planckFixture)
    }
    const bounds = body.node.getBounds()
    this._createFixture(body, bounds.width, bounds.height)
  }

  private _handleContact(contact: planck.Contact): void {
    const bodyA = getPhysicsBody(contact.getFixtureA().getBody())
    const bodyB = getPhysicsBody(contact.getFixtureB().getBody())

    if (!bodyA || !bodyB || !bodyA.active || !bodyB.active) return
    if (this._isIgnored(bodyA.group, bodyB.group)) {
      contact.setEnabled(false)
      return
    }

    bodyA._fireCollide(bodyB.node)
    bodyB._fireCollide(bodyA.node)
  }

  private _isIgnored(ga: number, gb: number): boolean {
    for (const ig of this._ignores) {
      if ((ig.a === ga && ig.b === gb) || (ig.a === gb && ig.b === ga)) return true
    }
    return false
  }

  private _resolveBodies(target: Node | string): PhysicsBody[] {
    if (typeof target === "string") {
      return this._bodies.filter((b) => b.active && b.node.tag === target)
    }
    const body = this._bodies.find((b) => b.node === target)
    return body && body.active ? [body] : []
  }
}
