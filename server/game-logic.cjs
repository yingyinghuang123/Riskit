'use strict';

// ==============================
// RISKiT 共享游戏逻辑（前后端通用）
// 更新于 2026-06：完整功能牌系统
// ==============================

const THREAT_TYPES = ['crocodile', 'spider', 'scorpion', 'piranha', 'snake'];
const THREAT_NAMES = { crocodile: '鳄鱼', spider: '蜘蛛', scorpion: '蝎子', piranha: '食人鱼', snake: '毒蛇' };

// --- 基础牌组生成 (94张基础威胁 + 4张分裂 + 6张特殊效果 = 108张) ---
function genCards() {
  const c = [];
  let id = 0;

  // 鳄鱼 18张：15普通(th=4) + 3死亡愿望(th=0,tv=0)
  const crocodileTreasures = [2,2,2, 3,3,3, 5,5,5,5,5,5,5,5,5];
  crocodileTreasures.forEach(tv => {
    c.push({ id: `crocodile_${id++}`, type: 'threat', threatType: 'crocodile', threatValue: 4, treasureValue: tv, special: null });
  });
  for (let i = 0; i < 3; i++) {
    c.push({ id: `crocodile_${id++}`, type: 'threat', threatType: 'crocodile', threatValue: 0, treasureValue: 0, special: 'deathwish' });
  }

  // 蜘蛛 18张：10普通(th=2) + 5普通(th=5) + 3鸡毛(th=5,tv=0)
  const spiderTreasures = [2,2,2, 3,3,3, 5,5,5,5,5,5,5,5,5];
  spiderTreasures.slice(0, 10).forEach(tv => {
    c.push({ id: `spider_${id++}`, type: 'threat', threatType: 'spider', threatValue: 2, treasureValue: tv, special: null });
  });
  spiderTreasures.slice(10, 15).forEach(tv => {
    c.push({ id: `spider_${id++}`, type: 'threat', threatType: 'spider', threatValue: 5, treasureValue: tv, special: null });
  });
  for (let i = 0; i < 3; i++) {
    c.push({ id: `spider_${id++}`, type: 'threat', threatType: 'spider', threatValue: 5, treasureValue: 0, special: 'chicken_feather' });
  }

  // 蝎子 18张：10普通(th=2) + 5普通(th=5) + 3鸡毛(th=5,tv=0)
  const scorpionTreasures = [2,2,2, 3,3,3,3,3,3, 5,5,5,5,5,5];
  scorpionTreasures.slice(0, 10).forEach(tv => {
    c.push({ id: `scorpion_${id++}`, type: 'threat', threatType: 'scorpion', threatValue: 2, treasureValue: tv, special: null });
  });
  scorpionTreasures.slice(10, 15).forEach(tv => {
    c.push({ id: `scorpion_${id++}`, type: 'threat', threatType: 'scorpion', threatValue: 5, treasureValue: tv, special: null });
  });
  for (let i = 0; i < 3; i++) {
    c.push({ id: `scorpion_${id++}`, type: 'threat', threatType: 'scorpion', threatValue: 5, treasureValue: 0, special: 'chicken_feather' });
  }

  // 食人鱼 18张：全部(th=3)
  const piranhaTreasures = [2,2,2,2,2,2,2,2, 3,3,3,3,3, 5,5,5,5,5];
  piranhaTreasures.forEach(tv => {
    c.push({ id: `piranha_${id++}`, type: 'threat', threatType: 'piranha', threatValue: 3, treasureValue: tv, special: null });
  });

  // 蛇 18张：全部(th=3)
  const snakeTreasures = [2,2,2,2,2,2,2,2, 3,3,3,3,3, 5,5,5,5,5];
  snakeTreasures.forEach(tv => {
    c.push({ id: `snake_${id++}`, type: 'threat', threatType: 'snake', threatValue: 3, treasureValue: tv, special: null });
  });

  // 分裂牌 4张
  for (let i = 0; i < 4; i++) {
    c.push({ id: `split_${i}`, type: 'split', splitTypes: ['piranha', 'snake'], threatType: 'none', threatValue: 3, treasureValue: 2, special: null });
  }

  return c;
}

