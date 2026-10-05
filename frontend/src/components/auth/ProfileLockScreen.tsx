import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Lock, 
  KeyRound, 
  Users, 
  UserPlus, 
  Trash2, 
  Mail, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  RotateCcw,
  Sparkles,
  Delete,
  LogIn
} from 'lucide-react';
import type { DeviceProfile } from '../../services/deviceProfiles';
import { sendEmailOtpApi } from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';
import { BrandLogo } from '../common/BrandLogo';

interface ProfileLockScreenProps {
  profiles: DeviceProfile[];
  activeProfile: DeviceProfile | null;
  onUnlockWithPin: (profileId: number, pin: string) => Promise<boolean>;
  onSwitchProfile: (profileId: number) => void;
  onAddNewAccount: () => void;
  onRemoveProfile: (profileId: number) => void;
  onResetPinWithOtp: (email: string, otp: string, newPin: string) => Promise<void>;
  onResetPasswordWithOtp: (email: string, password: string, confirmation: string, otp: string) => Promise<void>;
}

type ScreenView = 'pin' | 'switcher' | 'forgot_pin_request' | 'forgot_pin_verify';

export const ProfileLockScreen: React.FC<ProfileLockScreenProps> = ({
  profiles,
  activeProfile,
  onUnlockWithPin,
  onSwitchProfile,
  onAddNewAccount,
  onRemoveProfile,
  onResetPinWithOtp,
  onResetPasswordWithOtp,
}) => {
  const [view, setView] = useState<ScreenView>('pin');
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(
    activeProfile?.id ?? profiles[0]?.id ?? null
  );

  const targetProfile = profiles.find((p) => 
    String(p.id) === String(selectedProfileId ?? activeProfile?.id)
  ) || activeProfile || profiles[0] || null;

  // PIN input state
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  // Forgot PIN & Password recovery state
  const [recoveryTab, setRecoveryTab] = useState<'pin' | 'password'>('password');
  const [resetOtp, setResetOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const pinContainerRef = useRef<HTMLDivElement>(null);

  // Countdown timer for reset OTP cooldown
  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  // Auto-verify when 4 digits are typed
  const triggerVerify = useCallback(async (currentPin: string) => {
    if (!targetProfile) return;
    if (currentPin.length !== 4) return;

    setIsVerifying(true);
    setPinError(null);

    try {
      const isValid = await onUnlockWithPin(targetProfile.id, currentPin);
      if (!isValid) {
        setIsShaking(true);
        setPinError('Incorrect PIN. Try again, or use Forgot PIN / Password below.');
        setTimeout(() => {
          setIsShaking(false);
          setPin('');
        }, 500);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setIsShaking(true);
      setPinError(e.message || 'Error verifying PIN');
      setTimeout(() => {
        setIsShaking(false);
        setPin('');
      }, 500);
    } finally {
      setIsVerifying(false);
    }
  }, [targetProfile, onUnlockWithPin]);

  // Handle Physical Keyboard input
  useEffect(() => {
    if (view !== 'pin') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if an input or textarea is active
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          const next = pin + e.key;
          setPin(next);
          setPinError(null);
          if (next.length === 4) {
            triggerVerify(next);
          }
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1));
        setPinError(null);
      } else if (e.key === 'Enter' && pin.length === 4) {
        triggerVerify(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, pin, triggerVerify]);

  // Keypad click handlers
  const handleKeypadPress = (val: string) => {
    if (pin.length >= 4) return;
    const next = pin + val;
    setPin(next);
    setPinError(null);
    if (next.length === 4) {
      triggerVerify(next);
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleKeypadClear = () => {
    setPin('');
    setPinError(null);
  };

  // Helper to mask email
  const maskEmail = (email: string) => {
    if (!email.includes('@')) return email;
    const [userPart, domain] = email.split('@');
    if (userPart.length <= 2) return `${userPart}***@${domain}`;
    return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
  };

  // Trigger Send OTP for Reset PIN
  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProfile) return;

    setResetError(null);
    setIsResetSubmitting(true);

    try {
      const res = await sendEmailOtpApi({
        email: targetProfile.email,
        type: 'forgot_password',
      });
      setResetSuccess(res.message || 'Verification code sent to your email.');
      setResetCooldown(res.cooldown_seconds || 60);
      setView('forgot_pin_verify');
    } catch (err: unknown) {
      const e = err as Error;
      setResetError(e.message || 'Failed to dispatch verification code. Please check your network.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Verify OTP and Save New PIN
  const handleVerifyOtpAndSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProfile) return;

    setResetError(null);
    setResetSuccess(null);

    const cleanOtp = resetOtp.trim();
    if (cleanOtp.length !== 6) {
      setResetError('Please enter the 6-digit code received in your email.');
      return;
    }

    if (newPin.length !== 4) {
      setResetError('New PIN must be exactly 4 digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setResetError('PINs do not match. Please verify both inputs.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      // Direct end-to-end OTP verification, database PIN update & session grant
      await onResetPinWithOtp(targetProfile.email, cleanOtp, newPin);

      // Successfully updated! Smooth unlock
      setResetSuccess('PIN reset successfully! Unlocking your vault...');
      setTimeout(() => {
        setResetSuccess(null);
        setView('pin');
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      setResetError(e.message || 'Invalid or expired verification code.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Verify OTP and Save New Account Password
  const handleVerifyOtpAndSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProfile) return;

    setResetError(null);
    setResetSuccess(null);

    const cleanOtp = resetOtp.trim();
    if (cleanOtp.length !== 6) {
      setResetError('Please enter the 6-digit code received in your email.');
      return;
    }

    if (newPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setResetError('Passwords do not match. Please verify both inputs.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      await onResetPasswordWithOtp(targetProfile.email, newPassword, confirmNewPassword, cleanOtp);
      setResetSuccess('Password reset successfully! Unlocking your vault...');
      setTimeout(() => {
        setResetSuccess(null);
        setView('pin');
      }, 600);
    } catch (err: unknown) {
      const e = err as Error;
      setResetError(e.message || 'Invalid or expired verification code.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="profile-lock-backdrop">
      <div className="profile-lock-container">
        
        {/* ===================================================================
            VIEW 1: RECENT USER PIN UNLOCK (DEFAULT)
            =================================================================== */}
        {view === 'pin' && targetProfile && (
          <div className="profile-lock-card">
            {/* Top brand header */}
            <div className="profile-lock-brand">
              <BrandLogo size={28} />
              <span className="profile-lock-brand-name">RemiVault Security</span>
            </div>

            {/* Target User Avatar & Meta */}
            <div className="profile-lock-user-hero">
              <div className="profile-lock-avatar-wrap">
                <UserAvatar
                  name={targetProfile.name}
                  email={targetProfile.email}
                  photoUrl={targetProfile.photoUrl}
                  className="profile-lock-avatar"
                  bgColor={targetProfile.avatarBg || 'var(--primary-gradient)'}
                />
                <div className="profile-lock-badge">
                  <Lock size={12} />
                </div>
              </div>
              <h2 className="profile-lock-user-name">{targetProfile.name}</h2>
              <p className="profile-lock-user-email">{maskEmail(targetProfile.email)}</p>
            </div>

            {/* PIN Dots Display */}
            <div className="profile-pin-display-wrapper">
              <div 
                ref={pinContainerRef}
                className={`profile-pin-dots-row ${isShaking ? 'shake-animation' : ''}`}
              >
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`profile-pin-slot ${idx < pin.length ? 'filled' : ''} ${
                      pinError ? 'error' : ''
                    }`}
                  >
                    {idx < pin.length && <div className="profile-pin-dot-fill" />}
                  </div>
                ))}
              </div>

              {pinError ? (
                <div className="profile-pin-feedback error">
                  <AlertCircle size={14} />
                  <span>{pinError}</span>
                </div>
              ) : (
                <div className="profile-pin-feedback">
                  <span>Enter Profile PIN to unlock</span>
                </div>
              )}
            </div>

            {/* Interactive Numeric Keypad */}
            <div className="profile-keypad-grid">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  className="profile-keypad-btn"
                  onClick={() => handleKeypadPress(digit)}
                  disabled={isVerifying}
                >
                  <span className="keypad-digit">{digit}</span>
                </button>
              ))}

              <button
                type="button"
                className="profile-keypad-btn action-btn"
                onClick={handleKeypadClear}
                disabled={pin.length === 0 || isVerifying}
                title="Clear PIN"
              >
                <RotateCcw size={18} />
              </button>

              <button
                type="button"
                className="profile-keypad-btn"
                onClick={() => handleKeypadPress('0')}
                disabled={isVerifying}
              >
                <span className="keypad-digit">0</span>
              </button>

              <button
                type="button"
                className="profile-keypad-btn action-btn"
                onClick={handleKeypadBackspace}
                disabled={pin.length === 0 || isVerifying}
                title="Backspace"
              >
                <Delete size={20} />
              </button>
            </div>

            {/* Footer Navigation Options */}
            <div className="profile-lock-footer-nav">
              <div className="profile-lock-footer-row">
                <button
                  type="button"
                  className="profile-lock-link-btn"
                  onClick={() => {
                    setResetError(null);
                    setResetSuccess(null);
                    setRecoveryTab('pin');
                    setView('forgot_pin_request');
                  }}
                  title="Reset your 4-digit security PIN via email code"
                >
                  <KeyRound size={14} />
                  <span>Forgot PIN?</span>
                </button>

                <span className="profile-lock-sep">•</span>

                <button
                  type="button"
                  className="profile-lock-link-btn"
                  onClick={() => {
                    setResetError(null);
                    setResetSuccess(null);
                    setRecoveryTab('password');
                    setView('forgot_pin_request');
                  }}
                  title="Reset your master account password via email code"
                >
                  <Lock size={14} />
                  <span>Forgot Password?</span>
                </button>
              </div>

              <div className="profile-lock-footer-row secondary">
                <button
                  type="button"
                  className="profile-lock-link-btn"
                  onClick={onAddNewAccount}
                  title="Sign in with your email & password"
                >
                  <LogIn size={13} />
                  <span>Sign In</span>
                </button>

                <span className="profile-lock-sep">•</span>

                <button
                  type="button"
                  className="profile-lock-link-btn"
                  onClick={() => setView('switcher')}
                  title="Switch or manage profiles on this device"
                >
                  <Users size={13} />
                  <span>Switch Profile ({profiles.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 2: PROFILE SWITCHER (ALL ACCOUNTS ON THIS DEVICE)
            =================================================================== */}
        {view === 'switcher' && (
          <div className="profile-lock-card profile-switcher-card">
            <div className="profile-card-top-nav">
              <button
                type="button"
                className="profile-back-btn"
                onClick={() => {
                  setPin('');
                  setPinError(null);
                  setView('pin');
                }}
              >
                <ArrowLeft size={16} />
                <span>Back to PIN</span>
              </button>
              <span className="profile-switcher-badge">This Device</span>
            </div>

            <div className="profile-switcher-header">
              <h2 className="profile-switcher-title">Accounts on this Device</h2>
              <p className="profile-switcher-subtitle">
                Select a profile to enter its vault, or sign in to an additional account.
              </p>
            </div>

            <div className="profile-accounts-list">
              {profiles.map((p) => {
                const isActive = targetProfile?.id === p.id;
                return (
                  <div
                    key={p.id}
                    className={`profile-account-item ${isActive ? 'active-profile' : ''}`}
                    onClick={() => {
                      setSelectedProfileId(p.id);
                      onSwitchProfile(p.id);
                      setPin('');
                      setPinError(null);
                      setView('pin');
                    }}
                  >
                    <UserAvatar
                      name={p.name}
                      email={p.email}
                      photoUrl={p.photoUrl}
                      className="profile-account-avatar"
                      bgColor={p.avatarBg || 'var(--primary-gradient)'}
                    />

                    <div className="profile-account-info">
                      <div className="profile-account-name-row">
                        <span className="profile-account-name">{p.name}</span>
                        {isActive && (
                          <span className="badge badge-primary current-badge">Active</span>
                        )}
                      </div>
                      <span className="profile-account-email">{p.email}</span>
                    </div>

                    <div className="profile-account-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="btn-icon-subtle danger"
                        title="Remove this account from device"
                        onClick={() => {
                          if (window.confirm(`Remove profile for "${p.name}" from this device?`)) {
                            onRemoveProfile(p.id);
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="profile-switcher-add-wrapper">
              <button
                type="button"
                className="btn btn-secondary profile-add-account-btn"
                onClick={onAddNewAccount}
              >
                <UserPlus size={16} />
                <span>Sign In with Another Account</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 3: FORGOT PIN & PASSWORD - REQUEST EMAIL OTP
            =================================================================== */}
        {view === 'forgot_pin_request' && targetProfile && (
          <div className="profile-lock-card">
            <div className="profile-card-top-nav">
              <button
                type="button"
                className="profile-back-btn"
                onClick={() => setView('pin')}
              >
                <ArrowLeft size={16} />
                <span>Cancel</span>
              </button>
            </div>

            <div className="profile-lock-user-hero" style={{ marginTop: '0.5rem' }}>
              <div className="profile-pin-badge-icon">
                <Mail size={24} />
              </div>
              <h2 className="profile-lock-user-name">
                {recoveryTab === 'password' ? 'Reset Account Password' : 'Reset Profile PIN'}
              </h2>
              <p className="profile-lock-user-email">
                We will dispatch a 6-digit verification code to your verified email:
                <br />
                <strong style={{ color: 'var(--text-primary)', marginTop: '0.25rem', display: 'inline-block' }}>
                  {targetProfile.email}
                </strong>
              </p>
            </div>

            {resetError && (
              <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleSendResetOtp} style={{ marginTop: '1.25rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                disabled={isResetSubmitting || resetCooldown > 0}
              >
                {isResetSubmitting 
                  ? 'Sending Code...' 
                  : resetCooldown > 0 
                  ? `Resend available in ${resetCooldown}s` 
                  : 'Send Verification Code'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button
                type="button"
                className="auth-link-btn"
                style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                onClick={() => {
                  setResetError(null);
                  setView('forgot_pin_verify');
                }}
              >
                Already have a 6-digit code? Enter code directly &rarr;
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================
            VIEW 4: FORGOT CREDENTIALS - VERIFY OTP & ENTER NEW PIN / PASSWORD
            =================================================================== */}
        {view === 'forgot_pin_verify' && targetProfile && (
          <div className="profile-lock-card">
            <div className="profile-card-top-nav">
              <button
                type="button"
                className="profile-back-btn"
                onClick={() => setView('forgot_pin_request')}
              >
                <ArrowLeft size={16} />
                <span>Resend Code</span>
              </button>
              <button
                type="button"
                className="profile-back-btn"
                onClick={() => setView('pin')}
              >
                <span>Back to PIN</span>
              </button>
            </div>

            <div className="profile-lock-user-hero" style={{ marginTop: '0.25rem', marginBottom: '0.5rem' }}>
              <div className="profile-pin-badge-icon">
                <Sparkles size={22} />
              </div>
              <h2 className="profile-lock-user-name">Account Recovery</h2>
              <p className="profile-lock-user-email">
                Verification code dispatched to <strong>{maskEmail(targetProfile.email)}</strong>
              </p>
            </div>

            {/* Recovery Switcher Tabs */}
            <div className="profile-recovery-tabs">
              <button
                type="button"
                className={`profile-recovery-tab-btn ${recoveryTab === 'password' ? 'active' : ''}`}
                onClick={() => {
                  setRecoveryTab('password');
                  setResetError(null);
                }}
              >
                <Lock size={15} />
                <span>Reset Password</span>
              </button>

              <button
                type="button"
                className={`profile-recovery-tab-btn ${recoveryTab === 'pin' ? 'active' : ''}`}
                onClick={() => {
                  setRecoveryTab('pin');
                  setResetError(null);
                }}
              >
                <KeyRound size={15} />
                <span>Reset PIN</span>
              </button>
            </div>

            {/* TAB A: RESET PIN */}
            {recoveryTab === 'pin' && (
              <form onSubmit={handleVerifyOtpAndSavePin} style={{ marginTop: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="reset-otp-input">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="reset-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="form-control"
                    style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 700 }}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="reset-new-pin">
                    New 4-Digit PIN
                  </label>
                  <input
                    id="reset-new-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    className="form-control"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="reset-confirm-pin">
                    Confirm New 4-Digit PIN
                  </label>
                  <input
                    id="reset-confirm-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="••••"
                    className="form-control"
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                </div>

                {resetSuccess && (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                {resetError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{resetError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                  disabled={isResetSubmitting || resetOtp.length < 6 || newPin.length !== 4 || confirmNewPin.length !== 4}
                >
                  {isResetSubmitting ? 'Verifying & Unlocking...' : 'Save New PIN & Unlock'}
                </button>
              </form>
            )}

            {/* TAB B: RESET PASSWORD */}
            {recoveryTab === 'password' && (
              <form onSubmit={handleVerifyOtpAndSavePassword} style={{ marginTop: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="reset-pwd-otp-input">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="reset-pwd-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className="form-control"
                    style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '1.2rem', fontWeight: 700 }}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="reset-new-password">
                    New Master Password (min 8 chars)
                  </label>
                  <input
                    id="reset-new-password"
                    type="password"
                    placeholder="At least 8 characters"
                    className="form-control"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="reset-confirm-password">
                    Confirm New Password
                  </label>
                  <input
                    id="reset-confirm-password"
                    type="password"
                    placeholder="Repeat new password"
                    className="form-control"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>

                {resetSuccess && (
                  <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                {resetError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{resetError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
                  disabled={isResetSubmitting || resetOtp.length < 6 || newPassword.length < 8 || confirmNewPassword.length < 8}
                >
                  {isResetSubmitting ? 'Resetting & Unlocking...' : 'Reset Password & Unlock'}
                </button>
              </form>
            )}

          </div>
        )}

      </div>
    </div>
  );
};
