import type {
  ClockSnapshot,
  ClockStatus,
  EngineEventListener,
  EngineEventName,
  PlayerClockState,
  PlayerConfig,
  PlayerId,
  Stage,
  TimeControlConfig,
} from './types.ts';
import { DEFAULT_TIME_CONTROL } from './presets.ts';

export class ChessClockEngine {
  private config: TimeControlConfig;
  private status: ClockStatus = 'ready';
  private activePlayer: PlayerId | null = null;
  private flaggedPlayer: PlayerId | null = null;
  private winner: PlayerId | 'draw' | null = null;

  private player1State: PlayerClockState;
  private player2State: PlayerClockState;

  private lastTickTime: number = 0;
  private totalElapsedMs: number = 0;
  private lastMoveTimestamp: number | null = null;

  private tickTimerId: any = null;
  private currentTickIntervalMs: number = 100;

  private listeners: Map<EngineEventName, Set<EngineEventListener>> = new Map();

  constructor(initialConfig: TimeControlConfig = DEFAULT_TIME_CONTROL) {
    this.config = initialConfig;
    this.player1State = this.createInitialPlayerState(initialConfig.player1);
    this.player2State = this.createInitialPlayerState(initialConfig.player2);
  }

  // ---------------------------------------------------------------------------
  // Lifecycle & Event Handling
  // ---------------------------------------------------------------------------

  public on(event: EngineEventName, listener: EngineEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => {
      this.listeners.get(event)?.delete(listener);
    };
  }