// --- 功能牌生成 (16张) ---
function genOptionalCards() {
  const c = [];
  // 3 贿赂
  for (let i = 0; i < 3; i++) {
    c.push({ id: `bribe_${i}`, type: 'bribe', threatType: 'none', threatValue: 0, treasureValue: 4, special: null });
  }
  // 3 背包
  for (let i = 0; i < 3; i++) {
    c.push({ id: `backpack_${i}`, type: 'backpack', threatType: 'none', threatValue: 0, treasureValue: 1, special: null });
  }
  // 3 黑豹汁
  for (let i = 0; i < 3; i++) {
    c.push({ id: `panther_juice_${i}`, type: 'panther_juice', threatType: 'none', threatValue: 0, treasureValue: 4, special: null });
  }
  // 3 厄运雕像
  for (let i = 0; i < 3; i++) {
    c.push({ id: `statue_${i}`, type: 'statue', threatType: 'none', threatValue: 0, treasureValue: 9, special: null });
  }
  // 3 砍刀
  for (let i = 0; i < 3; i++) {
    c.push({ id: `machete_${i}`, type: 'machete', threatType: 'none', threatValue: 0, treasureValue: 1, special: null });
  }
  // 1 卓柏卡布拉
  c.push({ id: 'chupacabra', type: 'threat', threatType: 'chupacabra', threatValue: 0, treasureValue: 0, special: null });
  return c;
}

const BASE_CARDS = genCards();
const OPTIONAL_CARDS = genOptionalCards();
const ALL_CARDS = [...BASE_CARDS, ...OPTIONAL_CARDS];

