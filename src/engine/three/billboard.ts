import { Sprite, SpriteMaterial, CanvasTexture, LinearFilter, Vector3 } from "three"
import { getPlatform } from "../platform/platform"

/**
 * Create a billboard sprite in 3D space that always faces the camera.
 * Uses THREE.Sprite + CanvasTexture for dynamic content (health bars, labels).
 *
 * WeChat mini-game compatible: no DOM, uses wx.createCanvas() for texture.
 */

export interface BillboardOptions {
  width: number
  height: number
  canvasWidth?: number
  canvasHeight?: number
}

export interface Billboard {
  sprite: any
  canvas: any
  ctx: any
  /** Call after drawing to canvas to upload to GPU */
  update(): void
  /** Remove from scene and dispose */
  dispose(): void
}

export function createBillboard(options: BillboardOptions): Billboard {
  const canvasWidth = options.canvasWidth ?? 256
  const canvasHeight = options.canvasHeight ?? 64

  const canvas = getPlatform().createCanvas()
  canvas.width = canvasWidth
  canvas.height = canvasHeight

  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("[billboard] Failed to get 2D context")
  }

  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter

  const material = new SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  })

  const sprite = new Sprite(material)
  sprite.scale.set(options.width, options.height, 1)

  return {
    sprite,
    canvas,
    ctx,
    update() {
      texture.needsUpdate = true
    },
    dispose() {
      material.dispose()
      texture.dispose()
    },
  }
}

/**
 * Convert 2D screen coordinates (pixels) to 3D world position at a given depth.
 * Useful for positioning billboards to track 2D game objects.
 */
export function screenToWorld(
  camera: any,
  screenX: number,
  screenY: number,
  screenWidth: number,
  screenHeight: number,
  targetZ = 0,
): { x: number; y: number; z: number } {
  const ndc = new Vector3((screenX / screenWidth) * 2 - 1, -(screenY / screenHeight) * 2 + 1, 0.5)
  ndc.unproject(camera)

  const dir = ndc.sub(camera.position).normalize()
  const dist = (targetZ - camera.position.z) / dir.z
  const pos = camera.position.clone().add(dir.multiplyScalar(dist))
  return { x: pos.x, y: pos.y, z: pos.z }
}
