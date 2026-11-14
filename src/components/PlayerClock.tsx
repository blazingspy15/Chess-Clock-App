import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ClockStatus, PlayerClockState, Stage } from '../engine/types';

interface PlayerClockProps {
  playerNumber: 1 | 2;
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
  const isFlagged = clockState.isFlagged;
  const isPaused = status === 'paused';
  const isReady = status === 'ready';

  // Flash animation for 0:00 Flag
  const flashAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isFlagged) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      flashAnim.setValue(1);
    }
  }, [isFlagged, flashAnim]);

  // Determine Background Color
  let bgColor = '#1e293b'; // Default Inactive Slate

  if (isFlagged) {
    bgColor = '#dc2626'; // Urgent Crimson Red
  } else if (isActive && isClockRunning) {
    bgColor = '#15803d'; // Vibrant Energetic Green
  } else if (isActive && isPaused) {
    bgColor = '#166534'; // Calmer forest green when paused
  } else if (isReady) {
    bgColor = playerNumber === 1 ? '#1e293b' : '#334155'; // Subtle distinction before start
  }

  // Determine Text Colors
  const textColor = isFlagged
    ? '#ffffff'
    : isActive
    ? '#ffffff'
    : '#94a3b8';

  const subTextColor = isFlagged
    ? '#fee2e2'
    : isActive
    ? '#bbf7d0'
    : '#64748b';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          opacity: isFlagged ? flashAnim : 1,
          transform: isRotated ? [{ rotate: '180deg' }] : [],
        },
      ]}
    >
      <Pressable
        style={styles.pressableArea}
        onPress={onPress}
        android_disableSound={true}
      >
        {/* Top Info Bar (Move count & Time Control / Stage) */}
        <View style={styles.topInfoBar}>
          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: subTextColor }]}>
              {playerNumber === 1 ? 'WHITE' : 'BLACK'}
            </Text>
          </View>

          <View style={styles.badge}>
            <Text style={[styles.badgeText, { color: subTextColor }]}>
              MOVE {clockState.moveCount}
            </Text>
          </View>

          {stage.movesThreshold ? (
            <View style={[styles.badge, styles.stageBadge]}>
              <Text style={[styles.badgeText, { color: '#fbbf24' }]}>
                STAGE {clockState.currentStageIndex + 1}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Main Clock Face */}
        <View style={styles.timeWrapper}>
          <Text
            style={[
              styles.timeText,
              {
                color: textColor,
                fontSize: orientation === 'landscape' ? 70 : 84,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formattedTime}
          </Text>

          {/* Simple Delay Countdown Indicator */}
          {delayFormatted ? (
            <View style={styles.delayBadge}>
              <Text style={styles.delayText}>DELAY {delayFormatted}</Text>
            </View>
          ) : null}

          {/* Flag / Time's Up Banner */}
          {isFlagged ? (
            <View style={styles.flagBanner}>
              <Text style={styles.flagText}>TIME'S UP!</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Turn Status Indicator */}
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
  },
  pressableArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  topInfoBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  badge: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stageBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  timeWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  timeText: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -1.5,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  delayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    marginTop: 6,
  },
  delayText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flagBanner: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
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
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
