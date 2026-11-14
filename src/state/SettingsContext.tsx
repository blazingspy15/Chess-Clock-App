import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, StorageService } from '../services/storageService';
import { AudioService } from '../services/audioService';
import { HapticsService } from '../services/hapticsService';
import { TimeControlConfig } from '../engine/types';

interface SettingsContextValue {
  settings: AppSettings;
  customPresets: TimeControlConfig[];
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  addCustomPreset: (preset: TimeControlConfig) => Promise<void>;
  deleteCustomPreset: (id: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [customPresets, setCustomPresets] = useState<TimeControlConfig[]>([]);

  useEffect(() => {
    // Load initial settings and presets from offline storage
    async function init() {
      const savedSettings = await StorageService.loadSettings();
      setSettings(savedSettings);
      AudioService.setSoundEnabled(savedSettings.soundEnabled);
      HapticsService.setHapticsEnabled(savedSettings.hapticsEnabled);

      const savedCustomPresets = await StorageService.loadCustomPresets();
      setCustomPresets(savedCustomPresets);
    }
    init();
  }, []);

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const updated = { ...settings, ...partial };
    setSettings(updated);

    if (partial.soundEnabled !== undefined) {
      AudioService.setSoundEnabled(partial.soundEnabled);
    }
    if (partial.hapticsEnabled !== undefined) {
      HapticsService.setHapticsEnabled(partial.hapticsEnabled);
    }

    await StorageService.saveSettings(updated);
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
        customPresets,
        updateSettings,
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
