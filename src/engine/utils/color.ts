// ─── CSS 颜色解析工具 ────────────────────────────────────────────

export interface ParsedColor {
  /** RGB 颜色值 (0x000000 ~ 0xffffff) */
  color: number
  /** 透明度 (0 ~ 1) */
  alpha: number
}

const CSS_NAMED_COLORS: Record<string, number> = {
  black: 0x000000,
  white: 0xffffff,
  red: 0xff0000,
  green: 0x008000,
  blue: 0x0000ff,
  yellow: 0xffff00,
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  orange: 0xffa500,
  purple: 0x800080,
  pink: 0xffc0cb,
  gray: 0x808080,
  grey: 0x808080,
  transparent: 0x000000,
}

const TRANSPARENT_ALPHA: Record<string, number> = {
  transparent: 0,
}

/**
 * 解析 CSS 颜色字符串为 PixiJS 可用的 {color, alpha}
 *
 * 支持格式：
 * - `#rgb` / `#rrggbb` / `#rrggbbaa`
 * - `rgb(r, g, b)` / `rgba(r, g, b, a)`
 * - CSS 颜色名称（black, white, red 等常用色）
 */
export function parseCssColor(input: string): ParsedColor {
  const s = input.trim().toLowerCase()

  // #hex
  if (s.charCodeAt(0) === 0x23) {
    return parseHex(s)
  }

  // rgba(...)
  if (s.startsWith("rgba(")) {
    return parseRgba(s)
  }

  // rgb(...)
  if (s.startsWith("rgb(")) {
    return parseRgb(s)
  }

  // named color
  if (s in CSS_NAMED_COLORS) {
    return { color: CSS_NAMED_COLORS[s], alpha: TRANSPARENT_ALPHA[s] ?? 1 }
  }

  // fallback: white
  return { color: 0xffffff, alpha: 1 }
}

/** 仅提取 RGB 数值（不含 alpha），用于 tint 等只需颜色的场景 */
export function cssColorToNumber(input: string): number {
  return parseCssColor(input).color
}

// ── 内部解析 ──────────────────────────────────────────────────────

function parseHex(s: string): ParsedColor {
  const hex = s.slice(1)
  const len = hex.length

  if (len === 6 && /^[0-9a-f]{6}$/.test(hex)) {
    return { color: Number.parseInt(hex, 16), alpha: 1 }
  }

  if (len === 3 && /^[0-9a-f]{3}$/.test(hex)) {
    const expanded = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    return { color: Number.parseInt(expanded, 16), alpha: 1 }
  }

  if (len === 8 && /^[0-9a-f]{8}$/.test(hex)) {
    const color = Number.parseInt(hex.slice(0, 6), 16)
    const alpha = Number.parseInt(hex.slice(6, 8), 16) / 255
    return { color, alpha }
  }

  if (len === 4 && /^[0-9a-f]{4}$/.test(hex)) {
    const expanded = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
    const alphaHex = hex[3] + hex[3]
    return { color: Number.parseInt(expanded, 16), alpha: Number.parseInt(alphaHex, 16) / 255 }
  }

  return { color: 0xffffff, alpha: 1 }
}

function parseRgb(s: string): ParsedColor {
  const m = s.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)
  if (!m) return { color: 0xffffff, alpha: 1 }

  const r = clamp255(Number.parseInt(m[1], 10))
  const g = clamp255(Number.parseInt(m[2], 10))
  const b = clamp255(Number.parseInt(m[3], 10))
  return { color: (r << 16) | (g << 8) | b, alpha: 1 }
}

function parseRgba(s: string): ParsedColor {
  const m = s.match(/^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*([0-9.]+)\s*\)$/)
  if (!m) return { color: 0xffffff, alpha: 1 }

  const r = clamp255(Number.parseInt(m[1], 10))
  const g = clamp255(Number.parseInt(m[2], 10))
  const b = clamp255(Number.parseInt(m[3], 10))
  const a = Math.max(0, Math.min(1, Number.parseFloat(m[4])))
  return { color: (r << 16) | (g << 8) | b, alpha: a }
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v
}
