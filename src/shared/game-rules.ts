import { PlayerState, ThreatType, CardInstance, RoundState, ThreatStack, GameState, ExitToken, InputRequest } from './types';

export function getPlayerThreats(player: PlayerState): Map<ThreatType, number> {
  const totals = new Map<ThreatType, number>();
  const allCards = [...player.outsideCards, ...player.dangerZoneCards];
  allCards.forEach(card => {
    const type = card.assignedType || card.def.threatType;
    if (type === 'none') return;
    let val = card.def.threatValue;
    if (type === 'chupacabra' && card.tuckedCards) val += card.tuckedCards.reduce((sum, c) => sum + c.def.threatValue, 0);
    totals.set(type, (totals.get(type) || 0) + val);
  });
  return totals;
}

export function updatePlayerDangerZone(player: PlayerState, lastDrawnType?: ThreatType): void {
  const totals = getPlayerThreats(player);
  let maxVal = -1;
  let maxType: ThreatType | null = null;
  totals.forEach((val, type) => {
    if (val > maxVal) {
      maxVal = val;
      maxType = type;
    } else if (val === maxVal && type === lastDrawnType) {
      // 相等时后抽优先进入危险区
      maxType = type;
    }
  });
  const allCards = [...player.outsideCards, ...player.dangerZoneCards];
  if (maxType) {
    player.dangerZoneCards = allCards.filter(c => (c.assignedType || c.def.threatType) === maxType);
    player.outsideCards = allCards.filter(c => (c.assignedType || c.def.threatType) !== maxType);
  } else { player.dangerZoneCards = []; player.outsideCards = allCards; }
}

export function getDangerZoneStacks(round: RoundState): ThreatStack[] {
  const stacks = new Map<ThreatType, CardInstance[]>();
  round.players.forEach(p => {
    p.dangerZoneCards.forEach(c => {
      const type = c.assignedType || c.def.threatType;
      if (!stacks.has(type)) stacks.set(type, []);
      stacks.get(type)!.push(c);
    });
  });
  return Array.from(stacks.entries()).map(([type, cards]) => {
    let totalValue = 0;
    cards.forEach(c => {
      totalValue += c.def.threatValue;
      if (type === 'chupacabra' && c.tuckedCards) totalValue += c.tuckedCards.reduce((sum, tc) => sum + tc.def.threatValue, 0);
    });
    return { threatType: type, cards, totalValue };
  });
}

export function checkBusts(round: RoundState): ThreatType[] {
  const stacks = getDangerZoneStacks(round);
  return stacks.filter(s => s.totalValue > 12).map(s => s.threatType);
}

export function handlePlayerBust(round: RoundState, player: PlayerState) {
  player.isActive = false;
  player.hasBusted = true;
  const token = round.exitTokens.shift();
  if (token) player.exitToken = { ...token, isCoffin: true };
  const hasDeathwish = player.dangerZoneCards.some(c => c.def.special === 'deathwish');
  if (hasDeathwish) { player.scorePile.push(...player.dangerZoneCards); player.dangerZoneCards = []; }
}

export function nextPlayer(round: RoundState): void {
  const startIdx = round.currentPlayerIndex;
  do { round.currentPlayerIndex = (round.currentPlayerIndex + 1) % round.players.length; } 
  while (!round.players[round.currentPlayerIndex].isActive && round.currentPlayerIndex !== startIdx);
}

export function getSortedExitPlayers(round: RoundState): PlayerState[] {
  return round.players.filter(p => p.exitToken !== null).sort((a, b) => a.exitToken!.number - b.exitToken!.number);
}

export function resolveCard(state: GameState, card: CardInstance): { state: GameState, drawnCard: CardInstance, needsInput?: InputRequest } {
  const round = state.currentRound!;
  const player = round.players.find(p => p.id === card.ownerId)!;
  switch (card.def.type) {
    case 'threat':
      if (card.def.threatType === 'chupacabra') { player.outsideCards.push(card); card.tuckedCards = []; } 
      else {
        const chupacabra = player.outsideCards.find(c => c.def.threatType === 'chupacabra') || player.dangerZoneCards.find(c => c.def.threatType === 'chupacabra');
        if (chupacabra) chupacabra.tuckedCards!.push(card); else player.outsideCards.push(card);
      }
      updatePlayerDangerZone(player, card.assignedType || card.def.threatType);
      return checkBustAndContinue(state, card);
    case 'split':
      round.phase = 'resolve';
      const splitOptions = card.def.splitTypes || ['piranha', 'snake'];
      const request: InputRequest = { playerId: player.id, type: 'choose_split_type', options: splitOptions, cardId: card.id };
      round.inputRequest = request;
      return { state, drawnCard: card, needsInput: request };
    case 'statue':
      round.centerCards.push(card);
      if (round.centerCards.filter(c => c.def.type === 'statue').length >= 2) {
        round.players.filter(p => p.isActive).forEach(p => handlePlayerBust(round, p));
        return finishTurn(state, card);
      }
      break;
    case 'backpack':
    case 'machete':
      round.centerCards.push(card);
      break;
    case 'bribe': {
      round.phase = 'resolve';
      // Cannot bribe a player with Panther Juice. If all active players have PJ, discard.
      const bribleTargets = round.players.filter(p => p.isActive && p.id !== player.id && !p.isPantherJuiced);
      if (bribleTargets.length === 0) {
        round.discardPile.push(card.def);
        break;
      }
      const request: InputRequest = { playerId: player.id, type: 'choose_panther_target', options: bribleTargets.map(t => t.id), cardId: card.id };
      round.inputRequest = request;
      return { state, drawnCard: card, needsInput: request };
    }
    case 'panther_juice': {
      round.phase = 'resolve';
      const pjTargets = round.players.filter(p => p.isActive && p.id !== player.id);
      if (pjTargets.length === 0) { round.discardPile.push(card.def); break; }
      const request: InputRequest = { playerId: player.id, type: 'choose_panther_target', options: pjTargets.map(t => t.id), cardId: card.id };
      round.inputRequest = request;
      return { state, drawnCard: card, needsInput: request };
    }
  }
  return finishTurn(state, card);
}

