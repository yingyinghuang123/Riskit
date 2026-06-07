// ─── 碰撞形状 ─────────────────────────────────────────────────────

export type ShapeType = 'rect' | 'circle'

export interface RectShape {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

export interface CircleShape {
  type: 'circle'
  x: number
  y: number
  radius: number
}

export type Shape = RectShape | CircleShape

export function createRectShape(x: number, y: number, w: number, h: number): RectShape {
  return { type: 'rect', x, y, width: w, height: h }
}

export function createCircleShape(x: number, y: number, r: number): CircleShape {
  return { type: 'circle', x, y, radius: r }
}
