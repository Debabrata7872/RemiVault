/**
 * RemiVault Device Profile & Security PIN Storage Service
 *
 * Provides:
 * - Multi-account device profile management in LocalStorage.
 * - Secure PIN hashing using WebCrypto (SHA-256 + cryptographic salt).
 * - Device Lock / Unlock state tracking.
 * - Account switching and graceful offline session preservation.
 */

import type { User } from './api';
import { setStoredToken } from './api';

export interface DeviceProfile {
  id: number;
  name: string;
  email: string;
  token: string;
  pinHash?: string;
  salt?: string;
  hasPin: boolean;
  avatarBg: string;
  photoUrl?: string | null;
  lastActiveAt: string;
  createdAt: string;
}

const PROFILES_STORAGE_KEY = 'remivault_device_profiles';
const ACTIVE_PROFILE_KEY = 'remivault_active_profile_id';
const LOCK_STATE_KEY = 'remivault_device_lock_state';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #6366f1, #8b5cf6)', // Indigo - Violet
  'linear-gradient(135deg, #0ea5e9, #2563eb)', // Sky - Blue
  'linear-gradient(135deg, #10b981, #059669)', // Emerald
  'linear-gradient(135deg, #f59e0b, #d97706)', // Amber - Orange
  'linear-gradient(135deg, #ec4899, #f43f5e)', // Pink - Rose
  'linear-gradient(135deg, #8b5cf6, #d946ef)', // Violet - Fuchsia
  'linear-gradient(135deg, #06b6d4, #0284c7)', // Cyan - Blue
  'linear-gradient(135deg, #14b8a6, #0d9488)', // Teal
];

/**
 * Generate a consistent avatar background gradient based on email string
 */
export function getAvatarColor(identifier: string): string {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}

/**
 * Generate cryptographic random hex salt
 */
export function generateSalt(): string {
  const array = new Uint8Array(16);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Cryptographically hash a PIN with a salt using WebCrypto SHA-256
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin.trim()}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Retrieve all registered device profiles from LocalStorage
 */
export function getDeviceProfiles(): DeviceProfile[] {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const profiles = JSON.parse(raw) as DeviceProfile[];
    // Sort with most recently active first
    return profiles.sort(
      (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
    );
  } catch {
    return [];
  }
}

/**
 * Save or update a profile when a user successfully authenticates
 */
export function saveDeviceProfile(user: User, token: string, photoUrl?: string | null): DeviceProfile {
  const profiles = getDeviceProfiles();
  const existingIndex = profiles.findIndex(
    (p) => String(p.id) === String(user.id) || (p.email && user.email && p.email.toLowerCase() === user.email.toLowerCase())
  );

  const now = new Date().toISOString();
  const resolvedPhoto = photoUrl || user.avatar_url || (existingIndex >= 0 ? profiles[existingIndex].photoUrl : null);

  let profile: DeviceProfile;

  if (existingIndex >= 0) {
    // Update existing profile (preserve PIN if previously configured or sync from backend)
    const existing = profiles[existingIndex];
    profile = {
      ...existing,
      id: user.id,
      name: user.name,
      email: user.email,
      token,
      pinHash: existing.pinHash,
      salt: existing.salt,
      hasPin: user.has_pin !== undefined ? (user.has_pin || existing.hasPin) : existing.hasPin,
      photoUrl: resolvedPhoto,
      lastActiveAt: now,
    };
    profiles[existingIndex] = profile;
  } else {
    // New profile on this device (inherits hasPin status from backend account)
    profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      token,
      hasPin: user.has_pin === true,
      photoUrl: resolvedPhoto,
      avatarBg: getAvatarColor(user.email || user.name),
      lastActiveAt: now,
      createdAt: now,
    };
    profiles.push(profile);
  }

  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  localStorage.setItem(ACTIVE_PROFILE_KEY, String(user.id));
  setStoredToken(token);

  return profile;
}

/**
 * Returns the best available avatar URL for a user/profile.
 * 1. Explicit photoUrl (e.g. from Google login)
 * 2. Unavatar public lookup by email (Gravatar / GitHub / Google)
 */
export function getEffectiveAvatarUrl(email?: string, _name?: string, photoUrl?: string | null): string {
  if (photoUrl && photoUrl.trim()) {
    return photoUrl.trim();
  }
  if (email && email.trim() && !email.includes('@auth.remivault.local') && !email.includes('@remivault.local')) {
    return `https://unavatar.io/${encodeURIComponent(email.trim().toLowerCase())}?fallback=false`;
  }
  return '';
}

