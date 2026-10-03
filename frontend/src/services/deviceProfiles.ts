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
 * Pure JavaScript SHA-256 implementation (FIPS 180-4).
 * Used as universal fallback in non-secure contexts (e.g. mobile accessing local server via HTTP IP),
 * where window.crypto.subtle is intentionally restricted by modern mobile browsers.
 */
function sha256PureJs(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isComposite: Record<number, boolean> = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = ((mathPow(candidate, 0.5) % 1) * maxWord) | 0;
      k[primeCounter] = ((mathPow(candidate, 1 / 3) % 1) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii[lengthProperty] % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength | 0;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      const i2 = i - 2,
        i7 = i - 7,
        i15 = i - 15,
        i16 = i - 16;
      const w15 = w[i15],
        w2 = w[i2];

      const s0 = i >= 16 ? rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3) : 0;
      const s1 = i >= 16 ? rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10) : 0;

      const wi =
        i < 16
          ? w[i]
          : (((w[i16] + s0) | 0) + ((w[i7] + s1) | 0)) | 0;

      w[i] = wi;

      const s1_h = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = ((((hash[7] + s1_h) | 0) + ch) | 0) + (((k[i] + wi) | 0)) | 0;
      const s0_h = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_h + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (8 * b)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }

  return result;
}

/**
 * Generate cryptographic random hex salt (with fallback for non-secure contexts)
 */
export function generateSalt(): string {
  try {
    if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.getRandomValues === 'function') {
      const array = new Uint8Array(16);
      window.crypto.getRandomValues(array);
      return Array.from(array)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch {
    // Fallback
  }
  let fallback = '';
  for (let idx = 0; idx < 32; idx++) {
    fallback += Math.floor(Math.random() * 16).toString(16);
  }
  return fallback;
}

/**
 * Cryptographically hash a PIN with a salt.
 * Uses WebCrypto SHA-256 in secure contexts (HTTPS/localhost) with automatic pure JS fallback on HTTP.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const input = `${salt}:${pin.trim()}`;
  try {
    if (
      typeof window !== 'undefined' &&
      window.crypto &&
      window.crypto.subtle &&
      typeof window.crypto.subtle.digest === 'function'
    ) {
      const encoder = new TextEncoder();
      const data = encoder.encode(input);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Quiet fallback to pure JS
  }
  return sha256PureJs(input);
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
