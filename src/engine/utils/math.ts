// ─── 数学工具 + Vec2 ─────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function inverseLerp(a: number, b: number, value: number): number {
  return a === b ? 0 : (value - a) / (b - a)
}

export function remap(inMin: number, inMax: number, outMin: number, outMax: number, value: number): number {
  return lerp(outMin, outMax, inverseLerp(inMin, inMax, value))
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

export function distanceSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return dx * dx + dy * dy
}

export function degToRad(deg: number): number {
  return (deg * Math.PI) / 180
}

export function radToDeg(rad: number): number {
  return (rad * 180) / Math.PI
}

export function angleBetween(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

export function wrap(value: number, min: number, max: number): number {
  const range = max - min
  return range === 0 ? min : min + ((((value - min) % range) + range) % range)
}

export function approxEqual(a: number, b: number, epsilon = 1e-6): boolean {
  return Math.abs(a - b) < epsilon
}

// ─── 缓动函数 ───────────────────────────────────────────────────

export type EasingFn = (t: number) => number

export const Easing: Record<string, EasingFn> & {
  linear: EasingFn
  easeInQuad: EasingFn
  easeOutQuad: EasingFn
  easeInOutQuad: EasingFn
  easeInCubic: EasingFn
  easeOutCubic: EasingFn
  easeInOutCubic: EasingFn
  easeInBack: EasingFn
  easeOutBack: EasingFn
  easeInOutBack: EasingFn
  easeOutElastic: EasingFn
  easeOutBounce: EasingFn
  easeInSine: EasingFn
  easeOutSine: EasingFn
  easeInOutSine: EasingFn
} = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),

  easeInBack: (t) => {
    const s = 1.70158
    return t * t * ((s + 1) * t - s)
  },
  easeOutBack: (t) => {
    const s = 1.70158
    return --t * t * ((s + 1) * t + s) + 1
  },
  easeInOutBack: (t) => {
    const s = 1.70158 * 1.525
    if (t < 0.5) return 0.5 * ((2 * t) * (2 * t) * ((s + 1) * 2 * t - s))
    const t2 = 2 * t - 2
    return 0.5 * (t2 * t2 * ((s + 1) * t2 + s) + 2)
  },

  easeOutElastic: (t) => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin(((t - 0.075) * (2 * Math.PI)) / 0.3) + 1
  },

  easeOutBounce: (t) => {
    if (t < 1 / 2.75) return 7.5625 * t * t
    if (t < 2 / 2.75) return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    if (t < 2.5 / 2.75) return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
  },

  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
}

export function resolveEasing(easing: EasingFn | string | undefined): EasingFn {
  if (typeof easing === 'function') return easing
  if (typeof easing === 'string' && easing in Easing) return Easing[easing]
  return Easing.easeOutQuad
}

// ─── Vec2 ───────────────────────────────────────────────────────

export class Vec2 {
  constructor(public x: number = 0, public y: number = 0) {}

  set(x: number, y: number): this {
    this.x = x
    this.y = y
    return this
  }

  copy(v: Vec2): this {
    this.x = v.x
    this.y = v.y
    return this
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y)
  }

  add(v: Vec2): this {
    this.x += v.x
    this.y += v.y
    return this
  }

  sub(v: Vec2): this {
    this.x -= v.x
    this.y -= v.y
    return this
  }

  scale(s: number): this {
    this.x *= s
    this.y *= s
    return this
  }

  normalize(): this {
    const len = this.length()
    if (len > 0) {
      this.x /= len
      this.y /= len
    }
    return this
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y)
  }

  lengthSq(): number {
    return this.x * this.x + this.y * this.y
  }

  distanceTo(v: Vec2): number {
    return distance(this.x, this.y, v.x, v.y)
  }

  angle(): number {
    return Math.atan2(this.y, this.x)
  }

  angleTo(v: Vec2): number {
    return Math.atan2(v.y - this.y, v.x - this.x)
  }

  lerp(v: Vec2, t: number): this {
    this.x = lerp(this.x, v.x, t)
    this.y = lerp(this.y, v.y, t)
    return this
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y
  }

  cross(v: Vec2): number {
    return this.x * v.y - this.y * v.x
  }

  rotate(angle: number): this {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const nx = this.x * cos - this.y * sin
    const ny = this.x * sin + this.y * cos
    this.x = nx
    this.y = ny
    return this
  }

  static fromAngle(angle: number, length = 1): Vec2 {
    return new Vec2(Math.cos(angle) * length, Math.sin(angle) * length)
  }

  static ZERO = new Vec2(0, 0)
  static ONE = new Vec2(1, 1)
  static UP = new Vec2(0, -1)
  static DOWN = new Vec2(0, 1)
  static LEFT = new Vec2(-1, 0)
  static RIGHT = new Vec2(1, 0)
}

// ─── 随机数工具 ──────────────────────────────────────────────────

export class Random {
  private _seed: number

  constructor(seed?: number) {
    this._seed = seed ?? (Math.random() * 2147483647) | 0
    if (this._seed <= 0) this._seed += 2147483646
  }

  /** 获取下一个 [0, 1) 随机浮点数 */
  next(): number {
    this._seed = (this._seed * 16807) % 2147483647
    return (this._seed - 1) / 2147483646
  }

  /** 随机整数 [min, max]（含两端） */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min
  }

  /** 随机浮点数 [min, max) */
  float(min: number, max: number): number {
    return this.next() * (max - min) + min
  }

  /** 随机 x 坐标 [0, width) */
  x(width: number): number {
    return this.next() * width
  }

  /** 随机 y 坐标 [0, height) */
  y(height: number): number {
    return this.next() * height
  }

  /** 从数组中随机取一个 */
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  /** 概率判定 (0~1) */
  chance(probability: number): boolean {
    return this.next() < probability
  }

  /** 随机角度 [0, 2π) */
  angle(): number {
    return this.next() * Math.PI * 2
  }

  /** 随机颜色 hex */
  color(): string {
    return '#' + Math.floor(this.next() * 0xffffff).toString(16).padStart(6, '0')
  }

  /** 洗牌（Fisher-Yates） */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1))
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
  }

  /** 随机单位向量 */
  direction(): Vec2 {
    return Vec2.fromAngle(this.angle())
  }

  /** 在圆内随机取一点 */
  insideCircle(radius: number): Vec2 {
    const r = Math.sqrt(this.next()) * radius
    const a = this.angle()
    return new Vec2(Math.cos(a) * r, Math.sin(a) * r)
  }
}