/**
 * Get active profile id
 */
export function getActiveProfileId(): number | null {
  const raw = localStorage.getItem(ACTIVE_PROFILE_KEY);
  if (!raw) return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

/**
 * Set active profile id and sync its Bearer token
 */
export function setActiveProfileId(id: number | null): void {
  if (id === null) {
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_PROFILE_KEY, String(id));
  const profiles = getDeviceProfiles();
  const found = profiles.find((p) => String(p.id) === String(id));
  if (found) {
    setStoredToken(found.token);
    // Bump activity timestamp
    found.lastActiveAt = new Date().toISOString();
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
  }
}

/**
 * Get the currently active profile or fallback to the most recent one
 */
export function getActiveProfile(): DeviceProfile | null {
  const profiles = getDeviceProfiles();
  if (profiles.length === 0) return null;

  const activeId = getActiveProfileId();
  if (activeId !== null) {
    const match = profiles.find((p) => String(p.id) === String(activeId));
    if (match) return match;
  }

  // Fallback to most recently active profile
  return profiles[0] || null;
}

/**
 * Set or reset a profile's security PIN
 */
export async function setProfilePin(profileId: number | string, pin: string): Promise<void> {
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    throw new Error('Profile PIN must be exactly 4 numeric digits.');
  }

  const profiles = getDeviceProfiles();
  const index = profiles.findIndex(
    (p) => String(p.id) === String(profileId) || (typeof profileId === 'string' && p.email.toLowerCase() === profileId.toLowerCase())
  );
  if (index === -1) {
    throw new Error('Profile not found on this device.');
  }

  const salt = generateSalt();
  const pinHash = await hashPin(cleanPin, salt);

  profiles[index] = {
    ...profiles[index],
    pinHash,
    salt,
    hasPin: true,
    lastActiveAt: new Date().toISOString(),
  };

  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
}

/**
 * Verify an input PIN against stored profile PIN hash
 */
export async function verifyProfilePin(profileId: number | string, inputPin: string): Promise<boolean> {
  const profiles = getDeviceProfiles();
  const profile = profiles.find(
    (p) => String(p.id) === String(profileId) || (typeof profileId === 'string' && p.email.toLowerCase() === profileId.toLowerCase())
  );

  if (!profile || !profile.hasPin || !profile.pinHash || !profile.salt) {
    return false;
  }

  const computedHash = await hashPin(inputPin.trim(), profile.salt);
  return computedHash === profile.pinHash;
}

/**
 * Device lock state: 'locked' | 'unlocked'
 */
export function getLockState(): 'locked' | 'unlocked' {
  const state = localStorage.getItem(LOCK_STATE_KEY);
  return state === 'unlocked' ? 'unlocked' : 'locked';
}

export function setLockState(state: 'locked' | 'unlocked'): void {
  localStorage.setItem(LOCK_STATE_KEY, state);
}

/**
 * Lock the current device session
 */
export function lockDeviceSession(): void {
  setLockState('locked');
}

/**
 * Unlock the session for a specific profile
 */
export function unlockDeviceSession(profileId?: number | string): void {
  if (profileId !== undefined) {
    const num = Number(profileId);
    setActiveProfileId(Number.isFinite(num) ? num : null);
  }
  setLockState('unlocked');
}

/**
 * Completely remove a single account profile from this device
 */
export function removeDeviceProfile(profileId: number | string): void {
  const profiles = getDeviceProfiles();
  const updated = profiles.filter((p) => String(p.id) !== String(profileId));
  localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updated));

  const currentActive = getActiveProfileId();
  if (currentActive !== null && String(currentActive) === String(profileId)) {
    if (updated.length > 0) {
      setActiveProfileId(updated[0].id);
      setLockState('locked');
    } else {
      setActiveProfileId(null);
      setStoredToken(null);
      setLockState('unlocked');
    }
  }
}

/**
 * Clear all device profiles (Factory reset for this browser)
 */
export function clearAllDeviceProfiles(): void {
  localStorage.removeItem(PROFILES_STORAGE_KEY);
  localStorage.removeItem(ACTIVE_PROFILE_KEY);
  localStorage.removeItem(LOCK_STATE_KEY);
  setStoredToken(null);
}
