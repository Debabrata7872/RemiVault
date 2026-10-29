/**
 * RemiVault Application Version & Release Identity
 * Single authoritative source of truth for the frontend client
 */

export const APP_VERSION = '0.2.0';
export const APP_VERSION_CODE = 2;
export const APP_RELEASE_DATE = '2026-10-29';
export const APP_PACKAGE_NAME = 'com.remivault.app';

export interface ChangelogItem {
  id: string;
  category: 'feature' | 'security' | 'performance' | 'ui';
  title: string;
  description: string;
  badge?: string;
}

export interface ReleaseNotes {
  version: string;
  versionCode: number;
  releaseTitle: string;
  releaseDate: string;
  summary: string;
  highlights: ChangelogItem[];
}

/**
 * Authoritative Changelog Archive
 */
export const RELEASES_CHANGELOG: Record<string, ReleaseNotes> = {
  '0.2.0': {
    version: '0.2.0',
    versionCode: 2,
    releaseTitle: 'Standalone Mobile APK, Status Bar Alerts & Luxury Launch Screen',
    releaseDate: 'October 29, 2026',
    summary: 'A major milestone upgrade delivering standalone Android APK distribution, native system notification tray integration, zero localStorage adaptive preloading, and high-fidelity launch screen telemetry.',
    highlights: [
      {
        id: 'apk-build',
        category: 'feature',
        title: 'Standalone Android APK (.APK)',
        description: 'Packaged standalone Android application with hardware-backed performance, zero browser address bar clutter, and custom launcher crest.',
        badge: 'Mobile App',
      },
      {
        id: 'status-bar-alerts',
        category: 'feature',
        title: 'System Tray & Notification Bar Delivery',
        description: 'Scheduled tasks and document expirations now appear in your Android phone notification shade and desktop system tray with harmonic crystal audio chimes.',
        badge: 'Alerts',
      },
      {
        id: 'auth-pin-sync',
        category: 'security',
        title: 'Hardware PIN Lock & Multi-Profile',
        description: 'Authoritative database sync for 4-digit security PINs with brute-force cooldown timers, auto-lock on inactivity, and cross-device persistence.',
        badge: 'Security',
      },
      {
        id: 'zero-localstorage',
        category: 'performance',
        title: 'Zero LocalStorage In-Memory Preload',
        description: 'Luxury fintech shimmer skeletons with instant non-blocking hydration and background multi-function preview data without storing records in localStorage.',
        badge: 'Privacy',
      },
      {
        id: 'launch-screen',
        category: 'ui',
        title: 'Superb Vault Launch & Lock Experience',
        description: 'Central floating gold crest with dual rotating combination dials, dynamic cryptographic telemetry, and interactive category security capsules.',
        badge: 'Design',
      },
      {
        id: 'version-upgrade',
        category: 'feature',
        title: 'In-App Update & Bandwidth Management',
        description: 'Periodic smart install prompt, explicit download size preview for data awareness, and 1-click APK download management.',
        badge: 'Updates',
      },
    ],
  },
  '0.1.0': {
    version: '0.1.0',
    versionCode: 1,
    releaseTitle: 'RemiVault Initial Genesis Release',
    releaseDate: 'October 15, 2026',
    summary: 'Initial release of RemiVault featuring multi-category encrypted records, password manager, and responsive dashboard.',
    highlights: [
      {
        id: 'core-vault',
        category: 'feature',
        title: 'Multi-Category Vault Core',
        description: 'End-to-end management for passwords, secure notes, reminders, and important dates.',
      },
      {
        id: 'dark-theme',
        category: 'ui',
        title: 'Fintech Obsidian Dark Theme',
        description: 'High-contrast luxury design system tailored for secure private vaults.',
      },
    ],
  },
};

/**
 * Compare two semver strings: e.g. "0.3.0" vs "0.2.0"
 * Returns:
 *   1 if v1 > v2
 *  -1 if v1 < v2
 *   0 if equal
 */
export function compareSemver(v1: string, v2: string): number {
  const clean = (v: string) => v.replace(/^v/i, '').trim().split('-')[0];
  const p1 = clean(v1).split('.').map((n) => parseInt(n, 10) || 0);
  const p2 = clean(v2).split('.').map((n) => parseInt(n, 10) || 0);

  const len = Math.max(p1.length, p2.length);
  for (let i = 0; i < len; i++) {
    const num1 = p1[i] ?? 0;
    const num2 = p2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}
