import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const HAPTICS_PREFERENCE_KEY = 'remivault_haptics_enabled';

/**
 * Check whether tactile haptic feedback is enabled in user preferences.
 * Default is true (enabled for high-end luxury fintech tactile feel).
 */
export const isHapticsEnabled = (): boolean => {
  try {
    const stored = localStorage.getItem(HAPTICS_PREFERENCE_KEY);
    if (stored === null) return true;
    return stored === 'true';
  } catch {
    return true;
  }
};

/**
 * Update tactile haptic feedback preference.
 */
export const setHapticsEnabled = (enabled: boolean): void => {
  try {
    localStorage.setItem(HAPTICS_PREFERENCE_KEY, String(enabled));
  } catch {
    // Ignore storage quota or access errors
  }
};

/**
 * Check if haptic hardware or web vibration is supported on this platform/device.
 */
export const isHapticsSupported = (): boolean => {
  if (Capacitor.isNativePlatform()) return true;
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Trigger a subtle, ultra-light tactile tick vibration.
 * Ideal for 4-digit PIN numeric keypad presses, mechanical combination dial notches,
 * and bottom navigation bar tab clicks.
 */
export const triggerHapticTick = async (): Promise<void> => {
  if (!isHapticsEnabled()) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
  } catch {
    // Graceful silent fallback if vibration not permitted
  }
};

/**
 * Trigger a medium mechanical impact pulse.
 * Ideal for password visibility toggles, cipher scrambles, and action buttons.
 */
export const triggerHapticMedium = async (): Promise<void> => {
  if (!isHapticsEnabled()) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(30);
    }
  } catch {
    // Graceful fallback
  }
};

/**
 * Trigger a rhythmic double-pulse success haptic vibration.
 * Ideal for vault unlock authorization, PIN set confirmation, and clipboard copying.
 */
export const triggerHapticSuccess = async (): Promise<void> => {
  if (!isHapticsEnabled()) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([25, 45, 25]);
    }
  } catch {
    // Graceful fallback
  }
};

/**
 * Trigger an alert/rejection buzz vibration.
 * Ideal for wrong PIN entry, cooldown timer trigger, or validation errors.
 */
export const triggerHapticError = async (): Promise<void> => {
  if (!isHapticsEnabled()) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.notification({ type: NotificationType.Error });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 50, 40, 50, 80]);
    }
  } catch {
    // Graceful fallback
  }
};

/**
 * Trigger a selection change haptic tick.
 * Ideal for tab switches and selector dials.
 */
export const triggerHapticSelection = async (): Promise<void> => {
  if (!isHapticsEnabled()) return;

  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.selectionChanged();
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
  } catch {
    // Graceful fallback
  }
};

/**
 * Test vibration to preview haptic feel (e.g. from Settings modal).
 */
export const testHapticFeedback = async (): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([20, 40, 20]);
    }
  } catch {
    // Graceful fallback
  }
};

