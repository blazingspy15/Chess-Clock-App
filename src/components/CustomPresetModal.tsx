import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createHandicapConfig,
  createMultiStageConfig,
  createSymmetricConfig,
} from '../engine/presets';
import { TimingMethod, TimeControlConfig } from '../engine/types';
import { useSettings } from '../state/SettingsContext';

interface CustomPresetModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyConfig: (config: TimeControlConfig) => void;
}

type BuilderMode = 'symmetric' | 'handicap' | 'multistage';

export const CustomPresetModal: React.FC<CustomPresetModalProps> = ({
  visible,
  onClose,
  onApplyConfig,
}) => {
  const { addCustomPreset, theme } = useSettings();

  const [mode, setMode] = useState<BuilderMode>('symmetric');
  const [presetName, setPresetName] = useState('Custom');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Symmetric State
  const [symMinutes, setSymMinutes] = useState('5');
  const [symSeconds, setSymSeconds] = useState('0');
  const [symIncSeconds, setSymIncSeconds] = useState('3');
  const [symMethod, setSymMethod] = useState<TimingMethod>('fischer');

  // Handicap State (Asymmetric)
  const [p1Minutes, setP1Minutes] = useState('10');
  const [p1IncSeconds, setP1IncSeconds] = useState('0');
  const [p1Method, setP1Method] = useState<TimingMethod>('none');

  const [p2Minutes, setP2Minutes] = useState('2');
  const [p2IncSeconds, setP2IncSeconds] = useState('1');
  const [p2Method, setP2Method] = useState<TimingMethod>('fischer');

  // Multi-Stage State
  const [stage1Moves, setStage1Moves] = useState('40');
  const [stage1Minutes, setStage1Minutes] = useState('90');
  const [stage1Inc, setStage1Inc] = useState('30');
  const [stage1Method, setStage1Method] = useState<TimingMethod>('fischer');

  const [stage2Minutes, setStage2Minutes] = useState('30');
  const [stage2Inc, setStage2Inc] = useState('30');
  const [stage2Method, setStage2Method] = useState<TimingMethod>('fischer');

  const timingMethods: { id: TimingMethod; label: string; desc: string }[] = [
    { id: 'fischer', label: 'Fischer (+)', desc: 'Added instantly after move' },
    { id: 'bronstein', label: 'Bronstein (B)', desc: 'Refunds time spent, capped at delay' },
    { id: 'delay', label: 'Simple Delay (D)', desc: 'Countdown before main time ticks' },
    { id: 'none', label: 'None', desc: 'No increment or delay' },
  ];

  const handleSaveAndApply = async () => {
    setErrorMessage(null);
    let config: TimeControlConfig;

    if (mode === 'symmetric') {
      const min = parseInt(symMinutes, 10);
      const sec = parseInt(symSeconds, 10);
      const inc = parseInt(symIncSeconds, 10);

      if (isNaN(min) || min < 0 || isNaN(sec) || sec < 0) {
        setErrorMessage('Minutes and seconds must be positive numbers.');
        return;
      }
      const totalSec = min * 60 + sec;
      if (totalSec < 1) {
        setErrorMessage('Total starting time must be at least 1 second.');
        return;
      }
      if (isNaN(inc) || inc < 0) {
        setErrorMessage('Increment cannot be negative.');
        return;
      }

      const name = presetName.trim() || `${min}|${inc}`;
      config = createSymmetricConfig(
        `custom_${Date.now()}`,
        name,
        'custom',
        totalSec,
        inc,
        symMethod,
        `${name} (${symMethod})`
      );
    } else if (mode === 'handicap') {
      const p1Min = parseInt(p1Minutes, 10);
      const p1Inc = parseInt(p1IncSeconds, 10);
      const p2Min = parseInt(p2Minutes, 10);
      const p2Inc = parseInt(p2IncSeconds, 10);

      if (isNaN(p1Min) || p1Min < 0 || isNaN(p2Min) || p2Min < 0) {
        setErrorMessage('Both players must have valid time settings.');
        return;
      }
      if (p1Min * 60 < 1 || p2Min * 60 < 1) {
        setErrorMessage('Starting time must be at least 1 minute for both players.');
        return;
      }
      if (isNaN(p1Inc) || p1Inc < 0 || isNaN(p2Inc) || p2Inc < 0) {
        setErrorMessage('Increments cannot be negative.');
        return;
      }

      const name = presetName.trim() || `Handicap ${p1Min}m vs ${p2Min}m`;
      config = createHandicapConfig(
        name,
        p1Min * 60,
        p1Inc,
        p1Method,
        p2Min * 60,
        p2Inc,
        p2Method
      );
    } else {
      // Multi-stage
      const s1Moves = parseInt(stage1Moves, 10);
      const s1Min = parseInt(stage1Minutes, 10);
      const s1Inc = parseInt(stage1Inc, 10);
      const s2Min = parseInt(stage2Minutes, 10);
      const s2Inc = parseInt(stage2Inc, 10);

      if (isNaN(s1Moves) || s1Moves < 1) {
        setErrorMessage('Stage 1 move threshold must be at least 1 move.');
        return;
      }
      if (isNaN(s1Min) || s1Min < 1 || isNaN(s2Min) || s2Min < 1) {
        setErrorMessage('Stage minutes must be at least 1 minute.');
        return;
      }
      if (isNaN(s1Inc) || s1Inc < 0 || isNaN(s2Inc) || s2Inc < 0) {
        setErrorMessage('Stage increments cannot be negative.');
        return;
      }

      const name = presetName.trim() || `Tournament ${s1Moves}/${s1Min}m + ${s2Min}m`;
      config = createMultiStageConfig(`tournament_${Date.now()}`, name, [
        {
          movesThreshold: s1Moves,
          baseTimeMinutes: s1Min,
          incrementSeconds: s1Inc,
          timingMethod: stage1Method,
        },
        {
          baseTimeMinutes: s2Min,
          incrementSeconds: s2Inc,
          timingMethod: stage2Method,
        },
      ]);
    }

    await addCustomPreset(config);
    onApplyConfig(config);
    onClose();
  };

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
            <Text style={[styles.title, { color: theme.textPrimary }]}>Custom Time Control</Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated }]}
            >
              <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Mode Selector Tabs */}
          <View style={[styles.modeTabs, { backgroundColor: theme.surfaceElevated }]}>
            <Pressable
              style={[
                styles.modeTab,
                mode === 'symmetric' && { backgroundColor: theme.accentBlue },
              ]}
              onPress={() => {
                setMode('symmetric');
                setErrorMessage(null);
              }}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'symmetric' ? '#ffffff' : theme.textMuted },
                ]}
              >
                Standard
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                mode === 'handicap' && { backgroundColor: theme.accentBlue },
              ]}
              onPress={() => {
                setMode('handicap');
                setErrorMessage(null);
              }}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'handicap' ? '#ffffff' : theme.textMuted },
                ]}
              >
                Handicap
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.modeTab,
                mode === 'multistage' && { backgroundColor: theme.accentBlue },
              ]}
              onPress={() => {
                setMode('multistage');
                setErrorMessage(null);
              }}
            >
              <Text
                style={[
                  styles.modeTabText,
                  { color: mode === 'multistage' ? '#ffffff' : theme.textMuted },
                ]}
              >
                Multi-Stage
              </Text>
            </Pressable>
          </View>

          {/* Validation Error Banner */}
          {errorMessage ? (
            <View style={[styles.errorBanner, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Text style={[styles.errorText, { color: theme.flagRed }]}>⚠️ {errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Preset Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Preset Name</Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.surfaceElevated,
                    color: theme.textPrimary,
                    borderColor: theme.borderSubtle,
                  },
                ]}
                value={presetName}
                onChangeText={setPresetName}
                placeholder="e.g. My Blitz 4|2"
                placeholderTextColor={theme.textMuted}
                maxLength={24}
              />
            </View>

            {/* SYMMETRIC FORM */}
            {mode === 'symmetric' && (
              <View>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceElevated,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      keyboardType="number-pad"
                      value={symMinutes}
                      onChangeText={setSymMinutes}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Seconds</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceElevated,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      keyboardType="number-pad"
                      value={symSeconds}
                      onChangeText={setSymSeconds}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Increment (s)</Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: theme.surfaceElevated,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      keyboardType="number-pad"
                      value={symIncSeconds}
                      onChangeText={setSymIncSeconds}
                    />
                  </View>
                </View>

                <Text style={[styles.sectionHeader, { color: theme.accentGold }]}>TIMING MECHANIC</Text>
                {timingMethods.map(item => {
                  const isSelected = symMethod === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      style={[
                        styles.methodRow,
                        {
                          backgroundColor: isSelected ? theme.surfaceActive : theme.surfaceElevated,
                          borderColor: isSelected ? theme.borderActive : theme.borderSubtle,
                        },
                      ]}
                      onPress={() => setSymMethod(item.id)}
                    >
                      <View>
                        <Text
                          style={[
                            styles.methodLabel,
                            { color: isSelected ? '#ffffff' : theme.textPrimary },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.methodDesc,
                            { color: isSelected ? theme.activeSubTextColor : theme.textMuted },
                          ]}
                        >
                          {item.desc}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* HANDICAP FORM */}
            {mode === 'handicap' && (
              <View>
                {/* Player 1 Box */}
                <View
                  style={[
                    styles.handicapBox,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.handicapBoxTitle, { color: theme.textPrimary }]}>
                    ⚪ Player 1 (White)
                  </Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={p1Minutes}
                        onChangeText={setP1Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Increment (s)</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={p1IncSeconds}
                        onChangeText={setP1IncSeconds}
                      />
                    </View>
                  </View>
                  <View style={styles.methodChips}>
                    {timingMethods.map(m => (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.methodChip,
                          {
                            backgroundColor:
                              p1Method === m.id ? theme.accentBlue : theme.surface,
                            borderColor:
                              p1Method === m.id ? theme.borderActive : theme.borderSubtle,
                          },
                        ]}
                        onPress={() => setP1Method(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: p1Method === m.id ? '#ffffff' : theme.textMuted },
                          ]}
                        >
                          {m.label.split(' ')[0]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Player 2 Box */}
                <View
                  style={[
                    styles.handicapBox,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.handicapBoxTitle, { color: theme.textPrimary }]}>
                    ⚫ Player 2 (Black)
                  </Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={p2Minutes}
                        onChangeText={setP2Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Increment (s)</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={p2IncSeconds}
                        onChangeText={setP2IncSeconds}
                      />
                    </View>
                  </View>
                  <View style={styles.methodChips}>
                    {timingMethods.map(m => (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.methodChip,
                          {
                            backgroundColor:
                              p2Method === m.id ? theme.accentBlue : theme.surface,
                            borderColor:
                              p2Method === m.id ? theme.borderActive : theme.borderSubtle,
                          },
                        ]}
                        onPress={() => setP2Method(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: p2Method === m.id ? '#ffffff' : theme.textMuted },
                          ]}
                        >
                          {m.label.split(' ')[0]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* MULTI-STAGE FORM */}
            {mode === 'multistage' && (
              <View>
                <View
                  style={[
                    styles.handicapBox,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.handicapBoxTitle, { color: theme.textPrimary }]}>
                    Stage 1 Control
                  </Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Move Threshold</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={stage1Moves}
                        onChangeText={setStage1Moves}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Minutes</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={stage1Minutes}
                        onChangeText={setStage1Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Inc (s)</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={stage1Inc}
                        onChangeText={setStage1Inc}
                      />
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.handicapBox,
                    {
                      backgroundColor: theme.surfaceElevated,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.handicapBoxTitle, { color: theme.textPrimary }]}>
                    Stage 2 Bonus (Rest of game)
                  </Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Added Minutes</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={stage2Minutes}
                        onChangeText={setStage2Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Inc (s)</Text>
                      <TextInput
                        style={[
                          styles.textInput,
                          {
                            backgroundColor: theme.surface,
                            color: theme.textPrimary,
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        keyboardType="number-pad"
                        value={stage2Inc}
                        onChangeText={setStage2Inc}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Save & Apply */}
            <Pressable
              style={[styles.applyBtn, { backgroundColor: theme.surfaceActive }]}
              onPress={handleSaveAndApply}
            >
              <Text style={styles.applyBtnText}>Save & Apply Clock</Text>
            </Pressable>
          </ScrollView>
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
    padding: 16,
  },
  modalContent: {
    borderRadius: 20,
    maxHeight: '90%',
    padding: 20,
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
  modeTabs: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  errorBanner: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bodyScroll: {
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    fontWeight: '600',
    borderWidth: 1,
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 10,
    marginBottom: 8,
  },
  methodRow: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1.5,
  },
  methodLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  methodDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  handicapBox: {
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1.5,
  },
  handicapBoxTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  methodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  methodChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  applyBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
