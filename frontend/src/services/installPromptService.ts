import { Capacitor } from '@capacitor/core';
import { getApiBaseUrl } from './api';

export type DeviceType = 'android' | 'ios' | 'desktop';

export interface AppVersionInfo {
  version: string;
  version_code: number;
  package_name: string;
  apk_filename: string;
  apk_size_bytes: number;
  apk_size_formatted: string;
  min_android: string;
  target_android: string;
  download_url: string;
  release_date: string;
  changelog: string[];
}

const STORAGE_KEYS = {
  DISMISSED_AT: 'remivault_install_prompt_dismissed_at',
  DOWNLOADED_AT: 'remivault_apk_downloaded_at',
};

// Global PWA BeforeInstallPromptEvent tracking
let deferredInstallPrompt: any = null;
const installableListeners = new Set<(canInstall: boolean) => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    installableListeners.forEach((listener) => listener(true));
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    installableListeners.forEach((listener) => listener(false));
    try {
      localStorage.setItem(STORAGE_KEYS.DOWNLOADED_AT, Date.now().toString());
    } catch {
      // storage unavailable
    }
  });
}

/**
 * Detect client device category
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) return 'ios';
  return 'desktop';
}

/**
 * Check if the application is currently running inside the native Capacitor Android APK wrapper
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Check if the application is currently running in standalone PWA / full-screen mode
 */
export function isStandalonePwa(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if the user is already using RemiVault as a standalone app
 */
export function isAlreadyStandaloneApp(): boolean {
  return isNativePlatform() || isStandalonePwa();
}

/**
 * Check if a PWA installation prompt is supported & ready in the browser
 */
export function canTriggerPwaInstall(): boolean {
  return !!deferredInstallPrompt;
}

/**
 * Subscribe to Pwa installable state changes
 */
export function subscribeToPwaInstallable(callback: (canInstall: boolean) => void): () => void {
  installableListeners.add(callback);
  callback(!!deferredInstallPrompt);
  return () => {
    installableListeners.delete(callback);
  };
}

/**
 * Trigger the native browser PWA install dialog
 */
export async function promptPwaInstall(): Promise<boolean> {
  if (!deferredInstallPrompt) return false;
  try {
    deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installableListeners.forEach((listener) => listener(false));
    return choiceResult.outcome === 'accepted';
  } catch (err) {
    console.warn('[RemiVault Install] PWA prompt failed:', err);
    return false;
  }
}

/**
 * Get direct APK download URL pointing to the backend stream or static asset
 */
export function getApkDownloadUrl(): string {
  try {
    const apiBase = getApiBaseUrl();
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}/api/download/apk`;
  } catch {
    return '/downloads/RemiVault.apk';
  }
}

/**
 * Determine whether the in-app install prompt banner should be displayed
 * Follows polite dismissal cooldown:
 * - 48-hour cooldown after user taps "Later" / dismiss
 * - 14-day cooldown after user taps "Download APK"
 * - Never shows to native app users
 */
export function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Native app users are already using the standalone APK!
  if (isNativePlatform()) return false;

  // 2. Standalone desktop PWA users don't need prompts on desktop
  if (isStandalonePwa() && getDeviceType() !== 'android') return false;

  try {
    const downloadedAt = localStorage.getItem(STORAGE_KEYS.DOWNLOADED_AT);
    if (downloadedAt) {
      const past = parseInt(downloadedAt, 10);
      const now = Date.now();
      // 14 days cooldown after downloading APK
      if (now - past < 14 * 24 * 60 * 60 * 1000) {
        return false;
      }
    }

    const dismissedAt = localStorage.getItem(STORAGE_KEYS.DISMISSED_AT);
    if (dismissedAt) {
      const past = parseInt(dismissedAt, 10);
      const now = Date.now();
      // 48 hours cooldown after user dismisses
      if (now - past < 48 * 60 * 60 * 1000) {
        return false;
      }
    }
  } catch {
    // fallback
  }

  return true;
}

/**
 * Record user dismissal of install prompt
 */
export function dismissInstallPrompt(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DISMISSED_AT, Date.now().toString());
  } catch {
    // ignore
  }
}

/**
 * Record APK download initiation
 */
export function recordApkDownload(): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DOWNLOADED_AT, Date.now().toString());
  } catch {
    // ignore
  }
}

/**
 * Trigger immediate browser download of the RemiVault standalone .APK
 */
export function triggerApkDownload(): void {
  recordApkDownload();
  const downloadUrl = getApkDownloadUrl();

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = 'RemiVault.apk';
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}

/**
 * Fetch latest app release info and download size from backend
 */
export async function fetchAppVersionInfo(): Promise<AppVersionInfo> {
  const fallback: AppVersionInfo = {
    version: '0.2.0',
    version_code: 2,
    package_name: 'com.remivault.app',
    apk_filename: 'RemiVault.apk',
    apk_size_bytes: 18365203,
    apk_size_formatted: '17.5 MB',
    min_android: 'Android 8.0 (API 26)+',
    target_android: 'Android 14 (API 34)',
    download_url: getApkDownloadUrl(),
    release_date: '2026-10-29',
    changelog: [
      'Standalone Android APK with hardware-backed performance',
      'Full-screen vault experience with zero browser address bar clutter',
      'Real-time system tray & status bar alerts for due tasks',
      'High-security 4-digit PIN authentication & auto-lock',
    ],
  };

  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/app/version`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      return { ...fallback, ...data };
    }
  } catch (err) {
    console.debug('[RemiVault Install] Version fetch fallback used:', err);
  }

  return fallback;
}

