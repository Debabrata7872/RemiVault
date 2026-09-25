import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Bell, 
  Calendar, 
  FileText, 
  KeyRound,
  LogOut,
  UserCheck,
  LayoutDashboard,
  Terminal,
  ArrowRight,
  Lock,
  Sparkles
} from 'lucide-react';
import { checkBackendHealth, getStoredToken } from './services/api';
import type { HealthResponse } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { NotesSection } from './components/notes/NotesSection';
import { RemindersSection } from './components/reminders/RemindersSection';
import { ImportantDatesSection } from './components/importantDates/ImportantDatesSection';
import { VaultSection } from './components/vault/VaultSection';
import { UserOverview } from './components/dashboard/UserOverview';
import { AdminDiagnosticsModal } from './components/admin/AdminDiagnosticsModal';
import { fetchVaultEntriesApi } from './services/vault';
import { fetchImportantDatesApi } from './services/importantDates';
import { fetchRemindersApi } from './services/reminders';
import { fetchNotesApi } from './services/notes';
import './App.css';

type WorkspaceTab = 'overview' | 'vault' | 'dates' | 'reminders' | 'notes';

const RemiVaultApp: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Health & Diagnostics state (Kept for Admin diagnostics modal)
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isAdminDiagOpen, setIsAdminDiagOpen] = useState<boolean>(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

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
      <nav className="navbar">
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
          {user ? (
            <div className="navbar-user-group">
              <div className="badge badge-primary user-nav-badge">
                <UserCheck size={14} />
                <span className="user-nav-name">{user.name}</span>
              </div>
              <button 
                className="btn btn-secondary nav-logout-btn" 
                onClick={logout}
                title="Sign Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </nav>

      {/* =========================================================================
          LOGGED IN USER EXPERIENCE
          ========================================================================= */}
      {user ? (
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
              <span>Zero-Knowledge Personal Productivity Sanctuary</span>
            </div>
            <h1 className="hero-title">
              Your Private Life, <span>Encrypted and Organized</span>
            </h1>
            <p className="hero-subtitle">
              RemiVault provides a secure, isolated space for your sensitive passwords, critical renewal dates, reminders, and private notes. Built with state-of-the-art cryptography.
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
                AES-256-GCM authenticated encryption for web logins, API tokens, and payment cards. Zero plaintext stored.
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
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>Multi-User Architecture &amp; Data Isolation</h4>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Every user account is cryptographically isolated. Your records, notes, and credentials cannot be seen by other users or unauthorized parties.
                  </p>
                </div>
              </div>
              <div className="security-badges-row">
                <span className="security-pill">Isolated Accounts</span>
                <span className="security-pill">Bcrypt &amp; Argon2id</span>
                <span className="security-pill">Sanctum Tokens</span>
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
        <div className="footer-links">
          <button 
            className="footer-btn-link"
            onClick={() => setIsAdminDiagOpen(true)}
            title="Open internal infrastructure & API telemetry"
          >
            <Terminal size={14} />
            <span>System Diagnostics (Admin)</span>
          </button>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Admin / System Diagnostics Modal (Kept safe for future Admin Panel) */}
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
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RemiVaultApp />
    </AuthProvider>
  );
};

export default App;
