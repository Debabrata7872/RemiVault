import { 
  APP_VERSION, 
  RELEASES_CHANGELOG, 
  compareSemver, 
  type ReleaseNotes 
} from '../config/version';

const STORAGE_KEYS = {
  LAST_SEEN_CHANGELOG: 'remivault_last_seen_changelog_version',
  AUTO_CLOSE_PREF: 'remivault_whats_new_auto_close_enabled',
};

/**
 * Retrieve release notes for a specific version or fallback to current release
 */
export function getReleaseNotes(version: string = APP_VERSION): ReleaseNotes {
  if (RELEASES_CHANGELOG[version]) {
    return RELEASES_CHANGELOG[version];
  }
  // Fallback to latest available release notes
  return RELEASES_CHANGELOG[APP_VERSION] || {
    version: APP_VERSION,
    versionCode: 2,
    releaseTitle: `RemiVault v${APP_VERSION}`,
    releaseDate: 'October 2026',
    summary: 'System optimizations, performance improvements, and security enhancements.',
    highlights: [],
  };
}

/**
 * Determine if the "What's New" modal should be shown on post-update launch
 * Triggered when a version bump is detected (e.g. APP_VERSION > lastSeenVersion)
 */
export function shouldShowWhatsNew(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const lastSeen = localStorage.getItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG);

    // If user has never seen any release notes, show current release on first post-update boot
    if (!lastSeen) {
      return true;
    }

    // Version bump check: if current app version is newer than the last recorded version
    if (compareSemver(APP_VERSION, lastSeen) > 0) {
      return true;
    }
  } catch {
    // storage not accessible
  }

  return false;
}

/**
 * Mark the current version changelog as seen so it doesn't show again on subsequent launches
 */
export function markWhatsNewSeen(version: string = APP_VERSION): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG, version);
  } catch {
    // ignore
  }
}

/**
 * Reset the seen version marker (useful for testing or replaying the changelog)
 */
export function resetWhatsNewSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEYS.LAST_SEEN_CHANGELOG);
  } catch {
    // ignore
  }
}

/**
 * Get user preference for auto-dismiss behavior (default enabled)
 */
export function isAutoDismissEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const pref = localStorage.getItem(STORAGE_KEYS.AUTO_CLOSE_PREF);
    return pref !== 'false';
  } catch {
    return true;
  }
}

/**
 * Save user preference for auto-dismiss behavior
 */
export function setAutoDismissEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.AUTO_CLOSE_PREF, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Calculate dynamic auto-dismiss countdown duration in milliseconds based on content height & density
 * Longer release notes stay visible proportionally longer to allow comfortable reading.
 * 
 * Formula:
 * - Base reading time: 10,000 ms (10 seconds)
 * - Height scaling: +18 ms per pixel of scrollable content over 250px
 * - Density scaling: +1,200 ms per changelog highlight item
 * - Clamped between 10,000 ms (10s) minimum and 32,000 ms (32s) maximum
 */
export function calculateAutoDismissDuration(
  contentHeightPx: number,
  itemCount: number
): { durationMs: number; durationSeconds: number } {
  const baseMs = 10000;
  const heightOverhead = Math.max(0, contentHeightPx - 250) * 18;
  const itemOverhead = itemCount * 1200;

  const rawMs = baseMs + heightOverhead + itemOverhead;
  const durationMs = Math.min(32000, Math.max(10000, Math.round(rawMs)));
  const durationSeconds = Math.round(durationMs / 1000);

  return { durationMs, durationSeconds };
}

