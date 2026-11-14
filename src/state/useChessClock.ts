import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { ChessClockEngine } from '../engine/ChessClockEngine';
import { ClockSnapshot, PlayerId, TimeControlConfig } from '../engine/types';
import { DEFAULT_TIME_CONTROL } from '../engine/presets';
import { AudioService } from '../services/audioService';
import { HapticsService } from '../services/hapticsService';
import { useSettings } from './SettingsContext';

export function formatTimeDisplay(ms: number, showDecisecondsWhenLow: boolean = true): string {
  if (ms <= 0) return '0.0';

  const totalSeconds = ms / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((ms % 1000) / 100);

  // If under 10 seconds, show tenth of a second (S.s)
  if (showDecisecondsWhenLow && totalSeconds < 10) {
    return `${seconds}.${tenths}`;
  }

  // If 1 hour or more: H:MM:SS
  if (hours > 0) {
    const paddedM = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const paddedS = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${hours}:${paddedM}:${paddedS}`;
  }

  // Standard: M:SS
  const paddedS = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${minutes}:${paddedS}`;
}

export function useChessClock(initialConfig: TimeControlConfig = DEFAULT_TIME_CONTROL) {
  const { settings } = useSettings();
  const engineRef = useRef<ChessClockEngine | null>(null);

  if (!engineRef.current) {
    engineRef.current = new ChessClockEngine(initialConfig);
  }
  const engine = engineRef.current;

  const [snapshot, setSnapshot] = useState<ClockSnapshot>(() => engine.getSnapshot());

  // Subscribe to engine events
  useEffect(() => {
    const unsubTick = engine.on('tick', (snap) => setSnapshot(snap));
    const unsubPause = engine.on('pause', (snap) => setSnapshot(snap));
    const unsubResume = engine.on('resume', (snap) => setSnapshot(snap));
    const unsubReset = engine.on('reset', (snap) => setSnapshot(snap));
    const unsubAdjust = engine.on('adjust', (snap) => setSnapshot(snap));

    const unsubTurn = engine.on('turn_switch', (snap) => {
      setSnapshot(snap);
      AudioService.playClickSound();
      HapticsService.triggerClockPress();
    });

    const unsubFlag = engine.on('flag', (snap) => {
      setSnapshot(snap);
      AudioService.playFlagAlarm();
      HapticsService.triggerFlagVibration();
    });

    return () => {
      unsubTick();
      unsubPause();
      unsubResume();
      unsubReset();
      unsubAdjust();
      unsubTurn();
      unsubFlag();
    };
  }, [engine]);

  // Auto-Pause when app goes to background / phone call / screen lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (settings.autoPauseEnabled) {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
          if (engine.getSnapshot().status === 'running') {
            engine.pause();
          }
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [engine, settings.autoPauseEnabled]);

  // Formatted times for display
  const p1Formatted = useMemo(
    () => formatTimeDisplay(snapshot.player1.timeRemainingMs),
    [snapshot.player1.timeRemainingMs]
  );

  const p2Formatted = useMemo(
    () => formatTimeDisplay(snapshot.player2.timeRemainingMs),
    [snapshot.player2.timeRemainingMs]
  );

  const p1DelayFormatted = useMemo(() => {
    if (snapshot.player1.currentDelayRemainingMs > 0) {
      return `+${(snapshot.player1.currentDelayRemainingMs / 1000).toFixed(1)}s`;
    }
    return null;
  }, [snapshot.player1.currentDelayRemainingMs]);

  const p2DelayFormatted = useMemo(() => {
    if (snapshot.player2.currentDelayRemainingMs > 0) {
      return `+${(snapshot.player2.currentDelayRemainingMs / 1000).toFixed(1)}s`;
    }
    return null;
  }, [snapshot.player2.currentDelayRemainingMs]);

  // Actions
  const pressClock = useCallback(
    (player: PlayerId) => {
      const snap = engine.getSnapshot();
      if (snap.status === 'flagged') return;

      if (snap.status === 'ready') {
        // Pressing your clock starts the opponent's clock
        engine.switchTurn(player);
        return;
      }

      if (snap.status === 'paused') {
        engine.resume();
        return;
      }

      if (snap.status === 'running') {
        // Only active player can switch
        if (snap.activePlayer === player) {
          engine.switchTurn(player);
        }
      }
    },
    [engine]
  );

  const togglePause = useCallback(() => {
    HapticsService.triggerButtonPress();
    const snap = engine.getSnapshot();
    if (snap.status === 'running') {
      engine.pause();
    } else if (snap.status === 'paused') {
      engine.resume();
    } else if (snap.status === 'ready') {
      engine.start(1);
    }
  }, [engine]);

  const reset = useCallback(() => {
    HapticsService.triggerButtonPress();
    engine.reset();
  }, [engine]);

  const setPreset = useCallback(
    (config: TimeControlConfig) => {
      HapticsService.triggerButtonPress();
      engine.setConfig(config);
    },
    [engine]
  );

  const adjustTime = useCallback(
    (player: PlayerId, deltaMs: number) => {
      engine.adjustTime(player, deltaMs);
    },
    [engine]
  );

  const adjustMoves = useCallback(
    (player: PlayerId, deltaMoves: number) => {
      engine.adjustMoves(player, deltaMoves);
    },
    [engine]
  );

  return {
    snapshot,
    formattedTimes: {
      player1: p1Formatted,
      player2: p2Formatted,
      p1Delay: p1DelayFormatted,
      p2Delay: p2DelayFormatted,
    },
    actions: {
      pressClock,
      togglePause,
      reset,
      setPreset,
      adjustTime,
      adjustMoves,
    },
  };
}