  private emit(event: EngineEventName, data?: any) {
    const snapshot = this.getSnapshot();
    const set = this.listeners.get(event);
    if (set) {
      set.forEach(listener => {
        try {
          listener(snapshot, data);
        } catch (err) {
          console.error(`Error in ChessClockEngine listener for ${event}:`, err);
        }
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Public Control API
  // ---------------------------------------------------------------------------

  /**
   * Starts the clock if ready or paused.
   * If not already running, activePlayer defaults to White (Player 1) unless specified.
   */
  public start(firstPlayer: PlayerId = 1, startTime?: number): void {
    if (this.status === 'running') return;
    if (this.status === 'flagged') return;

    if (this.status === 'ready' || this.activePlayer === null) {
      this.activePlayer = firstPlayer;
      const activeState = this.getPlayerState(firstPlayer);
      const stage = this.getPlayerStage(firstPlayer);
      activeState.turnStartTimeMs = activeState.timeRemainingMs;

      // Handle simple delay for turn 1
      if (stage.timingMethod === 'delay') {
        activeState.currentDelayRemainingMs = stage.incrementMs;
      }
    }

    this.status = 'running';
    this.lastTickTime = startTime ?? Date.now();
    this.startTickLoop();
    this.emit('resume');
  }

  /**
   * Called when a player presses their clock button.
   * Completes their move, applies increment/delay, advances stage if threshold reached,
   * and transfers turn to the opponent.
   */
  public switchTurn(requestingPlayer?: PlayerId, switchTime?: number): void {
    // If not running, pressing a player's side can start the clock with the opponent active!
    if (this.status === 'ready') {
      const active = requestingPlayer ? (requestingPlayer === 1 ? 2 : 1) : 2;
      this.start(active, switchTime);
      return;
    }

    if (this.status !== 'running') return;
    if (this.activePlayer === null) return;

    // Optional guard: if requestingPlayer is provided and does not match activePlayer, ignore
    if (requestingPlayer && requestingPlayer !== this.activePlayer) {
      return;
    }

    const previousPlayer = this.activePlayer;
    const nextPlayer: PlayerId = previousPlayer === 1 ? 2 : 1;

    const prevPlayerState = this.getPlayerState(previousPlayer);
    const prevPlayerStage = this.getPlayerStage(previousPlayer);

    // 1. Process Delay / Increment mechanics on move completion
    switch (prevPlayerStage.timingMethod) {
      case 'fischer':
        // Fischer Increment: Add fixed increment at the end of the move
        prevPlayerState.timeRemainingMs += prevPlayerStage.incrementMs;
        break;

      case 'bronstein': {
        // Bronstein Delay: Add back time spent on the move, capped at delay amount.
        // Clock cannot exceed what it started the turn with.
        const timeSpent = prevPlayerState.turnStartTimeMs - prevPlayerState.timeRemainingMs;
        const reimbursement = Math.min(prevPlayerStage.incrementMs, Math.max(0, timeSpent));
        prevPlayerState.timeRemainingMs = Math.min(
          prevPlayerState.turnStartTimeMs,
          prevPlayerState.timeRemainingMs + reimbursement
        );
        break;
      }

      case 'delay':
        // Simple Delay: Delay countdown already protected main bank during tick.
        // Clear any residual delay bank for the turn.
        prevPlayerState.currentDelayRemainingMs = 0;
        break;

      case 'none':
      default:
        break;
    }

    // 2. Increment move counter
    prevPlayerState.moveCount += 1;

    // 3. Multi-Stage Tournament check
    const playerConfig = previousPlayer === 1 ? this.config.player1 : this.config.player2;
    if (
      prevPlayerStage.movesThreshold &&
      prevPlayerState.moveCount === prevPlayerStage.movesThreshold &&
      prevPlayerState.currentStageIndex + 1 < playerConfig.stages.length
    ) {
      prevPlayerState.currentStageIndex += 1;
      const nextStage = playerConfig.stages[prevPlayerState.currentStageIndex];
      prevPlayerState.timeRemainingMs += nextStage.baseTimeMs;

      this.emit('stage_advanced', {
        player: previousPlayer,
        newStageIndex: prevPlayerState.currentStageIndex,
        addedTimeMs: nextStage.baseTimeMs,
      });
    }

    // 4. Set up next player's turn
    this.activePlayer = nextPlayer;
    const nextPlayerState = this.getPlayerState(nextPlayer);
    const nextPlayerStage = this.getPlayerStage(nextPlayer);

    nextPlayerState.turnStartTimeMs = nextPlayerState.timeRemainingMs;
    if (nextPlayerStage.timingMethod === 'delay') {
      nextPlayerState.currentDelayRemainingMs = nextPlayerStage.incrementMs;
    }

    const now = switchTime ?? Date.now();
    this.lastTickTime = now;
    this.lastMoveTimestamp = now;

    // Dynamically adjust tick rate if moving into / out of low time scramble
    this.adjustTickRateIfNeeded();

    this.emit('turn_switch', {
      previousPlayer,
      nextPlayer,
      snapshot: this.getSnapshot(),
    });
  }

  /**
   * Pauses the running clock.
   */
  public pause(): void {
    if (this.status !== 'running') return;

    this.stopTickTimer();
    this.status = 'paused';
    this.emit('pause');
  }

  /**
   * Resumes a paused clock.
   */
  public resume(): void {
    if (this.status !== 'paused') return;

    this.status = 'running';
    this.lastTickTime = Date.now();
    this.startTickLoop();
    this.emit('resume');
  }

  /**
   * Resets the clock to initial state with current configuration.
   */
  public reset(): void {
    this.stopTickTimer();
    this.status = 'ready';
    this.activePlayer = null;
    this.flaggedPlayer = null;
    this.winner = null;
    this.totalElapsedMs = 0;
    this.lastMoveTimestamp = null;

    this.player1State = this.createInitialPlayerState(this.config.player1);
    this.player2State = this.createInitialPlayerState(this.config.player2);

    this.emit('reset');
  }

  /**
   * Updates time control configuration and resets clock.
   */
  public setConfig(newConfig: TimeControlConfig): void {
    this.stopTickTimer();
    this.config = newConfig;
    this.reset();
  }

  /**
   * On-the-fly adjustment: add or subtract time for a player.
   */
  public adjustTime(player: PlayerId, deltaMs: number): void {
    const state = this.getPlayerState(player);
    state.timeRemainingMs = Math.max(0, state.timeRemainingMs + deltaMs);
    state.turnStartTimeMs = Math.max(0, state.turnStartTimeMs + deltaMs);

    if (state.timeRemainingMs > 0 && state.isFlagged) {
      state.isFlagged = false;
      if (this.flaggedPlayer === player) {
        this.flaggedPlayer = null;
        this.winner = null;
        this.status = 'paused';
      }
    }

    this.emit('adjust', { player, deltaMs });
  }

  /**
   * On-the-fly adjustment: add or subtract moves for a player.
   */
  public adjustMoves(player: PlayerId, deltaMoves: number): void {
    const state = this.getPlayerState(player);
    state.moveCount = Math.max(0, state.moveCount + deltaMoves);
    this.emit('adjust', { player, deltaMoves });
  }

  /**
   * Cleans up timers and clears listeners.
   */
  public destroy(): void {
    this.stopTickTimer();
    this.listeners.clear();
  }

  // ---------------------------------------------------------------------------
  // Internal Timing Loop & Drift Compensation
  // ---------------------------------------------------------------------------

  private startTickLoop(): void {
    this.stopTickTimer();
    this.adjustTickRateIfNeeded();

    this.tickTimerId = setInterval(() => {
      this.tick();
    }, this.currentTickIntervalMs);
  }

  private stopTickTimer(): void {
    if (this.tickTimerId !== null) {
      clearInterval(this.tickTimerId);
      this.tickTimerId = null;
    }
  }

  /**
   * Precision Delta Tick:
   * Calculates exact wall-clock difference since last tick, ensuring zero drift.
   */
  public tick(forcedNow?: number): void {
    if (this.status !== 'running' || this.activePlayer === null) return;

    const now = forcedNow ?? Date.now();
    const deltaMs = now - this.lastTickTime;
    this.lastTickTime = now;
    this.totalElapsedMs += deltaMs;

    const activeState = this.getPlayerState(this.activePlayer);
    const activeStage = this.getPlayerStage(this.activePlayer);

    // Apply Simple Delay Countdown if applicable
    if (activeStage.timingMethod === 'delay' && activeState.currentDelayRemainingMs > 0) {
      const delayDeduction = Math.min(deltaMs, activeState.currentDelayRemainingMs);
      activeState.currentDelayRemainingMs -= delayDeduction;

      const remainingDelta = deltaMs - delayDeduction;
      if (remainingDelta > 0) {
        activeState.timeRemainingMs -= remainingDelta;
      }
    } else {
      activeState.timeRemainingMs -= deltaMs;
    }

    // Check for Flag (Time Out)
    if (activeState.timeRemainingMs <= 0) {
      activeState.timeRemainingMs = 0;
      activeState.isFlagged = true;
      this.flaggedPlayer = this.activePlayer;
      this.winner = this.activePlayer === 1 ? 2 : 1;
      this.status = 'flagged';
      this.stopTickTimer();

      this.emit('flag', {
        flaggedPlayer: this.activePlayer,
        snapshot: this.getSnapshot(),
      });
      return;
    }

    // Dynamically adjust tick rate if entering/leaving time scramble
    this.adjustTickRateIfNeeded();

    this.emit('tick', this.getSnapshot());
  }

  /**
   * Battery Optimization:
   * Uses 100ms tick interval during comfortable time,
   * and 50ms during time scrambles (<= 10s) or active delay countdown.
   */
  private adjustTickRateIfNeeded(): void {
    const isScramble =
      this.player1State.timeRemainingMs <= 10000 ||
      this.player2State.timeRemainingMs <= 10000 ||
      (this.activePlayer && this.getPlayerState(this.activePlayer).currentDelayRemainingMs > 0);

    const targetInterval = isScramble ? 50 : 100;
    if (targetInterval !== this.currentTickIntervalMs && this.status === 'running') {
      this.currentTickIntervalMs = targetInterval;
      this.stopTickTimer();
      this.tickTimerId = setInterval(() => {
        this.tick();
      }, this.currentTickIntervalMs);
    }
  }

  // ---------------------------------------------------------------------------
  // State Accessors & Helpers
  // ---------------------------------------------------------------------------

  public getSnapshot(): ClockSnapshot {
    return {
      status: this.status,
      activePlayer: this.activePlayer,
      player1: { ...this.player1State },
      player2: { ...this.player2State },
      flaggedPlayer: this.flaggedPlayer,
      winner: this.winner,
      config: this.config,
      totalElapsedMs: this.totalElapsedMs,
      lastMoveTimestamp: this.lastMoveTimestamp,
    };
  }

  public getPlayerState(player: PlayerId): PlayerClockState {
    return player === 1 ? this.player1State : this.player2State;
  }

  public getPlayerStage(player: PlayerId): Stage {
    const config = player === 1 ? this.config.player1 : this.config.player2;
    const state = this.getPlayerState(player);
    return config.stages[state.currentStageIndex] || config.stages[0];
  }

  private createInitialPlayerState(playerConfig: PlayerConfig): PlayerClockState {
    const firstStage = playerConfig.stages[0];
    return {
      timeRemainingMs: firstStage.baseTimeMs,
      currentDelayRemainingMs: 0,
      turnStartTimeMs: firstStage.baseTimeMs,
      moveCount: 0,
      currentStageIndex: 0,
      isFlagged: false,
    };
  }
}