// --- 工具函数 ---
function shuffle(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

// --- 游戏状态创建 ---
function createGame(playerIds, playerNames, includeOptional) {
  const ps = playerIds.map(id => ({
    id,
    name: playerNames[id] || id,
    outsideCards: [],
    dangerZoneCards: [],
    scorePile: [],
    collectedBackpacks: [],
    collectedMachetes: [],
    exitToken: null,
    isPantherJuiced: false,
    isActive: false,
    hasBusted: false
  }));
  return {
    gameId: Math.random().toString(36).slice(2),
    players: ps,
    currentRound: null,
    roundNumber: 0,
    phase: 'waiting',
    includeOptionalCards: includeOptional !== false
  };
}

// --- 回合管理 ---
function startRound(st) {
  const rn = st.roundNumber + 1;
  if (rn > 5) return { ...st, phase: 'game_over' };
  const cardsToUse = st.includeOptionalCards ? ALL_CARDS : BASE_CARDS;
  const deck = shuffle(cardsToUse);
  const ps = st.players.map(p => ({
    ...p,
    outsideCards: [],
    dangerZoneCards: [],
    exitToken: null,
    isPantherJuiced: false,
    isActive: true,
    hasBusted: false
  }));
  const et = [];
  for (let i = ps.length; i >= 2; i--) et.push({ number: i, isCoffin: false, isPanther: false });
  return {
    ...st,
    currentRound: {
      roundNumber: rn,
      deck,
      discardPile: [],
      centerCards: [],
      players: ps,
      exitTokens: et,
      currentPlayerIndex: 0,
      phase: 'draw',
      lastDrawnCard: null,
      collectingPlayerIndex: 0,
      consecutiveCollections: 0,
      inputRequest: null,
      drawnCardsThisRound: []
    },
    roundNumber: rn,
    phase: 'playing'
  };
}

// --- 威胁 & 危险区 ---
function getPlayerThreats(p) {
  const m = new Map();
  [...p.outsideCards, ...p.dangerZoneCards].forEach(c => {
    const t = c.assignedType || c.def.threatType;
    if (t === 'none') return;
    let val = c.def.threatValue;
    // 卓柏卡布拉：累加吞入卡的威胁值
    if (t === 'chupacabra' && c.tuckedCards) {
      val += c.tuckedCards.reduce((s, tc) => s + tc.def.threatValue, 0);
    }
    m.set(t, (m.get(t) || 0) + val);
  });
  return m;
}

function updateDZ(p, lastDrawnType) {
  const t = getPlayerThreats(p);
  let mx = -1, mt = null;
  t.forEach((v, k) => {
    if (v > mx) { mx = v; mt = k; }
    else if (v === mx && k === lastDrawnType) { mt = k; }
  });
  const all = [...p.outsideCards, ...p.dangerZoneCards];
  if (mt) {
    p.dangerZoneCards = all.filter(c => (c.assignedType || c.def.threatType) === mt);
    p.outsideCards = all.filter(c => (c.assignedType || c.def.threatType) !== mt);
  } else {
    p.dangerZoneCards = [];
    p.outsideCards = all;
  }
}

function getDZStacks(rd) {
  const m = new Map();
  rd.players.forEach(p => {
    [...p.outsideCards, ...p.dangerZoneCards].forEach(c => {
      const t = c.assignedType || c.def.threatType;
      if (t === 'none') return;
      if (!m.has(t)) m.set(t, []);
      m.get(t).push(c);
    });
  });
  return Array.from(m.entries()).map(([t, cs]) => {
    let totalValue = 0;
    cs.forEach(c => {
      totalValue += c.def.threatValue;
      if (t === 'chupacabra' && c.tuckedCards) {
        totalValue += c.tuckedCards.reduce((s, tc) => s + tc.def.threatValue, 0);
      }
    });
    return { threatType: t, cards: cs, totalValue };
  });
}

function checkBusts(rd) {
  return getDZStacks(rd).filter(s => s.totalValue > 12).map(s => s.threatType);
}

function handleBust(rd, p) {
  p.isActive = false;
  p.hasBusted = true;
  const tk = rd.exitTokens.shift();
  if (tk) p.exitToken = { ...tk, isCoffin: true };
  if (p.dangerZoneCards.some(c => c.def.special === 'deathwish')) {
    p.scorePile.push(...p.dangerZoneCards);
    p.dangerZoneCards = [];
  }
}

function nextP(rd) {
  const s = rd.currentPlayerIndex;
  do { rd.currentPlayerIndex = (rd.currentPlayerIndex + 1) % rd.players.length; }
  while (!rd.players[rd.currentPlayerIndex].isActive && rd.currentPlayerIndex !== s);
}

// --- 卡牌结算（含功能牌） ---
function resolveCard(st, card) {
  const rd = st.currentRound, p = rd.players.find(x => x.id === card.ownerId);

  switch (card.def.type) {
    case 'threat': {
      if (card.def.threatType === 'chupacabra') {
        // 卓柏卡布拉：放入外部区，初始化吞牌列表
        p.outsideCards.push(card);
        card.tuckedCards = [];
      } else {
        // 普通威胁卡：检查是否有卓柏卡布拉可以吞入
        const chupa = p.outsideCards.find(c => c.def.threatType === 'chupacabra') ||
                      p.dangerZoneCards.find(c => c.def.threatType === 'chupacabra');
        if (chupa && chupa.tuckedCards) {
          chupa.tuckedCards.push(card);
        } else {
          p.outsideCards.push(card);
        }
      }
      updateDZ(p, card.assignedType || card.def.threatType);
      return bustCont(st, card);
    }

    case 'split': {
      rd.phase = 'resolve';
      const options = card.def.splitTypes || ['piranha', 'snake'];
      rd.inputRequest = { playerId: p.id, type: 'choose_split_type', options, cardId: card.id };
      return { state: st, drawnCard: card, needsInput: rd.inputRequest };
    }

    case 'statue': {
      rd.centerCards.push(card);
      // 集满2张厄运雕像：全员爆牌
      if (rd.centerCards.filter(c => c.def.type === 'statue').length >= 2) {
        rd.players.filter(x => x.isActive).forEach(x => handleBust(rd, x));
        rd.players.forEach(x => { if (x.isPantherJuiced) x.isPantherJuiced = false; });
      }
      return finTurn(st, card);
    }

    case 'backpack':
    case 'machete': {
      rd.centerCards.push(card);
      return finTurn(st, card);
    }

    case 'bribe': {
      // 贿赂：选择一个非豹汁标记的活跃玩家
      const targets = rd.players.filter(x => x.isActive && x.id !== p.id && !x.isPantherJuiced);
      if (targets.length === 0) {
        rd.discardPile.push(card.def);
        return finTurn(st, card);
      }
      rd.phase = 'resolve';
      rd.inputRequest = { playerId: p.id, type: 'choose_panther_target', options: targets.map(t => t.id), cardId: card.id, cardType: 'bribe' };
      return { state: st, drawnCard: card, needsInput: rd.inputRequest };
    }

    case 'panther_juice': {
      // 黑豹汁：选择目标玩家标记
      const targets = rd.players.filter(x => x.isActive && x.id !== p.id);
      if (targets.length === 0) {
        rd.discardPile.push(card.def);
        return finTurn(st, card);
      }
      rd.phase = 'resolve';
      rd.inputRequest = { playerId: p.id, type: 'choose_panther_target', options: targets.map(t => t.id), cardId: card.id, cardType: 'panther_juice' };
      return { state: st, drawnCard: card, needsInput: rd.inputRequest };
    }

    default:
      return finTurn(st, card);
  }
}

function bustCont(st, card) {
  const rd = st.currentRound, bt = checkBusts(rd);
  if (bt.length > 0) {
    rd.players.filter(p => p.isActive && [...p.outsideCards, ...p.dangerZoneCards].some(c => bt.includes(c.assignedType || c.def.threatType)))
      .forEach(p => handleBust(rd, p));
    rd.players.forEach(p => { if (p.isPantherJuiced) p.isPantherJuiced = false; });
  }
  return finTurn(st, card);
}

function finTurn(st, card) {
  const rd = st.currentRound;
  if (rd.players.every(p => !p.isActive)) return startColl(st, card);
  nextP(rd);
  rd.phase = 'exit_window';
  return { state: st, drawnCard: card };
}

function startColl(st, card) {
  const rd = st.currentRound;
  if (rd.players.every(p => p.hasBusted)) {
    rd.phase = 'round_end';
  } else {
    rd.players.forEach(p => {
      p.outsideCards.forEach(c => rd.discardPile.push(c.def));
      p.outsideCards = [];
      const noTreasure = p.dangerZoneCards.filter(c => c.def.treasureValue === 0);
      noTreasure.forEach(c => rd.discardPile.push(c.def));
      p.dangerZoneCards = p.dangerZoneCards.filter(c => c.def.treasureValue > 0);
    });
    rd.phase = 'collecting';
    rd.collectingPlayerIndex = 0;
    rd.consecutiveCollections = 0;
  }
  return { state: st, drawnCard: card };
}

// --- 玩家操作 ---
function playerExit(st, pid) {
  const rd = st.currentRound;
  if (!rd || rd.phase !== 'exit_window') return st;
  const p = rd.players.find(x => x.id === pid);
  if (!p || !p.isActive || p.isPantherJuiced) return st;
  p.isActive = false;
  // 退出时弃掉鸡毛牌
  const fe = p.dangerZoneCards.filter(c => c.def.special === 'chicken_feather');
  if (fe.length > 0) {
    p.dangerZoneCards = p.dangerZoneCards.filter(c => c.def.special !== 'chicken_feather');
    fe.forEach(f => rd.discardPile.push(f.def));
  }
  const tk = rd.exitTokens.shift();
  if (tk) p.exitToken = tk;
  if (rd.exitTokens.length === 0) {
    const lp = rd.players.find(x => x.isActive);
    if (lp) {
      lp.isActive = false;
      lp.exitToken = { number: 1, isCoffin: lp.hasBusted, isPanther: true };
    }
  }
  if (rd.players.every(x => !x.isActive)) {
    startColl(st, rd.lastDrawnCard);
  } else {
    if (!rd.players[rd.currentPlayerIndex].isActive) nextP(rd);
    rd.phase = 'draw';
  }
  return st;
}

function drawCard(st) {
  const rd = st.currentRound;
  if (!rd || (rd.phase !== 'draw' && rd.phase !== 'machete_window')) return { state: st };

  // 砍刀窗口：检查是否有活跃玩家持有砍刀
  if (rd.phase === 'draw') {
    const pWithMachete = rd.players.filter(p => p.isActive && p.collectedMachetes && p.collectedMachetes.length > 0);
    if (pWithMachete.length > 0) {
      rd.phase = 'machete_window';
      rd.inputRequest = { playerId: pWithMachete[0].id, type: 'choose_machete_use', options: ['yes', 'no'] };
      return { state: st, needsInput: rd.inputRequest };
    }
  }

  const cd = rd.deck.shift();
  if (!cd) return { state: st };
  const p = rd.players[rd.currentPlayerIndex];
  const ci = { id: `${cd.id}_${Date.now()}`, def: cd, ownerId: p.id };
  rd.lastDrawnCard = ci;
  rd.drawnCardsThisRound.push(ci);
  return resolveCard(st, ci);
}

function collectTreasure(st, pid, target) {
  const rd = st.currentRound;
  if (!rd || rd.phase !== 'collecting') return st;
  const sp = rd.players.filter(p => p.exitToken && !p.exitToken.isCoffin)
    .sort((a, b) => a.exitToken.number - b.exitToken.number);
  const cp = sp[rd.collectingPlayerIndex];
  if (!cp || cp.id !== pid) return st;

  if (target === 'center') {
    const c = rd.centerCards.shift();
    if (c) {
      if (c.def.type === 'backpack') {
        if (!cp.collectedBackpacks) cp.collectedBackpacks = [];
        cp.collectedBackpacks.push(c);
      } else if (c.def.type === 'machete') {
        if (!cp.collectedMachetes) cp.collectedMachetes = [];
        cp.collectedMachetes.push(c);
      } else {
        cp.scorePile.push(c);
      }
    }
  } else {
    const tp = rd.players.find(p => p.id === target);
    if (tp && tp.dangerZoneCards.length > 0) {
      cp.scorePile.push(...tp.dangerZoneCards);
      tp.dangerZoneCards = [];
    }
  }

  // 背包额外收集检查
  if (cp.collectedBackpacks && cp.collectedBackpacks.length > 0 && rd.consecutiveCollections === 0) {
    rd.inputRequest = { playerId: cp.id, type: 'choose_backpack_use', options: ['yes', 'no'] };
    return st;
  }

  rd.consecutiveCollections = 0;
  moveNext(rd);
  return st;
}

function moveNext(rd) {
  const sp = rd.players.filter(p => p.exitToken && !p.exitToken.isCoffin)
    .sort((a, b) => a.exitToken.number - b.exitToken.number);
  if (sp.length === 0) { rd.phase = 'round_end'; return; }
  rd.collectingPlayerIndex = (rd.collectingPlayerIndex + 1) % sp.length;
  if (!rd.players.some(p => p.dangerZoneCards.length > 0) && rd.centerCards.length === 0)
    rd.phase = 'round_end';
}

function resolveInput(st, inp) {
  const rd = st.currentRound;
  if (!rd) return st;
  rd.inputRequest = null;
  const p = rd.players.find(x => x.id === inp.playerId);

  switch (inp.type) {
    case 'choose_split_type': {
      if (rd.lastDrawnCard) {
        rd.lastDrawnCard.assignedType = inp.value;
        p.outsideCards.push(rd.lastDrawnCard);
        updateDZ(p, inp.value);
        const bt = checkBusts(rd);
        if (bt.length > 0) {
          rd.players.filter(x => x.isActive && x.dangerZoneCards.some(c => bt.includes(c.assignedType || c.def.threatType)))
            .forEach(x => handleBust(rd, x));
          rd.players.forEach(x => { if (x.isPantherJuiced) x.isPantherJuiced = false; });
        }
        if (rd.players.every(x => !x.isActive)) {
          startColl(st, rd.lastDrawnCard);
        } else {
          nextP(rd);
          rd.phase = 'exit_window';
        }
      }
      break;
    }

    case 'choose_panther_target': {
      const target = rd.players.find(x => x.id === inp.value);
      if (!target) break;
      const cardType = (rd.lastDrawnCard && rd.lastDrawnCard.def.type) || inp.cardType;
      if (cardType === 'panther_juice') {
        target.isPantherJuiced = true;
      } else if (cardType === 'bribe') {
        // 贿赂：夺取目标危险区的所有牌
        const dzCards = [...target.dangerZoneCards];
        p.outsideCards.push(...dzCards);
        target.dangerZoneCards = [];
        updateDZ(p, undefined);
      }
      nextP(rd);
      rd.phase = 'exit_window';
      break;
    }

    case 'choose_machete_use': {
      if (inp.value === 'yes') {
        if (!p.collectedMachetes) p.collectedMachetes = [];
        const machete = p.collectedMachetes.shift();
        if (machete) rd.discardPile.push(machete.def);
        // 跳过当前抽牌（消耗牌堆顶一张）
        const skipped = rd.deck.shift();
        if (skipped) rd.discardPile.push(skipped);
      }
      rd.phase = 'draw';
      break;
    }

    case 'choose_backpack_use': {
      if (inp.value === 'yes' && p.collectedBackpacks && p.collectedBackpacks.length > 0) {
        const bp = p.collectedBackpacks.shift();
        if (bp) rd.discardPile.push(bp.def);
        rd.consecutiveCollections = 1;
        // 允许再次收集（不移动到下一位）
      } else {
        rd.consecutiveCollections = 0;
        moveNext(rd);
      }
      break;
    }
  }

  return st;
}

// --- 查询函数 ---
function getScores(st) {
  return st.players.map(p => ({
    playerId: p.id,
    name: p.name,
    score: p.scorePile.reduce((s, c) => s + c.def.treasureValue, 0),
    cardCount: p.scorePile.length
  }));
}

function getCurTreasure(rd) {
  if (!rd) return 0;
  return rd.drawnCardsThisRound.reduce((s, c) => s + c.def.treasureValue, 0);
}

function getScore(st, pid) {
  const p = st.players.find(x => x.id === pid);
  return p ? p.scorePile.reduce((s, c) => s + c.def.treasureValue, 0) : 0;
}

// --- AI 决策 ---
function aiDecide(rd, aid) {
  const p = rd.players.find(x => x.id === aid);
  if (!p || !p.isActive) return null;

  // 处理 inputRequest
  if (rd.inputRequest && rd.inputRequest.playerId === aid) {
    switch (rd.inputRequest.type) {
      case 'choose_split_type':
        return { type: 'choose_split', playerId: aid, data: rd.inputRequest.options[Math.floor(Math.random() * rd.inputRequest.options.length)] };
      case 'choose_panther_target':
        return { type: 'choose_panther_target', playerId: aid, data: rd.inputRequest.options[Math.floor(Math.random() * rd.inputRequest.options.length)] };
      case 'choose_machete_use':
        return { type: 'choose_machete_use', playerId: aid, data: Math.random() > 0.5 ? 'yes' : 'no' };
      case 'choose_backpack_use':
        return { type: 'choose_backpack_use', playerId: aid, data: 'yes' };
    }
  }

  if (rd.phase === 'exit_window') {
    const th = getPlayerThreats(p);
    let mx = 0;
    th.forEach(v => { if (v > mx) mx = v; });
    const r = Math.random();
    let ex = false;
    if (mx >= 10) ex = r < 0.8;
    else if (mx >= 8) ex = r < 0.4;
    else if (mx >= 6) ex = r < 0.15;
    if (ex) return { type: 'exit', playerId: aid };
    if (rd.players[rd.currentPlayerIndex]?.id === aid)
      return { type: 'draw', playerId: aid };
    return null;
  }

  if (rd.players[rd.currentPlayerIndex]?.id !== aid) return null;
  if (rd.phase === 'draw') return { type: 'draw', playerId: aid };

  if (rd.phase === 'collecting') {
    const sp = rd.players.filter(x => x.exitToken && !x.exitToken.isCoffin)
      .sort((a, b) => a.exitToken.number - b.exitToken.number);
    if (sp[rd.collectingPlayerIndex]?.id === aid) {
      // 优先选宝藏值最高的牌堆
      const targets = rd.players.filter(x => x.dangerZoneCards.length > 0);
      if (targets.length > 0) {
        const bestTarget = targets.sort((a, b) =>
          b.dangerZoneCards.reduce((s, c) => s + c.def.treasureValue, 0) -
          a.dangerZoneCards.reduce((s, c) => s + c.def.treasureValue, 0)
        )[0];
        return { type: 'collect_treasure', playerId: aid, data: bestTarget.id };
      }
      if (rd.centerCards.length > 0) {
        return { type: 'collect_treasure', playerId: aid, data: 'center' };
      }
    }
  }
  return null;
}

// --- 导出 ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    THREAT_TYPES, THREAT_NAMES, BASE_CARDS, OPTIONAL_CARDS, ALL_CARDS,
    genCards, genOptionalCards, shuffle, createGame, startRound,
    getPlayerThreats, updateDZ, getDZStacks, checkBusts, handleBust, nextP,
    resolveCard, bustCont, finTurn, startColl,
    playerExit, drawCard, collectTreasure, moveNext, resolveInput,
    getScores, getCurTreasure, getScore, aiDecide
  };
}
