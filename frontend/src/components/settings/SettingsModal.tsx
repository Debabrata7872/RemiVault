import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sun, 
  Moon, 
  Monitor, 
  Check, 
  Shield, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Palette,
  HelpCircle,
  Users,
  LogOut,
  Send,
  Bell,
  Volume2,
  VolumeX,
  Smartphone,
  Calendar,
  Sparkles,
  Download,
  QrCode,
  RefreshCw,
  ArrowUpCircle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { changePasswordApi, sendFeedbackApi } from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';
import {
  getNotificationPermission,
  requestNotificationPermission,
  getNotificationSettings,
  saveNotificationSettings,
  showSystemNotification,
  playFintechChime,
  type NotificationPermissionState,
  type NotificationSettings
} from '../../services/notificationService';
import {
  triggerApkDownload,
  getDeviceType,
  isNativePlatform,
  fetchAppVersionInfo,
  type AppVersionInfo
} from '../../services/installPromptService';
import { APP_VERSION } from '../../config/version';
import { 
  type AppUpdateInfo, 
  type UpdateCheckResult, 
  toggleSimulatedServerRelease 
} from '../../services/versionUpdateService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultCount?: number;
  datesCount?: number;
  remindersCount?: number;
  notesCount?: number;
  onPreviewLaunchScreen?: () => void;
  onOpenInstallModal?: (tab?: 'android' | 'desktop' | 'qr') => void;
  onCheckUpdates?: (force?: boolean, simulate?: boolean) => Promise<UpdateCheckResult | null>;
  availableUpdate?: AppUpdateInfo | null;
  onOpenUpdateModal?: () => void;
  onOpenWhatsNew?: () => void;
}

