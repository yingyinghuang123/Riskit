// ─── 粒子发射器 — 增强版 ────────────────────────────────────────

export type EmitShape = "point" | "rect" | "circle"
export type BlendMode = "source-over" | "lighter" | "multiply" | "screen"

export interface ParticleConfig {
  x?: number
  y?: number
  emitShape?: EmitShape
  emitWidth?: number
  emitHeight?: number
  emitRadius?: number
  rate?: number
  burst?: number
  duration?: number
  lifeMin?: number
  lifeMax?: number
  speedMin?: number
  speedMax?: number
  angleMin?: number
  angleMax?: number
  gravityX?: number
  gravityY?: number
  sizeStart?: number
  sizeEnd?: number
  alphaStart?: number
  alphaEnd?: number
  rotationSpeed?: number
  colors?: string[]
  texture?: any
  blendMode?: BlendMode
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  sizeEnd: number
  alpha: number
  alphaEnd: number
  rotation: number
  rotationSpeed: number
  color: string
  alive: boolean
}

export class ParticleEmitter {
  x: number
  y: number
  active = true

  private _config: ParticleConfig
  private _particles: Particle[] = []
  private _pool: Particle[] = []
  private _emitAccum = 0
  private _elapsed = 0
  private _emitterActive = true
  private _finished = false

  constructor(config: ParticleConfig = {}) {
    this._config = config
    this.x = config.x ?? 0
    this.y = config.y ?? 0

    if (config.burst) this.burst(config.burst)
  }

  get config(): ParticleConfig {
    return this._config
  }
  get particleCount(): number {
    return this._particles.length
  }
  get finished(): boolean {
    return this._finished
  }

  burst(count?: number): void {
    const n = count ?? this._config.burst ?? 10
    for (let i = 0; i < n; i++) this._spawn()
  }

  update(dt: number): void {
    if (!this.active) return
    const cfg = this._config

    if (this._emitterActive) {
      const duration = cfg.duration ?? 0
      if (duration > 0) {
        this._elapsed += dt
        if (this._elapsed >= duration) this._emitterActive = false
      }
      if (this._emitterActive && !cfg.burst) {
        this._emitAccum += (cfg.rate ?? 10) * dt
        while (this._emitAccum >= 1) {
          this._emitAccum--
          this._spawn()
        }
      }
    }

    const gx = cfg.gravityX ?? 0
    const gy = cfg.gravityY ?? 0

    for (let i = this._particles.length - 1; i >= 0; i--) {
      const p = this._particles[i]
      p.life -= dt
      if (p.life <= 0) {
        p.alive = false
        this._pool.push(p)
        this._particles.splice(i, 1)
        continue
      }
      p.vx += gx * dt
      p.vy += gy * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rotation += p.rotationSpeed * dt
    }

    if (!this._emitterActive && this._particles.length === 0) {
      this._finished = true
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const cfg = this._config
    const blend = cfg.blendMode ?? "source-over"
    const prevComposite = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = blend

    for (const p of this._particles) {
      const t = 1 - p.life / p.maxLife
      const size = p.size + (p.sizeEnd - p.size) * t
      const alpha = p.alpha + (p.alphaEnd - p.alpha) * t
      if (size <= 0 || alpha <= 0) continue

      ctx.save()
      ctx.globalAlpha *= alpha
      ctx.translate(p.x, p.y)
      if (p.rotation !== 0) ctx.rotate(p.rotation)

      if (cfg.texture) {
        ctx.drawImage(cfg.texture, -size / 2, -size / 2, size, size)
      } else {
        ctx.fillStyle = p.color
        ctx.fillRect(-size / 2, -size / 2, size, size)
      }
      ctx.restore()
    }

    ctx.globalCompositeOperation = prevComposite
  }

  renderToGraphics(gfx: {
    fillCircle(x: number, y: number, r: number, color: string): void
    fillRect(x: number, y: number, w: number, h: number, color: string): void
  }): void {
    for (const p of this._particles) {
      const t = 1 - p.life / p.maxLife
      const size = p.size + (p.sizeEnd - p.size) * t
      const alpha = p.alpha + (p.alphaEnd - p.alpha) * t
      if (size <= 0 || alpha <= 0) continue
      const color = _colorWithAlpha(p.color, alpha)
      gfx.fillCircle(p.x, p.y, Math.max(0.5, size / 2), color)
    }
  }

  reset(): void {
    for (const p of this._particles) this._pool.push(p)
    this._particles.length = 0
    this._emitAccum = 0
    this._elapsed = 0
    this._emitterActive = true
    this._finished = false
  }

  destroy(): void {
    this._particles.length = 0
    this._pool.length = 0
    this.active = false
  }

  private _spawn(): void {
    const cfg = this._config
    const p = this._pool.length > 0 ? this._pool.pop()! : this._createParticle()
    const pos = this._getEmitPosition()
    p.x = pos.x
    p.y = pos.y

    const angle = this._rand(cfg.angleMin ?? 0, cfg.angleMax ?? Math.PI * 2)
    const speed = this._rand(cfg.speedMin ?? 50, cfg.speedMax ?? 100)
    p.vx = Math.cos(angle) * speed
    p.vy = Math.sin(angle) * speed

    p.maxLife = this._rand(cfg.lifeMin ?? 0.5, cfg.lifeMax ?? 1.5)
    p.life = p.maxLife
    p.size = cfg.sizeStart ?? 4
    p.sizeEnd = cfg.sizeEnd ?? 0
    p.alpha = cfg.alphaStart ?? 1
    p.alphaEnd = cfg.alphaEnd ?? 0
    p.rotation = 0
    p.rotationSpeed = cfg.rotationSpeed ?? 0
    p.color = cfg.colors ? cfg.colors[Math.floor(Math.random() * cfg.colors.length)] : "#fff"
    p.alive = true

    this._particles.push(p)
  }

  private _createParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 1,
      size: 4,
      sizeEnd: 0,
      alpha: 1,
      alphaEnd: 0,
      rotation: 0,
      rotationSpeed: 0,
      color: "#fff",
      alive: false,
    }
  }

  private _getEmitPosition(): { x: number; y: number } {
    const cfg = this._config
    const shape = cfg.emitShape ?? "point"
    if (shape === "rect") {
      const w = cfg.emitWidth ?? 0
      const h = cfg.emitHeight ?? 0
      return { x: this.x + (Math.random() - 0.5) * w, y: this.y + (Math.random() - 0.5) * h }
    }
    if (shape === "circle") {
      const r = (cfg.emitRadius ?? 0) * Math.sqrt(Math.random())
      const a = Math.random() * Math.PI * 2
      return { x: this.x + Math.cos(a) * r, y: this.y + Math.sin(a) * r }
    }
    return { x: this.x, y: this.y }
  }

  private _rand(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}

/** 将 #rrggbb + alpha 转为 rgba() 字符串 */
function _colorWithAlpha(hex: string, alpha: number): string {
  if (hex.startsWith("rgba")) return hex
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`
}
