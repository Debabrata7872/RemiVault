import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield,
  ShieldCheck,
  CheckCircle2, 
  Bell, 
  Calendar, 
  FileText, 
  KeyRound,
  LogOut,
  LayoutDashboard,
  ArrowRight,
  Lock,
  Sparkles,
  Settings,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
import { checkBackendHealth } from './services/api';
import type { HealthResponse } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/auth/AuthModal';
import { BrandLogo } from './components/common/BrandLogo';
import { SetProfilePinModal } from './components/auth/SetProfilePinModal';
import { ProfileLockScreen } from './components/auth/ProfileLockScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { UserAvatar } from './components/common/UserAvatar';
import { NotesSection } from './components/notes/NotesSection';
import { RemindersSection } from './components/reminders/RemindersSection';
import { ImportantDatesSection } from './components/importantDates/ImportantDatesSection';
import { VaultSection } from './components/vault/VaultSection';
import { UserOverview } from './components/dashboard/UserOverview';
import { AdminPinModal, AdminPanelModal } from './components/admin';
import { useActivityTracker } from './services/activityTracker';
import { isSuperAdmin } from './utils/admin';
import { PreloadDataProvider, usePreloadData } from './context/PreloadDataContext';
import { NotificationPromptModal } from './components/notifications/NotificationPromptModal';
import { NotificationToast } from './components/notifications/NotificationToast';
import { useNotificationScheduler } from './hooks/useNotificationScheduler';
import { initServiceWorker, shouldShowPermissionPrompt } from './services/notificationService';
import './App.css';

type WorkspaceTab = 'overview' | 'vault' | 'dates' | 'reminders' | 'notes';

