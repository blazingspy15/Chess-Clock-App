// 100% On-Device Offline Storage Service
// Persists presets, sound/haptic toggles, and user preferences locally

import { TimeControlConfig } from '../engine/types';

const STORAGE_KEYS = {
  SETTINGS: '@chess_clock_settings',
  CUSTOM_PRESETS: '@chess_clock_custom_presets',
  ACTIVE_PRESET_ID: '@chess_clock_active_preset_id',
};

export interface AppSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  autoPauseEnabled: boolean;
  theme: 'chess_dark' | 'midnight' | 'wood' | 'emerald';
  lowTimeWarningSound: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  autoPauseEnabled: true,
  theme: 'chess_dark',
  lowTimeWarningSound: false,
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
