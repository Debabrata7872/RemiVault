import { getApiBaseUrl } from './api';
import { triggerApkDownload } from './installPromptService';
import { APP_VERSION, APP_VERSION_CODE, compareSemver } from '../config/version';

export interface AppUpdateInfo {
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
  is_mandatory: boolean;
  changelog: string[];
}

export interface UpdateCheckResult {
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
  currentVersionCode: number;
  latestVersionCode: number;
  updateInfo: AppUpdateInfo | null;
  isSnoozed: boolean;
  snoozeRemainingHours: number;
}

const STORAGE_KEYS = {
  SNOOZED_UNTIL: 'remivault_update_snoozed_until',
  SNOOZED_VERSION: 'remivault_update_snoozed_version',
  LOGINS_SINCE_SNOOZE: 'remivault_update_logins_since_snooze',
  DOWNLOADED_VERSION: 'remivault_update_downloaded_version',
  LAST_SEEN_VERSION: 'remivault_last_seen_version',
};

/**
 * Increment the login / app-open counter to trigger periodic reminders
 * If the user has opened the app 3 times since snoozing, the snooze automatically lapses.
 */
export function recordAppOpenForUpdateCheck(): void {
  if (typeof window === 'undefined') return;
  try {
    const count = parseInt(localStorage.getItem(STORAGE_KEYS.LOGINS_SINCE_SNOOZE) || '0', 10);
    localStorage.setItem(STORAGE_KEYS.LOGINS_SINCE_SNOOZE, (count + 1).toString());
  } catch {
    // storage not available
  }
}

/**
 * Check if a release version is currently in an active snooze period
 */
export function isVersionSnoozed(version: string): { snoozed: boolean; remainingHours: number } {
  if (typeof window === 'undefined') return { snoozed: false, remainingHours: 0 };

  try {
    const snoozedVersion = localStorage.getItem(STORAGE_KEYS.SNOOZED_VERSION);
    const snoozedUntilStr = localStorage.getItem(STORAGE_KEYS.SNOOZED_UNTIL);
    const loginsSinceSnooze = parseInt(localStorage.getItem(STORAGE_KEYS.LOGINS_SINCE_SNOOZE) || '0', 10);

    // If snooze was for a different version, it doesn't apply
    if (snoozedVersion && snoozedVersion !== version) {
      return { snoozed: false, remainingHours: 0 };
    }

    // If the user has opened the app 3+ times, remind them!
    if (loginsSinceSnooze >= 3) {
      return { snoozed: false, remainingHours: 0 };
    }

    if (snoozedUntilStr) {
      const snoozedUntil = parseInt(snoozedUntilStr, 10);
      const diffMs = snoozedUntil - Date.now();
      if (diffMs > 0) {
        const remainingHours = Math.max(1, Math.ceil(diffMs / (3600 * 1000)));
        return { snoozed: true, remainingHours };
      }
    }
  } catch {
    // fallback
  }

  return { snoozed: false, remainingHours: 0 };
}

/**
 * Snooze the version update reminder for a specific duration (default 24h / next day)
 */
export function snoozeUpdate(version: string, hours = 24): void {
  if (typeof window === 'undefined') return;
  try {
    const snoozedUntil = Date.now() + hours * 3600 * 1000;
    localStorage.setItem(STORAGE_KEYS.SNOOZED_UNTIL, snoozedUntil.toString());
    localStorage.setItem(STORAGE_KEYS.SNOOZED_VERSION, version);
    localStorage.setItem(STORAGE_KEYS.LOGINS_SINCE_SNOOZE, '0');
  } catch {
    // ignore
  }
}

/**
 * Clear any active snooze (e.g. when user manually clicks "Check for Updates" in Settings)
 */
export function clearUpdateSnooze(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.SNOOZED_UNTIL);
    localStorage.removeItem(STORAGE_KEYS.SNOOZED_VERSION);
    localStorage.setItem(STORAGE_KEYS.LOGINS_SINCE_SNOOZE, '0');
  } catch {
    // ignore
  }
}

/**
 * Check whether a new application version is available on the server
 */
export async function checkForAppUpdate(options?: {
  forceCheck?: boolean;
  simulate?: boolean;
}): Promise<UpdateCheckResult> {
  const fallbackResult: UpdateCheckResult = {
    updateAvailable: false,
    currentVersion: APP_VERSION,
    latestVersion: APP_VERSION,
    currentVersionCode: APP_VERSION_CODE,
    latestVersionCode: APP_VERSION_CODE,
    updateInfo: null,
    isSnoozed: false,
    snoozeRemainingHours: 0,
  };

  try {
    const apiBase = getApiBaseUrl();
    const query = options?.simulate ? '?simulate_update=1' : '';
    const res = await fetch(`${apiBase}/app/version${query}`, {
      headers: {
        Accept: 'application/json',
        ...(options?.simulate ? { 'X-Simulate-Update': 'true' } : {}),
      },
    });

    if (!res.ok) return fallbackResult;

    const data: AppUpdateInfo = await res.json();
    const isNewerVersion = compareSemver(data.version, APP_VERSION) > 0;
    const isNewerCode = (data.version_code || 0) > APP_VERSION_CODE;
    const isAvailable = isNewerVersion || isNewerCode;

    if (!isAvailable) {
      return {
        ...fallbackResult,
        latestVersion: data.version,
        latestVersionCode: data.version_code,
        updateInfo: data,
      };
    }

    // Check if snooze is active (unless forceCheck is true or update is mandatory)
    const { snoozed, remainingHours } = isVersionSnoozed(data.version);
    const effectiveSnoozed = !options?.forceCheck && !data.is_mandatory && snoozed;

    return {
      updateAvailable: true,
      currentVersion: APP_VERSION,
      latestVersion: data.version,
      currentVersionCode: APP_VERSION_CODE,
      latestVersionCode: data.version_code,
      updateInfo: data,
      isSnoozed: effectiveSnoozed,
      snoozeRemainingHours: remainingHours,
    };
  } catch (err) {
    console.debug('[RemiVault Update] Version check notice:', err);
    return fallbackResult;
  }
}

/**
 * Trigger immediate download and record downloaded version
 */
export function executeAppUpdate(version: string): void {
  triggerApkDownload();
  try {
    localStorage.setItem(STORAGE_KEYS.DOWNLOADED_VERSION, version);
  } catch {
    // ignore
  }
}

/**
 * Toggle simulated server release manifest for testing and review
 */
export async function toggleSimulatedServerRelease(enable: boolean): Promise<boolean> {
  try {
    const apiBase = getApiBaseUrl();
    const res = await fetch(`${apiBase}/app/toggle-simulated-release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ enable }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

