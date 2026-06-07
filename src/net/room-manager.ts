import { MiniEngine, WxPlatform } from '../engine'
import { isWebPreview, createLocalCloud, createLocalStorage, LocalCloud, LocalStorage } from './local-adapter'

export type EngineWithWx = MiniEngine & { wx: WxPlatform }

export interface Room {

  id: string
  hostId: string
  players: { id: string; name: string; ready: boolean }[]
  status: 'waiting' | 'playing' | 'finished'
  includeOptionalCards: boolean
  maxPlayers: number
  createdAt: number
}

export class RoomManager {
  private engine: EngineWithWx
  private watcher: { close(): void } | null = null
  private cloud: LocalCloud
  private storage: LocalStorage
  
  constructor(engine: MiniEngine) {
    this.engine = engine as EngineWithWx;
    if (isWebPreview(engine)) {
      this.cloud = createLocalCloud();
      this.storage = createLocalStorage();
    } else {
      this.cloud = this.engine.wx.cloud;
      this.storage = this.engine.wx.storage;
    }
  }
  
  async updateRoomOptions(roomId: string, options: Partial<Pick<Room, 'includeOptionalCards'>>): Promise<void> {
    await this.cloud.update('rooms', roomId, options);
  }
  
  async createRoom(hostName: string, maxPlayers: number = 4, includeOptional: boolean = false): Promise<string> {
    const playerId = this.getPlayerId();
    const roomData: Omit<Room, 'id'> = {
      hostId: playerId,
      players: [{ id: playerId, name: hostName, ready: true }],
      status: 'waiting',
      includeOptionalCards: includeOptional,
      maxPlayers,
      createdAt: Date.now()
    };
    const id = await this.cloud.add('rooms', roomData);
    if (!id) throw new Error('Failed to create room');
    return id;
  }
  
  async joinRoom(roomId: string, playerName: string): Promise<Room> {
    const room = await this.cloud.getById<any>('rooms', roomId);
    if (!room) throw new Error('Room not found');
    if (room.status !== 'waiting') throw new Error('Room is already playing or finished');
    if (room.players.length >= room.maxPlayers) throw new Error('Room is full');
    
    const playerId = this.getPlayerId();
    const existingPlayer = room.players.find((p: any) => p.id === playerId);
    if (existingPlayer) {
      return { ...room, id: room._id } as Room;
    }
    
    const updatedPlayers = [...room.players, { id: playerId, name: playerName, ready: false }];
    const ok = await this.cloud.update('rooms', roomId, { players: updatedPlayers });
    if (!ok) throw new Error('Failed to join room');
    
    return { ...room, id: room._id, players: updatedPlayers } as Room;
  }
  
  async leaveRoom(roomId: string, playerId: string): Promise<void> {
    const room = await this.cloud.getById<any>('rooms', roomId);
    if (!room) return;
    
    const updatedPlayers = room.players.filter((p: any) => p.id !== playerId);
    if (updatedPlayers.length === 0) {
      await this.cloud.remove('rooms', roomId);
    } else {
      const updateData: any = { players: updatedPlayers };
      if (room.hostId === playerId) {
        updateData.hostId = updatedPlayers[0].id;
        updatedPlayers[0].ready = true;
      }
      await this.cloud.update('rooms', roomId, updateData);
    }
  }
  
  async setReady(roomId: string, playerId: string, ready: boolean): Promise<void> {
    const room = await this.cloud.getById<any>('rooms', roomId);
    if (!room) return;
    
    const updatedPlayers = room.players.map((p: any) => 
      p.id === playerId ? { ...p, ready } : p
    );
    await this.cloud.update('rooms', roomId, { players: updatedPlayers });
  }
  
  watchRoom(roomId: string, callback: (room: Room) => void): void {
    this.stopWatching();
    this.watcher = this.cloud.watch('rooms', { _id: roomId }, (snapshot: any) => {

      if (snapshot.docs && snapshot.docs.length > 0) {
        const doc = snapshot.docs[0];
        callback({ ...doc, id: doc._id } as Room);
      }
    });
  }
  
  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
  
  async listRooms(): Promise<Room[]> {
    const rooms = await this.cloud.get<any>('rooms', { 
      where: { status: 'waiting' },
      orderBy: { field: 'createdAt', direction: 'desc' }
    });
    return rooms.map((r: any) => ({ ...r, id: r._id }));
  }
  
  async startGame(roomId: string): Promise<void> {
    const ok = await this.cloud.update('rooms', roomId, { status: 'playing' });
    if (!ok) throw new Error('Failed to start game');
  }
  
  getPlayerId(): string {
    let playerId = this.storage.load<string>('playerId');
    if (!playerId) {
      playerId = Math.random().toString(36).substring(2);
      this.storage.save('playerId', playerId);
    }
    return playerId;
}
}
