import { MiniEngine, WxPlatform } from '../engine'
import { isWebPreview, createLocalCloud, LocalCloud } from './local-adapter'
import { GameState } from '../shared/types'

export type EngineWithWx = MiniEngine & { wx: WxPlatform }

export class GameSync {
  private engine: EngineWithWx
  private cloud: LocalCloud
  private stateWatcher: { close(): void } | null = null
  private actionWatcher: { close(): void } | null = null
  private seq: number = 0
  private processedActionIds: Set<string> = new Set()
  
  constructor(engine: MiniEngine) { 
    this.engine = engine as EngineWithWx;
    if (isWebPreview(engine)) {
      this.cloud = createLocalCloud();
    } else {
      this.cloud = this.engine.wx.cloud;
    }
  }
  
  async publishState(roomId: string, state: GameState): Promise<void> {
    const existing = await this.cloud.get<any>('game_states', { where: { roomId } });
    if (existing.length > 0) {
      await this.cloud.update('game_states', existing[0]._id, { state, updatedAt: Date.now() });
    } else {
      await this.cloud.add('game_states', { roomId, state, updatedAt: Date.now() });
    }
  }
  
  watchState(roomId: string, callback: (state: GameState) => void): void {
    if (this.stateWatcher) this.stateWatcher.close();
    this.stateWatcher = this.cloud.watch('game_states', { roomId }, (snapshot: any) => {
      if (snapshot.docs && snapshot.docs.length > 0) {
        callback(snapshot.docs[0].state);
      }
    });
  }
  
  async sendAction(roomId: string, action: { type: string; playerId: string; data?: any }): Promise<void> {
    await this.cloud.add('game_actions', {
      roomId,
      ...action,
      timestamp: Date.now(),
      seq: this.seq++
    });
  }
  
  watchActions(roomId: string, callback: (action: { type: string; playerId: string; data?: any }) => void): void {
    if (this.actionWatcher) this.actionWatcher.close();
    this.processedActionIds.clear();
    
    this.actionWatcher = this.cloud.watch('game_actions', { roomId }, (snapshot: any) => {
      if (snapshot.docs) {
        const newActions = snapshot.docs
          .filter((doc: any) => !this.processedActionIds.has(doc._id))
          .sort((a: any, b: any) => a.seq - b.seq);
        
        for (const action of newActions) {
          this.processedActionIds.add(action._id);
          callback(action);
        }
      }
    });
  }
  
  destroy(): void {
    if (this.stateWatcher) {
      this.stateWatcher.close();
      this.stateWatcher = null;
    }
    if (this.actionWatcher) {
      this.actionWatcher.close();
      this.actionWatcher = null;
    }
  }
}
