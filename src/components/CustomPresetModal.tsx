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
  const { addCustomPreset } = useSettings();

  const [mode, setMode] = useState<BuilderMode>('symmetric');
  const [presetName, setPresetName] = useState('Custom');

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
    let config: TimeControlConfig;

    if (mode === 'symmetric') {
      const baseSec = (parseInt(symMinutes, 10) || 0) * 60 + (parseInt(symSeconds, 10) || 0);
      const incSec = parseInt(symIncSeconds, 10) || 0;
      const name = presetName || `${symMinutes}|${symIncSeconds}`;

      config = createSymmetricConfig(
        `custom_${Date.now()}`,
        name,
        'custom',
        baseSec,
        incSec,
        symMethod,
        `${name} (${symMethod})`
      );
    } else if (mode === 'handicap') {
      const p1Base = (parseInt(p1Minutes, 10) || 0) * 60;
      const p1Inc = parseInt(p1IncSeconds, 10) || 0;
      const p2Base = (parseInt(p2Minutes, 10) || 0) * 60;
      const p2Inc = parseInt(p2IncSeconds, 10) || 0;
      const name = presetName || `Handicap ${p1Minutes}m vs ${p2Minutes}m`;

      config = createHandicapConfig(
        name,
        p1Base,
        p1Inc,
        p1Method,
        p2Base,
        p2Inc,
        p2Method
      );
    } else {
      // Multi-stage
      const s1Moves = parseInt(stage1Moves, 10) || 40;
      const s1Min = parseInt(stage1Minutes, 10) || 90;
      const s1Inc = parseInt(stage1Inc, 10) || 30;

      const s2Min = parseInt(stage2Minutes, 10) || 30;
      const s2Inc = parseInt(stage2Inc, 10) || 30;

      const name = presetName || `Tournament ${s1Moves}/${s1Min}m + ${s2Min}m`;

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
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Custom Time Control</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Mode Selector Tabs */}
          <View style={styles.modeTabs}>
            <Pressable
              style={[styles.modeTab, mode === 'symmetric' && styles.activeModeTab]}
              onPress={() => setMode('symmetric')}
            >
              <Text style={[styles.modeTabText, mode === 'symmetric' && styles.activeModeTabText]}>
                Standard
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'handicap' && styles.activeModeTab]}
              onPress={() => setMode('handicap')}
            >
              <Text style={[styles.modeTabText, mode === 'handicap' && styles.activeModeTabText]}>
                Handicap
              </Text>
            </Pressable>
            <Pressable
              style={[styles.modeTab, mode === 'multistage' && styles.activeModeTab]}
              onPress={() => setMode('multistage')}
            >
              <Text style={[styles.modeTabText, mode === 'multistage' && styles.activeModeTabText]}>
                Multi-Stage
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Preset Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preset Name</Text>
              <TextInput
                style={styles.textInput}
                value={presetName}
                onChangeText={setPresetName}
                placeholder="e.g. My Blitz 4|2"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* SYMMETRIC FORM */}
            {mode === 'symmetric' && (
              <View>
                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Minutes</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={symMinutes}
                      onChangeText={setSymMinutes}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.inputLabel}>Seconds</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={symSeconds}
                      onChangeText={setSymSeconds}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Increment (s)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="number-pad"
                      value={symIncSeconds}
                      onChangeText={setSymIncSeconds}
                    />
                  </View>
                </View>

                <Text style={styles.sectionHeader}>Timing Mechanic</Text>
                {timingMethods.map(item => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.methodRow,
                      symMethod === item.id && styles.activeMethodRow,
                    ]}
                    onPress={() => setSymMethod(item.id)}
                  >
                    <View>
                      <Text
                        style={[
                          styles.methodLabel,
                          symMethod === item.id && styles.activeMethodLabel,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text style={styles.methodDesc}>{item.desc}</Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        symMethod === item.id && styles.radioOuterActive,
                      ]}
                    >
                      {symMethod === item.id ? <View style={styles.radioInner} /> : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* HANDICAP ASYMMETRIC FORM */}
            {mode === 'handicap' && (
              <View>
                {/* Player 1 Box */}
                <View style={styles.handicapBox}>
                  <Text style={styles.handicapBoxTitle}>⚪ Player 1 (White)</Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Minutes</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={p1Minutes}
                        onChangeText={setP1Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Increment (s)</Text>
                      <TextInput
                        style={styles.textInput}
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
                          p1Method === m.id && styles.activeMethodChip,
                        ]}
                        onPress={() => setP1Method(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            p1Method === m.id && styles.activeChipText,
                          ]}
                        >
                          {m.label.split(' ')[0]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Player 2 Box */}
                <View style={styles.handicapBox}>
                  <Text style={styles.handicapBoxTitle}>⚫ Player 2 (Black)</Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Minutes</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={p2Minutes}
                        onChangeText={setP2Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Increment (s)</Text>
                      <TextInput
                        style={styles.textInput}
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
                          p2Method === m.id && styles.activeMethodChip,
                        ]}
                        onPress={() => setP2Method(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            p2Method === m.id && styles.activeChipText,
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
                {/* Stage 1 */}
                <View style={styles.handicapBox}>
                  <Text style={styles.handicapBoxTitle}>Stage 1 Control</Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Move Threshold</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={stage1Moves}
                        onChangeText={setStage1Moves}
                        placeholder="e.g. 40"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Minutes</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={stage1Minutes}
                        onChangeText={setStage1Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Inc (s)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={stage1Inc}
                        onChangeText={setStage1Inc}
                      />
                    </View>
                  </View>
                </View>

                {/* Stage 2 */}
                <View style={styles.handicapBox}>
                  <Text style={styles.handicapBoxTitle}>Stage 2 Bonus (Rest of game)</Text>
                  <View style={styles.rowInputs}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.inputLabel}>Added Minutes</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={stage2Minutes}
                        onChangeText={setStage2Minutes}
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1 }]}>
                      <Text style={styles.inputLabel}>Inc (s)</Text>
                      <TextInput
                        style={styles.textInput}
                        keyboardType="number-pad"
                        value={stage2Inc}
                        onChangeText={setStage2Inc}
                      />
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* Save & Apply Button */}
            <Pressable style={styles.applyBtn} onPress={handleSaveAndApply}>
              <Text style={styles.applyBtnText}>Save & Start Clock</Text>
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
    backgroundColor: '#0f172a',
    borderRadius: 20,
    maxHeight: '90%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
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
    color: '#f8fafc',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeTab: {
    backgroundColor: '#2563eb',
  },
  modeTabText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  activeModeTabText: {
    color: '#ffffff',
  },
  bodyScroll: {
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 8,
  },
  methodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeMethodRow: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c4a6e',
  },
  methodLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  activeMethodLabel: {
    color: '#38bdf8',
  },
  methodDesc: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#38bdf8',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38bdf8',
  },
  handicapBox: {
    backgroundColor: '#1e293b',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  handicapBoxTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  methodChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  methodChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeMethodChip: {
    backgroundColor: '#2563eb',
    borderColor: '#60a5fa',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  activeChipText: {
    color: '#ffffff',
  },
  applyBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});
