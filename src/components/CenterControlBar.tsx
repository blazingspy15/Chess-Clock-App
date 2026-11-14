import React from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ClockStatus, TimeControlConfig } from '../engine/types';
import { useSettings } from '../state/SettingsContext';

interface CenterControlBarProps {
  status: ClockStatus;
  config: TimeControlConfig;
  onTogglePause: () => void;
  onReset: () => void;
  onOpenPresets: () => void;
  onOpenSettings: () => void;
  onOpenAdjust: () => void;
  orientation?: 'portrait' | 'landscape';
}

export const CenterControlBar: React.FC<CenterControlBarProps> = ({
  status,
  config,
  onTogglePause,
  onReset,
  onOpenPresets,
  onOpenSettings,
  onOpenAdjust,
  orientation = 'portrait',
}) => {
  const { settings, updateSettings } = useSettings();

  const handleResetWithConfirm = () => {
    if (status === 'running' || status === 'paused') {
      Alert.alert(
        'Reset Game?',
        'Are you sure you want to reset the clocks to the beginning?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reset', style: 'destructive', onPress: onReset },
        ]
      );
    } else {
      onReset();
    }
  };

  const isRunning = status === 'running';

  return (
    <View
      style={[
        styles.deadZoneContainer,
        orientation === 'landscape' ? styles.landscapeContainer : styles.portraitContainer,
      ]}
    >
      {/* Preset Name / Change Button */}
      <Pressable
        style={styles.pillButton}
        onPress={onOpenPresets}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.presetText} numberOfLines={1}>
          {config.name}
        </Text>
      </Pressable>

      {/* Adjust Time Mid-Game Button */}
      <Pressable
        style={styles.iconButton}
        onPress={onOpenAdjust}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>⏱️ ±</Text>
      </Pressable>

      {/* Main Play / Pause Button */}
      <Pressable
        style={[
          styles.mainActionButton,
          isRunning ? styles.pauseButton : styles.playButton,
        ]}
        onPress={onTogglePause}
      >
        <Text style={styles.mainActionText}>
          {isRunning ? '⏸ PAUSE' : status === 'flagged' ? 'FLAGGED' : '▶ RESUME'}
        </Text>
      </Pressable>

      {/* Reset Game Button */}
      <Pressable
        style={styles.iconButton}
        onPress={handleResetWithConfirm}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>🔄</Text>
      </Pressable>

      {/* Quick Sound Toggle */}
      <Pressable
        style={styles.iconButton}
        onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>{settings.soundEnabled ? '🔊' : '🔇'}</Text>
      </Pressable>

      {/* Settings Modal Button */}
      <Pressable
        style={styles.iconButton}
        onPress={onOpenSettings}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>⚙️</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  deadZoneContainer: {
    backgroundColor: '#090d16',
    borderColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
  },
  portraitContainer: {
    width: '100%',
    height: 58,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    paddingHorizontal: 12,
  },
  landscapeContainer: {
    width: 64,
    height: '100%',
    borderLeftWidth: 2,
    borderRightWidth: 2,
    flexDirection: 'column',
    paddingVertical: 12,
  },
  pillButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    maxWidth: 90,
  },
  presetText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  mainActionButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    backgroundColor: '#2563eb',
  },
  pauseButton: {
    backgroundColor: '#b45309',
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
  },
  iconLabel: {
    fontSize: 14,
    color: '#e2e8f0',
  },
});
