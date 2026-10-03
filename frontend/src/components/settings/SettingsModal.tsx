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
  Send
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { changePasswordApi, sendFeedbackApi } from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vaultCount?: number;
  datesCount?: number;
  remindersCount?: number;
  notesCount?: number;
}

type AccordionSection = 'profile' | 'theme' | 'security' | 'feedback' | 'session' | null;

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose,
  vaultCount = 0,
  datesCount = 0,
  remindersCount = 0,
  notesCount = 0
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
