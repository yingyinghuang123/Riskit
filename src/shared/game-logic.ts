import { 
  GameState, PlayerState, RoundState, CardInstance, 
  ThreatType, InputRequest, PlayerInput, ExitToken
} from './types';

import { ALL_CARDS } from './cards';
import { 
  updatePlayerDangerZone,
  resolveCard, playerExit, collectTreasure,
  checkBusts, handlePlayerBust
} from './game-rules';


// 在 resolveInput 中使用的辅助函数：分裂牌解析后可能需要进入收集阶段
function startCollectionFromInput(state: GameState): void {
  const round = state.currentRound!;
  if (round.players.every(p => p.hasBusted)) {
    round.phase = 'round_end';
  } else {
    // 弃掉外部牌和无宝藏值的牌
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
  }
}


export function shuffle<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createGame(playerIds: string[], includeOptional: boolean): GameState {
  const players: PlayerState[] = playerIds.map(id => ({
    id,
    name: `Player ${id}`,
    outsideCards: [],
    dangerZoneCards: [],
    scorePile: [],
    collectedBackpacks: [],
    collectedMachetes: [],
    exitToken: null,
    isPantherJuiced: false,
    isActive: false,
    hasBusted: false,
  }));

  return {
    gameId: Math.random().toString(36).substring(7),
    players,
    currentRound: null,
    roundNumber: 0,
    phase: 'waiting',
    includeOptionalCards: includeOptional,
  };
}

export function startRound(state: GameState, random: () => number): GameState {
  const roundNumber = state.roundNumber + 1;
  if (roundNumber > 5) return { ...state, phase: 'game_over' };

  const deck = shuffle(
    ALL_CARDS.filter(c => state.includeOptionalCards || c.type === 'threat' || c.type === 'split'),
    random
  );

  const players = state.players.map(p => ({
    ...p,
    outsideCards: [],
    dangerZoneCards: [],
    exitToken: null,
    isPantherJuiced: false,
    isActive: true,
    hasBusted: false,
  }));

  // Exit tokens: #1 (Panther) at bottom, others in descending order on top
  // First player to exit takes highest number (top of stack)
  const exitTokens: ExitToken[] = [];
  for (let i = players.length; i >= 2; i--) {
    exitTokens.push({ number: i, isCoffin: false, isPanther: false });
  }

  const round: RoundState = {
    roundNumber,
    deck,
    discardPile: [],
    centerCards: [],
    players,
    exitTokens,
    currentPlayerIndex: 0,
    phase: 'draw',
    lastDrawnCard: null,
    collectingPlayerIndex: 0,
    consecutiveCollections: 0,
    inputRequest: null,
  };

  return {
    ...state,
    currentRound: round,
    roundNumber,
    phase: 'playing',
  };
}

export function drawCard(state: GameState): { state: GameState, drawnCard?: CardInstance, needsInput?: InputRequest } {
  const round = state.currentRound;
  if (!round || (round.phase !== 'draw' && round.phase !== 'machete_window')) {
    throw new Error('Invalid phase for drawing');
  }

  if (round.phase === 'draw') {
    const playersWithMachete = round.players.filter(p => p.isActive && p.collectedMachetes.length > 0);
    if (playersWithMachete.length > 0) {
      round.phase = 'machete_window';
      const request: InputRequest = {
        playerId: playersWithMachete[0].id,
        type: 'choose_machete_use',
        options: ['yes', 'no']
      };
      round.inputRequest = request;
      return { state, needsInput: request };
    }
  }

  const cardDef = round.deck.shift();
  if (!cardDef) {
    state.phase = 'playing';
    return { state };
  }

  const player = round.players[round.currentPlayerIndex];
  const cardInstance: CardInstance = {
    id: `${cardDef.id}_${Date.now()}`,
    def: cardDef,
    ownerId: player.id,
  };
  round.lastDrawnCard = cardInstance;

  return resolveCard(state, cardInstance);
}

export function resolveInput(state: GameState, input: PlayerInput): GameState {
  const round = state.currentRound;
  if (!round) return state;

  const player = round.players.find(p => p.id === input.playerId)!;
  round.inputRequest = null;

  switch (input.type) {
    case 'choose_split_type':
      if (round.lastDrawnCard) {
        round.lastDrawnCard.assignedType = input.value as ThreatType;
        // 分裂牌选择类型后，加入玩家卡牌并按威胁卡处理
        player.outsideCards.push(round.lastDrawnCard);
        updatePlayerDangerZone(player, input.value as ThreatType);
        // 检查爆牌并进入退出窗口
        const bustedTypes = checkBusts(round);
        if (bustedTypes.length > 0) {
          const playersToBust = round.players.filter(p => p.isActive && p.dangerZoneCards.some(c => bustedTypes.includes(c.assignedType || c.def.threatType)));
          playersToBust.forEach(p => handlePlayerBust(round, p));
          if (playersToBust.length > 0) round.players.forEach(p => { if (p.isPantherJuiced) p.isPantherJuiced = false; });
        }
        if (round.players.every(p => !p.isActive)) {
          startCollectionFromInput(state);
        } else {
          round.phase = 'exit_window';
        }
      }
      break;

    case 'choose_panther_target': {
      const target = round.players.find(p => p.id === input.value)!;
      if (round.lastDrawnCard?.def.type === 'panther_juice') {
        target.isPantherJuiced = true;
      } else if (round.lastDrawnCard?.def.type === 'bribe') {
        // Bribe: take target's danger zone cards
        const dzCards = [...target.dangerZoneCards];
        player.outsideCards.push(...dzCards);
        target.dangerZoneCards = [];
        updatePlayerDangerZone(player, undefined);
      }
      round.phase = 'exit_window';
      break;
    }

    case 'choose_bribe_response':
      // For now, treat as accept - bribe target selection handled via choose_panther_target
      break;

    case 'choose_machete_use':
      if (input.value === 'yes') {
        const machete = player.collectedMachetes.shift();
        if (machete) round.discardPile.push(machete.def);
      }
      round.phase = 'draw';
      break;

    case 'choose_collect_target':
      collectTreasure(state, player.id, input.value as any);
      break;

    case 'choose_backpack_use':
      if (input.value === 'yes' && player.collectedBackpacks.length > 0) {
        const bp = player.collectedBackpacks.shift()!;
        round.discardPile.push(bp.def);
        round.consecutiveCollections = 1;
      } else {
        round.consecutiveCollections = 0;
        // Logic to move to next collector would be in game-rules
      }
      break;
  }

  return state;
}

export function getScores(state: GameState) {
  return state.players.map(p => ({
    playerId: p.id,
    score: p.scorePile.reduce((sum, c) => sum + c.def.treasureValue, 0),
    cardCount: p.scorePile.length,
  }));
}

export function getWinner(state: GameState): string {
  const scores = getScores(state);
  scores.sort((a, b) => b.score - a.score || a.cardCount - b.cardCount);
  return scores[0].playerId;
}

export { playerExit, collectTreasure };

