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
import { TimeControlConfig } from '../engine/types';
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
  const { customPresets, deleteCustomPreset, theme } = useSettings();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'bullet', label: 'Bullet' },
    { id: 'blitz', label: 'Blitz' },
    { id: 'rapid', label: 'Rapid' },
    { id: 'classical', label: 'Classical' },
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
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: theme.textPrimary }]}>Time Controls</Text>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated }]}
            >
              <Text style={[styles.closeBtnText, { color: theme.textSecondary }]}>✕</Text>
            </Pressable>
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map(cat => {
              const isCatActive = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isCatActive ? theme.accentBlue : theme.surfaceElevated,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.id)}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      { color: isCatActive ? '#ffffff' : theme.textMuted },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
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
                      {
                        backgroundColor: isSelected ? theme.surfaceActive : theme.surfaceElevated,
                        borderColor: isSelected ? theme.borderActive : theme.borderSubtle,
                      },
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
                          { color: isSelected ? '#ffffff' : theme.textPrimary },
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

                    <Text
                      style={[
                        styles.presetDesc,
                        { color: isSelected ? theme.activeSubTextColor : theme.textMuted },
                      ]}
                    >
                      {preset.description}
                    </Text>

                    <View style={styles.tagContainer}>
                      <View
                        style={[
                          styles.timingMethodTag,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(0, 0, 0, 0.25)'
                              : theme.surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.timingMethodText,
                            { color: isSelected ? '#ffffff' : theme.accentBlue },
                          ]}
                        >
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

            {/* Custom Builder Button */}
            <Pressable
              style={[
                styles.customBuilderButton,
                {
                  borderColor: theme.accentBlue,
                  backgroundColor: theme.surfaceElevated,
                },
              ]}
              onPress={() => {
                onClose();
                onOpenCustomBuilder();
              }}
            >
              <Text style={[styles.customBuilderText, { color: theme.accentBlue }]}>
                + Create Custom / Handicap / Stage Preset
              </Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1.5,
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
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '700',
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
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
    borderWidth: 1.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  presetName: {
    fontSize: 15,
    fontWeight: '800',
  },
  presetDesc: {
    fontSize: 11,
    marginBottom: 8,
    fontWeight: '600',
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  timingMethodText: {
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
    fontWeight: '700',
  },
  customBuilderButton: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  customBuilderText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
