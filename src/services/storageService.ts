// 100% On-Device Offline Storage Service
// Persists presets, sound/haptic toggles, themes, player names, and user preferences locally

import { TimeControlConfig } from '../engine/types';
import { ThemeId } from '../theme/tokens';

const STORAGE_KEYS = {
  SETTINGS: '@chess_clock_settings_v2',
  CUSTOM_PRESETS: '@chess_clock_custom_presets',
  ACTIVE_PRESET_ID: '@chess_clock_active_preset_id',
};

export type ClockOrientation = 'opposite' | 'same';
export type BackgroundBehavior = 'pause' | 'continue';

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  theme: ThemeId;
  clockOrientation: ClockOrientation;
  player1Name: string;
  player2Name: string;
  backgroundBehavior: BackgroundBehavior;
  lowTimeWarning: boolean;
  timeoutAlarm: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  theme: 'graphite',
  clockOrientation: 'opposite', // Top player rotated 180° for opponent across the table
  player1Name: 'White',
  player2Name: 'Black',
  backgroundBehavior: 'pause', // Auto-pause when app is backgrounded
  lowTimeWarning: true,
  timeoutAlarm: true,
};

let asyncStorageModule: any = null;

async function getStorage() {
  if (asyncStorageModule) return asyncStorageModule;
  try {
    const mod = await import('@react-native-async-storage/async-storage');
    asyncStorageModule = mod.default || mod;
    return asyncStorageModule;
  } catch {
    // Return web localStorage fallback
    return {
      getItem: async (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      },
      setItem: async (key: string, value: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: async (key: string) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      },
    };
  }
}

export class StorageService {
  public static async loadSettings(): Promise<AppSettings> {
    try {
      const storage = await getStorage();
      const data = await storage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch (e) {
      console.warn('Failed to load settings from storage:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public static async saveSettings(settings: AppSettings): Promise<void> {
    try {
      const storage = await getStorage();
      await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  public static async resetSettings(): Promise<AppSettings> {
    try {
      const storage = await getStorage();
      await storage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    } catch (e) {
      console.warn('Failed to reset settings:', e);
    }
    return DEFAULT_SETTINGS;
  }

  public static async loadCustomPresets(): Promise<TimeControlConfig[]> {
    try {
      const storage = await getStorage();
      const data = await storage.getItem(STORAGE_KEYS.CUSTOM_PRESETS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to load custom presets:', e);
    }
    return [];
  }

  public static async saveCustomPresets(presets: TimeControlConfig[]): Promise<void> {
    try {
      const storage = await getStorage();
      await storage.setItem(STORAGE_KEYS.CUSTOM_PRESETS, JSON.stringify(presets));
    } catch (e) {
      console.warn('Failed to save custom presets:', e);
    }
  }

  public static async loadActivePresetId(): Promise<string | null> {
    try {
      const storage = await getStorage();
      return await storage.getItem(STORAGE_KEYS.ACTIVE_PRESET_ID);
    } catch {
      return null;
    }
  }

  public static async saveActivePresetId(id: string): Promise<void> {
    try {
      const storage = await getStorage();
      await storage.setItem(STORAGE_KEYS.ACTIVE_PRESET_ID, id);
    } catch {}
  }
}
