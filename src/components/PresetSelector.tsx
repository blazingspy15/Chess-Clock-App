import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PRESET_TIME_CONTROLS } from '../engine/presets';
import { TimeControlCategory, TimeControlConfig } from '../engine/types';
import { useSettings } from '../state/SettingsContext';

interface PresetSelectorProps {
  visible: boolean;
  currentConfigId: string;
  onSelectPreset: (config: TimeControlConfig) => void;
  onOpenCustomBuilder: () => void;
  onClose: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  visible,
  currentConfigId,
  onSelectPreset,
  onOpenCustomBuilder,
  onClose,
}) => {
  const { customPresets, deleteCustomPreset } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'bullet', label: 'Bullet' },
    { id: 'blitz', label: 'Blitz' },
    { id: 'rapid', label: 'Rapid' },
    { id: 'classical', label: 'Tournament' },
    { id: 'custom', label: 'Custom' },
  ];

  const allPresets = [...PRESET_TIME_CONTROLS, ...customPresets];

  const filteredPresets =
    selectedCategory === 'all'
      ? allPresets
      : allPresets.filter(p => p.category === selectedCategory);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.title}>Time Controls</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map(cat => (
              <Pressable
                key={cat.id}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat.id && styles.activeCategoryPill,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    selectedCategory === cat.id && styles.activeCategoryPillText,
                  ]}
                >
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Preset Cards Grid */}
          <ScrollView style={styles.presetsList} showsVerticalScrollIndicator={false}>
            <View style={styles.presetsGrid}>
              {filteredPresets.map(preset => {
                const isSelected = preset.id === currentConfigId;
                const p1Stage = preset.player1.stages[0];

                return (
                  <Pressable
                    key={preset.id}
                    style={[
                      styles.presetCard,
                      isSelected && styles.selectedPresetCard,
                    ]}
                    onPress={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                  >
                    <View style={styles.cardHeader}>
                      <Text
                        style={[
                          styles.presetName,
                          isSelected && styles.selectedPresetName,
                        ]}
                      >
                        {preset.name}
                      </Text>
                      {preset.isHandicap ? (
                        <View style={styles.handicapBadge}>
                          <Text style={styles.handicapText}>HANDICAP</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={styles.presetDesc}>{preset.description}</Text>

                    <View style={styles.tagContainer}>
                      <View style={styles.timingMethodTag}>
                        <Text style={styles.timingMethodText}>
                          {p1Stage.timingMethod.toUpperCase()}
                        </Text>
                      </View>
                      {preset.category === 'classical' && preset.player1.stages.length > 1 ? (
                        <View style={styles.multiStageTag}>
                          <Text style={styles.multiStageText}>
                            {preset.player1.stages.length} STAGES
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {preset.category === 'custom' ? (
                      <Pressable
                        style={styles.deleteCustomBtn}
                        onPress={() => deleteCustomPreset(preset.id)}
                      >
                        <Text style={styles.deleteCustomText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Time Control / Handicap Builder Button */}
            <Pressable
              style={styles.customBuilderButton}
              onPress={() => {
                onClose();
                onOpenCustomBuilder();
              }}
            >
              <Text style={styles.customBuilderText}>+ Create Custom / Handicap Preset</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
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
  categoryScroll: {
    maxHeight: 44,
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 8,
  },
  activeCategoryPill: {
    backgroundColor: '#2563eb',
  },
  categoryPillText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  activeCategoryPillText: {
    color: '#ffffff',
  },
  presetsList: {
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
  },
  selectedPresetCard: {
    borderColor: '#22c55e',
    backgroundColor: '#064e3b',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  selectedPresetName: {
    color: '#4ade80',
  },
  presetDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
  },
  handicapBadge: {
    backgroundColor: '#7c2d12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  handicapText: {
    color: '#fdba74',
    fontSize: 9,
    fontWeight: '800',
  },
  tagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timingMethodTag: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  timingMethodText: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
  },
  multiStageTag: {
    backgroundColor: '#3b0764',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  multiStageText: {
    color: '#d8b4fe',
    fontSize: 10,
    fontWeight: '800',
  },
  deleteCustomBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  deleteCustomText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '600',
  },
  customBuilderButton: {
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  customBuilderText: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
  },
});