function checkBustAndContinue(state: GameState, card: CardInstance): { state: GameState, drawnCard: CardInstance } {
  const round = state.currentRound!;
  const bustedTypes = checkBusts(round);
  if (bustedTypes.length > 0) {
    const playersToBust = round.players.filter(p => p.isActive && p.dangerZoneCards.some(c => bustedTypes.includes(c.assignedType || c.def.threatType)));
    playersToBust.forEach(p => handlePlayerBust(round, p));
    if (playersToBust.length > 0) round.players.forEach(p => { if (p.isPantherJuiced) p.isPantherJuiced = false; });
  }
  return finishTurn(state, card);
}

function finishTurn(state: GameState, card: CardInstance): { state: GameState, drawnCard: CardInstance } {
  const round = state.currentRound!;
  if (round.players.every(p => !p.isActive)) return startCollection(state, card);
  round.phase = 'exit_window';
  return { state, drawnCard: card };
}

export function playerExit(state: GameState, playerId: string): GameState {
  const round = state.currentRound;
  if (!round || round.phase !== 'exit_window') return state;
  const player = round.players.find(p => p.id === playerId)!;
  if (!player.isActive || player.isPantherJuiced) return state;
  player.isActive = false;
  const feathers = player.dangerZoneCards.filter(c => c.def.special === 'chicken_feather');
  if (feathers.length > 0) {
    player.dangerZoneCards = player.dangerZoneCards.filter(c => c.def.special !== 'chicken_feather');
    feathers.forEach(f => round.discardPile.push(f.def));
  }
  const token = round.exitTokens.shift();
  if (token) player.exitToken = token;
  if (round.exitTokens.length === 0) {
    const lastPlayer = round.players.find(p => p.isActive);
    if (lastPlayer) {
      lastPlayer.isActive = false;
      lastPlayer.exitToken = { number: 1, isCoffin: lastPlayer.hasBusted, isPanther: true };
    }
  }
  if (round.players.every(p => !p.isActive)) startCollection(state, round.lastDrawnCard!);
  else { nextPlayer(round); round.phase = 'draw'; }
  return state;
}

function startCollection(state: GameState, card: CardInstance): { state: GameState, drawnCard: CardInstance } {
  const round = state.currentRound!;
  if (round.players.every(p => p.hasBusted)) { round.phase = 'round_end'; return { state, drawnCard: card }; }
  
  // 收集阶段准备：
  // 1. 弃掉所有玩家"危险区外"的牌
  // 2. 弃掉危险区中没有宝藏值的卡牌
  round.players.forEach(p => {
    p.outsideCards.forEach(c => round.discardPile.push(c.def));
    p.outsideCards = [];
    const noTreasure = p.dangerZoneCards.filter(c => c.def.treasureValue === 0);
    noTreasure.forEach(c => round.discardPile.push(c.def));
    p.dangerZoneCards = p.dangerZoneCards.filter(c => c.def.treasureValue > 0);
  });

  round.phase = 'collecting';
  round.collectingPlayerIndex = 0;
  round.consecutiveCollections = 0;
  return { state, drawnCard: card };
}

export function collectTreasure(state: GameState, playerId: string, targetPlayerId: string | 'center'): GameState {
  const round = state.currentRound;
  if (!round || round.phase !== 'collecting') return state;
  const sortedPlayers = getSortedExitPlayers(round).filter(p => !p.hasBusted);
  const currentPlayer = sortedPlayers[round.collectingPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return state;
  if (targetPlayerId === 'center') {
    const card = round.centerCards.shift();
    if (card) {
      if (card.def.type === 'backpack') currentPlayer.collectedBackpacks.push(card);
      else if (card.def.type === 'machete') currentPlayer.collectedMachetes.push(card);
      else currentPlayer.scorePile.push(card);
    }
  } else {
    // 收集任何玩家（包括自己）危险区的所有牌
    const targetPlayer = round.players.find(p => p.id === targetPlayerId)!;
    if (targetPlayer.dangerZoneCards.length === 0) return state;
    currentPlayer.scorePile.push(...targetPlayer.dangerZoneCards);
    targetPlayer.dangerZoneCards = [];
  }
  if (currentPlayer.collectedBackpacks.length > 0 && round.consecutiveCollections === 0) round.phase = 'resolve';
  else { round.consecutiveCollections = 0; moveToNextCollector(round); }
  return state;
}

function moveToNextCollector(round: RoundState) {
  const sortedPlayers = getSortedExitPlayers(round).filter(p => !p.hasBusted);
  round.collectingPlayerIndex = (round.collectingPlayerIndex + 1) % sortedPlayers.length;
  // 当所有危险区牌都被拿完且没有中心卡时，本轮结束
  if (!round.players.some(p => p.dangerZoneCards.length > 0) && round.centerCards.length === 0) round.phase = 'round_end';
}

