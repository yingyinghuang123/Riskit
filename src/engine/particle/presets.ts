// ─── 粒子预设 — 常用效果 ────────────────────────────────────────

import { ParticleEmitter, type ParticleConfig } from './emitter'

export class FxPresets {
  static explode(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, rate: 0, burst: 30, duration: 0.1,
      lifeMin: 0.3, lifeMax: 0.8,
      speedMin: 100, speedMax: 300,
      angleMin: 0, angleMax: Math.PI * 2,
      sizeStart: 6, sizeEnd: 1,
      alphaStart: 1, alphaEnd: 0,
      colors: ['#ff4400', '#ff8800', '#ffcc00', '#ffffff'],
      blendMode: 'lighter', gravityY: 200,
      ...opts,
    })
  }

  static sparkle(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, rate: 20,
      lifeMin: 0.4, lifeMax: 1.0,
      speedMin: 20, speedMax: 60,
      angleMin: 0, angleMax: Math.PI * 2,
      sizeStart: 3, sizeEnd: 0,
      alphaStart: 1, alphaEnd: 0,
      colors: ['#ffdd00', '#ffff88', '#ffffff'],
      blendMode: 'lighter',
      ...opts,
    })
  }

  static smoke(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, rate: 8,
      lifeMin: 1.0, lifeMax: 2.5,
      speedMin: 10, speedMax: 30,
      angleMin: -Math.PI * 0.75, angleMax: -Math.PI * 0.25,
      sizeStart: 8, sizeEnd: 24,
      alphaStart: 0.5, alphaEnd: 0,
      colors: ['#888888', '#aaaaaa', '#cccccc'],
      gravityY: -30,
      ...opts,
    })
  }

  static trail(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, rate: 30,
      lifeMin: 0.2, lifeMax: 0.5,
      speedMin: 0, speedMax: 10,
      angleMin: 0, angleMax: Math.PI * 2,
      sizeStart: 4, sizeEnd: 0,
      alphaStart: 0.8, alphaEnd: 0,
      colors: ['#44aaff', '#88ccff', '#ffffff'],
      blendMode: 'lighter',
      ...opts,
    })
  }

  static confetti(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, rate: 0, burst: 50, duration: 0.1,
      lifeMin: 1.5, lifeMax: 3.0,
      speedMin: 80, speedMax: 200,
      angleMin: -Math.PI * 0.9, angleMax: -Math.PI * 0.1,
      sizeStart: 6, sizeEnd: 4,
      alphaStart: 1, alphaEnd: 0.3,
      rotationSpeed: 5,
      colors: ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'],
      gravityY: 300,
      ...opts,
    })
  }

  static rain(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, emitShape: 'rect',
      emitWidth: opts?.emitWidth ?? 400, emitHeight: 0,
      rate: 40,
      lifeMin: 0.5, lifeMax: 1.0,
      speedMin: 300, speedMax: 500,
      angleMin: Math.PI * 0.45, angleMax: Math.PI * 0.55,
      sizeStart: 2, sizeEnd: 2,
      alphaStart: 0.6, alphaEnd: 0.2,
      colors: ['#aaccff', '#88bbff'],
      ...opts,
    })
  }

  static snow(x: number, y: number, opts?: Partial<ParticleConfig>): ParticleEmitter {
    return new ParticleEmitter({
      x, y, emitShape: 'rect',
      emitWidth: opts?.emitWidth ?? 400, emitHeight: 0,
      rate: 15,
      lifeMin: 3.0, lifeMax: 6.0,
      speedMin: 20, speedMax: 50,
      angleMin: Math.PI * 0.4, angleMax: Math.PI * 0.6,
      sizeStart: 4, sizeEnd: 2,
      alphaStart: 0.8, alphaEnd: 0.2,
      colors: ['#ffffff', '#eeeeff', '#ddddff'],
      rotationSpeed: 1,
      ...opts,
    })
  }
}
