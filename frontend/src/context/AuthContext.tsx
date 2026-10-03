import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { 
  getStoredToken, 
  setStoredToken, 
  loginApi, 
  registerApi, 
  getMeApi, 
  logoutApi,
  verifyEmailOtpRegisterApi,
  verifyEmailOtpResetApi,
  firebaseLoginApi,
  updateAvatarApi,
  setSecurityPinApi,
  verifySecurityPinApi,
  resetPinWithOtpApi
} from '../services/api';
import type { User, ApiError, RequestOptions } from '../services/api';
import {
  type DeviceProfile,
  getDeviceProfiles,
  saveDeviceProfile,
  getActiveProfile,
  setActiveProfileId,
  setProfilePin,
  verifyProfilePin,
  getLockState,
  lockDeviceSession,
  unlockDeviceSession,
  removeDeviceProfile
} from '../services/deviceProfiles';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  // Multi-Profile & Lock Screen state
  isLocked: boolean;
  isPendingPinSetup: boolean;
  activeProfile: DeviceProfile | null;
  deviceProfiles: DeviceProfile[];
  // Authentication actions
  login: (email: string, password: string, options?: RequestOptions) => Promise<void>;
  register: (name: string, email: string, password: string, confirmation: string, options?: RequestOptions) => Promise<void>;
  registerWithOtp: (name: string, email: string, password: string, confirmation: string, otp: string, options?: RequestOptions) => Promise<void>;
  resetPasswordWithOtp: (email: string, password: string, confirmation: string, otp: string, options?: RequestOptions) => Promise<void>;
  loginWithFirebase: (idToken: string, email?: string | null, name?: string | null, phone?: string | null, photoUrl?: string | null, options?: RequestOptions) => Promise<void>;
  logout: (removeFromDevice?: boolean) => Promise<void>;
  clearError: () => void;
  // Profile Lock & Device Profile actions
  unlockWithPin: (profileId: number, pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  dismissPinSetup: () => void;
  switchProfile: (profileId: number) => void;
  lockApp: () => void;
  removeProfile: (profileId: number) => void;
  resetPinWithOtp: (email: string, otp: string, newPin: string) => Promise<void>;
  updateUserAvatar: (photoUrl: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [deviceProfiles, setDeviceProfiles] = useState<DeviceProfile[]>(() => getDeviceProfiles());
  const [activeProfile, setActiveProfile] = useState<DeviceProfile | null>(() => getActiveProfile());
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Lock status: true if device profiles exist and lock state is locked
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const profiles = getDeviceProfiles();
    if (profiles.length === 0) return false;
    return getLockState() === 'locked';
  });

  const [isPendingPinSetup, setIsPendingPinSetup] = useState<boolean>(false);

  /**
   * Sync and refresh device profiles state from LocalStorage
   */
  const refreshProfilesState = useCallback(() => {
    const profiles = getDeviceProfiles();
    setDeviceProfiles(profiles);
    const active = getActiveProfile();
    setActiveProfile(active);
    return { profiles, active };
  }, []);

  /**
   * On Mount: Initialize session from device profiles or legacy token
   */
  useEffect(() => {
    const initSession = async () => {
      const { profiles, active } = refreshProfilesState();

      if (profiles.length > 0 && active) {
        // We have remembered accounts on this device!
        setToken(active.token);
        setStoredToken(active.token);
        setUser({
          id: active.id,
          name: active.name,
          email: active.email,
          avatar_url: active.photoUrl,
          created_at: active.createdAt || new Date().toISOString(),
        });

        const isDismissed = localStorage.getItem(`remivault_dismissed_pin_${active.id}`) === 'true';
        if (!active.hasPin && !isDismissed) {
          // Profile hasn't configured a PIN yet and hasn't dismissed -> prompt PIN setup
          setIsPendingPinSetup(true);
          setIsLocked(false);
        } else if (getLockState() === 'locked' && active.hasPin) {
          // Locked: require PIN
          setIsLocked(true);
        } else {
          // Unlocked: ready to work
          setIsLocked(false);
        }

        setIsLoading(false);

        // Quiet background verification with Laravel
        try {
          const res = await getMeApi();
          setUser(res.user);
          if (active.token) {
            saveDeviceProfile(res.user, active.token, res.user.avatar_url || active.photoUrl);
            const { active: refreshedActive, profiles: refreshedProfiles } = refreshProfilesState();
            setActiveProfile(refreshedActive);
            setDeviceProfiles(refreshedProfiles);
            // If backend reports PIN is active, ensure setup modal is dismissed
            if (refreshedActive?.hasPin) {
              setIsPendingPinSetup(false);
            }
          }
        } catch (err: unknown) {
          const apiErr = err as ApiError;
          // If token was explicitly revoked on backend (401), mark session as expired
          if (apiErr.status === 401) {
            // Keep profile for quick relogin, but lock session
            lockDeviceSession();
            setIsLocked(true);
          }
        }
      } else {
        // No remembered profiles: check legacy token fallback
        const savedToken = getStoredToken();
        if (!savedToken) {
          setIsLoading(false);
          return;
        }

        try {
          const response = await getMeApi();
          const prof = saveDeviceProfile(response.user, savedToken, response.user.avatar_url);
          setUser(response.user);
          setToken(savedToken);
          const { profiles: legacyProfiles, active: legacyActive } = refreshProfilesState();
          setDeviceProfiles(legacyProfiles);
          setActiveProfile(legacyActive || prof);
          const isDismissed = localStorage.getItem(`remivault_dismissed_pin_${response.user.id}`) === 'true';
          if (!prof.hasPin && !isDismissed) {
            setIsPendingPinSetup(true);
          }
        } catch {
          setStoredToken(null);
          setToken(null);
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initSession();
  }, [refreshProfilesState]);

  /**
   * Internal helper after successful login/registration
   */
  const handleAuthSuccess = (authenticatedUser: User, authToken: string, photoUrl?: string | null) => {
    const effectivePhoto = photoUrl || authenticatedUser.avatar_url;
    const profile = saveDeviceProfile(authenticatedUser, authToken, effectivePhoto);
    setStoredToken(authToken);
    setToken(authToken);
    setUser({
      ...authenticatedUser,
      avatar_url: effectivePhoto || profile.photoUrl,
    });

    const { active, profiles } = refreshProfilesState();
    setActiveProfile(active || profile);
    setDeviceProfiles(profiles);

    const isDismissed = localStorage.getItem(`remivault_dismissed_pin_${profile.id}`) === 'true';
    if (!profile.hasPin && !isDismissed) {
      setIsPendingPinSetup(true);
      setIsLocked(false);
    } else {
      unlockDeviceSession(profile.id);
      setIsLocked(false);
    }
  };

  const login = async (email: string, password: string, options?: RequestOptions): Promise<void> => {
    setError(null);
    try {
      const response = await loginApi({ email, password }, options);
      handleAuthSuccess(response.user, response.token, response.user.avatar_url);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const msg = apiErr.errors?.email?.[0] || apiErr.message || 'Login failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    confirmation: string,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await registerApi({
        name,
        email,
        password,
        password_confirmation: confirmation,
      }, options);
      handleAuthSuccess(response.user, response.token, response.user.avatar_url);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const firstField = apiErr.errors ? Object.keys(apiErr.errors)[0] : null;
        const msg = firstField ? apiErr.errors![firstField][0] : apiErr.message || 'Registration failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const registerWithOtp = async (
    name: string,
    email: string,
    password: string,
    confirmation: string,
    otp: string,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await verifyEmailOtpRegisterApi({
        name,
        email,
        password,
        password_confirmation: confirmation,
        otp,
      }, options);
      handleAuthSuccess(response.user, response.token, response.user.avatar_url);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const firstField = apiErr.errors ? Object.keys(apiErr.errors)[0] : null;
        const msg = firstField ? apiErr.errors![firstField][0] : apiErr.message || 'OTP Verification failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const resetPasswordWithOtp = async (
    email: string,
    password: string,
    confirmation: string,
    otp: string,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await verifyEmailOtpResetApi({
        email,
        password,
        password_confirmation: confirmation,
        otp,
      }, options);
      handleAuthSuccess(response.user, response.token, response.user.avatar_url);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const msg = apiErr.message || 'Password reset failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const loginWithFirebase = async (
    idToken: string,
    email?: string | null,
    name?: string | null,
    phone?: string | null,
    photoUrl?: string | null,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await firebaseLoginApi({ idToken, email, name, phone, photo_url: photoUrl }, options);
      handleAuthSuccess(response.user, response.token, photoUrl || response.user.avatar_url);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const msg = apiErr.message || 'Firebase authentication failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const updateUserAvatar = async (photoUrl: string): Promise<void> => {
    try {
      const res = await updateAvatarApi(photoUrl);
      if (token && res.user) {
        saveDeviceProfile(res.user, token, photoUrl);
      }
      setUser((prev) => prev ? { ...prev, avatar_url: photoUrl } : null);
      const { active } = refreshProfilesState();
      setActiveProfile(active);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      throw apiErr;
    }
  };

  /**
   * Unlock account using Profile PIN
   * Checks local device hash first; if missing or outdated, verifies against backend account PIN.
   */
  const unlockWithPin = async (profileId: number, pin: string): Promise<boolean> => {
    const cleanPin = pin.trim();
    const profiles = getDeviceProfiles();
    const profile = profiles.find((p) => 
      String(p.id) === String(profileId) || 
      (typeof profileId === 'string' && p.email?.toLowerCase() === (profileId as string).toLowerCase())
    );

    // 1. Try instant local verification (fast, works offline)
    const localValid = profile ? await verifyProfilePin(profile.id, cleanPin) : await verifyProfilePin(profileId, cleanPin);
    if (localValid) {
      const resolvedProfile = profile || profiles.find((p) => String(p.id) === String(profileId)) || profiles[0];
      if (resolvedProfile && resolvedProfile.token) {
        setStoredToken(resolvedProfile.token);
        setSecurityPinApi(cleanPin).catch((err) => {
          console.warn('Auto-sync existing PIN to backend notice:', err);
        });
      }

      unlockDeviceSession(resolvedProfile?.id ?? profileId);
      const { active } = refreshProfilesState();

      if (active) {
        setUser({
          id: active.id,
          name: active.name,
          email: active.email,
          avatar_url: active.photoUrl,
          has_pin: true,
          created_at: active.createdAt || new Date().toISOString(),
        });
        setToken(active.token);
        setStoredToken(active.token);
      }

      setIsLocked(false);
      return true;
    }

    // 2. Cross-device backend verification fallback (e.g. user on phone verifying PIN originally created on Desktop, or updated PIN on another device)
    const targetProfile = profile || profiles.find((p) => String(p.id) === String(profileId)) || profiles[0];
    if (targetProfile) {
      if (!targetProfile.token) {
        throw new Error('No saved session on this device. Please sign in with your password.');
      }
      try {
        setStoredToken(targetProfile.token);
        const res = await verifySecurityPinApi(cleanPin, targetProfile.token);
        if (res.valid) {
          // Success! Save PIN locally on this device so future unlocks are offline & instantaneous
          await setProfilePin(targetProfile.id, cleanPin);
          unlockDeviceSession(targetProfile.id);
          const { active } = refreshProfilesState();

          if (active) {
            setUser({
              id: active.id,
              name: active.name,
              email: active.email,
              avatar_url: active.photoUrl,
              has_pin: true,
              created_at: active.createdAt || new Date().toISOString(),
            });
            setToken(active.token);
            setStoredToken(active.token);
          }

          setIsLocked(false);
          return true;
        }
      } catch (err: unknown) {
        const apiErr = err as ApiError;
        if (apiErr?.status === 401) {
          throw new Error('Your session on this device has expired. Please sign in with your password.');
        }
        if (apiErr?.status === 422) {
          return false;
        }
        throw new Error(apiErr?.message || 'Network error verifying PIN. Check your connection.');
      }
    }

    return false;
  };

  /**
   * Save initial or updated PIN for active profile (syncs to backend and caches locally)
   */
  const setupPin = async (pin: string): Promise<void> => {
    const cleanPin = pin.trim();
    if (!activeProfile) return;
    
    // Sync to backend account in database
    try {
      if (activeProfile.token) {
        setStoredToken(activeProfile.token);
      }
      await setSecurityPinApi(cleanPin);
    } catch (err) {
      console.warn('Backend PIN sync notice:', err);
    }

    // Cache on local device profile
    await setProfilePin(activeProfile.id, cleanPin);
    localStorage.setItem(`remivault_dismissed_pin_${activeProfile.id}`, 'true');
    unlockDeviceSession(activeProfile.id);
    refreshProfilesState();
    setIsPendingPinSetup(false);
    setIsLocked(false);
  };

  const dismissPinSetup = () => {
    if (activeProfile) {
      localStorage.setItem(`remivault_dismissed_pin_${activeProfile.id}`, 'true');
    }
    setIsPendingPinSetup(false);
  };

  /**
   * Switch to a different profile in the lock screen
   */
  const switchProfile = (profileId: number) => {
    setActiveProfileId(profileId);
    const { active, profiles } = refreshProfilesState();
    if (active) {
      setToken(active.token);
      setStoredToken(active.token);
      setUser({
        id: active.id,
        name: active.name,
        email: active.email,
        avatar_url: active.photoUrl,
        created_at: active.createdAt || new Date().toISOString(),
      });
      setActiveProfile(active);
    }
    setDeviceProfiles(profiles);
  };

  /**
   * Lock the current device session (presents ProfileLockScreen)
   */
  const lockApp = () => {
    lockDeviceSession();
    setIsLocked(true);
  };

  /**
   * Remove a profile from this device
   */
  const removeProfile = (profileId: number) => {
    removeDeviceProfile(profileId);
    const { profiles, active } = refreshProfilesState();
    setDeviceProfiles(profiles);

    if (profiles.length === 0) {
      setUser(null);
      setToken(null);
      setActiveProfile(null);
      setIsLocked(false);
    } else if (active) {
      setUser({
        id: active.id,
        name: active.name,
        email: active.email,
        avatar_url: active.photoUrl,
        created_at: active.createdAt || new Date().toISOString(),
      });
      setToken(active.token);
      setStoredToken(active.token);
      setActiveProfile(active);
      setIsLocked(true);
    }
  };

  /**
   * Reset profile PIN via Email OTP
   */
  const resetPinWithOtp = async (email: string, otp: string, newPin: string): Promise<void> => {
    const cleanPin = newPin.trim();
    const cleanOtp = otp.trim();

    // 1. Call dedicated backend endpoint to verify OTP and reset PIN in database
    const response = await resetPinWithOtpApi({
      email,
      otp: cleanOtp,
      pin: cleanPin,
    });

    // 2. Save authenticated session and fresh token
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);

    // 3. Cache profile and PIN in local WebCrypto store
    const profile = saveDeviceProfile(response.user, response.token, response.user.avatar_url);
    await setProfilePin(profile.id, cleanPin);
    unlockDeviceSession(profile.id);

    const { active, profiles: refreshedProfiles } = refreshProfilesState();
    setActiveProfile(active || profile);
    setDeviceProfiles(refreshedProfiles);

    setIsPendingPinSetup(false);
    setIsLocked(false);
  };

  /**
   * Logout handler:
   * If removeFromDevice is true, purges this profile from device LocalStorage and revokes on backend.
   * If removeFromDevice is false, locks the profile on this device so the user can easily unlock with PIN.
   */
  const logout = async (removeFromDevice = false): Promise<void> => {
    try {
      if (token && removeFromDevice) {
        await logoutApi();
      }
    } catch {
      // Quiet network catch
    } finally {
      if (removeFromDevice && activeProfile) {
        removeProfile(activeProfile.id);
      } else {
        // Lock the device session (keeps credentials saved for PIN unlock)
        lockApp();
      }
      setError(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        isLocked,
        isPendingPinSetup,
        activeProfile,
        deviceProfiles,
        login,
        register,
        registerWithOtp,
        resetPasswordWithOtp,
        loginWithFirebase,
        logout,
        clearError,
        unlockWithPin,
        setupPin,
        dismissPinSetup,
        switchProfile,
        lockApp,
        removeProfile,
        resetPinWithOtp,
        updateUserAvatar,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
