import React, { useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSettings } from '../state/SettingsContext';
import { THEMES, ThemeId } from '../theme/tokens';
import { BackgroundBehavior, ClockOrientation } from '../services/storageService';
import { AudioService } from '../services/audioService';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { settings, theme, audioStatus, updateSettings, resetSettings } = useSettings();

  const [p1Name, setP1Name] = useState(settings.player1Name);
  const [p2Name, setP2Name] = useState(settings.player2Name);

  useEffect(() => {
    setP1Name(settings.player1Name);
    setP2Name(settings.player2Name);
  }, [settings.player1Name, settings.player2Name]);

  const handleSaveNames = () => {
    updateSettings({
      player1Name: p1Name.trim() || 'White',
      player2Name: p2Name.trim() || 'Black',
    });
  };

  const themeList: { id: ThemeId; name: string; color: string }[] = [
    { id: 'graphite', name: 'Graphite', color: THEMES.graphite.surfaceActive },
    { id: 'midnight', name: 'Midnight', color: THEMES.midnight.surfaceActive },
    { id: 'emerald', name: 'Emerald', color: THEMES.emerald.surfaceActive },
    { id: 'wood', name: 'Classic Wood', color: THEMES.wood.surfaceActive },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: theme.surface,
              borderColor: theme.borderSubtle,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Clock Settings</Text>
            <Pressable
              onPress={() => {
                handleSaveNames();
                onClose();
              }}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated }]}
            >
              <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Player Names Section */}
            <Text style={[styles.sectionHeader, { color: theme.accentGold }]}>PLAYER NAMES</Text>
            <View style={styles.nameRow}>
              <View style={[styles.nameInputContainer, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Player 1 (White)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceElevated,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  value={p1Name}
                  onChangeText={setP1Name}
                  onBlur={handleSaveNames}
                  placeholder="White"
                  placeholderTextColor={theme.textMuted}
                  maxLength={16}
                />
              </View>
              <View style={[styles.nameInputContainer, { flex: 1 }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Player 2 (Black)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.surfaceElevated,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                  value={p2Name}
                  onChangeText={setP2Name}
                  onBlur={handleSaveNames}
                  placeholder="Black"
                  placeholderTextColor={theme.textMuted}
                  maxLength={16}
                />
              </View>
            </View>

            {/* Theme Selection */}
            <Text style={[styles.sectionHeader, { color: theme.accentGold, marginTop: 18 }]}>THEME</Text>
            <View style={styles.themeRow}>
              {themeList.map(item => {
                const isSelected = settings.theme === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.themeCard,
                      {
                        backgroundColor: theme.surfaceElevated,
                        borderColor: isSelected ? theme.accentBlue : theme.borderSubtle,
                      },
                    ]}
                    onPress={() => updateSettings({ theme: item.id })}
                  >
                    <View style={[styles.themeColorDot, { backgroundColor: item.color }]} />
                    <Text
                      style={[
                        styles.themeName,
                        { color: isSelected ? theme.textPrimary : theme.textMuted },
                      ]}
                    >
                      {item.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Clock Orientation Option */}
            <Text style={[styles.sectionHeader, { color: theme.accentGold, marginTop: 18 }]}>
              TOP CLOCK ORIENTATION
            </Text>
            <View style={styles.orientationTabs}>
              <Pressable
                style={[
                  styles.tabButton,
                  settings.clockOrientation === 'opposite' && {
                    backgroundColor: theme.accentBlue,
                  },
                ]}
                onPress={() => updateSettings({ clockOrientation: 'opposite' as ClockOrientation })}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color:
                        settings.clockOrientation === 'opposite'
                          ? '#ffffff'
                          : theme.textMuted,
                    },
                  ]}
                >
                  Opponent Facing (180°)
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tabButton,
                  settings.clockOrientation === 'same' && {
                    backgroundColor: theme.accentBlue,
                  },
                ]}
                onPress={() => updateSettings({ clockOrientation: 'same' as ClockOrientation })}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color:
                        settings.clockOrientation === 'same'
                          ? '#ffffff'
                          : theme.textMuted,
                    },
                  ]}
                >
                  Normal (Observer)
                </Text>
              </Pressable>
            </View>

            {/* Background Behavior */}
            <Text style={[styles.sectionHeader, { color: theme.accentGold, marginTop: 18 }]}>
              BACKGROUND BEHAVIOR
            </Text>
            <View style={styles.orientationTabs}>
              <Pressable
                style={[
                  styles.tabButton,
                  settings.backgroundBehavior === 'pause' && {
                    backgroundColor: theme.accentBlue,
                  },
                ]}
                onPress={() => updateSettings({ backgroundBehavior: 'pause' as BackgroundBehavior })}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color:
                        settings.backgroundBehavior === 'pause'
                          ? '#ffffff'
                          : theme.textMuted,
                    },
                  ]}
                >
                  Auto-Pause on Minimize
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.tabButton,
                  settings.backgroundBehavior === 'continue' && {
                    backgroundColor: theme.accentBlue,
                  },
                ]}
                onPress={() => updateSettings({ backgroundBehavior: 'continue' as BackgroundBehavior })}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    {
                      color:
                        settings.backgroundBehavior === 'continue'
                          ? '#ffffff'
                          : theme.textMuted,
                    },
                  ]}
                >
                  Continue Running
                </Text>
              </Pressable>
            </View>

            {/* Audio & Feedback Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: theme.accentGold, marginTop: 18 }]}>
                AUDIO & FEEDBACK
              </Text>
              {/* Audio Initialization Status Indicator */}
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      audioStatus === 'ready'
                        ? 'rgba(34, 197, 94, 0.15)'
                        : audioStatus === 'loading'
                        ? 'rgba(234, 179, 8, 0.15)'
                        : 'rgba(239, 68, 68, 0.15)',
                    borderColor:
                      audioStatus === 'ready'
                        ? '#22c55e'
                        : audioStatus === 'loading'
                        ? '#eab308'
                        : '#ef4444',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    {
                      color:
                        audioStatus === 'ready'
                          ? '#22c55e'
                          : audioStatus === 'loading'
                          ? '#eab308'
                          : '#ef4444',
                    },
                  ]}
                >
                  {audioStatus === 'ready'
                    ? '● Audio Ready'
                    : audioStatus === 'loading'
                    ? '◌ Audio Loading...'
                    : '○ Audio Unavailable'}
                </Text>
              </View>
            </View>

            {/* Sound Effects Master Switch */}
            <View style={[styles.settingRow, { borderColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Sound Effects</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Master audio toggle for clock sounds
                </Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={val => updateSettings({ soundEnabled: val })}
                trackColor={{ false: theme.borderSubtle, true: theme.accentBlue }}
              />
            </View>

            {/* Master Volume Control */}
            <View style={[styles.settingRowColumn, { borderColor: theme.borderSubtle }]}>
              <View style={styles.volumeHeaderRow}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Master Volume</Text>
                <Text style={[styles.volumeValueText, { color: theme.accentBlue }]}>
                  {Math.round((settings.masterVolume ?? 1.0) * 100)}%
                </Text>
              </View>
              <View style={styles.volumePillsRow}>
                {[0, 0.25, 0.5, 0.75, 1.0].map((vol) => {
                  const isSelected = Math.abs((settings.masterVolume ?? 1.0) - vol) < 0.05;
                  return (
                    <Pressable
                      key={vol}
                      style={[
                        styles.volumePill,
                        { borderColor: theme.borderSubtle },
                        isSelected && {
                          backgroundColor: theme.accentBlue,
                          borderColor: theme.accentBlue,
                        },
                      ]}
                      onPress={() => updateSettings({ masterVolume: vol })}
                    >
                      <Text
                        style={[
                          styles.volumePillText,
                          { color: isSelected ? '#ffffff' : theme.textSecondary },
                        ]}
                      >
                        {vol === 0 ? 'Mute' : `${Math.round(vol * 100)}%`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Clock Click + Test Sound Button */}
            <View style={[styles.settingRow, { borderColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Clock Click</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Mechanical snap on turn switch
                </Text>
              </View>
              <Pressable
                style={[
                  styles.testButton,
                  { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
                ]}
                onPress={() => AudioService.testSound('click')}
              >
                <Text style={[styles.testButtonText, { color: theme.accentBlue }]}>▶ Test</Text>
              </Pressable>
            </View>

            {/* Low-Time Warning + Test Button */}
            <View style={[styles.settingRow, { borderColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Low-Time Warning</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Countdown tick when under 10s
                </Text>
              </View>
              <View style={styles.actionGroup}>
                <Pressable
                  style={[
                    styles.testButtonSmall,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
                  ]}
                  onPress={() => AudioService.testSound('lowTime')}
                >
                  <Text style={[styles.testButtonText, { color: theme.accentBlue }]}>▶ Test</Text>
                </Pressable>
                <Switch
                  value={settings.lowTimeWarning}
                  onValueChange={val => updateSettings({ lowTimeWarning: val })}
                  trackColor={{ false: theme.borderSubtle, true: theme.accentBlue }}
                />
              </View>
            </View>

            {/* Timeout Alarm + Test Button */}
            <View style={[styles.settingRow, { borderColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Timeout Alarm</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Two-tone buzzer when time hits 0:00
                </Text>
              </View>
              <View style={styles.actionGroup}>
                <Pressable
                  style={[
                    styles.testButtonSmall,
                    { backgroundColor: theme.surfaceElevated, borderColor: theme.borderSubtle },
                  ]}
                  onPress={() => AudioService.testSound('timeout')}
                >
                  <Text style={[styles.testButtonText, { color: theme.accentBlue }]}>▶ Test</Text>
                </Pressable>
                <Switch
                  value={settings.timeoutAlarm}
                  onValueChange={val => updateSettings({ timeoutAlarm: val })}
                  trackColor={{ false: theme.borderSubtle, true: theme.accentBlue }}
                />
              </View>
            </View>

            {/* Button Sound Effects Toggle */}
            <View style={[styles.settingRow, { borderColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Button Feedback</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Audio clicks on Pause, Reset, Adjust
                </Text>
              </View>
              <Switch
                value={settings.buttonSoundEnabled ?? true}
                onValueChange={val => updateSettings({ buttonSoundEnabled: val })}
                trackColor={{ false: theme.borderSubtle, true: theme.accentBlue }}
              />
            </View>

            {/* Haptic Feedback Toggle */}
            <View style={[styles.settingRow, { borderColor: theme.borderSubtle }]}>
              <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>Haptic Feedback</Text>
                <Text style={[styles.settingSub, { color: theme.textMuted }]}>
                  Tactile vibration on turn pass
                </Text>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={val => updateSettings({ hapticsEnabled: val })}
                trackColor={{ false: theme.borderSubtle, true: theme.accentBlue }}
              />
            </View>

            {/* Restore Defaults Button */}
            <Pressable
              style={[styles.resetDefaultsBtn, { borderColor: theme.borderSubtle }]}
              onPress={resetSettings}
            >
              <Text style={[styles.resetDefaultsText, { color: theme.textSecondary }]}>
                Restore Default Settings
              </Text>
            </Pressable>
          </ScrollView>

          {/* Close Button */}
          <Pressable
            style={[styles.doneBtn, { backgroundColor: theme.accentBlue }]}
            onPress={() => {
              handleSaveNames();
              onClose();
            }}
          >
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    padding: 22,
    borderWidth: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  scrollBody: {
    marginBottom: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
  },
  nameInputContainer: {
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  textInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  themeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  themeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  themeColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  themeName: {
    fontSize: 13,
    fontWeight: '700',
  },
  orientationTabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSub: {
    fontSize: 12,
    marginTop: 2,
  },
  resetDefaultsBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  resetDefaultsText: {
    fontSize: 13,
    fontWeight: '700',
  },
  doneBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  settingRowColumn: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  volumeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  volumeValueText: {
    fontSize: 14,
    fontWeight: '800',
  },
  volumePillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  volumePill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  volumePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  testButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  testButtonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
