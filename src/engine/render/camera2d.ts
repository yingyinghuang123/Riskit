/**
 * 2D 相机系统
 * follow / bounds / shake / zoom / flash + 世界坐标转换 + 视口裁剪
 */

import { clamp, lerp } from "../utils/math"

export interface Camera2DConfig {
  /** 视口宽度（逻辑像素） */
  viewportWidth: number
  /** 视口高度（逻辑像素） */
  viewportHeight: number
}

export interface Camera2DBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Camera2DFollowOptions {
  /** 插值系数 0~1，越大越紧跟 (默认 0.1) */
  lerp?: number
  /** 目标点的偏移 X */
  offsetX?: number
  /** 目标点的偏移 Y */
  offsetY?: number
  /** 死区宽度（目标在此范围内不移动相机） */
  deadZoneWidth?: number
  /** 死区高度 */
  deadZoneHeight?: number
}

export interface Camera2D {
  /** 相机中心 X（世界坐标） */
  x: number
  /** 相机中心 Y（世界坐标） */
  y: number
  /** 缩放比例 */
  zoom: number
  /** 旋转角度（弧度） */
  rotation: number

  /** 跟随目标 */
  follow(target: { x: number; y: number }, options?: Camera2DFollowOptions): void
  /** 设置世界边界 */
  setBounds(bounds: Camera2DBounds | null): void
  /** 相机震动 */
  shake(intensity: number, duration: number): void
  /** 缩放到目标值 */
  zoomTo(scale: number, duration: number): void
  /** 闪白 */
  flash(color: string, duration: number): void
  /** 每帧更新 */
  update(dt: number): void

  /** 世界坐标 → 屏幕坐标 */
  worldToScreen(wx: number, wy: number): { x: number; y: number }
  /** 屏幕坐标 → 世界坐标 */
  screenToWorld(sx: number, sy: number): { x: number; y: number }

  /** 判断矩形是否在视口内（世界坐标） */
  isVisible(x: number, y: number, w: number, h: number): boolean

  /** 获取当前视口的世界坐标范围 */
  getViewBounds(): { left: number; top: number; right: number; bottom: number }

  /** 闪白状态（供渲染器检查） */
  readonly flashAlpha: number
  readonly flashColor: string

  /** 震动偏移（供渲染器使用） */
  readonly shakeOffsetX: number
  readonly shakeOffsetY: number
}

export function createCamera2D(config: Camera2DConfig): Camera2D {
  const { viewportWidth, viewportHeight } = config

  let targetRef: { x: number; y: number } | null = null
  let followOpts: Camera2DFollowOptions = {}
  let bounds: Camera2DBounds | null = null

  // 震动
  let shakeIntensity = 0
  let shakeRemaining = 0
  let shakeOX = 0
  let shakeOY = 0

  // 缩放动画
  let zoomFrom = 1
  let zoomTarget = 1
  let zoomDuration = 0
  let zoomElapsed = 0

  // 闪白
  let _flashColor = "#ffffff"
  let _flashAlpha = 0
  let flashDuration = 0
  let flashRemaining = 0

  const cam: Camera2D = {
    x: viewportWidth / 2,
    y: viewportHeight / 2,
    zoom: 1,
    rotation: 0,

    get flashAlpha() { return _flashAlpha },
    get flashColor() { return _flashColor },
    get shakeOffsetX() { return shakeOX },
    get shakeOffsetY() { return shakeOY },

    follow(target, options = {}) {
      targetRef = target
      followOpts = options
    },

    setBounds(b) {
      bounds = b
    },

    shake(intensity, duration) {
      shakeIntensity = intensity
      shakeRemaining = duration
    },

    zoomTo(scale, duration) {
      zoomFrom = cam.zoom
      zoomTarget = scale
      zoomDuration = duration
      zoomElapsed = 0
    },

    flash(color, duration) {
      _flashColor = color
      _flashAlpha = 1
      flashDuration = duration
      flashRemaining = duration
    },

    update(dt) {
      // 跟随
      if (targetRef) {
        const lerpFactor = followOpts.lerp ?? 0.1
        const offX = followOpts.offsetX ?? 0
        const offY = followOpts.offsetY ?? 0
        const tx = targetRef.x + offX
        const ty = targetRef.y + offY

        const dzW = followOpts.deadZoneWidth ?? 0
        const dzH = followOpts.deadZoneHeight ?? 0

        if (dzW > 0 || dzH > 0) {
          const diffX = tx - cam.x
          const diffY = ty - cam.y
          if (Math.abs(diffX) > dzW / 2) {
            cam.x = lerp(cam.x, tx - Math.sign(diffX) * dzW / 2, lerpFactor)
          }
          if (Math.abs(diffY) > dzH / 2) {
            cam.y = lerp(cam.y, ty - Math.sign(diffY) * dzH / 2, lerpFactor)
          }
        } else {
          cam.x = lerp(cam.x, tx, lerpFactor)
          cam.y = lerp(cam.y, ty, lerpFactor)
        }
      }

      // 边界约束
      if (bounds) {
        const halfW = (viewportWidth / cam.zoom) / 2
        const halfH = (viewportHeight / cam.zoom) / 2
        cam.x = clamp(cam.x, bounds.minX + halfW, bounds.maxX - halfW)
        cam.y = clamp(cam.y, bounds.minY + halfH, bounds.maxY - halfH)
      }

      // 缩放动画
      if (zoomDuration > 0 && zoomElapsed < zoomDuration) {
        zoomElapsed += dt
        const t = clamp(zoomElapsed / zoomDuration, 0, 1)
        // ease out quad
        const eased = t * (2 - t)
        cam.zoom = zoomFrom + (zoomTarget - zoomFrom) * eased
        if (zoomElapsed >= zoomDuration) {
          cam.zoom = zoomTarget
          zoomDuration = 0
        }
      }

      // 震动
      if (shakeRemaining > 0) {
        shakeRemaining -= dt
        const t = shakeRemaining > 0 ? shakeIntensity : 0
        shakeOX = (Math.random() * 2 - 1) * t
        shakeOY = (Math.random() * 2 - 1) * t
      } else {
        shakeOX = 0
        shakeOY = 0
      }

      // 闪白
      if (flashRemaining > 0) {
        flashRemaining -= dt
        _flashAlpha = flashDuration > 0 ? Math.max(0, flashRemaining / flashDuration) : 0
      }
    },

    worldToScreen(wx, wy) {
      return {
        x: (wx - cam.x) * cam.zoom + viewportWidth / 2 + shakeOX,
        y: (wy - cam.y) * cam.zoom + viewportHeight / 2 + shakeOY,
      }
    },

    screenToWorld(sx, sy) {
      return {
        x: (sx - viewportWidth / 2 - shakeOX) / cam.zoom + cam.x,
        y: (sy - viewportHeight / 2 - shakeOY) / cam.zoom + cam.y,
      }
    },

    isVisible(x, y, w, h) {
      const vb = cam.getViewBounds()
      return x + w > vb.left && x < vb.right && y + h > vb.top && y < vb.bottom
    },

    getViewBounds() {
      const halfW = (viewportWidth / cam.zoom) / 2
      const halfH = (viewportHeight / cam.zoom) / 2
      return {
        left: cam.x - halfW + shakeOX / cam.zoom,
        top: cam.y - halfH + shakeOY / cam.zoom,
        right: cam.x + halfW + shakeOX / cam.zoom,
        bottom: cam.y + halfH + shakeOY / cam.zoom,
      }
    },
  }

  return cam
}
