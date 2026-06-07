import { Scene, MiniEngine, FxPresets, Easing, Graphics, Node, ParticleEmitter } from '../engine';

class ParticleNode extends Node {
  private emitter: ParticleEmitter;
  private gfx: Graphics;

  constructor(emitter: ParticleEmitter) {
    super();
    this.emitter = emitter;
    this.gfx = new Graphics();
    this.addChild(this.gfx as any);
  }

  override update(dt: number) {
    this.emitter.update(dt);
    this.gfx.clear();
    this.emitter.renderToGraphics(this.gfx as any);
    if (this.emitter.finished) {
      this.destroy();
    }
  }
}

export class GameFX {
  private scene: Scene;
  private engine: MiniEngine;
  private dangerPulseNode: Graphics | null = null;
  
  constructor(scene: Scene, engine: MiniEngine) {
    this.scene = scene;
    this.engine = engine;
  }
  
  private addParticles(emitter: ParticleEmitter) {
    const node = new ParticleNode(emitter);
    this.scene.addChild(node);
    return node;
  }
  
  async animateCardDraw(fromX: number, fromY: number, toX: number, toY: number, cardNode: any): Promise<void> {
    cardNode.setPosition(fromX, fromY);
    cardNode.setScale(0.3, 0.3);
    cardNode.setVisible(true);
    
    const duration = 400;
    
    const movePromise = this.scene.tween!.async(cardNode, {
      x: toX,
      y: toY,
      scaleY: 1.0
    }, { duration, easing: Easing.easeOutBack });
    
    await this.scene.tween!.async(cardNode, { scaleX: 0 }, { duration: duration / 2, easing: Easing.linear });
    await this.scene.tween!.async(cardNode, { scaleX: 1 }, { duration: duration / 2, easing: Easing.linear });
    
    await movePromise;
    this.vibrateLight();
  }
  
  async animateBust(x: number, y: number): Promise<void> {
    if (this.scene.fx) {
      this.scene.fx.screenShake(8, 400);
      this.scene.fx.screenFlash('#ff0000', 200);
      this.scene.fx.freezeFrame(80);
    }
    
    this.addParticles(FxPresets.explode(x, y, { colors: ['#ff4400', '#ff8800', '#ffff00'] }));
    this.vibrateHeavy();
  }
  
  async animateSafeExit(x: number, y: number): Promise<void> {
    this.addParticles(FxPresets.sparkle(x, y, { colors: ['#4CAF50', '#8BC34A', '#CDDC39'] }));
    
    const checkmark = this.scene.add.text('✓', x, y, { fontSize: 80, color: '#4CAF50', bold: true, align: 'center' });
    checkmark.setAnchor(0.5, 0.5);
    checkmark.setScale(0, 0);
    checkmark.alpha = 0;
    
    await this.scene.tween!.async(checkmark, { scaleX: 1, scaleY: 1, alpha: 1 }, { duration: 500, easing: Easing.easeOutElastic });
    
    this.scene.timer!.delay(800, () => {
      this.scene.tween!.to(checkmark, { alpha: 0, scaleX: 0.5, scaleY: 0.5 }, { 
        duration: 300, 
        onComplete: () => checkmark.destroy() 
      });
    });
    
    this.vibrateLight();
  }
  
  async animateTreasureCollect(fromX: number, fromY: number, toX: number, toY: number): Promise<void> {
    const coinCount = 5;
    const promises: Promise<void>[] = [];
    
    for (let i = 0; i < coinCount; i++) {
      const coin = this.scene.add.graphics(fromX + (Math.random() - 0.5) * 40, fromY + (Math.random() - 0.5) * 40);
      coin.fillCircle(0, 0, 10, '#FFD700');
      coin.setAnchor(0.5, 0.5);
      
      const delay = i * 100;
      const p = new Promise<void>(resolve => {
        this.scene.timer!.delay(delay, async () => {
          await this.scene.tween!.async(coin, { 
            x: toX + (Math.random() - 0.5) * 20, 
            y: toY + (Math.random() - 0.5) * 20,
            scaleX: 0.5,
            scaleY: 0.5
          }, { duration: 600, easing: Easing.easeInQuad });
          
          this.addParticles(FxPresets.sparkle(coin.x, coin.y, { burst: 5, colors: ['#FFD700'] }));
          coin.destroy();
          resolve();
        });
      });
      promises.push(p);
    }
    
    await Promise.all(promises);
  }
  
