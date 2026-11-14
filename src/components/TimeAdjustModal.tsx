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
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerId>(1);

  const playerState = selectedPlayer === 1 ? snapshot.player1 : snapshot.player2;

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
        <View style={styles.modalContent}>
          <Text style={styles.title}>On-the-Fly Time & Move Adjustment</Text>
          <Text style={styles.subtitle}>
            Adjust clock times or move counts to fix mid-game mistakes or penalties.
          </Text>

          {/* Player Selector Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              style={[styles.tab, selectedPlayer === 1 && styles.activeTab]}
              onPress={() => setSelectedPlayer(1)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedPlayer === 1 && styles.activeTabText,
                ]}
              >
                White (P1): {formatTimeDisplay(snapshot.player1.timeRemainingMs)}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.tab, selectedPlayer === 2 && styles.activeTab]}
              onPress={() => setSelectedPlayer(2)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedPlayer === 2 && styles.activeTabText,
                ]}
              >
                Black (P2): {formatTimeDisplay(snapshot.player2.timeRemainingMs)}
              </Text>
            </Pressable>
          </View>

          {/* Current Values Display */}
          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current Time:</Text>
              <Text style={styles.statValue}>
                {formatTimeDisplay(playerState.timeRemainingMs)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Move Count:</Text>
              <View style={styles.moveStepper}>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => onAdjustMoves(selectedPlayer, -1)}
                >
                  <Text style={styles.stepBtnText}>-</Text>
                </Pressable>
                <Text style={styles.moveValue}>{playerState.moveCount}</Text>
                <Pressable
                  style={styles.stepBtn}
                  onPress={() => onAdjustMoves(selectedPlayer, 1)}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {/* Time Adjustment Buttons Grid */}
          <Text style={styles.sectionHeader}>Adjust Clock Time</Text>
          <View style={styles.buttonGrid}>
            {timeButtons.map((btn, index) => (
              <Pressable
                key={index}
                style={[
                  styles.adjustBtn,
                  btn.deltaMs < 0 ? styles.minusBtn : styles.plusBtn,
                ]}
                onPress={() => onAdjustTime(selectedPlayer, btn.deltaMs)}
              >
                <Text
                  style={[
                    styles.adjustBtnText,
                    btn.deltaMs < 0 ? styles.minusText : styles.plusText,
                  ]}
                >
                  {btn.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Done / Close Button */}
          <Pressable style={styles.doneButton} onPress={onClose}>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
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
  activeTab: {
    backgroundColor: '#2563eb',
  },
  tabText: {
    color: '#94a3b8',
    fontWeight: '700',
    fontSize: 13,
  },
  activeTabText: {
    color: '#ffffff',
  },
  statsCard: {
    backgroundColor: '#1e293b',
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
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  statValue: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  moveStepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepBtn: {
    backgroundColor: '#334155',
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  moveValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginHorizontal: 12,
  },
  sectionHeader: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
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
  },
  plusBtn: {
    backgroundColor: '#14532d',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  minusBtn: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  adjustBtnText: {
    fontWeight: '700',
    fontSize: 13,
  },
  plusText: {
    color: '#86efac',
  },
  minusText: {
    color: '#fca5a5',
  },
  doneButton: {
    backgroundColor: '#2563eb',
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
