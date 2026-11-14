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
  const { settings, theme, updateSettings } = useSettings();

  const handleResetWithConfirm = () => {
    if (status === 'running' || status === 'paused') {
      Alert.alert(
        'Reset Game?',
        'Are you sure you want to reset the clocks to the initial time control?',
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
        {
          backgroundColor: theme.bgApp,
          borderColor: theme.borderSubtle,
        },
        orientation === 'landscape' ? styles.landscapeContainer : styles.portraitContainer,
      ]}
    >
      {/* Preset Name Button */}
      <Pressable
        style={[styles.pillButton, { backgroundColor: theme.surfaceElevated }]}
        onPress={onOpenPresets}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={[styles.presetText, { color: theme.accentBlue }]} numberOfLines={1}>
          {config.name}
        </Text>
      </Pressable>

      {/* Adjust Time Button */}
      <Pressable
        style={[styles.iconButton, { backgroundColor: theme.surfaceElevated }]}
        onPress={onOpenAdjust}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>⏱️ ±</Text>
      </Pressable>

      {/* Main Action (Start / Pause / Resume) */}
      <Pressable
        style={[
          styles.mainActionButton,
          isRunning ? { backgroundColor: theme.accentGold } : { backgroundColor: theme.accentBlue },
        ]}
        onPress={onTogglePause}
      >
        <Text style={styles.mainActionText}>
          {isRunning ? '⏸ PAUSE' : status === 'flagged' ? 'FLAGGED' : '▶ RESUME'}
        </Text>
      </Pressable>

      {/* Reset Button */}
      <Pressable
        style={[styles.iconButton, { backgroundColor: theme.surfaceElevated }]}
        onPress={handleResetWithConfirm}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>🔄</Text>
      </Pressable>

      {/* Quick Sound Toggle */}
      <Pressable
        style={[styles.iconButton, { backgroundColor: theme.surfaceElevated }]}
        onPress={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.iconLabel}>{settings.soundEnabled ? '🔊' : '🔇'}</Text>
      </Pressable>

      {/* Settings Modal Button */}
      <Pressable
        style={[styles.iconButton, { backgroundColor: theme.surfaceElevated }]}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    elevation: 10,
  },
  portraitContainer: {
    width: '100%',
    height: 60,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  landscapeContainer: {
    width: 68,
    height: '100%',
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    flexDirection: 'column',
    paddingVertical: 16,
  },
  pillButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    maxWidth: 96,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainActionButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  iconButton: {
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 38,
    minHeight: 38,
  },
  iconLabel: {
    fontSize: 15,
  },
});
