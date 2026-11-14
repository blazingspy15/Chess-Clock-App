import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ClockStatus, PlayerClockState, Stage } from '../engine/types';
import { useSettings } from '../state/SettingsContext';

interface PlayerClockProps {
  playerNumber: 1 | 2;
  playerName: string;
  clockState: PlayerClockState;
  stage: Stage;
  formattedTime: string;
  delayFormatted: string | null;
  isActive: boolean;
  isClockRunning: boolean;
  status: ClockStatus;
  isRotated?: boolean;
  onPress: () => void;
  orientation?: 'portrait' | 'landscape';
}

export const PlayerClock: React.FC<PlayerClockProps> = ({
  playerNumber,
  playerName,
  clockState,
  stage,
  formattedTime,
  delayFormatted,
  isActive,
  isClockRunning,
  status,
  isRotated = false,
  onPress,
  orientation = 'portrait',
}) => {
  const { theme } = useSettings();
  const isFlagged = clockState.isFlagged;
  const isPaused = status === 'paused';
  const isReady = status === 'ready';
  const isLowTime = clockState.timeRemainingMs <= 10000 && clockState.timeRemainingMs > 0;

  // Flash animation for 0:00 Flag
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFlagged) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.35,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      flashAnim.setValue(1);
    }
  }, [isFlagged, flashAnim]);

  // Determine Background Color
  let bgColor = theme.surfaceInactive;

  if (isFlagged) {
    bgColor = theme.surfaceFlagged;
  } else if (isActive && isClockRunning) {
    bgColor = theme.surfaceActive;
  } else if (isActive && isPaused) {
    bgColor = theme.surfacePaused;
  } else if (isReady) {
    bgColor = playerNumber === 1 ? theme.surfaceInactive : theme.surface;
  }

  // Determine Text Colors
  let textColor = theme.textMuted;
  let subTextColor = theme.textMuted;

  if (isFlagged) {
    textColor = '#ffffff';
    subTextColor = theme.flagSubText;
  } else if (isActive) {
    textColor = theme.activeTextColor;
    subTextColor = theme.activeSubTextColor;
  } else if (isLowTime) {
    textColor = theme.accentGold;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: isFlagged ? flashAnim : 1,
          transform: isRotated ? [{ rotate: '180deg' }] : [],
          borderColor: isLowTime && isActive ? theme.accentGold : theme.borderSubtle,
        },
      ]}
    >
      <Pressable
        style={styles.pressableArea}
        onPress={onPress}
        android_disableSound={true}
      >
        {/* Top Info Bar: Player Name, Move Count, Stage */}
        <View style={styles.topInfoBar}>
          <View style={[styles.badge, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
            <Text style={[styles.badgeText, { color: subTextColor }]}>
              {playerName.toUpperCase()}
            </Text>
          </View>

          <View style={[styles.badge, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}>
            <Text style={[styles.badgeText, { color: subTextColor }]}>
              MOVE {clockState.moveCount}
            </Text>
          </View>

          {stage.movesThreshold ? (
            <View style={[styles.badge, { backgroundColor: 'rgba(217, 119, 6, 0.25)' }]}>
              <Text style={[styles.badgeText, { color: theme.accentGold }]}>
                STAGE {clockState.currentStageIndex + 1}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Center Main Clock Digits */}
        <View style={styles.timeWrapper}>
          <Text
            style={[
              styles.timeText,
              {
                color: textColor,
                fontSize: orientation === 'landscape' ? 68 : 82,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formattedTime}
          </Text>

          {/* Simple Delay Indicator */}
          {delayFormatted ? (
            <View style={styles.delayBadge}>
              <Text style={styles.delayText}>DELAY {delayFormatted}</Text>
            </View>
          ) : null}

          {/* Flagged / Time's Up Banner */}
          {isFlagged ? (
            <View style={styles.flagBanner}>
              <Text style={styles.flagText}>TIME'S UP!</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Turn Hint Indicator */}
        <View style={styles.bottomInfoBar}>
          <Text style={[styles.statusHint, { color: subTextColor }]}>
            {isFlagged
              ? 'FLAGGED'
              : isActive
              ? isClockRunning
                ? 'TAP TO PASS TURN'
                : 'PAUSED'
              : isReady
              ? 'TAP TO START'
              : 'WAITING'}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
    borderWidth: 1,
  },
  pressableArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 22,
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  timeWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  timeText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  delayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 6,
  },
  delayText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flagBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  flagText: {
    color: '#fef08a',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  bottomInfoBar: {
    alignItems: 'center',
  },
  statusHint: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
