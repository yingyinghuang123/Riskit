// ─── 碰撞检测 ─────────────────────────────────────────────────────

import type { Shape, RectShape, CircleShape } from './shapes'

export interface CollisionResult {
  hit: boolean
  overlapX: number
  overlapY: number
  normalX: number
  normalY: number
}

const NO_HIT: CollisionResult = { hit: false, overlapX: 0, overlapY: 0, normalX: 0, normalY: 0 }

/** 检测两个形状是否碰撞 */
export function testShapes(a: Shape, b: Shape): CollisionResult {
  if (a.type === 'rect' && b.type === 'rect') return rectVsRect(a, b)
  if (a.type === 'circle' && b.type === 'circle') return circleVsCircle(a, b)
  if (a.type === 'rect' && b.type === 'circle') return rectVsCircle(a, b)
  if (a.type === 'circle' && b.type === 'rect') {
    const r = rectVsCircle(b, a)
    return r.hit ? { ...r, normalX: -r.normalX, normalY: -r.normalY, overlapX: -r.overlapX, overlapY: -r.overlapY } : NO_HIT
  }
  return NO_HIT
}

function rectVsRect(a: RectShape, b: RectShape): CollisionResult {
  const dx = (b.x + b.width / 2) - (a.x + a.width / 2)
  const dy = (b.y + b.height / 2) - (a.y + a.height / 2)
  const overlapX = (a.width + b.width) / 2 - Math.abs(dx)
  const overlapY = (a.height + b.height) / 2 - Math.abs(dy)

  if (overlapX <= 0 || overlapY <= 0) return NO_HIT

  if (overlapX < overlapY) {
    const sx = dx > 0 ? 1 : -1
    return { hit: true, overlapX: overlapX * sx, overlapY: 0, normalX: sx, normalY: 0 }
  } else {
    const sy = dy > 0 ? 1 : -1
    return { hit: true, overlapX: 0, overlapY: overlapY * sy, normalX: 0, normalY: sy }
  }
}

function circleVsCircle(a: CircleShape, b: CircleShape): CollisionResult {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distSq = dx * dx + dy * dy
  const radSum = a.radius + b.radius

  if (distSq >= radSum * radSum) return NO_HIT

  const dist = Math.sqrt(distSq) || 0.001
  const overlap = radSum - dist
  const nx = dx / dist
  const ny = dy / dist

  return { hit: true, overlapX: overlap * nx, overlapY: overlap * ny, normalX: nx, normalY: ny }
}

function rectVsCircle(rect: RectShape, circle: CircleShape): CollisionResult {
  const cx = circle.x
  const cy = circle.y
  const r = circle.radius

  // 矩形中心
  const rx = rect.x + rect.width / 2
  const ry = rect.y + rect.height / 2
  const hw = rect.width / 2
  const hh = rect.height / 2

  // 找最近点
  const closestX = Math.max(rx - hw, Math.min(cx, rx + hw))
  const closestY = Math.max(ry - hh, Math.min(cy, ry + hh))

  const dx = cx - closestX
  const dy = cy - closestY
  const distSq = dx * dx + dy * dy

  if (distSq >= r * r) return NO_HIT

  const dist = Math.sqrt(distSq) || 0.001
  const overlap = r - dist
  const nx = dx / dist
  const ny = dy / dist

  return { hit: true, overlapX: overlap * nx, overlapY: overlap * ny, normalX: nx, normalY: ny }
}

/** AABB 快速检测 */
export function aabbOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}
