export type ThreatType = 'crocodile' | 'spider' | 'scorpion' | 'piranha' | 'snake' | 'chupacabra' | 'none';
export type SpecialType = 'bribe' | 'backpack' | 'panther_juice' | 'statue' | 'machete' | 'split';
export type CardType = 'threat' | SpecialType;

export type SpecialEffect = 'deathwish' | 'chicken_feather';

export interface CardDef {
  id: string;
  type: CardType;
  threatType: ThreatType;
  threatValue: number;
  treasureValue: number;
  special?: SpecialEffect;
  splitTypes?: ThreatType[]; // For split cards: the two threat types to choose from
}

export interface CardInstance {
  id: string;
  def: CardDef;
  assignedType?: ThreatType; // For split cards
  ownerId: string;
  tuckedCards?: CardInstance[]; // For Chupacabra
}

export type GamePhase = 'waiting' | 'playing' | 'game_over';
export type TurnPhase = 
  | 'draw' 
  | 'machete_window' 
  | 'resolve' 
  | 'exit_window' 
  | 'bust_resolve' 
  | 'collecting' 
  | 'round_end';

export interface ExitToken {
  number: number;
  isCoffin: boolean;
  isPanther: boolean;
}

export interface ThreatStack {
  threatType: ThreatType;
  cards: CardInstance[];
  totalValue: number;
}

export interface PlayerState {
  id: string;
  name: string;
  outsideCards: CardInstance[]; // Cards NOT in Danger Zone
  dangerZoneCards: CardInstance[]; // Cards IN Danger Zone (highest threat type)
  scorePile: CardInstance[];
  collectedBackpacks: CardInstance[]; // For use during collection
  collectedMachetes: CardInstance[]; // For use in following rounds
  exitToken: ExitToken | null;
  isPantherJuiced: boolean;
  isActive: boolean;
  hasBusted: boolean;
}

export interface RoundState {
  roundNumber: number;
  deck: CardDef[];
  discardPile: CardDef[];
  centerCards: CardInstance[]; // Statues, Backpacks, Machetes before collection
  players: PlayerState[];
  exitTokens: ExitToken[];
  currentPlayerIndex: number;
  phase: TurnPhase;
  lastDrawnCard: CardInstance | null;
  collectingPlayerIndex: number; // Index in sorted exit token list
  consecutiveCollections: number; // For backpack use
  inputRequest: InputRequest | null;
}

export interface GameState {
  gameId: string;
  players: PlayerState[];
  currentRound: RoundState | null;
  roundNumber: number;
  phase: GamePhase;
  includeOptionalCards: boolean;
}

export type InputRequestType = 
  | 'choose_split_type' 
  | 'choose_bribe_response' 
  | 'choose_panther_target' 
  | 'choose_machete_use' 
  | 'choose_collect_target' 
  | 'choose_backpack_use';

export interface InputRequest {
  playerId: string;
  type: InputRequestType;
  options: string[];
  cardId?: string; // Context for the request
}

export interface PlayerInput {
  playerId: string;
  type: InputRequestType;
  value: string;
}

