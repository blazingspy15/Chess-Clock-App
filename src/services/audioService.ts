// High-performance, low-latency audio service
// Supports Native Android/iOS via Expo AV (Audio.Sound) with preloaded cached sound assets
// and Web Audio API fallback for web preview

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';

export type AudioStatus = 'loading' | 'ready' | 'unavailable';

const SOUND_ASSETS: Record<string, any> = {
  click: require('../../assets/sounds/clock-click.wav'),
  lowTime: require('../../assets/sounds/low-time.wav'),
  timeout: require('../../assets/sounds/timeout-alarm.wav'),
};

let webAudioCtx: any = null;

function getWebAudioContext() {
  if (typeof window !== 'undefined') {
    const AudioContextClass =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!webAudioCtx) {
        webAudioCtx = new AudioContextClass();
      }
      if (webAudioCtx.state === 'suspended') {
        webAudioCtx.resume().catch(() => {});
      }
      return webAudioCtx;
    }
  }
  return null;
}

export class AudioService {
  private static isSoundEnabled: boolean = true;
  private static masterVolume: number = 1.0;
  private static buttonSoundEnabled: boolean = true;
  private static status: AudioStatus = 'loading';
  private static statusListeners: Set<(status: AudioStatus) => void> = new Set();
  private static soundCache: Map<string, Audio.Sound> = new Map();
  private static lastClickTimestamp: number = 0;
  private static isInitializing: boolean = false;
  private static isAudioModeConfigured: boolean = false;

  public static getStatus(): AudioStatus {
    return this.status;
  }

  public static onStatusChange(listener: (status: AudioStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private static notifyStatus(newStatus: AudioStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => {
      try {
        listener(newStatus);
      } catch (e) {
        console.warn('[AudioService] Listener error:', e);
      }
    });
  }

  public static setSoundEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
  }

  public static getSoundEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public static setButtonSoundEnabled(enabled: boolean) {
    this.buttonSoundEnabled = enabled;
  }

  public static getButtonSoundEnabled(): boolean {
    return this.buttonSoundEnabled;
  }

  public static setMasterVolume(volume: number) {
    // Clamp between 0.0 and 1.0
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterVolume = clamped;

    // Update volume on cached sound objects
    this.soundCache.forEach((sound) => {
      sound.setVolumeAsync(clamped).catch(() => {});
    });
  }

  public static getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Initializes audio system: configures audio mode and preloads sound assets.
   */
  public static async init(): Promise<AudioStatus> {
    if (this.status === 'ready') {
      return 'ready';
    }
    if (this.isInitializing) {
      return this.status;
    }

    this.isInitializing = true;
    this.notifyStatus('loading');

    // On Web: initialize Web Audio context
    if (Platform.OS === 'web') {
      try {
        const ctx = getWebAudioContext();
        this.status = ctx ? 'ready' : 'ready';
        this.isInitializing = false;
        this.notifyStatus(this.status);
        return this.status;
      } catch (err) {
        console.warn('[AudioService] Web Audio init error:', err);
        this.status = 'unavailable';
        this.isInitializing = false;
        this.notifyStatus(this.status);
        return this.status;
      }
    }

    // On Native Android & iOS: Configure Expo AV mode & preload sound files
    try {
      if (!this.isAudioModeConfigured) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
        this.isAudioModeConfigured = true;
      }

      // Preload all sounds in parallel
      const loadPromises = Object.entries(SOUND_ASSETS).map(async ([key, asset]) => {
        try {
          if (this.soundCache.has(key)) {
            return;
          }
          const { sound } = await Audio.Sound.createAsync(
            asset,
            {
              shouldPlay: false,
              volume: this.masterVolume,
            },
            undefined,
            true
          );
          this.soundCache.set(key, sound);
        } catch (err) {
          console.error(`[AudioService] Error preloading sound '${key}':`, err);
        }
      });

      await Promise.all(loadPromises);

      const hasLoadedSounds = this.soundCache.size > 0;
      this.status = hasLoadedSounds ? 'ready' : 'unavailable';
    } catch (err) {
      console.error('[AudioService] Native audio initialization failed:', err);
      this.status = 'unavailable';
    } finally {
      this.isInitializing = false;
      this.notifyStatus(this.status);
    }

