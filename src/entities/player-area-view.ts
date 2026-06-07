import { Container, Scene, Graphics, TextNode } from '../engine';
import { PlayerState, ExitToken, CardInstance } from '../shared/types';
import { CardView } from './card-view';

export class PlayerAreaView {
  node: Container;
  private scene: Scene;
  private options: { isLocalPlayer: boolean; width: number; height: number };
  private nameText: TextNode;
  private scoreText: TextNode;
  private cardViews: Map<string, CardView> = new Map();
  private exitTokenNode: Container | null = null;
  private bg: Graphics;
  private statusText: TextNode | null = null;

  constructor(scene: Scene, x: number, y: number, options: {
    isLocalPlayer: boolean;
    width: number;
    height: number;
  }) {
    this.scene = scene;
    this.options = options;
    this.node = scene.add.container(x, y);
    
    this.bg = scene.add.graphics(0, 0);
    this.node.addChild(this.bg);
    
    if (options.isLocalPlayer) {
      this.bg.fillRoundRect(0, 0, options.width, options.height, 16, 'rgba(10, 31, 28, 0.6)');
      this.bg.strokeRect(0, 0, options.width, options.height, 'rgba(255, 255, 255, 0.06)', 1);
      
      this.nameText = scene.add.text('', 15, 15, { fontSize: 14, color: '#9ca3af', bold: true });
      this.scoreText = scene.add.text('', options.width - 15, 15, { fontSize: 24, color: '#fbbf24', bold: true, align: 'right' });
      this.scoreText.setAnchor(1, 0);
    } else {
      this.bg.fillRoundRect(0, 0, options.width, options.height, 12, 'rgba(10, 31, 28, 0.6)');
      this.bg.strokeRect(0, 0, options.width, options.height, 'rgba(255, 255, 255, 0.06)', 1);
      this.nameText = scene.add.text('', options.width / 2, 10, { fontSize: 12, color: '#9ca3af', align: 'center' });
      this.scoreText = scene.add.text('', options.width / 2, 30, { fontSize: 18, color: '#fbbf24', align: 'center', bold: true });
    }
    
    this.node.addChild(this.nameText);
    this.node.addChild(this.scoreText);
  }

  update(player: PlayerState): void {
    this.nameText.setText(player.name + (player.isPantherJuiced ? ' 🥤' : ''));
    this.scoreText.setText(`${this.calculateScore(player)}`);
    
    if (this.statusText) {
      this.statusText.destroy();
      this.statusText = null;
    }
    
    if (this.options.isLocalPlayer) {
      this.renderLocalCards(player);
    } else {
      this.renderOpponentStatus(player);
    }
    
    if (player.exitToken) {
      this.showExitToken(player.exitToken);
    } else if (this.exitTokenNode) {
      this.exitTokenNode.destroy();
      this.exitTokenNode = null;
    }
    
    if (!player.isActive && !player.exitToken) {
      this.bg.clear();
      this.bg.fillRoundRect(0, 0, this.options.width, this.options.height, this.options.isLocalPlayer ? 16 : 12, 'rgba(239, 68, 68, 0.1)');
      this.bg.strokeRect(0, 0, this.options.width, this.options.height, 'rgba(239, 68, 68, 0.3)', 1);
    }
  }

  private calculateScore(player: PlayerState): number {
    return player.scorePile.reduce((sum, c) => sum + c.def.treasureValue, 0);
  }

  private renderLocalCards(player: PlayerState): void {
    const startY = 30;
    const cardSpacingX = 40;
    const rowSpacingY = 105;
    
    // 收集当前应显示的卡牌 ID 集合
    const activeCardIds = new Set<string>();
    
    const groups: Map<string, CardInstance[]> = new Map();
    player.outsideCards.forEach((c: CardInstance) => {
      const type = c.assignedType || c.def.type;
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(c);
      activeCardIds.add(c.id);
    });
    
    player.dangerZoneCards.forEach((c: CardInstance) => {
      const type = c.assignedType || c.def.type;
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(c);
      activeCardIds.add(c.id);
    });
    
    // 删除不再显示的卡牌视图
    for (const [id, cv] of this.cardViews) {
      if (!activeCardIds.has(id)) {
        cv.destroy();
        this.cardViews.delete(id);
      }
    }
    
    // 创建或复用卡牌视图，更新位置
    let rowIndex = 0;
    groups.forEach((cards) => {
      cards.forEach((card, colIndex) => {
        const isDanger = player.dangerZoneCards.some((dc: CardInstance) => dc.id === card.id);
        let cv = this.cardViews.get(card.id);
        if (!cv) {
          cv = new CardView(this.scene, card, { highlighted: isDanger });
          this.node.addChild(cv.node);
          this.cardViews.set(card.id, cv);
        } else {
          cv.setHighlighted(isDanger);
        }
        cv.node.setPosition(10 + colIndex * cardSpacingX, startY + rowIndex * rowSpacingY);
      });
      rowIndex++;
    });
  }

  private renderOpponentStatus(player: PlayerState): void {
    if (!player.isActive) {
      const status = player.exitToken ? (player.exitToken.isCoffin ? '☠' : '✓') : '...';
      const color = player.exitToken ? (player.exitToken.isCoffin ? '#f00' : '#0f0') : '#fff';
      this.statusText = this.scene.add.text(status, this.options.width / 2, 35, {
        fontSize: 16,
        color,
        align: 'center'
      });
      this.node.addChild(this.statusText);
    }
  }

  showExitToken(token: ExitToken): void {
    if (this.exitTokenNode) this.exitTokenNode.destroy();
    
    this.exitTokenNode = this.scene.add.container(this.options.width - 20, this.options.height - 20);
    this.node.addChild(this.exitTokenNode);
    
    const bg = this.scene.add.graphics(0, 0);
    const color = token.isCoffin ? '#b71c1c' : '#2e7d32';
    bg.fillCircle(0, 0, 12.5, color);
    bg.strokeCircle(0, 0, 12.5, '#fff', 1);
    this.exitTokenNode.addChild(bg);
    
    const text = this.scene.add.text(token.isCoffin ? '☠' : token.number.toString(), 0, 0, {
      fontSize: 12,
      color: '#fff',
      align: 'center',
      bold: true
    });
    this.exitTokenNode.addChild(text);
  }

  playBustAnimation(): void {
    this.node.tweenToEx({ scaleX: 1.1, scaleY: 1.1 }, {
      duration: 100,
      easing: 'ease-out',
      onComplete: () => {
        this.node.tweenTo({ scaleX: 1.0, scaleY: 1.0 }, 100, 'ease-in');
      }
    });
  }

  destroy(): void {
    this.cardViews.forEach(v => v.destroy());
    this.node.destroy();
  }
}
