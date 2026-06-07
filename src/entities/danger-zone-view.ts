import { Container, Scene, Graphics, TextNode, Sprite } from '../engine';
import { ThreatStack, CardInstance, ThreatType } from '../shared/types';

export class DangerZoneView {
  node: Container;
  private bg: Graphics;
  private header: TextNode;
  private stackContainers: Map<ThreatType, Container> = new Map();
  private scene: Scene;
  private width: number;
  private height: number;
  private interactiveCallback: ((threatType: ThreatType) => void) | null = null;

  // The 4 specific hazards in the game
  private readonly HAZARDS: ThreatType[] = ['spider', 'snake', 'scorpion', 'piranha'];

  constructor(scene: Scene, x: number, y: number, width: number, height: number) {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.node = scene.add.container(x, y);
    
    this.bg = scene.add.graphics(0, 0);
    this.node.addChild(this.bg);
    
    this.header = scene.add.text('危险追踪器 (集齐两张相同即爆牌)', width / 2, 15, {
      fontSize: 12,
      color: '#9ca3af',
      align: 'center',
      bold: true
    });
    this.node.addChild(this.header);
    
    this.updateBg(false);
  }

  private updateBg(isCloseToBust: boolean): void {
    this.bg.clear();
    // Glass panel style
    this.bg.fillRoundRect(0, 0, this.width, this.height, 16, 'rgba(10, 31, 28, 0.6)');
    this.bg.strokeRect(0, 0, this.width, this.height, 'rgba(255, 255, 255, 0.06)', 1);
  }

  update(dangerZone: ThreatStack[], chupacabraStack: CardInstance[] | null): void {
    this.stackContainers.forEach(c => c.destroy());
    this.stackContainers.clear();
    
    let isCloseToBust = false;
    
    const cols = 4;
    const colWidth = this.width / cols;
    const startY = 50;
    
    this.HAZARDS.forEach((threatType, index) => {
      const stack = dangerZone.find(s => s.threatType === threatType);
      const count = stack ? stack.cards.length : 0;
      const isActive = count > 0;
      if (count >= 1) isCloseToBust = true;
      
      const container = this.scene.add.container(index * colWidth + colWidth / 2, startY);
      this.node.addChild(container);
      this.stackContainers.set(threatType, container);
      
      // Hazard Box
      const boxW = 50;
      const boxH = 50;
      const box = this.scene.add.graphics(-boxW/2, -boxH/2);
      if (isActive) {
        box.fillRoundRect(0, 0, boxW, boxH, 12, 'rgba(239, 68, 68, 0.2)');
        box.strokeRect(0, 0, boxW, boxH, 'rgba(239, 68, 68, 0.6)', 2);
      } else {
        box.fillRoundRect(0, 0, boxW, boxH, 12, 'rgba(255, 255, 255, 0.05)');
        box.strokeRect(0, 0, boxW, boxH, 'rgba(255, 255, 255, 0.1)', 1);
      }
      container.addChild(box);

      // Icon
      const emoji = this.getEmoji(threatType);
      const iconText = this.scene.add.text(emoji, 0, -5, {
        fontSize: 20,
        align: 'center',
        color: isActive ? '#fff' : '#666'
      });
      container.addChild(iconText);

      // Dots for count
      const dotsContainer = this.scene.add.container(0, 15);
      container.addChild(dotsContainer);
      
      // Show 2 dots max (since 2 = bust)
      for (let i = 0; i < 2; i++) {
        const dot = this.scene.add.graphics(-6 + i * 12, 0);
        if (i < count) {
          dot.fillCircle(0, 0, 3, '#ef4444');
        } else {
          dot.fillCircle(0, 0, 3, 'rgba(255, 255, 255, 0.2)');
        }
        dotsContainer.addChild(dot);
      }
      
      if (this.interactiveCallback) {
        container.onTap(() => {
          if (this.interactiveCallback) this.interactiveCallback(threatType);
        });
      }
    });
    
    this.updateBg(isCloseToBust);
  }

  getStackPosition(type: ThreatType): { x: number, y: number } {
    const container = this.stackContainers.get(type);
    if (container) {
      return { x: this.node.x + container.x, y: this.node.y + container.y };
    }
    return { x: this.node.x + this.width / 2, y: this.node.y + this.height / 2 };
  }

  private getEmoji(type: ThreatType): string {
    switch (type) {
      case 'crocodile': return '🐊';
      case 'spider': return '🕷';
      case 'scorpion': return '🦂';
      case 'piranha': return '🐟';
      case 'snake': return '🐍';
      case 'chupacabra': return '🐐';
      default: return '';
    }
  }

  highlightStack(threatType: ThreatType | null): void {
    this.stackContainers.forEach((container, type) => {
      if (type === threatType) {
        container.setScale(1.2);
      } else {
        container.setScale(1.0);
      }
    });
  }

  setInteractive(callback: (threatType: ThreatType) => void): void {
    this.interactiveCallback = callback;
  }

  setNonInteractive(): void {
    this.interactiveCallback = null;
  }

  destroy(): void {
    this.node.destroy();
  }
}
