import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Bell, 
  Calendar, 
  FileText, 
  KeyRound,
  LogOut,
  LayoutDashboard,
  Terminal,
  ArrowRight,
  Lock,
  Sparkles,
  Settings,
  Trash2,
  X,
  ChevronRight
} from 'lucide-react';
import { checkBackendHealth, getStoredToken } from './services/api';
import type { HealthResponse } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthModal } from './components/auth/AuthModal';
import { SetProfilePinModal } from './components/auth/SetProfilePinModal';
import { ProfileLockScreen } from './components/auth/ProfileLockScreen';
import { SettingsModal } from './components/settings/SettingsModal';
import { UserAvatar } from './components/common/UserAvatar';
import { NotesSection } from './components/notes/NotesSection';
import { RemindersSection } from './components/reminders/RemindersSection';
import { ImportantDatesSection } from './components/importantDates/ImportantDatesSection';
import { VaultSection } from './components/vault/VaultSection';
import { UserOverview } from './components/dashboard/UserOverview';
import { AdminDiagnosticsModal } from './components/admin/AdminDiagnosticsModal';
import { isSuperAdmin } from './utils/admin';
import { fetchVaultEntriesApi } from './services/vault';
import { fetchImportantDatesApi } from './services/importantDates';
import { fetchRemindersApi } from './services/reminders';
import { fetchNotesApi } from './services/notes';
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
  
  // Health & Diagnostics state (Kept for Admin diagnostics modal)
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isAdminDiagOpen, setIsAdminDiagOpen] = useState<boolean>(false);

  // Super Admin Authorization
  const isAdmin = isSuperAdmin(user?.email);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // Sign out confirmation sheet/modal
  const [isLogoutPromptOpen, setIsLogoutPromptOpen] = useState<boolean>(false);

  // Settings Modal State (Accessible after sign-in)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active Workspace Tab
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('overview');

  // Dashboard Summary Metrics
  const [vaultCount, setVaultCount] = useState<number>(0);
  const [datesCount, setDatesCount] = useState<number>(0);
  const [remindersCount, setRemindersCount] = useState<number>(0);
  const [notesCount, setNotesCount] = useState<number>(0);
  const [urgentDatesCount, setUrgentDatesCount] = useState<number>(0);
  const [upcomingRemindersCount, setUpcomingRemindersCount] = useState<number>(0);

  const fetchStatus = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(null);
    const start = performance.now();

    try {
      const data = await checkBackendHealth();
      const end = performance.now();
      setHealth(data);
      setLatency(Math.round(end - start));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setHealthError(e?.message || 'Failed to connect to RemiVault backend API.');
      setHealth(null);
      setLatency(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Fetch summary counts for the user dashboard
  const loadDashboardSummary = useCallback(async () => {
    if (!user) return;
    try {
      const [vaultData, datesData, remindersData, notesData] = await Promise.allSettled([
        fetchVaultEntriesApi(),
        fetchImportantDatesApi(),
        fetchRemindersApi(),
        fetchNotesApi(),
      ]);

      if (vaultData.status === 'fulfilled') {
        setVaultCount(vaultData.value.counts.total);
      }
      if (datesData.status === 'fulfilled') {
        setDatesCount(datesData.value.counts.total);
        setUrgentDatesCount(datesData.value.counts.urgent);
      }
      if (remindersData.status === 'fulfilled') {
        setRemindersCount(remindersData.value.counts.total);
        setUpcomingRemindersCount(remindersData.value.counts.upcoming);
      }
      if (notesData.status === 'fulfilled') {
        setNotesCount(notesData.value.length);
      }
    } catch {
      // Quiet fallback
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (user) {
      loadDashboardSummary();
    }
  }, [user, loadDashboardSummary]);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const storedToken = getStoredToken();
  const maskedToken = storedToken 
    ? `${storedToken.substring(0, 4)}...${storedToken.substring(storedToken.length - 4)}`
    : null;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <nav className={`navbar ${isLocked ? 'navbar-locked' : ''}`}>
        <div className="navbar-brand-row">
          <div className="brand" onClick={() => setWorkspaceTab('overview')} style={{ cursor: 'pointer' }}>
            <div className="brand-icon">
              <Shield size={24} />
            </div>
            <span className="brand-name">RemiVault</span>
            <span className="brand-version">v0.2.0</span>
          </div>

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
                className="badge badge-primary user-nav-badge"
                onClick={() => setIsSettingsOpen(true)}
                title="Account Settings & Preferences"
                style={{ cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <UserAvatar
                  size={20}
                  name={user.name}
                  email={user.email}
                  photoUrl={activeProfile?.photoUrl || user.avatar_url}
                  style={{ borderRadius: '50%', flexShrink: 0 }}
                  fontSize="0.65rem"
                />
                <span className="user-nav-name">{user.name}</span>
              </button>
              <button 
                type="button"
                className="btn btn-secondary nav-lock-btn" 
                onClick={lockApp}
                title="Lock Vault (Quick PIN Access)"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Lock size={14} />
                <span>Lock</span>
              </button>
              <button 
                className="btn btn-secondary nav-settings-btn" 
                onClick={() => setIsSettingsOpen(true)}
                title="Settings & Appearance"
              >
                <Settings size={14} />
                <span>Settings</span>
              </button>
              <button 
                className="btn btn-secondary nav-logout-btn" 
                onClick={() => setIsLogoutPromptOpen(true)}
                title="Sign Out or Switch Account"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
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
              vaultCount={vaultCount}
              datesCount={datesCount}
              remindersCount={remindersCount}
              notesCount={notesCount}
              urgentDatesCount={urgentDatesCount}
              upcomingRemindersCount={upcomingRemindersCount}
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
              onClick={() => setIsAdminDiagOpen(true)}
              title="Open internal infrastructure & API telemetry (Admin only)"
            >
              <Terminal size={14} />
              <span>System Diagnostics (Admin)</span>
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
        vaultCount={vaultCount}
        datesCount={datesCount}
        remindersCount={remindersCount}
        notesCount={notesCount}
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

      {/* Admin / System Diagnostics Modal (Accessible strictly to admin user) */}
      {isAdmin && (
        <AdminDiagnosticsModal
          isOpen={isAdminDiagOpen}
          onClose={() => setIsAdminDiagOpen(false)}
          health={health}
          loading={healthLoading}
          fetchStatus={fetchStatus}
          latency={latency}
          error={healthError}
          user={user}
          maskedToken={maskedToken}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <RemiVaultApp />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