type AccordionSection = 'profile' | 'theme' | 'security' | 'notifications' | 'app' | 'feedback' | 'session' | null;

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  vaultCount = 0,
  datesCount = 0,
  remindersCount = 0,
  notesCount = 0,
  onPreviewLaunchScreen,
  onOpenInstallModal,
  onCheckUpdates,
  availableUpdate,
  onOpenUpdateModal,
  onOpenWhatsNew,
}) => {
  const { userPreference, setTheme } = useTheme();
  const { user, logout, activeProfile, setupPin, lockApp } = useAuth();

  // Active accordion section (null if collapsed, or section name)
  const [openSection, setOpenSection] = useState<AccordionSection>(null);

  // Security Sub-Tab ('pin' vs 'password')
  const [securityTab, setSecurityTab] = useState<'pin' | 'password'>('pin');

  // Change PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [isPinSubmitting, setIsPinSubmitting] = useState(false);

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isPasswordSubmitting, setIsPasswordSubmitting] = useState(false);

  // Feedback form state
  const [feedbackType, setFeedbackType] = useState<'improvement' | 'feature' | 'bug'>('improvement');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  // System Notifications state
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>(() => getNotificationPermission());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(() => getNotificationSettings());
  const [testNotifStatus, setTestNotifStatus] = useState<string | null>(null);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
  };

  const handleToggleSound = () => {
    const updated = saveNotificationSettings({ soundEnabled: !notifSettings.soundEnabled });
    setNotifSettings(updated);
    if (updated.soundEnabled) {
      playFintechChime();
    }
  };

  const handleToggleReminders = () => {
    const updated = saveNotificationSettings({ remindersEnabled: !notifSettings.remindersEnabled });
    setNotifSettings(updated);
  };

  const handleToggleDates = () => {
    const updated = saveNotificationSettings({ datesEnabled: !notifSettings.datesEnabled });
    setNotifSettings(updated);
  };

  const handleSendTestNotification = async () => {
    setTestNotifStatus('Sending test alert...');
    playFintechChime();
    const ok = await showSystemNotification('🔔 RemiVault System Test Alert', {
      body: 'Notifications are working! Alerts appear in your mobile status bar and desktop tray.',
      tag: 'test-from-settings',
    });
    if (ok) {
      setTestNotifStatus('Test alert delivered to system tray!');
    } else {
      setTestNotifStatus('Please allow system notifications first.');
    }
    setTimeout(() => setTestNotifStatus(null), 4000);
  };

  // Standalone App & .APK Download State
  const [isSettingsApkDownloading, setIsSettingsApkDownloading] = useState(false);
  const [settingsApkSuccess, setSettingsApkSuccess] = useState(false);
  const [appInfo, setAppInfo] = useState<AppVersionInfo | null>(null);
  const currentDevice = getDeviceType();

  useEffect(() => {
    if (isOpen) {
      fetchAppVersionInfo().then(setAppInfo);
    }
  }, [isOpen]);

  const handleSettingsApkDownload = () => {
    setIsSettingsApkDownloading(true);
    triggerApkDownload();
    setSettingsApkSuccess(true);
    setTimeout(() => {
      setIsSettingsApkDownloading(false);
    }, 1500);
  };

  // Version Upgrade Management State (Step 14)
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [updateCheckFeedback, setUpdateCheckFeedback] = useState<string | null>(null);
  const [isSimulatingRelease, setIsSimulatingRelease] = useState(false);

  const handleManualCheckUpdates = async () => {
    if (!onCheckUpdates) return;
    setIsCheckingUpdates(true);
    setUpdateCheckFeedback(null);
    try {
      const res = await onCheckUpdates(true, isSimulatingRelease);
      if (res && res.updateAvailable) {
        setUpdateCheckFeedback(`v${res.latestVersion} available!`);
      } else {
        setUpdateCheckFeedback(`You're up to date (v${APP_VERSION})`);
      }
    } catch {
      setUpdateCheckFeedback('Could not reach server.');
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleToggleSimulateRelease = async () => {
    const nextState = !isSimulatingRelease;
    setIsSimulatingRelease(nextState);
    await toggleSimulatedServerRelease(nextState);
    if (onCheckUpdates) {
      await onCheckUpdates(true, nextState);
    }
    setUpdateCheckFeedback(nextState ? 'Simulated v0.3.0 active!' : 'Reset to standard v0.2.0');
  };

  // Reset all modal internal state (collapses all accordions and clears inputs)
  const resetAllState = () => {
    setOpenSection(null);
    setSecurityTab('pin');
    setCurrentPin('');
    setNewPin('');
    setConfirmNewPin('');
    setPinError(null);
    setPinSuccess(null);
    setIsPinSubmitting(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setPasswordError(null);
    setPasswordSuccess(null);
    setIsPasswordSubmitting(false);
    setFeedbackType('improvement');
    setFeedbackMessage('');
    setFeedbackSuccess(null);
    setFeedbackError(null);
    setIsFeedbackSubmitting(false);
    setNotifPermission(getNotificationPermission());
    setNotifSettings(getNotificationSettings());
    setTestNotifStatus(null);
  };

  const handleModalClose = () => {
    resetAllState();
    onClose();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset forms and collapse all accordions on modal open/close
  useEffect(() => {
    resetAllState();
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSection = (section: AccordionSection) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const totalStoredRecords = vaultCount + datesCount + remindersCount + notesCount;

  // Determine user usage priority tier
  const getUserPriority = () => {
    if (totalStoredRecords > 20) return { label: 'High Priority (Power Vault)', color: '#10b981' };
    if (totalStoredRecords > 5) return { label: 'Active Vault User', color: '#6366f1' };
    return { label: 'Standard Vault Member', color: '#06b6d4' };
  };

  const priority = getUserPriority();

  const themeOptions: {
    mode: Theme;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      mode: 'light',
      title: 'Light Mode',
      description: 'Clean bright surfaces with high-contrast text.',
      icon: <Sun size={18} color="#f59e0b" />,
    },
    {
      mode: 'dark',
      title: 'Dark Mode',
      description: 'Obsidian glassmorphism with vivid neon accents.',
      icon: <Moon size={18} color="#818cf8" />,
    },
    {
      mode: 'system',
      title: 'System Theme',
      description: 'Matches your operating system color scheme.',
      icon: <Monitor size={18} color="#06b6d4" />,
    },
  ];

  /**
   * Handle Profile 4-Digit PIN Update (Saved directly in database & synced across devices)
   */
  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinSuccess(null);

    if (!activeProfile) {
      setPinError('No active profile detected on this device.');
      return;
    }

    if (activeProfile.hasPin && currentPin.length !== 4) {
      setPinError('Please enter your current 4-digit PIN.');
      return;
    }

    if (newPin.length !== 4) {
      setPinError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinError('New PIN and confirmation do not match.');
      return;
    }

    setIsPinSubmitting(true);
    try {
      await setupPin(newPin, activeProfile.hasPin ? currentPin : undefined);
      setPinSuccess('PIN updated successfully!');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: unknown) {
      const e = err as Error;
      setPinError(e.message || 'Failed to update PIN. Please try again.');
    } finally {
      setIsPinSubmitting(false);
    }
  };

  /**
   * Handle Account Password Update (Server-authenticated)
   */
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsPasswordSubmitting(true);
    try {
      const res = await changePasswordApi({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmNewPassword,
      });
      setPasswordSuccess(res.message || 'Account password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      const msg = apiErr.errors?.current_password?.[0] || apiErr.errors?.password?.[0] || apiErr.message || 'Failed to change password.';
      setPasswordError(msg);
    } finally {
      setIsPasswordSubmitting(false);
    }
  };

  /**
   * Handle Help & Review Submission (Prepared for Step 2 DB storage)
   */
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    setFeedbackSuccess(null);

    if (!feedbackMessage.trim()) {
      setFeedbackError('Please enter your query or feedback message.');
      return;
    }

    setIsFeedbackSubmitting(true);
    try {
      const res = await sendFeedbackApi({
        type: feedbackType,
        message: feedbackMessage.trim(),
        name: user?.name,
        email: user?.email,
      });
      setFeedbackSuccess(res.message || 'Thank you! We have received your feedback.');
      setFeedbackMessage('');
    } catch (err: unknown) {
      const apiErr = err as { message?: string; errors?: Record<string, string[]> };
      const msg = apiErr.errors?.message?.[0] || apiErr.message || 'Could not submit feedback at this time.';
      setFeedbackError(msg);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop settings-modal-backdrop" onClick={handleModalClose} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content settings-modal-sheet" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="settings-sheet-header">
          <div>
            <h2 className="settings-sheet-title">Settings</h2>
            <p className="settings-sheet-subtitle">Manage profile, appearance, and vault security</p>
          </div>
          <button className="settings-sheet-close" onClick={handleModalClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        {/* ===================================================================
            1. EXECUTIVE IDENTITY HERO CARD & QUICK ACTIONS
            =================================================================== */}
        {user && (
          <div className="settings-profile-hero">
            <div className="settings-hero-main">
              <div className="settings-hero-avatar-wrap">
                <UserAvatar
                  name={user.name}
                  email={user.email}
                  photoUrl={activeProfile?.photoUrl || user.avatar_url}
                  className="settings-profile-avatar"
                  bgColor={activeProfile?.avatarBg || 'var(--primary-gradient)'}
                />
                <span className="settings-avatar-status-dot" title="Active Protected Session" />
              </div>

              <div className="settings-profile-meta">
                <div className="settings-profile-identity">
                  <span className="settings-profile-name">{user.name}</span>
                  <span className="settings-priority-badge" style={{ color: priority.color, borderColor: priority.color }}>
                    ✦ {priority.label}
                  </span>
                </div>
                <span className="settings-profile-email" title={user.email}>{user.email}</span>
              </div>
            </div>

            {/* Hero Quick Action Bar */}
            <div className="settings-hero-action-bar">
              <button
                type="button"
                className="settings-quick-lock-btn"
                onClick={() => {
                  handleModalClose();
                  lockApp();
                }}
                title="Immediately lock profile with 4-digit PIN"
              >
                <Lock size={14} />
                <span>Quick Lock Profile</span>
              </button>

              <button
                type="button"
                className={`settings-storage-toggle-btn ${openSection === 'profile' ? 'active' : ''}`}
                onClick={() => toggleSection('profile')}
                title="View summary of your saved items"
              >
                <Shield size={13} color="#818cf8" />
                <span>{totalStoredRecords} Saved Items</span>
                <ChevronDown size={14} className={`settings-storage-chevron ${openSection === 'profile' ? 'expanded' : ''}`} />
              </button>
            </div>

            {/* Expanded Profile Storage Breakdown */}
            {openSection === 'profile' && (
              <div className="settings-profile-expanded">
                <div className="settings-storage-breakdown">
                  <div className="settings-storage-header">
                    <Shield size={14} color="#818cf8" />
                    <span>Personal Vault Summary</span>
                  </div>
                  <p className="settings-storage-desc">
                    Your passwords, important dates, reminders, and notes are securely protected and private to you.
                  </p>

                  <div className="settings-metrics-pills">
                    <div className="settings-metric-chip">
                      <span className="metric-chip-count">{vaultCount}</span>
                      <span className="metric-chip-label">Passwords</span>
                    </div>
                    <div className="settings-metric-chip">
                      <span className="metric-chip-count">{datesCount}</span>
                      <span className="metric-chip-label">Dates</span>
                    </div>
                    <div className="settings-metric-chip">
                      <span className="metric-chip-count">{remindersCount}</span>
                      <span className="metric-chip-label">Reminders</span>
                    </div>
                    <div className="settings-metric-chip">
                      <span className="metric-chip-count">{notesCount}</span>
                      <span className="metric-chip-label">Notes</span>
                    </div>
                  </div>

                  <div className="settings-profile-meta-footer">
                    <CheckCircle2 size={13} color="#10b981" />
                    <span>All your records are protected and up to date</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            2. GROUPED SETTINGS HUB (APPLE / LINEAR STYLE INSET CANVAS)
            =================================================================== */}
        <div className="settings-hub-card">
          
          {/* SECTION: THEME PREFERENCE */}
          <div className="settings-hub-item">
            <div 
              className={`settings-hub-row ${openSection === 'theme' ? 'active' : ''}`}
              onClick={() => toggleSection('theme')}
            >
              <div className="settings-hub-row-left">
                <div className="settings-icon-bubble theme-bubble">
                  <Palette size={18} />
                </div>
                <div>
                  <h4 className="settings-item-title">
                    <span className="settings-title-full">Theme &amp; Appearance</span>
                    <span className="settings-title-short">Theme</span>
                  </h4>
                  <span className="settings-item-sub">Customize lighting and visual contrast</span>
                </div>
              </div>
              <div className="settings-hub-row-right">
                <span className="settings-status-pill">
                  <span className="pill-full">{userPreference.charAt(0).toUpperCase() + userPreference.slice(1)} Mode</span>
                  <span className="pill-short">{userPreference.charAt(0).toUpperCase() + userPreference.slice(1)}</span>
                </span>
                <ChevronDown size={16} className={`settings-hub-chevron ${openSection === 'theme' ? 'expanded' : ''}`} />
              </div>
            </div>

            {openSection === 'theme' && (
              <div className="settings-hub-drawer">
                <div className="settings-theme-visual-grid">
                  {themeOptions.map((opt) => {
                    const isSelected = userPreference === opt.mode;
                    return (
                      <div
                        key={opt.mode}
                        className={`settings-theme-visual-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => setTheme(opt.mode)}
                      >
                        {/* Visual miniature mockup */}
                        <div className={`theme-miniature miniature-${opt.mode}`}>
                          <div className="miniature-bar" />
                          <div className="miniature-body">
                            <div className="miniature-sidebar" />
                            <div className="miniature-content">
                              <div className="miniature-line" />
                              <div className="miniature-box" />
                            </div>
                          </div>
                        </div>

                        <div className="theme-card-footer">
                          <div className="theme-card-info">
                            <span className="theme-card-icon-wrap">{opt.icon}</span>
                            <span className="theme-card-label">{opt.title}</span>
                          </div>
                          {isSelected && (
                            <div className="theme-selected-check">
                              <Check size={13} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Vault Launch Screen Experience Preview */}
                {onPreviewLaunchScreen && (
                  <div 
                    className="launch-preview-banner" 
                    style={{ 
                      marginTop: '1.25rem', 
                      padding: '0.9rem 1.1rem', 
                      background: 'rgba(245, 158, 11, 0.08)', 
                      border: '1px solid rgba(245, 158, 11, 0.25)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      gap: '1rem' 
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div 
                        style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 9, 
                          background: 'rgba(245, 158, 11, 0.18)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: '#f59e0b', 
                          flexShrink: 0,
                          boxShadow: '0 0 12px rgba(245, 158, 11, 0.25)'
                        }}
                      >
                        <Sparkles size={18} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                          Vault Launch &amp; Lock Experience
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                          Replay animated cryptographic dials, category locks &amp; security telemetry
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        onClose();
                        onPreviewLaunchScreen();
                      }}
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '0.4rem 0.85rem', 
                        borderColor: 'rgba(245, 158, 11, 0.4)', 
                        color: '#fbbf24', 
                        whiteSpace: 'nowrap',
                        fontWeight: 600
                      }}
                    >
                      <span>Play Intro</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="settings-hub-divider" />

          {/* SECTION: SECURITY & CREDENTIALS */}
          <div className="settings-hub-item">
            <div 
              className={`settings-hub-row ${openSection === 'security' ? 'active' : ''}`}
              onClick={() => toggleSection('security')}
            >
              <div className="settings-hub-row-left">
                <div className="settings-icon-bubble security-bubble">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h4 className="settings-item-title">
                    <span className="settings-title-full">Security &amp; Credentials</span>
                    <span className="settings-title-short">Security &amp; PIN</span>
                  </h4>
                  <span className="settings-item-sub">4-digit PIN &amp; account password</span>
                </div>
              </div>
              <div className="settings-hub-row-right">
                <span className="settings-status-pill security-pill">
                  <span className="pill-full">{activeProfile?.hasPin ? 'PIN Active' : 'Set PIN'}</span>
                  <span className="pill-short">{activeProfile?.hasPin ? 'Active' : 'Off'}</span>
                </span>
                <ChevronDown size={16} className={`settings-hub-chevron ${openSection === 'security' ? 'expanded' : ''}`} />
              </div>
            </div>

            {openSection === 'security' && (
              <div className="settings-hub-drawer">
                {/* Mode Selector Tabs */}
                <div className="settings-segmented-tabs">
                  <button
                    type="button"
                    className={`settings-tab-btn ${securityTab === 'pin' ? 'active' : ''}`}
                    onClick={() => setSecurityTab('pin')}
                  >
                    <KeyRound size={14} />
                    <span>4-Digit PIN</span>
                  </button>
                  <button
                    type="button"
                    className={`settings-tab-btn ${securityTab === 'password' ? 'active' : ''}`}
                    onClick={() => setSecurityTab('password')}
                  >
                    <Lock size={14} />
                    <span>Account Password</span>
                  </button>
                </div>

                {/* SUB-TAB A: 4-DIGIT PIN */}
                {securityTab === 'pin' && (
                  <form onSubmit={handleUpdatePin} className="settings-security-form">
                    {pinSuccess && (
                      <div className="settings-alert success">
                        <CheckCircle2 size={16} />
                        <span>{pinSuccess}</span>
                      </div>
                    )}

                    {pinError && (
                      <div className="settings-alert danger">
                        <AlertCircle size={16} />
                        <span>{pinError}</span>
                      </div>
                    )}

                    {activeProfile?.hasPin && (
                      <div className="settings-input-group">
                        <label className="settings-input-label">Current 4-Digit PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="••••"
                          className="settings-rounded-input pin-center-input"
                          value={currentPin}
                          onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                      </div>
                    )}

                    <div className="settings-input-row">
                      <div className="settings-input-group">
                        <label className="settings-input-label">New 4-Digit PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="••••"
                          className="settings-rounded-input pin-center-input"
                          value={newPin}
                          onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-input-label">Confirm New PIN</label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="••••"
                          className="settings-rounded-input pin-center-input"
                          value={confirmNewPin}
                          onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                      </div>
                    </div>

                    <div className="settings-form-footer">
                      <div className="settings-tip">
                        <Shield size={13} color="#10b981" />
                        <span>Must be 4 digits • Works across all your devices</span>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary settings-submit-btn"
                        disabled={isPinSubmitting || newPin.length !== 4 || confirmNewPin.length !== 4 || (Boolean(activeProfile?.hasPin) && currentPin.length !== 4)}
                      >
                        {isPinSubmitting ? 'Updating PIN...' : activeProfile?.hasPin ? 'Update PIN' : 'Save PIN'}
                      </button>
                    </div>
                  </form>
                )}

                {/* SUB-TAB B: ACCOUNT PASSWORD */}
                {securityTab === 'password' && (
                  <form onSubmit={handleUpdatePassword} className="settings-security-form">
                    {passwordSuccess && (
                      <div className="settings-alert success">
                        <CheckCircle2 size={16} />
                        <span>{passwordSuccess}</span>
                      </div>
                    )}

                    {passwordError && (
                      <div className="settings-alert danger">
                        <AlertCircle size={16} />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    <div className="settings-input-group">
                      <label className="settings-input-label">Current Password</label>
                      <div className="settings-input-wrapper">
                        <Lock size={15} className="settings-input-icon" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="Enter your current password"
                          className="settings-rounded-input with-icon"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <button
                          type="button"
                          className="settings-eye-btn"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="settings-input-row">
                      <div className="settings-input-group">
                        <label className="settings-input-label">New Password</label>
                        <div className="settings-input-wrapper">
                          <Lock size={15} className="settings-input-icon" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Min 8 chars"
                            className="settings-rounded-input with-icon"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                          <button
                            type="button"
                            className="settings-eye-btn"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="settings-input-group">
                        <label className="settings-input-label">Confirm Password</label>
                        <div className="settings-input-wrapper">
                          <Lock size={15} className="settings-input-icon" />
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            placeholder="Repeat new password"
                            className="settings-rounded-input with-icon"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="settings-form-footer">
                      <div className="settings-tip">
                        <Shield size={13} color="#10b981" />
                        <span>Must be at least 8 characters</span>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary settings-submit-btn"
                        disabled={isPasswordSubmitting || !currentPassword || newPassword.length < 8 || newPassword !== confirmNewPassword}
                      >
                        {isPasswordSubmitting ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <div className="settings-hub-divider" />

          {/* SECTION: SYSTEM NOTIFICATIONS & ALERTS */}
          <div className="settings-hub-item">
            <div 
              className={`settings-hub-row ${openSection === 'notifications' ? 'active' : ''}`}
              onClick={() => toggleSection('notifications')}
            >
              <div className="settings-hub-row-left">
                <div className="settings-icon-bubble notif-bubble">
                  <Bell size={18} color="#f59e0b" />
                </div>
                <div>
                  <h4 className="settings-item-title">
                    <span className="settings-title-full">System Alerts &amp; Notifications</span>
                    <span className="settings-title-short">Notifications</span>
                  </h4>
                  <span className="settings-item-sub">Status bar alerts, desktop tray &amp; sound chimes</span>
                </div>
              </div>
              <div className="settings-hub-row-right">
                <span className={`badge ${notifPermission === 'granted' ? 'badge-success' : notifPermission === 'denied' ? 'badge-danger' : 'badge-primary'}`}>
                  {notifPermission === 'granted' ? 'Active' : notifPermission === 'denied' ? 'Blocked' : 'Setup'}
                </span>
                <ChevronDown size={16} className={`settings-hub-chevron ${openSection === 'notifications' ? 'expanded' : ''}`} />
              </div>
            </div>

            {openSection === 'notifications' && (
              <div className="settings-hub-drawer">
                <div className="settings-notif-overview-card">
                  <div className="notif-overview-icon-col">
                    <Smartphone size={22} className="notif-phone-icon" />
                  </div>
                  <div className="notif-overview-text">
                    <strong>Cross-Platform Status Bar &amp; Tray Delivery</strong>
                    <p>
                      Alerts appear on your mobile status bar (beside Wi-Fi &amp; battery) and in desktop notifications for scheduled tasks and document renewals.
                    </p>
                    {notifPermission !== 'granted' ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm notif-req-btn"
                        onClick={handleEnableNotifications}
                        style={{ marginTop: '0.65rem' }}
                      >
                        <Bell size={14} />
                        <span>Enable System Notifications</span>
                      </button>
                    ) : (
                      <span className="notif-active-indicator">
                        <CheckCircle2 size={14} color="#10b981" />
                        <span>System notifications enabled &amp; active</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Preference Toggles */}
                <div className="settings-notif-toggles-list">
                  <div className="settings-notif-toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-title-row">
                        {notifSettings.soundEnabled ? <Volume2 size={16} color="#818cf8" /> : <VolumeX size={16} color="#94a3b8" />}
                        <strong>Alert Chime Sound</strong>
                      </div>
                      <span>Plays a subtle luxury crystal fintech chime on active notifications.</span>
                    </div>
                    <button
                      type="button"
                      className={`notif-toggle-switch ${notifSettings.soundEnabled ? 'on' : 'off'}`}
                      onClick={handleToggleSound}
                      title="Toggle sound"
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>

                  <div className="settings-notif-toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-title-row">
                        <Bell size={16} color="#f59e0b" />
                        <strong>Task &amp; Reminder Due Alerts</strong>
                      </div>
                      <span>Pushes notification when a scheduled reminder or task deadline arrives.</span>
                    </div>
                    <button
                      type="button"
                      className={`notif-toggle-switch ${notifSettings.remindersEnabled ? 'on' : 'off'}`}
                      onClick={handleToggleReminders}
                      title="Toggle reminder alerts"
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>

                  <div className="settings-notif-toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-title-row">
                        <Calendar size={16} color="#06b6d4" />
                        <strong>Document Expiration Warnings</strong>
                      </div>
                      <span>Proactive countdown alerts before passports, licenses, cards &amp; warranties expire.</span>
                    </div>
                    <button
                      type="button"
                      className={`notif-toggle-switch ${notifSettings.datesEnabled ? 'on' : 'off'}`}
                      onClick={handleToggleDates}
                      title="Toggle expiration warnings"
                    >
                      <span className="toggle-knob" />
                    </button>
                  </div>
                </div>

                {/* Test Action Controls */}
                <div className="settings-notif-test-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSendTestNotification}
                  >
                    <Bell size={14} />
                    <span>Send Test Notification</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => playFintechChime()}
                  >
                    <Volume2 size={14} />
                    <span>Test Chime Sound</span>
                  </button>
                </div>

                {testNotifStatus && (
                  <div className="settings-alert info" style={{ marginTop: '0.65rem' }}>
                    <CheckCircle2 size={15} />
                    <span>{testNotifStatus}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="settings-hub-divider" />

          {/* SECTION: MOBILE APP & STANDALONE (.APK) */}
          <div className="settings-hub-item">
            <div 
              className={`settings-hub-row ${openSection === 'app' ? 'active' : ''}`}
              onClick={() => toggleSection('app')}
            >
              <div className="settings-hub-row-left">
                <div className="settings-icon-bubble app-bubble">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="settings-item-title">
                    <span className="settings-title-full">Mobile App (.APK) &amp; Desktop</span>
                    <span className="settings-title-short">Mobile App</span>
                  </h4>
                  <span className="settings-item-sub">Standalone Android app &amp; offline vault access</span>
                </div>
              </div>
              <div className="settings-hub-row-right">
                <span className="settings-status-pill app-pill">
                  {isNativePlatform() ? 'Native App' : 'Android .APK'}
                </span>
                <ChevronDown size={16} className={`settings-hub-chevron ${openSection === 'app' ? 'expanded' : ''}`} />
              </div>
            </div>

            {openSection === 'app' && (
              <div className="settings-hub-drawer">
                {/* Platform Status Banner */}
                <div className="settings-notif-overview-card" style={{ marginBottom: '1rem' }}>
                  <div className="notif-overview-icon-col">
                    <Smartphone size={22} className="notif-phone-icon" />
                  </div>
                  <div className="notif-overview-text">
                    <strong>
                      {isNativePlatform()
                        ? 'Running inside Standalone Android App'
                        : currentDevice === 'android'
                        ? 'Android Mobile Device Detected'
                        : currentDevice === 'ios'
                        ? 'Apple iOS Device Detected'
                        : 'Desktop Workstation Detected'}
                    </strong>
                    <p>
                      {isNativePlatform()
                        ? 'You are running the official standalone RemiVault Android application with hardware PIN protection.'
                        : currentDevice === 'android'
                        ? 'Install our standalone .APK for instant launch without browser address bars, hardware PIN lock, and system notification alerts.'
                        : 'Download the standalone Android .APK for your phone or install the desktop application for taskbar access.'}
                    </p>
                  </div>
                </div>

                {/* Direct APK Download Card */}
                <div className="install-download-box" style={{ marginBottom: '0.85rem' }}>
                  <div className="install-box-left">
                    <div className="install-apk-badge">
                      <span className="apk-label">APK</span>
                      <span className="apk-size">{appInfo?.apk_size_formatted || '17.5 MB'}</span>
                    </div>
                    <div>
                      <h4 className="download-box-heading">RemiVault Standalone .APK</h4>
                      <p className="download-box-sub">
                        {appInfo?.version ? `v${appInfo.version}` : 'v0.2.0'} • Android 8.0+ • Full Offline Vault
                      </p>
                    </div>
                  </div>

                  <div className="install-box-right">
                    <button
                      type="button"
                      className="btn btn-primary download-apk-main-btn"
                      onClick={handleSettingsApkDownload}
                      disabled={isSettingsApkDownloading}
                      style={{ padding: '0.55rem 0.95rem', fontSize: '0.8rem' }}
                    >
                      <Download size={15} className={isSettingsApkDownloading ? 'spin-anim' : ''} />
                      <span>{isSettingsApkDownloading ? 'Starting...' : 'Download APK'}</span>
                    </button>
                  </div>
                </div>

                {settingsApkSuccess && (
                  <div className="install-alert-banner success" style={{ marginBottom: '0.85rem' }}>
                    <CheckCircle2 size={15} />
                    <span>Download started! Check your notification bar for <code>RemiVault.apk</code>.</span>
                  </div>
                )}

                {/* Additional Guidance Buttons */}
                {onOpenInstallModal && (
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        handleModalClose();
                        onOpenInstallModal('android');
                      }}
                      style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                    >
                      <Sparkles size={14} color="#f59e0b" />
                      <span>Step-by-Step Install Guide</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        handleModalClose();
                        onOpenInstallModal('qr');
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                      title="Scan QR Code to download on mobile"
                    >
                      <QrCode size={14} />
                      <span>Scan QR Code</span>
                    </button>
                  </div>
                )}

                {/* App Version & Upgrade Management Section (Step 14) */}
                <div style={{ marginTop: '0.85rem', padding: '0.85rem 1rem', background: 'rgba(15, 23, 42, 0.45)', border: '1px solid var(--border-card)', borderRadius: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                      <ArrowUpCircle size={18} color="#fbbf24" />
                      <div>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block' }}>
                          App Version &amp; Upgrade Alerts
                        </strong>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Installed: <code>v{APP_VERSION}</code> • Status: {isCheckingUpdates ? 'Checking server...' : updateCheckFeedback || (availableUpdate ? `v${availableUpdate.version} Available!` : 'Latest Version')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleManualCheckUpdates}
                      disabled={isCheckingUpdates}
                      style={{ fontSize: '0.74rem', padding: '0.35rem 0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Check server for new release updates"
                    >
                      <RefreshCw size={12} className={isCheckingUpdates ? 'spin-anim' : ''} />
                      <span>{isCheckingUpdates ? 'Checking...' : 'Check Updates'}</span>
                    </button>
                  </div>

                  {availableUpdate && (
                    <div style={{ marginTop: '0.5rem', padding: '0.7rem 0.85rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.35)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span>New Update: v{availableUpdate.version}</span>
                          <span style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem', borderRadius: 4, background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', fontWeight: 600 }}>
                            {availableUpdate.apk_size_formatted || '17.5 MB'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          {availableUpdate.changelog?.[0] || 'New features and improvements ready'}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          handleModalClose();
                          if (onOpenUpdateModal) onOpenUpdateModal();
                        }}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem', whiteSpace: 'nowrap' }}
                      >
                        Release Notes
                      </button>
                    </div>
                  )}

                  {/* Dev / Reviewer Simulation Control */}
                  <div style={{ marginTop: '0.6rem', paddingTop: '0.55rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      Developer / Demo Testing:
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', color: '#f59e0b', textDecoration: 'underline' }}
                      onClick={handleToggleSimulateRelease}
                    >
                      {isSimulatingRelease ? 'Reset Server to v0.2.0' : 'Simulate v0.3.0 Release'}
                    </button>
                  </div>

                  {/* View What's New Release Notes Replay */}
                  {onOpenWhatsNew && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          handleModalClose();
                          onOpenWhatsNew();
                        }}
                        style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.76rem', padding: '0.45rem' }}
                      >
                        <Sparkles size={13} color="#f59e0b" />
                        <span>View What's New in v{APP_VERSION} (Release Notes)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="settings-hub-divider" />

          {/* SECTION: HELP & REVIEW */}
          <div className="settings-hub-item">
            <div 
              className={`settings-hub-row ${openSection === 'feedback' ? 'active' : ''}`}
              onClick={() => toggleSection('feedback')}
            >
              <div className="settings-hub-row-left">
                <div className="settings-icon-bubble help-bubble">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="settings-item-title">
                    <span className="settings-title-full">Help &amp; Review</span>
                    <span className="settings-title-short">Help &amp; Review</span>
                  </h4>
                  <span className="settings-item-sub">Send queries, feedback, or feature requests</span>
                </div>
              </div>
              <div className="settings-hub-row-right">
                <span className="settings-status-pill">Feedback</span>
                <ChevronDown size={16} className={`settings-hub-chevron ${openSection === 'feedback' ? 'expanded' : ''}`} />
              </div>
            </div>

            {openSection === 'feedback' && (
              <div className="settings-hub-drawer">
                <form onSubmit={handleFeedbackSubmit} className="settings-security-form">
                  <p className="settings-feedback-intro">
                    We value your feedback! Share what you’d like improved or any issues you’re experiencing.
                  </p>

                  {feedbackSuccess && (
                    <div className="settings-alert success">
                      <CheckCircle2 size={16} />
                      <span>{feedbackSuccess}</span>
                    </div>
                  )}

                  {feedbackError && (
                    <div className="settings-alert danger">
                      <AlertCircle size={16} />
                      <span>{feedbackError}</span>
                    </div>
                  )}

                  <div className="settings-category-pills">
                    <button
                      type="button"
                      className={`settings-pill-chip ${feedbackType === 'improvement' ? 'active' : ''}`}
                      onClick={() => setFeedbackType('improvement')}
                    >
                      💡 App Improvement
                    </button>
                    <button
                      type="button"
                      className={`settings-pill-chip ${feedbackType === 'feature' ? 'active' : ''}`}
                      onClick={() => setFeedbackType('feature')}
                    >
                      ✨ Feature Request
                    </button>
                    <button
                      type="button"
                      className={`settings-pill-chip ${feedbackType === 'bug' ? 'active' : ''}`}
                      onClick={() => setFeedbackType('bug')}
                    >
                      🐛 Bug Report
                    </button>
                  </div>

                  <div className="settings-input-group">
                    <label className="settings-input-label">Your Message or Query</label>
                    <textarea
                      rows={3}
                      className="settings-rounded-textarea"
                      placeholder="Describe what changes or improvements would make RemiVault better for you..."
                      value={feedbackMessage}
                      onChange={(e) => setFeedbackMessage(e.target.value)}
                    />
                  </div>

                  <div className="settings-form-footer">
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      We appreciate your feedback
                    </span>
                    <button
                      type="submit"
                      className="btn btn-primary settings-submit-btn"
                      disabled={isFeedbackSubmitting || !feedbackMessage.trim()}
                    >
                      <Send size={13} />
                      <span>{isFeedbackSubmitting ? 'Sending...' : 'Send Feedback'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="settings-hub-divider" />

          {/* SECTION: ACCOUNT & SESSION */}
          <div className="settings-hub-item">
            <div 
              className={`settings-hub-row ${openSection === 'session' ? 'active' : ''}`}
              onClick={() => toggleSection('session')}
            >
              <div className="settings-hub-row-left">
                <div className="settings-icon-bubble session-bubble">
                  <Users size={18} />
                </div>
                <div>
                  <h4 className="settings-item-title">
                    <span className="settings-title-full">Account &amp; Session</span>
                    <span className="settings-title-short">Account</span>
                  </h4>
                  <span className="settings-item-sub">Switch account profile or log out</span>
                </div>
              </div>
              <div className="settings-hub-row-right">
                <span className="settings-status-pill danger-pill">Session</span>
                <ChevronDown size={16} className={`settings-hub-chevron ${openSection === 'session' ? 'expanded' : ''}`} />
              </div>
            </div>

            {openSection === 'session' && (
              <div className="settings-hub-drawer">
                <div className="settings-session-buttons">
                  <button
                    type="button"
                    className="settings-session-action-btn switch-btn"
                    onClick={() => {
                      handleModalClose();
                      lockApp();
                    }}
                  >
                    <div className="action-btn-icon-wrap switch-icon-wrap">
                      <Users size={18} />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <span className="action-btn-title">Switch Account Profile</span>
                      <span className="action-btn-sub">Lock session and choose another profile on this device</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className="settings-session-action-btn logout-btn"
                    onClick={() => {
                      handleModalClose();
                      logout(false);
                    }}
                  >
                    <div className="action-btn-icon-wrap logout-icon-wrap">
                      <LogOut size={18} />
                    </div>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                      <span className="action-btn-title">Sign Out / Lock Profile</span>
                      <span className="action-btn-sub">Locks vault for fast 4-digit PIN access next time</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Minimal Bottom Info */}
        <div className="settings-minimal-footer">
          <Shield size={13} />
          <span>RemiVault • Secure &amp; Private</span>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
