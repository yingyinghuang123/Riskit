import { Container, Scene, Graphics, TextNode, Sprite, loadImage } from '../engine';
import { CardInstance } from '../shared/types';

const CARD_ART_PATH: Record<string, string> = {
  crocodile: 'assets/cards/crocodile.png',
  spider: 'assets/cards/card_spider.png',
  scorpion: 'assets/cards/card_scorpion.png',
  piranha: 'assets/cards/card_piranha.png',
  snake: 'assets/cards/card_snake.png',
  chupacabra: 'assets/cards/chupacabra.png',
  split: 'assets/cards/split.png',
  bribe: 'assets/cards/bribe.png',
  backpack: 'assets/cards/backpack.png',
  panther_juice: 'assets/cards/panther_juice.png',
  statue: 'assets/cards/statue.png',
  machete: 'assets/cards/machete.png',
};

export class CardView {
  node: Container;
  private whiteBorder: Graphics;
  private bg: Graphics;
  private artSprite: Sprite;
  private treasureBg: Graphics;
  private treasureText: TextNode;
  private threatText: TextNode;
  private specialBg: Graphics;
  private specialText: TextNode;
  private emojiText: TextNode;
  private highlightGfx: Graphics;
  private card: CardInstance;
  private currentArtPath: string | null = null;
  private options: { compact?: boolean; faceDown?: boolean; highlighted?: boolean };

  constructor(scene: Scene, card: CardInstance, options: {
    compact?: boolean;
    faceDown?: boolean;
    highlighted?: boolean;
  } = {}) {
    this.card = card;
    this.options = options;
    this.node = scene.add.container(0, 0);
    
    const width = options.compact ? 45 : 70;
    const height = options.compact ? 63 : 98;
    
    this.whiteBorder = scene.add.graphics(0, 0);
    this.node.addChild(this.whiteBorder);

    this.bg = scene.add.graphics(0, 0);
    this.node.addChild(this.bg);

    this.artSprite = scene.add.sprite('', width / 2, height / 2);
    this.artSprite.setAnchor(0.5, 0.5);
    this.node.addChild(this.artSprite);
    
    this.treasureBg = scene.add.graphics(0, 0);
    this.node.addChild(this.treasureBg);

    this.treasureText = scene.add.text('', 0, 0, {
      fontSize: options.compact ? 10 : 14,
      color: '#fff',
      align: 'center',
      bold: true
    });
    this.node.addChild(this.treasureText);

    this.threatText = scene.add.text('', 0, 0, {
      fontSize: options.compact ? 14 : 20,
      color: '#000',
      align: 'center',
      bold: true,
      stroke: { color: '#fff', width: 2 }
    });
    this.node.addChild(this.threatText);

    this.specialBg = scene.add.graphics(0, 0);
    this.node.addChild(this.specialBg);

    this.specialText = scene.add.text('', 0, 0, {
      fontSize: options.compact ? 10 : 14,
      color: '#fff',
      align: 'center'
    });
    this.node.addChild(this.specialText);

    this.emojiText = scene.add.text('', width / 2, height / 2, {
      fontSize: options.compact ? 16 : 24,
      color: '#fff',
      align: 'center'
    });
    this.node.addChild(this.emojiText);

    this.highlightGfx = scene.add.graphics(0, 0);
    this.node.addChild(this.highlightGfx);
    
    this.updateVisuals();
  }

