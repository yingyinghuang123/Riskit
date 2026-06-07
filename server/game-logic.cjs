'use strict';

// ==============================
// RISKiT 共享游戏逻辑（前后端通用）
// 更新于 2026-06：匹配官方规则书卡牌分布
// ==============================

const THREAT_TYPES = ['crocodile', 'spider', 'scorpion', 'piranha', 'snake'];
const THREAT_NAMES = { crocodile: '鳄鱼', spider: '蜘蛛', scorpion: '蝎子', piranha: '食人鱼', snake: '毒蛇' };

// --- 牌组生成 ---
function genCards() {
  const c = [];
  let id = 0;

  // 鳄鱼 18张：15普通(th=4) + 3死亡愿望(th=0,tv=0)
  // 宝藏值分布：2×3, 3×3, 5×9
  const crocodileTreasures = [2,2,2, 3,3,3, 5,5,5,5,5,5,5,5,5];
  crocodileTreasures.forEach(tv => {
    c.push({ id: `crocodile_${id++}`, type: 'threat', threatType: 'crocodile', threatValue: 4, treasureValue: tv, special: null });
  });
  for (let i = 0; i < 3; i++) {
    c.push({ id: `crocodile_${id++}`, type: 'threat', threatType: 'crocodile', threatValue: 0, treasureValue: 0, special: 'deathwish' });
  }

  // 蜘蛛 18张：10普通(th=2) + 5普通(th=5) + 3鸡毛(th=5,tv=0)
  // 有宝藏15张分布：2×3, 3×3, 5×9
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
  // 有宝藏15张分布：2×3, 3×6, 5×6
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

  // 食人鱼 18张：全部(th=3)，宝藏分布：2×8, 3×5, 5×5
  const piranhaTreasures = [2,2,2,2,2,2,2,2, 3,3,3,3,3, 5,5,5,5,5];
  piranhaTreasures.forEach(tv => {
    c.push({ id: `piranha_${id++}`, type: 'threat', threatType: 'piranha', threatValue: 3, treasureValue: tv, special: null });
  });

  // 蛇 18张：全部(th=3)，宝藏分布：2×8, 3×5, 5×5
  const snakeTreasures = [2,2,2,2,2,2,2,2, 3,3,3,3,3, 5,5,5,5,5];
  snakeTreasures.forEach(tv => {
    c.push({ id: `snake_${id++}`, type: 'threat', threatType: 'snake', threatValue: 3, treasureValue: tv, special: null });
  });

  // 分裂牌 4张：食人鱼+蛇，th=3, tv=2
  for (let i = 0; i < 4; i++) {
    c.push({ id: `split_${i}`, type: 'split', splitTypes: ['piranha', 'snake'], threatType: 'none', threatValue: 3, treasureValue: 2, special: null });
  }

  return c;
}

const BASE_CARDS = genCards();

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
function createGame(playerIds, playerNames) {
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
    includeOptionalCards: false
  };
}

// --- 回合管理 ---
function startRound(st) {
  const rn = st.roundNumber + 1;
  if (rn > 5) return { ...st, phase: 'game_over' };
  const deck = shuffle(BASE_CARDS);
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
    if (c.def.type === 'split' && c.def.splitTypes) {
      // 分裂牌用 assignedType
      const t = c.assignedType || c.def.threatType;
      if (t === 'none') return;
      m.set(t, (m.get(t) || 0) + c.def.threatValue);
    } else {
      const t = c.assignedType || c.def.threatType;
      if (t === 'none') return;
      m.set(t, (m.get(t) || 0) + c.def.threatValue);
    }
  });
  return m;
}

function updateDZ(p, lastDrawnType) {
  const t = getPlayerThreats(p);
  let mx = -1, mt = null;
  t.forEach((v, k) => {
    if (v > mx) {
      mx = v; mt = k;
    } else if (v === mx && k === lastDrawnType) {
      // 相等时后抽优先
      mt = k;
    }
  });
  const all = [...p.outsideCards, ...p.dangerZoneCards];
  if (mt) {
    p.dangerZoneCards = all.filter(c => {
      const ct = c.assignedType || c.def.threatType;
      return ct === mt;
    });
    p.outsideCards = all.filter(c => {
      const ct = c.assignedType || c.def.threatType;
      return ct !== mt;
    });
  } else {
    p.dangerZoneCards = [];
    p.outsideCards = all;
  }
}

function getDZStacks(rd) {
  const m = new Map();
  rd.players.forEach(p => p.dangerZoneCards.forEach(c => {
    const t = c.assignedType || c.def.threatType;
    if (t === 'none') return;
    if (!m.has(t)) m.set(t, []);
    m.get(t).push(c);
  }));
  return Array.from(m.entries()).map(([t, cs]) => ({
    threatType: t,
    cards: cs,
    totalValue: cs.reduce((s, c) => s + c.def.threatValue, 0)
  }));
}

function checkBusts(rd) {
  return getDZStacks(rd).filter(s => s.totalValue > 12).map(s => s.threatType);
}

