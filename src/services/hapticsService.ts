// High-performance tactile haptics service
// Supports Expo Haptics on iOS & Android devices with browser navigator.vibrate fallback

export class HapticsService {
  private static isHapticsEnabled: boolean = true;

  public static setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
  }

  public static getHapticsEnabled(): boolean {
    return this.isHapticsEnabled;
  }

  /**
   * Crisp tactile feedback on clock button tap
   */
  public static async triggerClockPress(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      const Haptics = await this.loadExpoHapticsSafe();
      if (Haptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  }

  /**
   * Distinct vibration pattern when a player flags (Time Out)
   */
  public static async triggerFlagVibration(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      const Haptics = await this.loadExpoHapticsSafe();
      if (Haptics) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
  }

  /**
   * Subtle tick feedback on control bar buttons (Pause, Reset, Settings)
   */
  public static async triggerButtonPress(): Promise<void> {
    if (!this.isHapticsEnabled) return;

    try {
      const Haptics = await this.loadExpoHapticsSafe();
      if (Haptics) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return;
      }
    } catch {
      // Fallback
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }

  private static async loadExpoHapticsSafe(): Promise<any> {
    try {
      const haptics = await import('expo-haptics');
      return haptics;
    } catch {
      return null;
    }
  }
}