  startDangerPulse(node: any, intensity: number): void {
    if (intensity < 0.5) {
      this.stopDangerPulse();
      return;
    }
    
    if (!this.dangerPulseNode) {
      this.dangerPulseNode = this.scene.add.graphics(0, 0);
      const width = node.width || 750;
      const height = node.height || 300;
      this.dangerPulseNode.fillRect(0, 0, width, height, '#ff0000');
      this.dangerPulseNode.alpha = 0;
      node.addChild(this.dangerPulseNode);
    }
    
    const duration = intensity > 0.8 ? 400 : 1000;
    const maxAlpha = intensity > 0.8 ? 0.7 : 0.3;
    const minAlpha = intensity > 0.8 ? 0.3 : 0.1;
    
    this.scene.tween!.cancel(this.dangerPulseNode);
    this.dangerPulseNode.alpha = minAlpha;
    this.scene.tween!.to(this.dangerPulseNode, { alpha: maxAlpha }, {
      duration,
      easing: Easing.easeInOutSine,
      yoyo: true,
      loop: -1
    });
  }
  
  stopDangerPulse(): void {
    if (this.dangerPulseNode) {
      this.scene.tween!.cancel(this.dangerPulseNode);
      this.dangerPulseNode.destroy();
      this.dangerPulseNode = null;
    }
  }
  
  async animateScoreChange(textNode: any, fromValue: number, toValue: number): Promise<void> {
    const duration = 500;
    
    textNode.tweenTo({ scaleX: 1.3, scaleY: 1.3 }, 150, Easing.easeOutBack)
      .then(() => textNode.tweenTo({ scaleX: 1.0, scaleY: 1.0 }, 150, Easing.easeOutBack));
      
    await this.scene.tween!.async({ val: fromValue }, { val: toValue }, {
      duration,
      onUpdate: (obj: any) => {
        textNode.setText(`Score: ${Math.floor(obj.val)}`);
      }
    });
    
    textNode.setText(`Score: ${toValue}`);
  }
  
  async animateRoundStart(roundNumber: number): Promise<void> {
    const cx = this.engine.screen.width / 2;
    const cy = this.engine.screen.height / 2;
    const text = this.scene.add.text(`Round ${roundNumber}`, cx, cy, {
      fontSize: 100,
      color: '#fff',
      bold: true,
      align: 'center',
      stroke: { color: '#000', width: 8 }
    });
    text.setAnchor(0.5, 0.5);
    text.setScale(3, 3);
    text.alpha = 0;
    
    await this.scene.tween!.async(text, { scaleX: 1, scaleY: 1, alpha: 1 }, { duration: 300, easing: Easing.easeOutBack });
    
    await this.scene.timer!.wait(800);
    
    await this.scene.tween!.async(text, { alpha: 0, scaleX: 0.5, scaleY: 0.5 }, { duration: 200 });
    text.destroy();
  }
  
  vibrateLight(): void { 
    if ((this.engine as any).wx?.vibrate) (this.engine as any).wx.vibrate.short('light');
  }
  vibrateMedium(): void {
    if ((this.engine as any).wx?.vibrate) (this.engine as any).wx.vibrate.short('medium');
  }
  vibrateHeavy(): void {
    if ((this.engine as any).wx?.vibrate) (this.engine as any).wx.vibrate.long();
  }
}

