import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Server, 
  Database, 
  Cpu, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Lock, 
  Bell, 
  Calendar, 
  FileText, 
  KeyRound,
  ArrowRight,
  LogOut,
  UserCheck,
  Fingerprint
} from 'lucide-react';
import { checkBackendHealth, getStoredToken } from './services/api';
import type { HealthResponse } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './components/auth/AuthModal';
import { NotesSection } from './components/notes/NotesSection';
import './App.css';

const RemiVaultDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    const start = performance.now();

    try {
      const data = await checkBackendHealth();
      const end = performance.now();
      setHealth(data);
      setLatency(Math.round(end - start));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to connect to RemiVault backend API.');
      setHealth(null);
      setLatency(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

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
        <div className="brand">
          <div className="brand-icon">
            <Shield size={24} />
          </div>
          <span className="brand-name">RemiVault</span>
          <span className="brand-version">v0.2.0-dev</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className={`badge ${health?.status === 'ok' ? 'badge-success' : 'badge-danger'}`}>
            <span className={`pulse-dot ${health?.status === 'ok' ? 'online' : 'offline'}`}></span>
            {health?.status === 'ok' ? 'System Online' : 'System Offline'}
          </span>

          {/* User Auth Buttons or Profile Menu */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="badge badge-primary" style={{ padding: '0.4rem 0.8rem', gap: '0.5rem' }}>
                <UserCheck size={14} />
                <span>{user.name}</span>
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={logout}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                title="Sign Out"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => openAuth('login')}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                Sign In
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => openAuth('register')}
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Authenticated User Session Banner */}
      {user && (
        <section className="user-profile-card">
          <div className="user-info-group">
            <div className="user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <h3 className="user-name">{user.name}</h3>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  Authenticated (User #{user.id})
                </span>
              </div>
              <span className="user-email-tag">{user.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', textAlign: 'right' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
              <Fingerprint size={16} color="#818cf8" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Sanctum Bearer Token:</span>
              <code style={{ fontSize: '0.82rem', color: '#38bdf8', background: 'rgba(0,0,0,0.3)', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                {maskedToken}
              </code>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              All subsequent requests to Notes, Reminders &amp; Vault are strictly authorized to User #{user.id}.
            </span>
          </div>
        </section>
      )}

      {/* Main Feature: Personal Notes (Available for Authenticated Users) */}
      {user && <NotesSection />}

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-pill">
          <Lock size={14} />
          Stages 3 &amp; 4: User Data Architecture &amp; Notes Active
        </div>
        <h1 className="hero-title">
          Secure Personal Productivity &amp; <span>Vault Management</span>
        </h1>
        <p className="hero-subtitle">
          RemiVault isolates and safeguards your personal reminders, critical dates, notes, and sensitive credentials using rigorous authorization and modern cryptography.
        </p>
      </header>

      {/* System Health & Architecture Telemetry */}
      <section className="status-grid">
        {/* Connection Status Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <Server size={20} color="#818cf8" />
              Live Infrastructure Telemetry
            </h2>
            <button 
              className="btn btn-secondary" 
              onClick={fetchStatus} 
              disabled={loading}
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              {loading ? 'Pinging...' : 'Ping API'}
            </button>
          </div>

          <div className="status-items">
            <div className="status-row">
              <span className="status-label">
                <Cpu size={16} />
                Frontend SPA
              </span>
              <span className="status-value badge badge-primary">
                React 19 + TypeScript (Vite)
              </span>
            </div>

            <div className="status-row">
              <span className="status-label">
                <Server size={16} />
                Backend REST API
              </span>
              <span className="status-value">
                {health ? `${health.application} (${health.environment})` : 'Connecting...'}
              </span>
            </div>

            <div className="status-row">
              <span className="status-label">
                <Database size={16} />
                Database (MySQL/MariaDB)
              </span>
              <span className="status-value">
                {health?.database === 'connected' ? (
                  <span className="badge badge-success">
                    <CheckCircle2 size={13} /> Connected (remivault_dev)
                  </span>
                ) : (
                  <span className="badge badge-danger">
                    <AlertCircle size={13} /> {health?.database || 'Disconnected'}
                  </span>
                )}
              </span>
            </div>

            <div className="status-row">
              <span className="status-label">
                <RefreshCw size={16} />
                API Round-Trip Latency
              </span>
              <span className="status-value" style={{ color: '#38bdf8' }}>
                {latency !== null ? `${latency} ms` : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Live HTTP Payload Viewer */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <CheckCircle2 size={20} color="#34d399" />
              Authentication &amp; Health Telemetry
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live State</span>
          </div>

          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
            {user ? `Active session for ${user.email} verified with Laravel Sanctum:` : 'Infrastructure health payload:'}
          </p>

          <pre className="payload-viewer">
            {user ? (
              JSON.stringify({
                auth_status: 'authenticated',
                user: user,
                token_preview: maskedToken,
                session_type: 'Sanctum Bearer Token',
                database_collation: 'utf8mb4_unicode_ci',
              }, null, 2)
            ) : error ? (
              <span style={{ color: '#fb7185' }}>Error: {error}</span>
            ) : health ? (
              JSON.stringify(health, null, 2)
            ) : (
              'Waiting for response...'
            )}
          </pre>
        </div>
      </section>

      {/* Roadmap Modules Grid */}
      <section className="roadmap-section">
        <div className="section-header">
          <h2 className="section-title">Application Blueprint &amp; Roadmap</h2>
          <p className="section-desc">Each module is isolated by user ownership and protected by strict authorization policies.</p>
        </div>

        <div className="modules-grid">
          <div className="card module-card">
            <div className="module-icon-wrap" style={{ color: '#818cf8' }}>
              <Server size={22} />
            </div>
            <h3 className="module-title">Stage 1: Foundation</h3>
            <p className="module-desc">Decoupled React SPA, Laravel REST API, MySQL database, Git hygiene, and CORS.</p>
            <div className="module-status">
              <CheckCircle2 size={14} /> Completed
            </div>
          </div>

          <div className="card module-card active-stage">
            <div className="module-icon-wrap" style={{ color: '#38bdf8' }}>
              <Lock size={22} />
            </div>
            <h3 className="module-title">Stage 2: Authentication</h3>
            <p className="module-desc">User Registration, Login, Logout, Bcrypt password hashing, Sanctum Bearer tokens.</p>
            <div className="module-status">
              <CheckCircle2 size={14} /> Completed &amp; Verified
            </div>
          </div>

          <div className="card module-card active-stage">
            <div className="module-icon-wrap" style={{ color: '#34d399' }}>
              <FileText size={22} />
            </div>
            <h3 className="module-title">Stages 3 &amp; 4: Notes</h3>
            <p className="module-desc">Personal notes CRUD, Eloquent relationship scoping, and IDOR/BOLA authorization.</p>
            <div className="module-status">
              <CheckCircle2 size={14} /> Completed &amp; Verified
            </div>
          </div>

          <div className="card module-card">
            <div className="module-icon-wrap" style={{ color: '#f59e0b' }}>
              <Bell size={22} />
            </div>
            <h3 className="module-title">Stage 5: Reminders</h3>
            <p className="module-desc">Time-sensitive reminders, status tracking, UTC normalization, background scheduling.</p>
            <div className="module-status" style={{ color: '#f59e0b' }}>
              <ArrowRight size={14} /> Up Next
            </div>
          </div>

          <div className="card module-card">
            <div className="module-icon-wrap" style={{ color: '#f43f5e' }}>
              <Calendar size={22} />
            </div>
            <h3 className="module-title">Stage 6: Important Dates</h3>
            <p className="module-desc">Passports, anniversaries, warranties, recurring cycles, countdown calculations.</p>
            <div className="module-status">Planned</div>
          </div>

          <div className="card module-card">
            <div className="module-icon-wrap" style={{ color: '#a855f7' }}>
              <KeyRound size={22} />
            </div>
            <h3 className="module-title">Stage 7: Password Vault</h3>
            <p className="module-desc">AES-256-GCM symmetric encryption, zero-plaintext storage, secure key derivation.</p>
            <div className="module-status">Planned</div>
          </div>
        </div>
      </section>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <RemiVaultDashboard />
    </AuthProvider>
  );
};

export default App;
