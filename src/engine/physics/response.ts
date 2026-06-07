// ─── 碰撞响应 ─────────────────────────────────────────────────────

import type { PhysicsBody } from './body'
import type { CollisionResult } from './collision'

/** 分离两个物理体 */
export function separateBodies(a: PhysicsBody, b: PhysicsBody, result: CollisionResult): void {
  if (a.isTrigger || b.isTrigger) return

  const aStatic = a.type === 'static'
  const bStatic = b.type === 'static'

  if (aStatic && bStatic) return

  if (aStatic) {
    b.node.x += result.overlapX
    b.node.y += result.overlapY
  } else if (bStatic) {
    a.node.x -= result.overlapX
    a.node.y -= result.overlapY
  } else {
    a.node.x -= result.overlapX * 0.5
    a.node.y -= result.overlapY * 0.5
    b.node.x += result.overlapX * 0.5
    b.node.y += result.overlapY * 0.5
  }

  // 速度响应
  applyBounce(a, b, result)
}

function applyBounce(a: PhysicsBody, b: PhysicsBody, result: CollisionResult): void {
  const nx = result.normalX
  const ny = result.normalY
  const bounce = Math.max(a.bounce, b.bounce)

  if (a.type === 'dynamic') {
    const dot = a.velocity.x * nx + a.velocity.y * ny
    if (dot < 0) {
      a.velocity.x -= (1 + bounce) * dot * nx
      a.velocity.y -= (1 + bounce) * dot * ny
    }
  }

  if (b.type === 'dynamic') {
    const dot = b.velocity.x * nx + b.velocity.y * ny
    if (dot > 0) {
      b.velocity.x -= (1 + bounce) * dot * nx
      b.velocity.y -= (1 + bounce) * dot * ny
    }
  }

  // 摩擦
  const friction = Math.max(a.friction, b.friction)
  if (friction > 0) {
    const tx = -ny
    const ty = nx
    if (a.type === 'dynamic') {
      const tangentDot = a.velocity.x * tx + a.velocity.y * ty
      a.velocity.x -= friction * tangentDot * tx
      a.velocity.y -= friction * tangentDot * ty
    }
    if (b.type === 'dynamic') {
      const tangentDot = b.velocity.x * tx + b.velocity.y * ty
      b.velocity.x -= friction * tangentDot * tx
      b.velocity.y -= friction * tangentDot * ty
    }
  }
}