    return this.status;
  }

  /**
   * Internal sound player with native/web branching and error resilience.
   */
  private static async playSound(
    key: 'click' | 'lowTime' | 'timeout',
    customVolumeMultiplier: number = 1.0,
    forcePlay: boolean = false
  ): Promise<void> {
    if (!forcePlay && !this.isSoundEnabled) {
      return;
    }

    const targetVolume = Math.max(0, Math.min(1, this.masterVolume * customVolumeMultiplier));
    if (targetVolume <= 0) {
      return;
    }

    // Branch 1: Web platform uses zero-latency synthesized Web Audio
    if (Platform.OS === 'web') {
      this.playWebAudio(key, targetVolume);
      return;
    }

    // Branch 2: Native Android & iOS playback via Expo AV
    try {
      let sound = this.soundCache.get(key);
      if (!sound) {
        // Attempt on-demand load if not yet in cache
        const asset = SOUND_ASSETS[key];
        if (asset) {
          const result = await Audio.Sound.createAsync(
            asset,
            { shouldPlay: false, volume: targetVolume },
            undefined,
            true
          );
          sound = result.sound;
          this.soundCache.set(key, sound);
        }
      }

      if (sound) {
        await sound.setVolumeAsync(targetVolume);
        await sound.replayAsync();
      }
    } catch (err) {
      console.warn(`[AudioService] Native replay failed for '${key}':`, err);
      // Fallback: try web audio synthesizer if in hybrid environment
      try {
        this.playWebAudio(key, targetVolume);
      } catch {
        // quiet fallback
      }
    }
  }

  /**
   * Crisp mechanical clock press click sound
   */
  public static async playClickSound(): Promise<void> {
    if (!this.isSoundEnabled) return;

    const now = Date.now();
    // Debounce rapid overlapping clicks within 45ms
    if (now - this.lastClickTimestamp < 45) {
      return;
    }
    this.lastClickTimestamp = now;

    await this.playSound('click', 1.0);
  }

  /**
   * Optional subtle click feedback for UI control buttons
   */
  public static async playButtonSound(): Promise<void> {
    if (!this.isSoundEnabled || !this.buttonSoundEnabled) return;

    const now = Date.now();
    if (now - this.lastClickTimestamp < 45) {
      return;
    }
    this.lastClickTimestamp = now;

    // Play at 50% volume for subtle feedback
    await this.playSound('click', 0.5);
  }

  /**
   * Subtle low-time tick (warning when active clock is under 10 seconds)
   */
  public static async playLowTimeTick(): Promise<void> {
    if (!this.isSoundEnabled) return;
    await this.playSound('lowTime', 0.85);
  }

  /**
   * Time's up / Flagged horn alarm sound
   */
  public static async playFlagAlarm(): Promise<void> {
    if (!this.isSoundEnabled) return;
    await this.playSound('timeout', 1.0);
  }

  /**
   * Test sound player for SettingsModal audition buttons
   */
  public static async testSound(key: 'click' | 'lowTime' | 'timeout'): Promise<void> {
    // If not ready, attempt initialization
    if (this.status !== 'ready') {
      await this.init();
    }
    await this.playSound(key, 1.0, true);
  }

  /**
   * Cleanly unloads all audio instances from device memory.
   */
  public static async cleanup(): Promise<void> {
    const unloadPromises = Array.from(this.soundCache.values()).map(async (sound) => {
      try {
        await sound.unloadAsync();
      } catch (err) {
        console.warn('[AudioService] Cleanup unload error:', err);
      }
    });
    await Promise.all(unloadPromises);
    this.soundCache.clear();
    this.status = 'unavailable';
    this.notifyStatus('unavailable');
  }

  /**
   * Web Audio API Synthesizer (for desktop and mobile browsers)
   */
  private static playWebAudio(key: 'click' | 'lowTime' | 'timeout', volume: number) {
    try {
      const ctx = getWebAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      if (key === 'click') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.045);

        gain.gain.setValueAtTime(0.7 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.046);
      } else if (key === 'lowTime') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);

        gain.gain.setValueAtTime(0.35 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.036);
      } else if (key === 'timeout') {
        [0, 0.16].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(offset === 0 ? 587 : 440, now + offset);

          gain.gain.setValueAtTime(0.55 * volume, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.19);
        });
      }
    } catch (e) {
      console.warn('[AudioService] Web Audio synthesis error:', e);
    }
  }
}
