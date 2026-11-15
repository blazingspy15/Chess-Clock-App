// Chess Clock Pro – Native-first Audio Service v1.1.0
//
// ARCHITECTURE:
//   Android/iOS  → expo-av  Audio.Sound, loaded from base64 data URIs
//                  (bypasses Metro asset path hashing & res/raw name resolution completely)
//   Web          → Zero-latency Web Audio API synthesizer (no file download needed)
//
// WHY BASE64 DATA URIs?
//   • Expo release APKs bundle assets into res/raw with mangled names.
//   • `require('../../assets/sounds/file.wav')` resolves to a numeric module id.
//   • expo-asset.downloadAsync() can silently fail when the mangled res/raw name
//     does not match what ResourceAsset.kt expects (space in folder path, etc.).
//   • { uri: 'data:audio/wav;base64,...' } bypasses ALL of that:
//     ExoPlayer's DataDataSource handles data URIs natively, offline, zero-network.

import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Platform } from 'react-native';
import { SOUND_DATA_URIS } from './soundData';

export type AudioStatus = 'loading' | 'ready' | 'unavailable';

// ─── Web Audio Context ────────────────────────────────────────────────────────

let webAudioCtx: any = null;

function getWebAudioContext(): any {
  if (typeof window === 'undefined') return null;
  const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!webAudioCtx) {
    webAudioCtx = new Ctor();
  }
  if (webAudioCtx.state === 'suspended') {
    webAudioCtx.resume().catch(() => {});
  }
  return webAudioCtx;
}

// ─── AudioService ─────────────────────────────────────────────────────────────

export class AudioService {
  private static isSoundEnabled: boolean = true;
  private static masterVolume: number = 1.0;
  private static buttonSoundEnabled: boolean = true;
  private static status: AudioStatus = 'loading';
  private static statusListeners: Set<(s: AudioStatus) => void> = new Set();
  private static soundCache: Map<string, Audio.Sound> = new Map();
  private static lastClickTimestamp: number = 0;
  private static isInitializing: boolean = false;
  private static isAudioModeConfigured: boolean = false;

  // ── Status ──────────────────────────────────────────────────────────────────

  public static getStatus(): AudioStatus {
    return this.status;
  }

  public static onStatusChange(listener: (s: AudioStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => { this.statusListeners.delete(listener); };
  }

  private static notifyStatus(s: AudioStatus) {
    this.status = s;
    this.statusListeners.forEach(fn => { try { fn(s); } catch {} });
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  public static setSoundEnabled(enabled: boolean)        { this.isSoundEnabled = enabled; }
  public static getSoundEnabled(): boolean               { return this.isSoundEnabled; }
  public static setButtonSoundEnabled(enabled: boolean)  { this.buttonSoundEnabled = enabled; }
  public static getButtonSoundEnabled(): boolean         { return this.buttonSoundEnabled; }

  public static setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.soundCache.forEach(sound => {
      sound.setVolumeAsync(this.masterVolume).catch(() => {});
    });
  }

  public static getMasterVolume(): number { return this.masterVolume; }

  // ── Init ────────────────────────────────────────────────────────────────────

  /**
   * Initialises the audio subsystem and preloads all sounds.
   * On Web:    sets up Web Audio API (synthesiser, no file load needed).
   * On Native: configures Expo AV audio mode, then preloads all three sounds
   *            from inline base64 data URIs – 100% offline, zero asset-path
   *            resolution, zero network required.
   */
  public static async init(): Promise<AudioStatus> {
    if (this.status === 'ready') return 'ready';
    if (this.isInitializing)    return this.status;

    this.isInitializing = true;
    this.notifyStatus('loading');

    // ── Web platform ──────────────────────────────────────────────────────────
    if (Platform.OS === 'web') {
      try {
        getWebAudioContext(); // warm up
        this.notifyStatus('ready');
      } catch (err) {
        console.warn('[AudioService] Web Audio init error:', err);
        this.notifyStatus('unavailable');
      }
      this.isInitializing = false;
      return this.status;
    }

    // ── Native Android / iOS ──────────────────────────────────────────────────
    try {
      // 1. Configure audio session (do once only)
      if (!this.isAudioModeConfigured) {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS:       true,
          staysActiveInBackground:    false,
          shouldDuckAndroid:          true,
          interruptionModeAndroid:    InterruptionModeAndroid.DuckOthers,
          interruptionModeIOS:        InterruptionModeIOS.DuckOthers,
          playThroughEarpieceAndroid: false,
        });
        this.isAudioModeConfigured = true;
      }

      // 2. Preload all sounds in parallel using base64 data URIs.
      //    { uri: 'data:audio/wav;base64,...' } is passed directly to ExoPlayer –
      //    no Metro asset resolution, no res/raw lookup, no network permission needed.
      const keys = Object.keys(SOUND_DATA_URIS) as Array<keyof typeof SOUND_DATA_URIS>;
      await Promise.all(keys.map(async (key) => {
        if (this.soundCache.has(key)) return;
        try {
          const { sound } = await Audio.Sound.createAsync(
            { uri: SOUND_DATA_URIS[key] },
            { shouldPlay: false, volume: this.masterVolume },
          );
          this.soundCache.set(key, sound);
          console.log(`[AudioService] Loaded '${key}' via data URI ✓`);
        } catch (err) {
          console.error(`[AudioService] Failed to preload '${key}':`, err);
        }
      }));

      const loaded = this.soundCache.size;
      console.log(`[AudioService] Preloaded ${loaded}/${keys.length} sounds.`);
      this.notifyStatus(loaded > 0 ? 'ready' : 'unavailable');
    } catch (err) {
      console.error('[AudioService] Native init error:', err);
      this.notifyStatus('unavailable');
    } finally {
      this.isInitializing = false;
    }

