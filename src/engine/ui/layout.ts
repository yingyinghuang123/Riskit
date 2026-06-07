// ─── Layout 布局系统 ────────────────────────────────────────────

import { Node } from '../nodes/node'

export interface LayoutOptions {
  spacing?: number
  align?: 'start' | 'center' | 'end'
  padding?: number
}

export interface GridOptions extends LayoutOptions {
  cols?: number
  cellWidth?: number
  cellHeight?: number
}

/** 垂直布局 */
export function vbox(x: number, y: number, options: LayoutOptions, children: Node[]): Node {
  const container = new Node()
  container.x = x
  container.y = y

  const { spacing = 10, align = 'center', padding = 0 } = options
  let offsetY = padding

  // 先计算最大宽度
  let maxW = 0
  for (const child of children) {
    if (child.width > maxW) maxW = child.width
  }

  for (const child of children) {
    child.y = offsetY

    if (align === 'center') {
      child.x = padding + (maxW - child.width) / 2
    } else if (align === 'end') {
      child.x = padding + maxW - child.width
    } else {
      child.x = padding
    }

    container.addChild(child)
    offsetY += child.height + spacing
  }

  container.width = maxW + padding * 2
  container.height = offsetY - spacing + padding
  return container
}

/** 水平布局 */
export function hbox(x: number, y: number, options: LayoutOptions, children: Node[]): Node {
  const container = new Node()
  container.x = x
  container.y = y

  const { spacing = 10, align = 'center', padding = 0 } = options
  let offsetX = padding

  // 先计算最大高度
  let maxH = 0
  for (const child of children) {
    if (child.height > maxH) maxH = child.height
  }

  for (const child of children) {
    child.x = offsetX

    if (align === 'center') {
      child.y = padding + (maxH - child.height) / 2
    } else if (align === 'end') {
      child.y = padding + maxH - child.height
    } else {
      child.y = padding
    }

    container.addChild(child)
    offsetX += child.width + spacing
  }

  container.width = offsetX - spacing + padding
  container.height = maxH + padding * 2
  return container
}

/** 网格布局 */
export function grid(x: number, y: number, options: GridOptions, children: Node[]): Node {
  const container = new Node()
  container.x = x
  container.y = y

  const { cols = 3, spacing = 10, padding = 0, cellWidth, cellHeight } = options

  let cw = cellWidth ?? 0
  let ch = cellHeight ?? 0

  // 自动计算 cell 尺寸
  if (!cw || !ch) {
    for (const child of children) {
      if (child.width > cw) cw = child.width
      if (child.height > ch) ch = child.height
    }
  }

  for (let i = 0; i < children.length; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    const child = children[i]
    child.x = padding + col * (cw + spacing)
    child.y = padding + row * (ch + spacing)
    container.addChild(child)
  }

  const rows = Math.ceil(children.length / cols)
  container.width = padding * 2 + cols * cw + (cols - 1) * spacing
  container.height = padding * 2 + rows * ch + (rows - 1) * spacing
  return container
}
