/**
 * 3D 相机控制器
 * 封装 Three.js 相机操作：position / lookAt / orbit / follow3D
 */

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Camera3DConfig {
  /** 视场角（度，默认 60） */
  fov?: number
  /** 宽高比 */
  aspect: number
  /** 近裁剪面（默认 0.1） */
  near?: number
  /** 远裁剪面（默认 1000） */
  far?: number
  /** 初始位置 */
  position?: Vec3
  /** 初始朝向 */
  lookAt?: Vec3
}

export interface OrbitConfig {
  /** 是否启用旋转 */
  enableRotation?: boolean
  /** 旋转速度 */
  rotationSpeed?: number
  /** 是否启用缩放 */
  enableZoom?: boolean
  /** 最小距离 */
  minDistance?: number
  /** 最大距离 */
  maxDistance?: number
  /** 最小极角（弧度） */
  minPolarAngle?: number
  /** 最大极角（弧度） */
  maxPolarAngle?: number
  /** 是否自动旋转 */
  autoRotate?: boolean
  /** 自动旋转速度（弧度/秒） */
  autoRotateSpeed?: number
  /** 阻尼系数（0 = 无阻尼） */
  damping?: number
}

export interface Camera3DFollow {
  /** 跟随目标 */
  target: Vec3
  /** 与目标的偏移 */
  offset: Vec3
  /** 插值速度 */
  lerp: number
}

export interface Camera3DState {
  position: Vec3
  lookAt: Vec3
  fov: number
  aspect: number
  near: number
  far: number
  orbit: OrbitConfig | null
  follow: Camera3DFollow | null
}

/** 创建 3D 相机状态（不直接依赖 Three.js，由 webgl-renderer 桥接） */
export function createCamera3DState(config: Camera3DConfig): Camera3DState {
  return {
    position: config.position ?? { x: 0, y: 5, z: 10 },
    lookAt: config.lookAt ?? { x: 0, y: 0, z: 0 },
    fov: config.fov ?? 60,
    aspect: config.aspect,
    near: config.near ?? 0.1,
    far: config.far ?? 1000,
    orbit: null,
    follow: null,
  }
}

/** 启用轨道控制 */
export function enableOrbit(state: Camera3DState, config: OrbitConfig = {}): void {
  state.orbit = {
    enableRotation: config.enableRotation ?? true,
    rotationSpeed: config.rotationSpeed ?? 1,
    enableZoom: config.enableZoom ?? true,
    minDistance: config.minDistance ?? 1,
    maxDistance: config.maxDistance ?? 100,
    minPolarAngle: config.minPolarAngle ?? 0,
    maxPolarAngle: config.maxPolarAngle ?? Math.PI,
    autoRotate: config.autoRotate ?? false,
    autoRotateSpeed: config.autoRotateSpeed ?? Math.PI / 30,
    damping: config.damping ?? 0.05,
  }
}

/** 设置 3D 跟随 */
export function follow3D(state: Camera3DState, target: Vec3, offset?: Vec3, lerp?: number): void {
  state.follow = {
    target,
    offset: offset ?? { x: 0, y: 5, z: 10 },
    lerp: lerp ?? 0.1,
  }
}

/** 更新 3D 相机状态（轨道控制/跟随） */
export function updateCamera3D(state: Camera3DState, dt: number): void {
  // 跟随逻辑
  if (state.follow) {
    const { target, offset, lerp: lerpFactor } = state.follow
    const goalX = target.x + offset.x
    const goalY = target.y + offset.y
    const goalZ = target.z + offset.z

    state.position.x += (goalX - state.position.x) * lerpFactor
    state.position.y += (goalY - state.position.y) * lerpFactor
    state.position.z += (goalZ - state.position.z) * lerpFactor

    state.lookAt.x += (target.x - state.lookAt.x) * lerpFactor
    state.lookAt.y += (target.y - state.lookAt.y) * lerpFactor
    state.lookAt.z += (target.z - state.lookAt.z) * lerpFactor
  }

  // 自动旋转（轨道控制）
  if (state.orbit?.autoRotate) {
    const speed = state.orbit.autoRotateSpeed ?? Math.PI / 30
    const dx = state.position.x - state.lookAt.x
    const dz = state.position.z - state.lookAt.z
    const dist = Math.sqrt(dx * dx + dz * dz)
    const angle = Math.atan2(dz, dx) + speed * dt
    state.position.x = state.lookAt.x + Math.cos(angle) * dist
    state.position.z = state.lookAt.z + Math.sin(angle) * dist
  }
}
