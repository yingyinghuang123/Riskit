import { CardDef, ThreatType } from './types';

/**
 * RISKiT 卡牌数据
 * 基于官方规则书定义的正确分布
 */

function generateBaseCards(): CardDef[] {
  const cards: CardDef[] = [];
  let id = 0;

  // === 鳄鱼 18张 ===
  // 15张普通牌（威胁值=4）
  // 宝藏值分布：2×3, 3×3, 5×9
  const crocodileTreasures = [
    ...Array(3).fill(2),
    ...Array(3).fill(3),
    ...Array(9).fill(5),
  ];
  crocodileTreasures.forEach(tv => {
    cards.push({ id: `crocodile_${id++}`, type: 'threat', threatType: 'crocodile', threatValue: 4, treasureValue: tv });
  });
  // 3张死亡愿望（威胁值=0, 宝藏值=0）
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `crocodile_${id++}`, type: 'threat', threatType: 'crocodile', threatValue: 0, treasureValue: 0, special: 'deathwish' });
  }

  // === 蜘蛛 18张 ===
  // 10张普通牌（威胁值=2）+ 5张普通牌（威胁值=5）+ 3张鸡毛牌（威胁值=5, 宝藏值=0）
  // 15张有宝藏的牌分布：2×3, 3×3, 5×9
  const spiderTreasures = [
    ...Array(3).fill(2),
    ...Array(3).fill(3),
    ...Array(9).fill(5),
  ];
  // 前10张 th=2
  spiderTreasures.slice(0, 10).forEach(tv => {
    cards.push({ id: `spider_${id++}`, type: 'threat', threatType: 'spider', threatValue: 2, treasureValue: tv });
  });
  // 接下来5张 th=5
  spiderTreasures.slice(10, 15).forEach(tv => {
    cards.push({ id: `spider_${id++}`, type: 'threat', threatType: 'spider', threatValue: 5, treasureValue: tv });
  });
  // 3张鸡毛牌 th=5, tv=0
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `spider_${id++}`, type: 'threat', threatType: 'spider', threatValue: 5, treasureValue: 0, special: 'chicken_feather' });
  }

  // === 蝎子 18张 ===
  // 10张普通牌（威胁值=2）+ 5张普通牌（威胁值=5）+ 3张鸡毛牌（威胁值=5, 宝藏值=0）
  // 15张有宝藏的牌分布：2×3, 3×6, 5×6
  const scorpionTreasures = [
    ...Array(3).fill(2),
    ...Array(6).fill(3),
    ...Array(6).fill(5),
  ];
  // 前10张 th=2
  scorpionTreasures.slice(0, 10).forEach(tv => {
    cards.push({ id: `scorpion_${id++}`, type: 'threat', threatType: 'scorpion', threatValue: 2, treasureValue: tv });
  });
  // 接下来5张 th=5
  scorpionTreasures.slice(10, 15).forEach(tv => {
    cards.push({ id: `scorpion_${id++}`, type: 'threat', threatType: 'scorpion', threatValue: 5, treasureValue: tv });
  });
  // 3张鸡毛牌 th=5, tv=0
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `scorpion_${id++}`, type: 'threat', threatType: 'scorpion', threatValue: 5, treasureValue: 0, special: 'chicken_feather' });
  }

  // === 食人鱼 18张 ===
  // 全部普通牌（威胁值=3）
  // 宝藏值分布：2×8, 3×5, 5×5
  const piranhaTreasures = [
    ...Array(8).fill(2),
    ...Array(5).fill(3),
    ...Array(5).fill(5),
  ];
  piranhaTreasures.forEach(tv => {
    cards.push({ id: `piranha_${id++}`, type: 'threat', threatType: 'piranha', threatValue: 3, treasureValue: tv });
  });

  // === 蛇 18张 ===
  // 全部普通牌（威胁值=3）
  // 宝藏值分布：2×8, 3×5, 5×5
  const snakeTreasures = [
    ...Array(8).fill(2),
    ...Array(5).fill(3),
    ...Array(5).fill(5),
  ];
  snakeTreasures.forEach(tv => {
    cards.push({ id: `snake_${id++}`, type: 'threat', threatType: 'snake', threatValue: 3, treasureValue: tv });
  });

  // === 分裂牌 4张 ===
  // 由食人鱼和蛇构成，威胁值=3, 宝藏值=2
  for (let i = 0; i < 4; i++) {
    cards.push({
      id: `split_${i}`,
      type: 'split',
      threatType: 'none',
      threatValue: 3,
      treasureValue: 2,
      splitTypes: ['piranha', 'snake'],
    });
  }

  return cards;
}

function generateOptionalCards(): CardDef[] {
  const cards: CardDef[] = [];

  // 3 贿赂（宝藏值=4）
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `bribe_${i}`, type: 'bribe', threatType: 'none', threatValue: 0, treasureValue: 4 });
  }
  // 3 背包（宝藏值=1）
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `backpack_${i}`, type: 'backpack', threatType: 'none', threatValue: 0, treasureValue: 1 });
  }
  // 3 黑豹汁（宝藏值=4）
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `panther_juice_${i}`, type: 'panther_juice', threatType: 'none', threatValue: 0, treasureValue: 4 });
  }
  // 3 厄运雕像（宝藏值=9）
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `statue_${i}`, type: 'statue', threatType: 'none', threatValue: 0, treasureValue: 9 });
  }
  // 3 砍刀（宝藏值=1）
  for (let i = 0; i < 3; i++) {
    cards.push({ id: `machete_${i}`, type: 'machete', threatType: 'none', threatValue: 0, treasureValue: 1 });
  }
  // 1 卓柏卡布拉
  cards.push({ id: 'chupacabra', type: 'threat', threatType: 'chupacabra', threatValue: 0, treasureValue: 0 });

  return cards;
}

export const BASE_CARDS = generateBaseCards();
export const OPTIONAL_CARDS = generateOptionalCards();
export const ALL_CARDS = [...BASE_CARDS, ...OPTIONAL_CARDS];
