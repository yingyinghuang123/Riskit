const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const CARD_W = 731;
const CARD_H = 1024;
const BASE = path.join(__dirname, 'assets/ris');

const PATHS = {
  bg: () => path.join(BASE, 'bg/crocodile.jpeg'),
  treasure: (val) => path.join(BASE, `treasure/${val}.png`),
  threat: (val) => path.join(BASE, `numbers/${val}.png`),
  deathWish: path.join(BASE, 'deathwish.png'),
};

// 鳄鱼 18张: 普通15张(威胁4, 宝藏 5x6 + 3x6 + 2x3) + 死亡愿望3张(威胁0)
const CARDS = [];
let id = 37;
for (let i = 0; i < 6; i++) CARDS.push({ id: id++, kind: '普通', threat: 4, treasure: 5 });
for (let i = 0; i < 6; i++) CARDS.push({ id: id++, kind: '普通', threat: 4, treasure: 3 });
for (let i = 0; i < 3; i++) CARDS.push({ id: id++, kind: '普通', threat: 4, treasure: 2 });
for (let i = 0; i < 3; i++) CARDS.push({ id: id++, kind: '死亡愿望', threat: 0, treasure: 0 });

async function renderCard(card) {
  const canvas = createCanvas(CARD_W, CARD_H);
  const ctx = canvas.getContext('2d');

  // 底图
  const bgImg = await loadImage(PATHS.bg());
  ctx.drawImage(bgImg, 0, 0, CARD_W, CARD_H);

  if (card.kind === '普通') {
    // 宝藏值（左上角偏右）
    const treasureImg = await loadImage(PATHS.treasure(card.treasure));
    const tH = CARD_H * 0.30;
    const tScale = tH / treasureImg.height;
    const tW = treasureImg.width * tScale;
    ctx.drawImage(treasureImg, CARD_W * 0.12, 0, tW, tH);

    // 威胁值（偏中间）
    const threatImg = await loadImage(PATHS.threat(card.threat));
    const thrH = CARD_H * 0.25;
    const thrScale = thrH / threatImg.height;
    const thrW = threatImg.width * thrScale;
    const x = CARD_W * 0.58 - thrW / 2;
    const y = CARD_H * 0.06;
    ctx.drawImage(threatImg, x, y, thrW, thrH);
  } else if (card.kind === '死亡愿望') {
    // 死亡愿望标识（与宝藏值同一位置）
    const dwImg = await loadImage(PATHS.deathWish);
    const dwH = CARD_H * 0.30;
    const dwScale = dwH / dwImg.height;
    const dwW = dwImg.width * dwScale;
    ctx.drawImage(dwImg, CARD_W * 0.12, 0, dwW, dwH);

    // 威胁值0（偏中间）
    const threatImg = await loadImage(PATHS.threat(0));
    const thrH = CARD_H * 0.25;
    const thrScale = thrH / threatImg.height;
    const thrW = threatImg.width * thrScale;
    const x = CARD_W * 0.58 - thrW / 2;
    const y = CARD_H * 0.06;
    ctx.drawImage(threatImg, x, y, thrW, thrH);
  }

  return canvas;
}

async function main() {
  const outDir = path.join(__dirname, 'output/鳄鱼');
  fs.mkdirSync(outDir, { recursive: true });

  for (const card of CARDS) {
    const canvas = await renderCard(card);
    const fileName = `${String(card.id).padStart(2, '0')}_鳄鱼_${card.kind}_T${card.threat}_V${card.treasure}.png`;
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(outDir, fileName), buf);
    console.log(`✓ ${fileName}`);
  }
  console.log(`\n完成！共 ${CARDS.length} 张，输出到 output/鳄鱼/`);
}

main().catch(e => { console.error(e); process.exit(1); });