    return this.status;
  }

  // ── Core Playback ────────────────────────────────────────────────────────────

  private static async playSound(
    key: keyof typeof SOUND_DATA_URIS,
    volumeMultiplier: number = 1.0,
    forcePlay: boolean = false,
  ): Promise<void> {
    if (!forcePlay && !this.isSoundEnabled) return;

    const targetVolume = Math.max(0, Math.min(1, this.masterVolume * volumeMultiplier));
    if (targetVolume <= 0) return;

    // Web: synthesised Web Audio
    if (Platform.OS === 'web') {
      this.playWebAudio(key, targetVolume);
      return;
    }

    // Native: Expo AV via pre-cached sound instances
    try {
      let sound = this.soundCache.get(key);

      // On-demand load if cache miss (e.g., called before init() completes)
      if (!sound) {
        console.warn(`[AudioService] '${key}' not in cache – loading on-demand.`);
        const { sound: s } = await Audio.Sound.createAsync(
          { uri: SOUND_DATA_URIS[key] },
          { shouldPlay: false, volume: targetVolume },
        );
        sound = s;
        this.soundCache.set(key, sound);
      }

      await sound.setVolumeAsync(targetVolume);
      await sound.replayAsync();
    } catch (err) {
      console.warn(`[AudioService] Native replay failed for '${key}':`, err);
      // Last-resort: Web Audio fallback (works in Expo Go but not release APK)
      try { this.playWebAudio(key, targetVolume); } catch {}
    }
  }

  // ── Public Sound Triggers ────────────────────────────────────────────────────

  /** Crisp mechanical clock-press click */
  public static async playClickSound(): Promise<void> {
    if (!this.isSoundEnabled) return;
    const now = Date.now();
    if (now - this.lastClickTimestamp < 45) return; // debounce 45ms
    this.lastClickTimestamp = now;
    await this.playSound('click', 1.0);
  }

  /** Subtle click feedback for UI control buttons */
  public static async playButtonSound(): Promise<void> {
    if (!this.isSoundEnabled || !this.buttonSoundEnabled) return;
    const now = Date.now();
    if (now - this.lastClickTimestamp < 45) return;
    this.lastClickTimestamp = now;
    await this.playSound('click', 0.5);
  }

  /** Low-time warning tick (< 10 s remaining) */
  public static async playLowTimeTick(): Promise<void> {
    if (!this.isSoundEnabled) return;
    await this.playSound('lowTime', 0.85);
  }

  /** Timeout / flag alarm */
  public static async playFlagAlarm(): Promise<void> {
    if (!this.isSoundEnabled) return;
    await this.playSound('timeout', 1.0);
  }

  /** Audition a sound from Settings – always plays regardless of master toggle */
  public static async testSound(key: keyof typeof SOUND_DATA_URIS): Promise<void> {
    if (this.status !== 'ready') await this.init();
    await this.playSound(key, 1.0, true);
  }

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  public static async cleanup(): Promise<void> {
    await Promise.all(
      Array.from(this.soundCache.values()).map(s =>
        s.unloadAsync().catch(() => {}),
      ),
    );
    this.soundCache.clear();
    this.notifyStatus('unavailable');
  }

  // ── Web Audio Synthesiser ─────────────────────────────────────────────────────

  private static playWebAudio(key: keyof typeof SOUND_DATA_URIS, volume: number) {
    try {
      const ctx = getWebAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      if (key === 'click') {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.045);
        gain.gain.setValueAtTime(0.7 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.046);

      } else if (key === 'lowTime') {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(1100, now);
        gain.gain.setValueAtTime(0.35 * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.036);

      } else if (key === 'timeout') {
        [0, 0.16].forEach(offset => {
          const osc  = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(offset === 0 ? 587 : 440, now + offset);
          gain.gain.setValueAtTime(0.55 * volume, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + offset); osc.stop(now + offset + 0.19);
        });
      }
    } catch (e) {
      console.warn('[AudioService] Web Audio synthesis error:', e);
    }
  }
}