  private updateVisuals(): void {
    const width = this.options.compact ? 45 : 70;
    const height = this.options.compact ? 63 : 98;
    const radius = this.options.compact ? 5 : 8;
    const bw = 2;
    
    this.whiteBorder.clear();
    this.bg.clear();
    this.treasureBg.clear();
    this.specialBg.clear();
    this.highlightGfx.clear();
    
    // Draw shadow and border
    this.whiteBorder.fillRoundRect(0, 0, width, height, radius, 'rgba(0,0,0,0.5)');
    this.whiteBorder.strokeRect(0, 0, width, height, 'rgba(255,255,255,0.1)', 1);

    if (this.options.faceDown) {
      this.bg.fillRoundRect(bw, bw, width - bw * 2, height - bw * 2, radius - 1, '#8B0000');
      this.emojiText.setText('☠');
      this.emojiText.setPosition(width / 2, height / 2);
      this.emojiText.setVisible(true);
      this.treasureText.setVisible(false);
      this.threatText.setVisible(false);
      this.specialText.setVisible(false);
      this.loadArt('assets/cards/card_back.png');
    } else {
      const color = this.getCardColor();
      this.bg.fillRoundRect(bw, bw, width - bw * 2, height - bw * 2, radius - 1, color);
      
      const type: string = this.card.assignedType || this.card.def.threatType || this.card.def.type;
      const artPath = CARD_ART_PATH[type];
      
      if (artPath) {
        this.loadArt(artPath);
      } else {
        this.currentArtPath = null;
        this.artSprite.setVisible(false);
        this.emojiText.setText(this.getCardEmoji());
        this.emojiText.setPosition(width / 2, height / 2);
        this.emojiText.setVisible(true);
      }

      const tv = this.card.def.treasureValue;
      if (tv > 0) {
        const dSize = this.options.compact ? 8 : 12;
        const cx = bw + 4 + dSize / 2;
        const cy = bw + 4 + dSize / 2;
        
        this.treasureBg.fillCircle(cx, cy, dSize, '#F59E0B');
        this.treasureBg.strokeCircle(cx, cy, dSize, '#FBBF24', 2);
        
        this.treasureText.setText(tv.toString());
        this.treasureText.setPosition(cx, cy);
        this.treasureText.setVisible(true);
      } else {
        this.treasureText.setVisible(false);
      }

      const isItem = ['bribe', 'backpack', 'panther_juice', 'statue', 'machete'].includes(this.card.def.type);
      if (isItem) {
        let icon = '';
        if (['bribe', 'panther_juice'].includes(this.card.def.type)) icon = '🧭';
        else icon = '⚙';
        
        this.threatText.setText(icon);
        this.threatText.setPosition(width - bw - (this.options.compact ? 8 : 12), bw + (this.options.compact ? 8 : 12));
        this.threatText.setVisible(true);
      } else {
        const thv = this.card.def.threatValue;
        if (thv > 0) {
          this.threatText.setText(thv.toString());
          this.threatText.setPosition(width - bw - (this.options.compact ? 8 : 12), bw + (this.options.compact ? 8 : 12));
          this.threatText.setVisible(true);
        } else {
          this.threatText.setVisible(false);
        }
      }
      
      let special = '';
      if (this.card.def.special === 'deathwish') special = '💀';
      else if (this.card.def.special === 'chicken_feather') special = '🪶';
      
      if (special) {
        const sr = this.options.compact ? 6 : 8;
        const sx = bw + 4 + sr;
        const sy = bw + 4 + (this.options.compact ? 16 : 24) + 4 + sr;
        
        this.specialBg.fillCircle(sx, sy, sr, '#FF0000');
        this.specialText.setText(special);
        this.specialText.setPosition(sx, sy);
        this.specialText.setVisible(true);
      } else {
        this.specialText.setVisible(false);
      }
    }

    if (this.options.highlighted) {
      this.highlightGfx.strokeRect(-2, -2, width + 4, height + 4, '#ef4444', 3);
      this.highlightGfx.fillRoundRect(-2, -2, width + 4, height + 4, radius + 2, 'rgba(239, 68, 68, 0.2)');
    }
  }

  private loadArt(path: string): void {
    if (this.currentArtPath === path) return;
    this.currentArtPath = path;
    
    const width = this.options.compact ? 45 : 70;
    const height = this.options.compact ? 63 : 98;

    if (!this.options.faceDown) {
      this.emojiText.setText(this.getCardEmoji());
      this.emojiText.setPosition(width / 2, height / 2);
      this.emojiText.setVisible(true);
    } else {
      this.emojiText.setText('☠');
      this.emojiText.setPosition(width / 2, height / 2);
      this.emojiText.setVisible(true);
    }
    this.artSprite.setVisible(false);

    loadImage(path).then(res => {
      if (this.currentArtPath !== path) return;
      this.artSprite.setTexture(res.image as unknown as CanvasImageSource);
      this.artSprite.setVisible(true);
      this.artSprite.setSize(width - 4, height - 4);
    }).catch(() => {
      if (this.currentArtPath !== path) return;
      this.artSprite.setVisible(false);
      this.emojiText.setVisible(true);
    });
  }

  private getCardColor(): string {
    const type: string = this.card.assignedType || (this.card.def.threatType !== 'none' ? this.card.def.threatType : '') || this.card.def.type;
    switch (type) {
      case 'crocodile': return '#2D1B4E';
      case 'spider': return '#6B4D8A';
      case 'scorpion': return '#C2185B';
      case 'piranha': return '#00838F';
      case 'snake': return '#1565C0';
      case 'chupacabra': return '#2C2C2C';
      case 'split': return '#B8860B';
      case 'bribe': return '#2E7D32';
      case 'backpack': return '#BF6B00';
      case 'panther_juice': return '#607D8B';
      case 'statue': return '#2E7D32';
      case 'machete': return '#5C8EBF';
      default: return '#9e9e9e';
    }
  }

  private getCardEmoji(): string {
    const type: string = this.card.assignedType || (this.card.def.threatType !== 'none' ? this.card.def.threatType : '') || this.card.def.type;
    switch (type) {
      case 'crocodile': return '🐊';
      case 'spider': return '🕷';
      case 'scorpion': return '🦂';
      case 'piranha': return '🐟';
      case 'snake': return '🐍';
      case 'chupacabra': return '🐐';
      case 'split': return '✨';
      case 'bribe': return '💰';
      case 'backpack': return '🎒';
      case 'panther_juice': return '🥤';
      case 'statue': return '🗿';
      case 'machete': return '🔪';
      default: return '';
    }
  }

  setHighlighted(highlighted: boolean): void {
    this.options.highlighted = highlighted;
    this.updateVisuals();
  }

  setFaceDown(faceDown: boolean): void {
    this.options.faceDown = faceDown;
    this.updateVisuals();
  }

  getCard(): CardInstance {
    return this.card;
  }

  destroy(): void {
    this.node.destroy();
  }
}
