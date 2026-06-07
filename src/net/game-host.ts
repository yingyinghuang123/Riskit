import { MiniEngine } from '../engine'
import { GameState, ThreatType } from '../shared/types'
import { GameSync } from './game-sync'
import { createGame, startRound, drawCard, resolveInput, playerExit, collectTreasure } from '../shared/game-logic'
import { nextPlayer } from '../shared/game-rules'

export class GameHost {
  private sync: GameSync
  private state: GameState | null = null
  private roomId: string
  private random: () => number
  
  constructor(engine: MiniEngine, sync: GameSync, roomId: string) {
    this.sync = sync
    this.roomId = roomId
    this.random = Math.random
  }
  
  async initGame(playerIds: string[], includeOptional: boolean): Promise<void> {
    this.state = createGame(playerIds, includeOptional);
    this.state = startRound(this.state, this.random);
    await this.publishState();
  }
  
  start(): void {
    this.sync.watchActions(this.roomId, (action) => {
      this.processAction(action);
    });
  }
  
  private async processAction(action: { type: string; playerId: string; data?: any }): Promise<void> {
    if (!this.state || !this.state.currentRound) return;
    
    const round = this.state.currentRound;
    let stateChanged = false;
    
    switch (action.type) {
      case 'draw':
        if (round.phase === 'draw' || round.phase === 'exit_window') {
          const currentPlayer = round.players[round.currentPlayerIndex];
          if (currentPlayer.id === action.playerId) {
            const result = drawCard(this.state);
            this.state = result.state;
            stateChanged = true;
          }
        }
        break;
        
      case 'exit':
        if (round.phase === 'exit_window') {
          const player = round.players.find(p => p.id === action.playerId);
          if (player && player.isActive) {
            this.state = playerExit(this.state, action.playerId);
            stateChanged = true;
          }
        }
        break;
      case 'collect_treasure':
        if (round.phase === 'collecting') {
          const collectingOrder = this.getCollectingOrder();
          if (collectingOrder.length > 0 && collectingOrder[round.collectingPlayerIndex] === action.playerId) {
            this.state = collectTreasure(this.state, action.playerId, action.data);
            stateChanged = true;
          }
        }
        break;
      case 'choose_split':
        this.state = resolveInput(this.state, { playerId: action.playerId, type: 'choose_split_type', value: action.data });
        stateChanged = true;
        break;
        
      case 'choose_bribe_response':
        this.state = resolveInput(this.state, { playerId: action.playerId, type: 'choose_bribe_response', value: action.data });
        stateChanged = true;
        break;
        
      case 'choose_panther_target':
        this.state = resolveInput(this.state, { playerId: action.playerId, type: 'choose_panther_target', value: action.data });
        stateChanged = true;
        break;
        
      case 'choose_machete':
        this.state = resolveInput(this.state, { playerId: action.playerId, type: 'choose_machete_use', value: action.data });
        stateChanged = true;
        break;
      case 'choose_collect_target':
        this.state = resolveInput(this.state, { playerId: action.playerId, type: 'choose_collect_target', value: action.data });
        stateChanged = true;
        break;
        
      case 'choose_backpack_use':
        this.state = resolveInput(this.state, { playerId: action.playerId, type: 'choose_backpack_use', value: action.data });
        stateChanged = true;
        break;
    }
    
    if (stateChanged) {
      await this.advanceTurn();
      await this.publishState();
    }
  }
  
  private async advanceTurn(): Promise<void> {
    const state = this.state;
    if (!state) return;
    
    if (state.currentRound?.phase === 'round_end') {
      await this.publishState();
      await new Promise(resolve => setTimeout(resolve, 2000));
      this.state = startRound(state, this.random);
      await this.publishState();
      return;
    }
    
    const round = state.currentRound;
    if (!round) return;
    
    if (round.phase === 'exit_window') {
      const currentPlayer = round.players[round.currentPlayerIndex];
      if (!currentPlayer.isActive) {
        nextPlayer(round);
        round.phase = 'draw';
      }
    }
  }
  
  private async publishState(): Promise<void> {
    if (this.state) {
      await this.sync.publishState(this.roomId, this.state);
    }
  }

  /** Get ordered list of player IDs who should collect treasure (sorted by exitToken number) */
  private getCollectingOrder(): string[] {
    if (!this.state?.currentRound) return [];
    return this.state.currentRound.players
      .filter(p => p.exitToken && !p.exitToken.isCoffin)
      .sort((a, b) => a.exitToken!.number - b.exitToken!.number)
      .map(p => p.id);
  }
  
  getState(): GameState | null {
    return this.state;
  }
  
  destroy(): void {
    this.sync.destroy();
  }
}