function handleBust(rd, p) {
  p.isActive = false;
  p.hasBusted = true;
  const tk = rd.exitTokens.shift();
  if (tk) p.exitToken = { ...tk, isCoffin: true };
  // 死亡愿望：爆牌时危险区有此牌，将所有危险区卡加入得分堆
  if (p.dangerZoneCards.some(c => c.def.special === 'deathwish')) {
    p.scorePile.push(...p.dangerZoneCards);
    p.dangerZoneCards = [];
  }
}

function nextP(rd) {
  const s = rd.currentPlayerIndex;
  do {
    rd.currentPlayerIndex = (rd.currentPlayerIndex + 1) % rd.players.length;
  } while (!rd.players[rd.currentPlayerIndex].isActive && rd.currentPlayerIndex !== s);
}

// --- 卡牌结算 ---
function resolveCard(st, card) {
  const rd = st.currentRound, p = rd.players.find(x => x.id === card.ownerId);
  if (card.def.type === 'threat') {
    p.outsideCards.push(card);
    updateDZ(p, card.assignedType || card.def.threatType);
    return bustCont(st, card);
  }
  if (card.def.type === 'split') {
    rd.phase = 'resolve';
    const options = card.def.splitTypes || ['piranha', 'snake'];
    rd.inputRequest = { playerId: p.id, type: 'choose_split_type', options, cardId: card.id };
    return { state: st, drawnCard: card, needsInput: rd.inputRequest };
  }
  return finTurn(st, card);
}

function bustCont(st, card) {
  const rd = st.currentRound, bt = checkBusts(rd);
  if (bt.length > 0) {
    rd.players.filter(p => p.isActive && p.dangerZoneCards.some(c => bt.includes(c.assignedType || c.def.threatType)))
      .forEach(p => handleBust(rd, p));
    // 有人爆牌时解除黑豹汁锁定
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
    // 收集阶段准备：弃掉外部牌和无宝藏值的牌
    rd.players.forEach(p => {
      p.outsideCards.forEach(c => rd.discardPile.push(c.def));
      p.outsideCards = [];
      const noTreasure = p.dangerZoneCards.filter(c => c.def.treasureValue === 0);
      noTreasure.forEach(c => rd.discardPile.push(c.def));
      p.dangerZoneCards = p.dangerZoneCards.filter(c => c.def.treasureValue > 0);
    });
    rd.phase = 'collecting';
    rd.collectingPlayerIndex = 0;
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
  // 最后一个退出标记被拿走时，剩余唯一玩家获得美洲豹标记
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
  if (!rd || rd.phase !== 'draw') return { state: st };
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
    if (c) cp.scorePile.push(c);
  } else {
    // 收集任何玩家面前的危险区所有牌
    const tp = rd.players.find(p => p.id === target);
    if (tp && tp.dangerZoneCards.length > 0) {
      cp.scorePile.push(...tp.dangerZoneCards);
      tp.dangerZoneCards = [];
    }
  }
  moveNext(rd);
  return st;
}

function moveNext(rd) {
  const sp = rd.players.filter(p => p.exitToken && !p.exitToken.isCoffin)
    .sort((a, b) => a.exitToken.number - b.exitToken.number);
  if (sp.length === 0) { rd.phase = 'round_end'; return; }
  rd.collectingPlayerIndex = (rd.collectingPlayerIndex + 1) % sp.length;
  // 所有危险区牌拿完且无中心卡时结束
  if (!rd.players.some(p => p.dangerZoneCards.length > 0) && rd.centerCards.length === 0)
    rd.phase = 'round_end';
}

function resolveInput(st, inp) {
  const rd = st.currentRound;
  if (!rd) return st;
  rd.inputRequest = null;
  const p = rd.players.find(x => x.id === inp.playerId);
  if (inp.type === 'choose_split_type' && rd.lastDrawnCard) {
    rd.lastDrawnCard.assignedType = inp.value;
    p.outsideCards.push(rd.lastDrawnCard);
    updateDZ(p, inp.value);
    // 检查爆牌
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
  if (rd.inputRequest && rd.inputRequest.playerId === aid) {
    return { type: 'choose_split', playerId: aid, data: rd.inputRequest.options[Math.floor(Math.random() * rd.inputRequest.options.length)] };
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
      const bestTarget = targets.sort((a, b) =>
        b.dangerZoneCards.reduce((s, c) => s + c.def.treasureValue, 0) -
        a.dangerZoneCards.reduce((s, c) => s + c.def.treasureValue, 0)
      )[0];
      return { type: 'collect_treasure', playerId: aid, data: bestTarget ? bestTarget.id : 'center' };
    }
  }
  return null;
}

// --- 导出 ---
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    THREAT_TYPES, THREAT_NAMES, BASE_CARDS,
    genCards, shuffle, createGame, startRound,
    getPlayerThreats, updateDZ, getDZStacks, checkBusts, handleBust, nextP,
    resolveCard, bustCont, finTurn, startColl,
    playerExit, drawCard, collectTreasure, moveNext, resolveInput,
    getScores, getCurTreasure, getScore, aiDecide
  };
}
