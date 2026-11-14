import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ClockSnapshot, PlayerId } from '../engine/types';
import { formatTimeDisplay } from '../state/useChessClock';
import { useSettings } from '../state/SettingsContext';

interface TimeAdjustModalProps {
  visible: boolean;
  snapshot: ClockSnapshot;
  onClose: () => void;
  onAdjustTime: (player: PlayerId, deltaMs: number) => void;
  onAdjustMoves: (player: PlayerId, deltaMoves: number) => void;
}

export const TimeAdjustModal: React.FC<TimeAdjustModalProps> = ({
  visible,
  snapshot,
  onClose,
  onAdjustTime,
  onAdjustMoves,
}) => {
  const { theme, settings } = useSettings();
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(1);

  const playerState = selectedPlayer === 1 ? snapshot.player1 : snapshot.player2;
  const pName = selectedPlayer === 1 ? settings.player1Name : settings.player2Name;

  const timeButtons = [
    { label: '+5 min', deltaMs: 5 * 60 * 1000 },
    { label: '+1 min', deltaMs: 1 * 60 * 1000 },
    { label: '+30 sec', deltaMs: 30 * 1000 },
    { label: '+5 sec', deltaMs: 5 * 1000 },
    { label: '+1 sec', deltaMs: 1 * 1000 },
    { label: '-1 sec', deltaMs: -1 * 1000 },
    { label: '-5 sec', deltaMs: -5 * 1000 },
    { label: '-30 sec', deltaMs: -30 * 1000 },
    { label: '-1 min', deltaMs: -1 * 60 * 1000 },
    { label: '-5 min', deltaMs: -5 * 60 * 1000 },
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
          <Text style={[styles.title, { color: theme.textPrimary }]}>
            On-the-Fly Adjustments
          </Text>
          <Text style={[styles.subtitle, { color: theme.textMuted }]}>
            Arbitration tool: adjust time or move count mid-game.
          </Text>

          {/* Player Selector Tabs */}
          <View style={[styles.tabContainer, { backgroundColor: theme.surfaceElevated }]}>
            <Pressable
              style={[
                styles.tab,
                selectedPlayer === 1 && { backgroundColor: theme.accentBlue },
              ]}
              onPress={() => setSelectedPlayer(1)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedPlayer === 1 ? '#ffffff' : theme.textMuted },
                ]}
              >
                {settings.player1Name}: {formatTimeDisplay(snapshot.player1.timeRemainingMs)}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tab,
                selectedPlayer === 2 && { backgroundColor: theme.accentBlue },
              ]}
              onPress={() => setSelectedPlayer(2)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selectedPlayer === 2 ? '#ffffff' : theme.textMuted },
                ]}
              >
                {settings.player2Name}: {formatTimeDisplay(snapshot.player2.timeRemainingMs)}
              </Text>
            </Pressable>
          </View>

          {/* Current Values Display */}
          <View style={[styles.statsCard, { backgroundColor: theme.surfaceElevated }]}>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {pName}'s Time:
              </Text>
              <Text style={[styles.statValue, { color: theme.accentBlue }]}>
                {formatTimeDisplay(playerState.timeRemainingMs)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Move Count:
              </Text>
              <View style={styles.moveStepper}>
                <Pressable
                  style={[styles.stepBtn, { backgroundColor: theme.surface }]}
                  onPress={() => onAdjustMoves(selectedPlayer, -1)}
                >
                  <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>-</Text>
                </Pressable>
                <Text style={[styles.moveValue, { color: theme.textPrimary }]}>
                  {playerState.moveCount}
                </Text>
                <Pressable
                  style={[styles.stepBtn, { backgroundColor: theme.surface }]}
                  onPress={() => onAdjustMoves(selectedPlayer, 1)}
                >
                  <Text style={[styles.stepBtnText, { color: theme.textPrimary }]}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Adjustment Buttons Grid */}
          <Text style={[styles.sectionHeader, { color: theme.accentGold }]}>
            ADJUST TIME
          </Text>
          <View style={styles.buttonGrid}>
            {timeButtons.map((btn, index) => {
              const isMinus = btn.deltaMs < 0;
              return (
                <Pressable
                  key={index}
                  style={[
                    styles.adjustBtn,
                    {
                      backgroundColor: isMinus ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      borderColor: isMinus ? theme.flagRed : theme.borderActive,
                    },
                  ]}
                  onPress={() => onAdjustTime(selectedPlayer, btn.deltaMs)}
                >
                  <Text
                    style={[
                      styles.adjustBtnText,
                      { color: isMinus ? '#fca5a5' : '#86efac' },
                    ]}
                  >
                    {btn.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Done Button */}
          <Pressable
            style={[styles.doneButton, { backgroundColor: theme.accentBlue }]}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Done</Text>
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
    maxWidth: 440,
    padding: 22,
    borderWidth: 1.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontWeight: '700',
    fontSize: 12,
  },
  statsCard: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  moveStepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 18,
    fontWeight: '800',
  },
  moveValue: {
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  adjustBtn: {
    width: '48%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 4,
    borderWidth: 1,
  },
  adjustBtnText: {
    fontWeight: '800',
    fontSize: 13,
  },
  doneButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
