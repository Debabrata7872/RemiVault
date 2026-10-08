/**
 * RemiVault Cross-Platform Notification Service
 * 
 * Provides unified alert delivery across:
 * - Mobile Devices (.APK & mobile browsers): Android notification bar / status tray
 * - Desktop Users (PWA & desktop browsers): Windows/macOS native notification center
 * - In-App Foreground alerts with synthesized fintech audio chimes
 */

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface NotificationPayload {
  title?: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: {
    url?: string;
    tab?: 'overview' | 'reminders' | 'dates' | 'vault' | 'notes';
    id?: string | number;
  };
  requireInteraction?: boolean;
}

export interface NotificationSettings {
  soundEnabled: boolean;
  remindersEnabled: boolean;
  datesEnabled: boolean;
}

const STORAGE_KEYS = {
  SETTINGS: 'remivault_notif_settings',
  DISMISSED_AT: 'remivault_notif_prompt_dismissed_at',
  NOTIFIED_CACHE: 'remivault_notified_hashes',
};

let swRegistration: ServiceWorkerRegistration | null = null;
let audioCtx: AudioContext | null = null;

/**
 * Register Service Worker for Android system tray & desktop push notifications
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;
    return reg;
  } catch (err) {
    console.warn('[RemiVault Notifications] Service worker registration notice:', err);
    return null;
  }
}

/**
 * Check if the browser or platform supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current system notification permission state
 */
export function getNotificationPermission(): NotificationPermissionState {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request notification permission from user / operating system
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      // Send welcome verification alert
      await showSystemNotification('RemiVault Alerts Active', {
        body: 'Cross-platform notifications are enabled. Task deadlines and expiration alerts will appear in your notification tray.',
        tag: 'remivault-welcome',
        data: { tab: 'overview' },
      });
      playFintechChime();
    }
    return result as NotificationPermissionState;
  } catch (err) {
    console.error('[RemiVault Notifications] Error requesting permission:', err);
    return 'denied';
  }
}

/**
 * Deliver native notification to phone notification tray or desktop notification center
 */
export async function showSystemNotification(
  title: string, 
  payload: NotificationPayload
): Promise<boolean> {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const settings = getNotificationSettings();
  if (settings.soundEnabled) {
    playFintechChime();
  }

  const options: NotificationOptions & { vibrate?: number[] } = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/favicon.svg',
    tag: payload.tag || 'remivault-alert',
    data: payload.data || { url: '/', tab: 'overview' },
    requireInteraction: payload.requireInteraction ?? false,
    // Android vibration pattern for phone notification bar
    vibrate: [180, 90, 180],
  };

  // Try displaying through Service Worker first (critical for Android notification bar)
  try {
    if (!swRegistration && 'serviceWorker' in navigator) {
      swRegistration = await navigator.serviceWorker.ready;
    }

    if (swRegistration && 'showNotification' in swRegistration) {
      await swRegistration.showNotification(title, options as NotificationOptions);
      return true;
    }
  } catch (err) {
    console.warn('[RemiVault Notifications] Service worker alert fallback:', err);
  }

  // Desktop / standard window Notification fallback
  try {
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
    return true;
  } catch (err) {
    console.warn('[RemiVault Notifications] Fallback notification error:', err);
    return false;
  }
}

/**
 * Synthesizes a luxury crystal fintech chime using Web Audio API
 */
export function playFintechChime(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Harmonic dual tone (E6 1318.5Hz and B6 1975.5Hz)
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1318.51, now); // E6
    osc1.frequency.exponentialRampToValueAtTime(1760.00, now + 0.15); // A6 upward shimmer

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1975.53, now + 0.05); // B6 chime

    // Soft luxury decay envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc1.start(now);
    osc2.start(now + 0.04);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (err) {
    // Non-blocking if audio context is restricted
    console.debug('[RemiVault Notifications] Audio chime skipped:', err);
  }
}

/**
 * Load user notification preferences
 */
export function getNotificationSettings(): NotificationSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // fallback
  }

  return {
    soundEnabled: true,
    remindersEnabled: true,
    datesEnabled: true,
  };
}

/**
 * Save user notification preferences
 */
export function saveNotificationSettings(settings: Partial<NotificationSettings>): NotificationSettings {
  const current = getNotificationSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch {
    // ignore storage error
  }
  return updated;
}

/**
 * Check if the friendly in-app permission banner should be shown
 */
export function shouldShowPermissionPrompt(): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission !== 'default') return false;

  try {
    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    if (dismissedAt) {
      const past = parseInt(dismissedAt, 10);
      const now = Date.now();
      // Cooldown of 3 days before re-prompting
      if (now - past < 3 * 24 * 60 * 60 * 1000) {
        return false;
      }
    }
  } catch {
    // fallback
  }

  return true;
}

/**
 * Dismiss the friendly permission prompt with cooldown
 */
export function dismissPermissionPrompt(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
  } catch {
    // ignore
  }
}

/**
 * Deduplication helper to prevent repeated notifications in the same session
 */
export function hasBeenNotified(hashKey: string): boolean {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.NOTIFIED_CACHE);
    const set: string[] = raw ? JSON.parse(raw) : [];
    return set.includes(hashKey);
  } catch {
    return false;
  }
}

export function markAsNotified(hashKey: string): void {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.NOTIFIED_CACHE);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(hashKey)) {
      list.push(hashKey);
      sessionStorage.setItem(STORAGE_KEYS.NOTIFIED_CACHE, JSON.stringify(list));
    }
  } catch {
    // ignore
  }
}
