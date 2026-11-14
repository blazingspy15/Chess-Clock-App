import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSettings } from '../state/SettingsContext';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
  const { settings, updateSettings } = useSettings();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Clock Settings</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.section}>
            {/* Sound Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>Sound Effects</Text>
                <Text style={styles.settingSub}>
                  Mechanical click on button taps and alarm on 0:00 flag
                </Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={val => updateSettings({ soundEnabled: val })}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor={settings.soundEnabled ? '#60a5fa' : '#94a3b8'}
              />
            </View>

            {/* Haptic Feedback Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>Haptic Feedback</Text>
                <Text style={styles.settingSub}>
                  Tactile vibration on every turn pass and flag
                </Text>
              </View>
              <Switch
                value={settings.hapticsEnabled}
                onValueChange={val => updateSettings({ hapticsEnabled: val })}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor={settings.hapticsEnabled ? '#60a5fa' : '#94a3b8'}
              />
            </View>

            {/* Auto-Pause Toggle */}
            <View style={styles.settingRow}>
              <View style={styles.textContainer}>
                <Text style={styles.settingLabel}>Auto-Pause on Background</Text>
                <Text style={styles.settingSub}>
                  Automatically pauses clock during phone calls or screen lock
                </Text>
              </View>
              <Switch
                value={settings.autoPauseEnabled}
                onValueChange={val => updateSettings({ autoPauseEnabled: val })}
                trackColor={{ false: '#334155', true: '#2563eb' }}
                thumbColor={settings.autoPauseEnabled ? '#60a5fa' : '#94a3b8'}
              />
            </View>

            {/* Offline & Architecture Badge */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>100% Offline & Precision Tuned</Text>
              <Text style={styles.infoDesc}>
                This chess clock calculates delta timestamps against native hardware clocks
                with zero drift. All presets and preferences are persisted locally on-device.
              </Text>
            </View>
          </View>

          <Pressable style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Close</Text>
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
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
  section: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  settingSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#38bdf8',
  },
  infoTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  infoDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  doneBtn: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
