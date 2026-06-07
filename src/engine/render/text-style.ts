// ─── PixiJS TextStyle 构建工具（Text 和 Label 共用） ─────────────

import { TextStyle as PixiTextStyle } from "pixi.js"

export interface TextStyleOptions {
  fontSize?: number
  fontFamily?: string
  color?: string
  align?: CanvasTextAlign
  bold?: boolean
  italic?: boolean
  lineHeight?: number
  maxWidth?: number
  shadow?: {
    color?: string
    offsetX?: number
    offsetY?: number
    blur?: number
  }
  stroke?: {
    color?: string
    width?: number
  }
  letterSpacing?: number
}

/** 将引擎 TextStyleOptions 转换为 PixiJS TextStyle */
export function buildPixiTextStyle(style: TextStyleOptions): PixiTextStyle {
  const {
    fontSize = 24,
    fontFamily = "sans-serif",
    color = "#ffffff",
    align = "left",
    bold = false,
    italic = false,
    lineHeight,
    maxWidth,
    shadow,
    stroke,
    letterSpacing,
  } = style

  const pixiAlign: "left" | "center" | "right" =
    align === "center" ? "center" : align === "right" || align === "end" ? "right" : "left"

  return new PixiTextStyle({
    fontSize,
    fontFamily,
    fill: color,
    fontWeight: bold ? "bold" : "normal",
    fontStyle: italic ? "italic" : "normal",
    align: pixiAlign,
    lineHeight: lineHeight ?? fontSize * 1.2,
    letterSpacing: letterSpacing ?? 0,
    wordWrap: Boolean(maxWidth && maxWidth > 0),
    wordWrapWidth: maxWidth && maxWidth > 0 ? maxWidth : 0,
    stroke: stroke
      ? {
          color: stroke.color ?? "#000",
          width: stroke.width ?? 2,
        }
      : undefined,
    dropShadow: shadow
      ? {
          color: shadow.color ?? "rgba(0,0,0,0.5)",
          blur: shadow.blur ?? 0,
          distance: Math.hypot(shadow.offsetX ?? 2, shadow.offsetY ?? 2),
          angle: Math.atan2(shadow.offsetY ?? 2, shadow.offsetX ?? 2),
        }
      : undefined,
  })
}
