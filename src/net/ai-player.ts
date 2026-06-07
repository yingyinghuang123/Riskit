import { GameSync } from './game-sync';
import { GameState, PlayerState, RoundState } from '../shared/types';
import { getPlayerThreats } from '../shared/game-rules';

export class AIPlayer {
  private isActing = false;

  constructor(
    private playerId: string,
    private sync: GameSync,
    private roomId: string,
    private name: string
  ) {}

  onStateUpdate(state: GameState): void {
    if (state.phase !== 'playing' || !state.currentRound) return;
    if (this.isActing) return;

    const round = state.currentRound;
    const player = round.players.find(p => p.id === this.playerId);
    if (!player) return;

    if (round.inputRequest && round.inputRequest.playerId === this.playerId) {
      this.handleInputRequest(round.inputRequest);
      return;
    }

    if (round.phase === 'draw' && round.players[round.currentPlayerIndex].id === this.playerId) {
      this.handleDrawAction();
      return;
    }

    if (round.phase === 'exit_window' && round.players[round.currentPlayerIndex].id === this.playerId) {
      this.handleExitDecision(player);
      return;
    }

    if (round.phase === 'collecting') {
      const sortedExitPlayers = round.players
        .filter(p => p.exitToken && !p.exitToken.isCoffin)
        .sort((a, b) => a.exitToken!.number - b.exitToken!.number);
      
      if (sortedExitPlayers.length > 0 && sortedExitPlayers[round.collectingPlayerIndex]?.id === this.playerId) {
        this.handleCollectAction(round);
        return;
      }
    }
  }

  private async handleInputRequest(request: any): Promise<void> {
    this.isActing = true;
    await this.delay();

    let value = '';
    let actionType = '';
    switch (request.type) {
      case 'choose_split_type':
        actionType = 'choose_split';
        value = request.options[Math.floor(Math.random() * request.options.length)];
        break;
      case 'choose_panther_target':
        actionType = 'choose_panther_target';
        value = request.options[Math.floor(Math.random() * request.options.length)];
        break;
      case 'choose_bribe_response':
        actionType = 'choose_bribe_response';
        value = request.options[Math.floor(Math.random() * request.options.length)];
        break;
      case 'choose_collect_target':
        actionType = 'choose_collect_target';
        value = request.options[Math.floor(Math.random() * request.options.length)];
        break;
      case 'choose_machete_use':
        actionType = 'choose_machete';
        value = 'no';
        break;
      case 'choose_backpack_use':
        actionType = 'choose_backpack_use';
        value = 'no';
        break;
      default:
        actionType = 'resolve_input';
        value = request.options[0];
    }

    await this.sync.sendAction(this.roomId, {
      type: actionType,
      playerId: this.playerId,
      data: value
    });
    this.isActing = false;
  }

  private async handleDrawAction(): Promise<void> {
    this.isActing = true;
    await this.delay();
    await this.sync.sendAction(this.roomId, {
      type: 'draw',
      playerId: this.playerId
    });
    this.isActing = false;
  }

  private async handleExitDecision(player: PlayerState): Promise<void> {
    this.isActing = true;
    await this.delay();

    const threats = getPlayerThreats(player);
    let maxDanger = 0;
    threats.forEach(val => {
      if (val > maxDanger) maxDanger = val;
    });

    let shouldExit = false;
    const rand = Math.random();
    if (maxDanger >= 10) {
      shouldExit = rand < 0.8;
    } else if (maxDanger >= 8) {
      shouldExit = rand < 0.4;
    }

    if (shouldExit) {
      await this.sync.sendAction(this.roomId, {
        type: 'exit',
        playerId: this.playerId
      });
    } else {
      await this.sync.sendAction(this.roomId, {
        type: 'draw',
        playerId: this.playerId
      });
    }
    this.isActing = false;
  }

  private async handleCollectAction(round: RoundState): Promise<void> {
    this.isActing = true;
    await this.delay();

    const bustedPlayers = round.players.filter(p => p.hasBusted && (p.outsideCards.length > 0 || p.dangerZoneCards.length > 0));
    let target: string = 'center';
    if (bustedPlayers.length > 0) {
      target = bustedPlayers[0].id;
    }

    await this.sync.sendAction(this.roomId, {
      type: 'collect_treasure',
      playerId: this.playerId,
      data: target
    });
    this.isActing = false;
  }

  private delay(): Promise<void> {
    const ms = 600 + Math.random() * 400;
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  destroy(): void {
  }
}