const RemiVaultApp: React.FC = () => {
  const { 
    user, 
    logout,
    isLocked,
    isPendingPinSetup,
    activeProfile,
    deviceProfiles,
    unlockWithPin,
    setupPin,
    dismissPinSetup,
    switchProfile,
    lockApp,
    removeProfile,
    resetPinWithOtp,
    resetPasswordWithOtp
  } = useAuth();
  
  // Health status for top navigation indicator
  const [health, setHealth] = useState<HealthResponse | null>(null);

  // User Usage & Activity Tracker (App opens and active duration)
  useActivityTracker(!!user && !isLocked, user?.id);

  // Super Admin Authorization & Master PIN State
  const isAdmin = isSuperAdmin(user?.email);
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState<boolean>(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);

  // Auto-lock admin console immediately (wipes authorization state & closes modal)
  const lockAdminConsole = useCallback(() => {
    setIsAdminUnlocked(false);
    setIsAdminPanelOpen(false);
    setIsAdminPinModalOpen(false);
  }, []);

  // When user clicks the Admin button in the navbar:
  // Entering always requires Master PIN verification!
  const handleOpenAdmin = () => {
    setIsAdminUnlocked(false);
    setIsAdminPanelOpen(false);
    setIsAdminPinModalOpen(true);
  };

  // Auto-lock admin on logout, session expiration, new login, profile switch, or app lock
  useEffect(() => {
    lockAdminConsole();
  }, [user?.id, isLocked, lockAdminConsole]);

  // Global blur / window loss of focus listener:
  // If the admin panel or pin modal is open, immediately lock on window blur / tab hide
  useEffect(() => {
    if (!isAdminPanelOpen && !isAdminPinModalOpen) return;

    const handleWindowBlur = () => {
      lockAdminConsole();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        lockAdminConsole();
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAdminPanelOpen, isAdminPinModalOpen, lockAdminConsole]);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Sign out confirmation sheet/modal
  const [isLogoutPromptOpen, setIsLogoutPromptOpen] = useState<boolean>(false);

  // Settings Modal State (Accessible after sign-in)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active Workspace Tab
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');

  // Preloaded In-Memory Data Context
  const { counts, isOverviewLoading, reminders, dates } = usePreloadData();

  // Cross-Platform Notification Scheduler (System Tray, Status Bar & Foreground)
  const { activeToast, dismissToast } = useNotificationScheduler({
    enabled: !!user && !isLocked,
    reminders,
    importantDates: dates,
    onNavigateTab: (tab) => setWorkspaceTab(tab),
  });

  // Friendly In-App Notification Permission Prompt Modal State
  const [isNotifPromptOpen, setIsNotifPromptOpen] = useState<boolean>(false);

  // Initialize Service Worker for Android status bar & desktop tray notifications
  useEffect(() => {
    initServiceWorker();

    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data?.type === 'NAVIGATE_TAB' && event.data.tab) {
          setWorkspaceTab(event.data.tab);
        }
      };
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
    }
  }, []);

  // Proactively display friendly permission prompt on cold start (after initial hydration)
  useEffect(() => {
    if (user && !isLocked && !isOverviewLoading) {
      if (shouldShowPermissionPrompt()) {
        const timer = setTimeout(() => {
          setIsNotifPromptOpen(true);
        }, 3500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isLocked, isOverviewLoading]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await checkBackendHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className={`navbar ${isLocked ? 'navbar-locked' : ''}`}>
        <div className="navbar-brand-row">
          <BrandLogo 
            size={38}
            showText={true}
            badgeText="v0.2.0"
            onClick={() => setWorkspaceTab('overview')}
          />

          <span className={`badge ${health?.status === 'ok' ? 'badge-success' : 'badge-danger'} nav-status-badge`}>
            <span className={`pulse-dot ${health?.status === 'ok' ? 'online' : 'offline'}`}></span>
            <span className="nav-status-text">{health?.status === 'ok' ? 'Online' : 'Offline'}</span>
          </span>
        </div>

        <div className="navbar-actions">
          {user && !isLocked ? (
            <div className="navbar-user-group">
              <button 
                type="button"
                className="user-nav-badge"
                onClick={() => setIsSettingsOpen(true)}
                title="Account Settings & Preferences"
              >
                <UserAvatar
                  size={24}
                  name={user.name}
                  email={user.email}
                  photoUrl={activeProfile?.photoUrl || user.avatar_url}
                  style={{ borderRadius: '50%', flexShrink: 0 }}
                  fontSize="0.72rem"
                />
                <span className="user-nav-name">{user.name}</span>
              </button>

              <div className="navbar-action-buttons">
                <button 
                  type="button"
                  className="btn btn-secondary nav-action-btn nav-lock-btn" 
                  onClick={lockApp}
                  title="Lock Vault (Quick PIN Access)"
                >
                  <Lock size={15} />
                  <span className="nav-btn-text">Lock</span>
                </button>

                {isAdmin && (
                  <button 
                    type="button"
                    className="btn btn-secondary nav-action-btn nav-admin-btn" 
                    onClick={handleOpenAdmin}
                    title="Open Super Admin Console (PIN Protected)"
                  >
                    <ShieldCheck size={15} color="#818cf8" />
                    <span className="nav-btn-text">Admin</span>
                  </button>
                )}

                <button 
                  type="button"
                  className="btn btn-secondary nav-action-btn nav-settings-btn" 
                  onClick={() => setIsSettingsOpen(true)}
                  title="Settings & Appearance"
                >
                  <Settings size={15} />
                  <span className="nav-btn-text">Settings</span>
                </button>

                <button 
                  type="button"
                  className="btn btn-secondary nav-action-btn nav-logout-btn" 
                  onClick={() => setIsLogoutPromptOpen(true)}
                  title="Sign Out or Switch Account"
                >
                  <LogOut size={15} />
                  <span className="nav-btn-text">Logout</span>
                </button>
              </div>
            </div>
          ) : !isLocked ? (
            <div className="navbar-auth-group">
              <button 
                className="btn btn-secondary nav-auth-btn" 
                onClick={() => openAuth('login')}
              >
                Sign In
              </button>
              <button 
                className="btn btn-primary nav-auth-btn" 
                onClick={() => openAuth('register')}
              >
                Create Account
              </button>
            </div>
          ) : (
            <div className="navbar-auth-group">
              <button
                className="btn btn-secondary nav-auth-btn nav-auth-locked-btn"
                onClick={() => openAuth('login')}
                title="Sign in with another account"
              >
                <span className="nav-btn-text-full">Sign In Another Account</span>
                <span className="nav-btn-text-short">Switch Account</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* =========================================================================
          VIEW SWITCHER:
          1. If isLocked && deviceProfiles.length > 0 => ProfileLockScreen
          2. If user => Logged In User Workspace
          3. If !user => Public Landing Page
          ========================================================================= */}
      {isLocked && deviceProfiles.length > 0 ? (
        <ProfileLockScreen
          profiles={deviceProfiles}
          activeProfile={activeProfile}
          onUnlockWithPin={unlockWithPin}
          onSwitchProfile={switchProfile}
          onAddNewAccount={() => openAuth('login')}
          onRemoveProfile={removeProfile}
          onResetPinWithOtp={resetPinWithOtp}
          onResetPasswordWithOtp={resetPasswordWithOtp}
        />
      ) : user ? (
        <main className="user-workspace-main">
          {/* Workspace Module Navigation */}
          <div className="workspace-tabs-container">
            <div className="workspace-nav-tabs" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              <button
                className={`workspace-tab-item ${workspaceTab === 'overview' ? 'active' : ''}`}
                onClick={() => setWorkspaceTab('overview')}
                title="Dashboard Overview"
              >
                <LayoutDashboard size={17} className="tab-icon" />
                <span className="tab-label-full">Dashboard</span>
                <span className="tab-label-compact">Home</span>
              </button>

              <button
                className={`workspace-tab-item ${workspaceTab === 'vault' ? 'active' : ''}`}
                onClick={() => setWorkspaceTab('vault')}
                title="Password Vault"
              >
                <KeyRound size={17} className="tab-icon" />
                <span className="tab-label-full">Password Vault</span>
                <span className="tab-label-compact">Vault</span>
              </button>

              <button
                className={`workspace-tab-item ${workspaceTab === 'dates' ? 'active' : ''}`}
                onClick={() => setWorkspaceTab('dates')}
                title="Important Dates"
              >
                <Calendar size={17} className="tab-icon" />
                <span className="tab-label-full">Important Dates</span>
                <span className="tab-label-compact">Dates</span>
              </button>

              <button
                className={`workspace-tab-item ${workspaceTab === 'reminders' ? 'active' : ''}`}
                onClick={() => setWorkspaceTab('reminders')}
                title="Reminders"
              >
                <Bell size={17} className="tab-icon" />
                <span className="tab-label-full">Reminders</span>
                <span className="tab-label-compact">Alerts</span>
              </button>

              <button
                className={`workspace-tab-item ${workspaceTab === 'notes' ? 'active' : ''}`}
                onClick={() => setWorkspaceTab('notes')}
                title="Personal Notes"
              >
                <FileText size={17} className="tab-icon" />
                <span className="tab-label-full">Personal Notes</span>
                <span className="tab-label-compact">Notes</span>
              </button>
            </div>

            <div className="workspace-security-badge">
              <span className="security-pulse-dot"></span>
              <span>Encrypted Personal Space</span>
              <span className="security-dot-sep">•</span>
              <span>User #{user.id}</span>
            </div>
          </div>

          {/* Render Active View */}
          {workspaceTab === 'overview' && (
            <UserOverview 
              userName={user.name}
              onNavigate={(tab) => setWorkspaceTab(tab)}
              vaultCount={counts.vault}
              datesCount={counts.dates}
              remindersCount={counts.reminders}
              notesCount={counts.notes}
              urgentDatesCount={counts.urgent_dates}
              upcomingRemindersCount={counts.upcoming_reminders}
              isLoading={isOverviewLoading}
            />
          )}

          {workspaceTab === 'vault' && <VaultSection />}
          {workspaceTab === 'dates' && <ImportantDatesSection />}
          {workspaceTab === 'reminders' && <RemindersSection />}
          {workspaceTab === 'notes' && <NotesSection />}
        </main>
      ) : (
        /* =========================================================================
           PUBLIC LANDING PAGE (NOT LOGGED IN)
           ========================================================================= */
        <main className="public-landing-main">
          {/* Hero Section */}
          <header className="hero">
            <div className="hero-pill">
              <Sparkles size={14} color="#818cf8" />
              <span>Your Personal All-In-One Workspace</span>
            </div>
            <h1 className="hero-title">
              Your Private Life, <span>Secure and Organized</span>
            </h1>
            <p className="hero-subtitle">
              RemiVault gives you a secure, private place to organize your passwords, important dates, daily reminders, and notes.
            </p>
            <div className="overview-quick-actions" style={{ justifyContent: 'center', marginTop: '0.75rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => openAuth('register')}
                style={{ padding: '0.75rem 1.6rem', fontSize: '1rem' }}
              >
                <span>Create Your Free Vault</span>
                <ArrowRight size={16} />
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => openAuth('login')}
                style={{ padding: '0.75rem 1.4rem', fontSize: '1rem' }}
              >
                <span>Sign In to Vault</span>
              </button>
            </div>
          </header>

          {/* Interactive Feature Cards */}
          <section className="overview-modules-grid" style={{ marginTop: '3rem' }}>
            <div className="overview-module-card vault-card-theme" onClick={() => openAuth('register')}>
              <div className="overview-card-header">
                <div className="overview-icon-box vault-icon-box">
                  <KeyRound size={22} />
                </div>
                <Lock size={18} color="#a855f7" />
              </div>
              <h3 className="overview-card-title">Password &amp; Credential Vault</h3>
              <p className="overview-card-desc">
                Safely organize web logins, account passwords, and sensitive credentials with complete privacy.
              </p>
              <div className="overview-card-footer">
                <span>Explore Vault</span>
                <ArrowRight size={15} />
              </div>
            </div>

            <div className="overview-module-card dates-card-theme" onClick={() => openAuth('register')}>
              <div className="overview-card-header">
                <div className="overview-icon-box dates-icon-box">
                  <Calendar size={22} />
                </div>
                <CheckCircle2 size={18} color="#f43f5e" />
              </div>
              <h3 className="overview-card-title">Important Dates &amp; Milestones</h3>
              <p className="overview-card-desc">
                Automated countdowns for passports, driver licenses, warranties, and anniversaries before they expire.
              </p>
              <div className="overview-card-footer">
                <span>Explore Dates</span>
                <ArrowRight size={15} />
              </div>
            </div>

            <div className="overview-module-card reminders-card-theme" onClick={() => openAuth('register')}>
              <div className="overview-card-header">
                <div className="overview-icon-box reminders-icon-box">
                  <Bell size={22} />
                </div>
                <CheckCircle2 size={18} color="#f59e0b" />
              </div>
              <h3 className="overview-card-title">Time-Sensitive Reminders</h3>
              <p className="overview-card-desc">
                Normalized UTC scheduling, status lifecycle tracking, and custom snooze intervals for priority tasks.
              </p>
              <div className="overview-card-footer">
                <span>Explore Reminders</span>
                <ArrowRight size={15} />
              </div>
            </div>

            <div className="overview-module-card notes-card-theme" onClick={() => openAuth('register')}>
              <div className="overview-card-header">
                <div className="overview-icon-box notes-icon-box">
                  <FileText size={22} />
                </div>
                <CheckCircle2 size={18} color="#10b981" />
              </div>
              <h3 className="overview-card-title">Private Encrypted Notes</h3>
              <p className="overview-card-desc">
                Fast, responsive markdown notes with color coding, pin priority, and strict user-scoped authorization.
              </p>
              <div className="overview-card-footer">
                <span>Explore Notes</span>
                <ArrowRight size={15} />
              </div>
            </div>
          </section>

          {/* Privacy & Isolation Highlight */}
          <section className="overview-security-card" style={{ marginTop: '2.5rem' }}>
            <div className="security-card-inner">
              <div className="security-card-left">
                <div className="security-shield-icon">
                  <Shield size={22} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>100% Private &amp; Protected</h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Your account is completely private. Your saved passwords, dates, reminders, and notes can only be viewed by you.
                  </p>
                </div>
              </div>
              <div className="security-badges-row">
                <span className="security-pill">Private Account</span>
                <span className="security-pill">Secure Login</span>
                <span className="security-pill">4-Digit PIN Access</span>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* Clean Application Footer */}
      <footer className="app-footer">
        <div>
          <span>&copy; {new Date().getFullYear()} RemiVault. All personal user data is strictly encrypted and isolated.</span>
        </div>
        {isAdmin && (
          <div className="footer-links">
            <button 
              className="footer-btn-link"
              onClick={handleOpenAdmin}
              title="Open Super Admin Console (Master PIN Protected)"
            >
              <ShieldCheck size={14} />
              <span>Admin Console (Master PIN)</span>
            </button>
          </div>
        )}
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Settings Modal (Theme preferences, PIN/Password & Help) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vaultCount={counts.vault}
        datesCount={counts.dates}
        remindersCount={counts.reminders}
        notesCount={counts.notes}
      />

      {/* Set Profile PIN Modal (Prompted after login if PIN not yet set) */}
      <SetProfilePinModal
        isOpen={isPendingPinSetup}
        profile={activeProfile}
        onSavePin={setupPin}
        onSkip={dismissPinSetup}
      />

      {/* Logout / Lock Profile Confirmation Modal */}
      {isLogoutPromptOpen && (
        <div className="modal-backdrop session-modal-backdrop" onClick={() => setIsLogoutPromptOpen(false)} style={{ zIndex: 1100 }}>
          <div 
            className="modal-content session-modal-sheet" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Top Header */}
            <div className="session-sheet-header">
              <div className="session-sheet-brand">
                <Shield size={15} className="session-sheet-shield" />
                <span>Security &amp; Session</span>
              </div>
              <button 
                type="button" 
                className="session-sheet-close"
                onClick={() => setIsLogoutPromptOpen(false)}
                aria-label="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* User Identity Capsule */}
            {user && (
              <div className="session-user-capsule">
                <div className="session-avatar-wrap">
                  <UserAvatar
                    size={46}
                    name={user.name}
                    email={user.email}
                    photoUrl={activeProfile?.photoUrl || user.avatar_url}
                    bgColor={activeProfile?.avatarBg || 'var(--primary-gradient)'}
                    className="session-avatar"
                  />
                  <span className="session-status-dot" title="Active Protected Session" />
                </div>
                <div className="session-user-info">
                  <div className="session-user-name-row">
                    <span className="session-user-name">{user.name}</span>
                    <span className="session-user-badge">Active</span>
                  </div>
                  <span className="session-user-email">{user.email}</span>
                </div>
              </div>
            )}

            {/* Prompt Heading */}
            <div className="session-prompt-text">
              <h3 className="session-prompt-title">Sign Out or Lock Profile?</h3>
              <p className="session-prompt-subtitle">
                Choose how you want to manage this encrypted profile on this device.
              </p>
            </div>

            {/* Interactive Choice Cards */}
            <div className="session-options-list">
              {/* Option 1: Lock Profile (Recommended) */}
              <button
                type="button"
                className="session-option-card recommend"
                onClick={() => {
                  setIsLogoutPromptOpen(false);
                  logout(false);
                }}
              >
                <div className="session-option-icon lock-icon-wrap">
                  <Lock size={19} />
                </div>
                <div className="session-option-body">
                  <div className="session-option-title-row">
                    <span className="session-option-title">Lock Profile</span>
                    <span className="session-recommend-pill">✦ Quick Access</span>
                  </div>
                  <p className="session-option-desc">
                    Keeps data encrypted on this browser. Quickly unlock anytime with your 4-digit PIN.
                  </p>
                </div>
                <ChevronRight size={18} className="session-option-arrow" />
              </button>

              {/* Option 2: Sign Out & Remove Account */}
              <button
                type="button"
                className="session-option-card danger"
                onClick={() => {
                  setIsLogoutPromptOpen(false);
                  logout(true);
                }}
              >
                <div className="session-option-icon remove-icon-wrap">
                  <Trash2 size={18} />
                </div>
                <div className="session-option-body">
                  <div className="session-option-title-row">
                    <span className="session-option-title">Sign Out &amp; Remove</span>
                  </div>
                  <p className="session-option-desc">
                    Purges local session keys and cached profile from this browser. Full login required.
                  </p>
                </div>
                <ChevronRight size={18} className="session-option-arrow" />
              </button>
            </div>

            {/* Footer Dismiss Button */}
            <div className="session-sheet-footer">
              <button
                type="button"
                className="session-cancel-btn"
                onClick={() => setIsLogoutPromptOpen(false)}
              >
                Keep Session Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Console & Master PIN Verification (Strictly for super admin) */}
      {isAdmin && (
        <>
          <AdminPinModal
            isOpen={isAdminPinModalOpen}
            onClose={lockAdminConsole}
            onPinVerified={() => {
              setIsAdminUnlocked(true);
              setIsAdminPinModalOpen(false);
              setIsAdminPanelOpen(true);
            }}
          />
          {isAdminUnlocked && (
            <AdminPanelModal
              isOpen={isAdminPanelOpen}
              onClose={lockAdminConsole}
              onLockAdmin={lockAdminConsole}
            />
          )}
        </>
      )}

      {/* Foreground Real-Time In-App Alert Toast */}
      <NotificationToast toast={activeToast} onDismiss={dismissToast} />

      {/* Friendly Notification Permission Flow Modal */}
      <NotificationPromptModal
        isOpen={isNotifPromptOpen}
        onClose={() => setIsNotifPromptOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <PreloadDataProvider>
          <RemiVaultApp />
        </PreloadDataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
