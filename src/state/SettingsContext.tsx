import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { AppSettings, DEFAULT_SETTINGS, StorageService } from '../services/storageService';
import { AudioService, AudioStatus } from '../services/audioService';
import { HapticsService } from '../services/hapticsService';
import { TimeControlConfig } from '../engine/types';
import { THEMES, ThemeColors } from '../theme/tokens';

interface SettingsContextValue {
  settings: AppSettings;
  theme: ThemeColors;
  audioStatus: AudioStatus;
  customPresets: TimeControlConfig[];
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  addCustomPreset: (preset: TimeControlConfig) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>(() => AudioService.getStatus());
  const [customPresets, setCustomPresets] = useState<TimeControlConfig[]>([]);

  useEffect(() => {
    // Subscribe to AudioService status changes
    const unsubAudioStatus = AudioService.onStatusChange((status) => {
      setAudioStatus(status);
    });

    // Initialize AudioService & load initial settings
    async function init() {
      const savedSettings = await StorageService.loadSettings();
      setSettings(savedSettings);

      AudioService.setSoundEnabled(savedSettings.soundEnabled);
      AudioService.setMasterVolume(savedSettings.masterVolume ?? 1.0);
      AudioService.setButtonSoundEnabled(savedSettings.buttonSoundEnabled ?? true);
      HapticsService.setHapticsEnabled(savedSettings.hapticsEnabled);

      // Preload native audio assets
      await AudioService.init();

      const savedCustomPresets = await StorageService.loadCustomPresets();
      setCustomPresets(savedCustomPresets);
    }

    init();

    return () => {
      unsubAudioStatus();
    };
  }, []);

  const theme = useMemo(() => {
    return THEMES[settings.theme] || THEMES.graphite;
  }, [settings.theme]);

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);

    if (partial.soundEnabled !== undefined) {
      AudioService.setSoundEnabled(partial.soundEnabled);
    }
    if (partial.masterVolume !== undefined) {
      AudioService.setMasterVolume(partial.masterVolume);
    }
    if (partial.buttonSoundEnabled !== undefined) {
      AudioService.setButtonSoundEnabled(partial.buttonSoundEnabled);
    }
    if (partial.hapticsEnabled !== undefined) {
      HapticsService.setHapticsEnabled(partial.hapticsEnabled);
    }

    await StorageService.saveSettings(updated);
  };

  const resetSettings = async () => {
    const defaults = await StorageService.resetSettings();
    setSettings(defaults);
    AudioService.setSoundEnabled(defaults.soundEnabled);
    AudioService.setMasterVolume(defaults.masterVolume);
    AudioService.setButtonSoundEnabled(defaults.buttonSoundEnabled);
    HapticsService.setHapticsEnabled(defaults.hapticsEnabled);
  };

  const addCustomPreset = async (preset: TimeControlConfig) => {
    const updated = [...customPresets.filter(p => p.id !== preset.id), preset];
    setCustomPresets(updated);
    await StorageService.saveCustomPresets(updated);
  };

  const deleteCustomPreset = async (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    await StorageService.saveCustomPresets(updated);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        theme,
        audioStatus,
        customPresets,
        updateSettings,
        resetSettings,
        addCustomPreset,
        deleteCustomPreset,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return ctx;
}
