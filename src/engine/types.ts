export type TimingMethod = 'fischer' | 'bronstein' | 'delay' | 'none';

export type TimeControlCategory = 'bullet' | 'blitz' | 'rapid' | 'classical' | 'custom';

export interface Stage {
  stageIndex: number;
  baseTimeMs: number; // For stage 0: starting time. For subsequent stages: added bonus time.
  incrementMs: number; // Fischer increment, Bronstein delay, or Simple delay in ms
  timingMethod: TimingMethod;
  movesThreshold?: number; // Moves required to trigger transition to next stage (e.g. 40)
}

export interface PlayerConfig {
  stages: Stage[];
}

export interface TimeControlConfig {
  id: string;
  name: string;
  description?: string;
  category: TimeControlCategory;
  player1: PlayerConfig;
  player2: PlayerConfig;
  isHandicap?: boolean;
}

export type PlayerId = 1 | 2;

export type ClockStatus = 'idle' | 'ready' | 'running' | 'paused' | 'flagged';

export interface PlayerClockState {
  timeRemainingMs: number;
  currentDelayRemainingMs: number; // Simple delay countdown remaining for current move
  turnStartTimeMs: number; // Time remaining when turn began (used for Bronstein delay calculus)
  moveCount: number;
  currentStageIndex: number;
  isFlagged: boolean;
}

export interface ClockSnapshot {
  status: ClockStatus;
  activePlayer: PlayerId | null;
  player1: PlayerClockState;
  player2: PlayerClockState;
  flaggedPlayer: PlayerId | null;
  winner: PlayerId | 'draw' | null;
  config: TimeControlConfig;
  totalElapsedMs: number;
  lastMoveTimestamp: number | null;
}

export type EngineEventName =
  | 'tick'
  | 'turn_switch'
  | 'flag'
  | 'pause'
  | 'resume'
  | 'reset'
  | 'adjust'
  | 'stage_advanced';

export type EngineEventListener = (snapshot: ClockSnapshot, eventData?: any) => void;
