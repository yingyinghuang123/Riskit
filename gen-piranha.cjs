const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const CARD_W = 731;
const CARD_H = 1024;
const BASE = path.join(__dirname, 'assets/ris');

const PATHS = {
  bg: () => path.join(BASE, 'bg/piranha.jpeg'),
  treasure: (val) => path.join(BASE, `treasure/${val}.png`),
  threat: (val) => path.join(BASE, `numbers/${val}.png`),
};

// 食人鱼 18张: 威胁值3, 宝藏 5x3 + 3x9 + 2x6
const CARDS = [];
let id = 19;
for (let i = 0; i < 3; i++) CARDS.push({ id: id++, threat: 3, treasure: 5 });
for (let i = 0; i < 9; i++) CARDS.push({ id: id++, threat: 3, treasure: 3 });
for (let i = 0; i < 6; i++) CARDS.push({ id: id++, threat: 3, treasure: 2 });

async function renderCard(card) {
  const canvas = createCanvas(CARD_W, CARD_H);
  const ctx = canvas.getContext('2d');

  // 底图
  const bgImg = await loadImage(PATHS.bg());
  ctx.drawImage(bgImg, 0, 0, CARD_W, CARD_H);

  // 宝藏值（左上角偏右）
  const treasureImg = await loadImage(PATHS.treasure(card.treasure));
  const tH = CARD_H * 0.30;
  const tScale = tH / treasureImg.height;
  const tW = treasureImg.width * tScale;
  ctx.drawImage(treasureImg, CARD_W * 0.12, 0, tW, tH);

  // 威胁值（右上方）
  const threatImg = await loadImage(PATHS.threat(card.threat));
  const thrH = CARD_H * 0.25;
  const thrScale = thrH / threatImg.height;
  const thrW = threatImg.width * thrScale;
  const x = CARD_W * 0.58 - thrW / 2;
  const y = CARD_H * 0.06;
  ctx.drawImage(threatImg, x, y, thrW, thrH);

  return canvas;
}

async function main() {
  const outDir = path.join(__dirname, 'output/食人鱼');
  fs.mkdirSync(outDir, { recursive: true });

  for (const card of CARDS) {
    const canvas = await renderCard(card);
    const fileName = `${String(card.id).padStart(2, '0')}_食人鱼_普通_T${card.threat}_V${card.treasure}.png`;
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outDir, fileName), buf);
    console.log(`✓ ${fileName}`);
  }
  console.log(`\n完成！共 ${CARDS.length} 张，输出到 output/食人鱼/`);
}

main().catch(e => { console.error(e); process.exit(1); });
