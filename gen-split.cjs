const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const CARD_W = 731;
const CARD_H = 1024;
const BASE = path.join(__dirname, 'assets/ris');

const PATHS = {
  bg1: () => path.join(BASE, 'bg/snake.jpeg'),
  bg2: () => path.join(BASE, 'bg/piranha.jpeg'),
  treasure: (val) => path.join(BASE, `treasure/${val}.png`),
  threat: (val) => path.join(BASE, `numbers/${val}.png`),
};

// 分裂牌 4张: 蛇+食人鱼, 威胁3/3, 宝藏2
const CARDS = [
  { id: 91, threat1: 3, threat2: 3, treasure: 2 },
  { id: 92, threat1: 3, threat2: 3, treasure: 2 },
  { id: 93, threat1: 3, threat2: 3, treasure: 2 },
  { id: 94, threat1: 3, threat2: 3, treasure: 2 },
];

async function renderCard(card) {
  const canvas = createCanvas(CARD_W, CARD_H);
  const ctx = canvas.getContext('2d');

  const bg1 = await loadImage(PATHS.bg1());
  const bg2 = await loadImage(PATHS.bg2());

  // === 上半区域（左上梯形）：蛇 ===
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(CARD_W, 0);
  ctx.lineTo(CARD_W, CARD_H * 0.65);
  ctx.lineTo(0, CARD_H * 0.35);
  ctx.closePath();
  ctx.clip();
  const bg1OffsetY = -CARD_H * 0.15;
  ctx.drawImage(bg1, 0, bg1OffsetY, CARD_W, CARD_H);
  ctx.restore();

  // === 下半区域（右下梯形）：食人鱼，旋转180° ===
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, CARD_H * 0.35);
  ctx.lineTo(CARD_W, CARD_H * 0.65);
  ctx.lineTo(CARD_W, CARD_H);
  ctx.lineTo(0, CARD_H);
  ctx.closePath();
  ctx.clip();
  ctx.translate(CARD_W, CARD_H);
  ctx.rotate(Math.PI);
  ctx.drawImage(bg2, 0, 0, CARD_W, CARD_H);
  ctx.restore();

  // === 对角线分割线（粗黑线） ===
  ctx.save();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(0, CARD_H * 0.35);
  ctx.lineTo(CARD_W, CARD_H * 0.65);
  ctx.stroke();
  ctx.restore();

  // === 上半区域：宝藏值（左上角）+ 威胁值（偏中间） ===
  const treasureImg = await loadImage(PATHS.treasure(card.treasure));
  const treasureH = CARD_H * 0.30;
  const treasureScale = treasureH / treasureImg.height;
  const treasureW = treasureImg.width * treasureScale;
  ctx.drawImage(treasureImg, CARD_W * 0.12, 10, treasureW, treasureH);

  // 威胁值 - 偏中间
  const tImg1 = await loadImage(PATHS.threat(card.threat1));
  const threatH = CARD_H * 0.22;
  const s1 = threatH / tImg1.height;
  const w1 = tImg1.width * s1;
  const x1 = CARD_W * 0.58 - w1 / 2;
  const y1 = CARD_H * 0.03;
  ctx.drawImage(tImg1, x1, y1, w1, threatH);

  // === 下半区域：宝藏值（右下角，旋转180°）+ 威胁值（左下方，旋转180°） ===
  // 威胁值 - 左下方，旋转180°
  const tImg2 = await loadImage(PATHS.threat(card.threat2));
  const s2 = threatH / tImg2.height;
  const w2 = tImg2.width * s2;
  const x2 = CARD_W * 0.42 - w2 / 2;
  const y2 = CARD_H * 0.95 - threatH;
  ctx.save();
  ctx.translate(x2 + w2 / 2, y2 + threatH / 2);
  ctx.rotate(Math.PI);
  ctx.drawImage(tImg2, -w2 / 2, -threatH / 2, w2, threatH);
  ctx.restore();

  // 宝藏值 - 右下角，旋转180°
  ctx.save();
  const tx = CARD_W - CARD_W * 0.12 - treasureW / 2;
  const ty = CARD_H - 10 - treasureH / 2;
  ctx.translate(tx, ty);
  ctx.rotate(Math.PI);
  ctx.drawImage(treasureImg, -treasureW / 2, -treasureH / 2, treasureW, treasureH);
  ctx.restore();

  return canvas;
}

async function main() {
  const outDir = path.join(__dirname, 'output/分裂');
  fs.mkdirSync(outDir, { recursive: true });

  for (const card of CARDS) {
    const canvas = await renderCard(card);
    const fileName = `${String(card.id).padStart(2, '0')}_蛇+食人鱼_分裂_T3-3_V${card.treasure}.png`;
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outDir, fileName), buf);
    console.log(`✓ ${fileName}`);
  }
  console.log(`\n完成！共 ${CARDS.length} 张，输出到 output/分裂/`);
}

main().catch(e => { console.error(e); process.exit(1); });
