import React from 'react';
import { 
  X, 
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
  Terminal,
  ShieldCheck,
  Activity
} from 'lucide-react';
import type { HealthResponse, User } from '../../services/api';

interface AdminDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  health: HealthResponse | null;
  loading: boolean;
  fetchStatus: () => void;
  latency: number | null;
  error: string | null;
  user: User | null;
  maskedToken: string | null;
}

export const AdminDiagnosticsModal: React.FC<AdminDiagnosticsModalProps> = ({
  isOpen,
  onClose,
  health,
  loading,
  fetchStatus,
  latency,
  error,
  user,
  maskedToken,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content admin-diag-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '780px', width: '95vw', maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                System &amp; Infrastructure Diagnostics
                <span className="badge badge-primary" style={{ fontSize: '0.72rem' }}>Admin / Dev Preview</span>
              </h2>
              <p className="modal-subtitle">
                Internal telemetry, API health checks, database connections, and architecture roadmap.
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close diagnostics">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '0.25rem' }}>
          
          {/* Live Telemetry Grid */}
          <div className="status-grid" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="card-header" style={{ marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
                  <Server size={18} color="#818cf8" />
                  Live Infrastructure Telemetry
                </h3>
                <button 
                  className="btn btn-secondary" 
                  onClick={fetchStatus} 
                  disabled={loading}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <RefreshCw size={13} className={loading ? 'spin' : ''} />
                  {loading ? 'Pinging...' : 'Ping API'}
                </button>
              </div>

              <div className="status-items">
                <div className="status-row">
                  <span className="status-label">
                    <Cpu size={15} />
                    Frontend SPA
                  </span>
                  <span className="status-value badge badge-primary" style={{ fontSize: '0.8rem' }}>
                    React 19 + TypeScript (Vite)
                  </span>
                </div>

                <div className="status-row">
                  <span className="status-label">
                    <Server size={15} />
                    Backend REST API
                  </span>
                  <span className="status-value" style={{ fontSize: '0.85rem' }}>
                    {health ? `${health.application} (${health.environment})` : 'Connecting...'}
                  </span>
                </div>

                <div className="status-row">
                  <span className="status-label">
                    <Database size={15} />
                    Database (MySQL/MariaDB)
                  </span>
                  <span className="status-value">
                    {health?.database === 'connected' ? (
                      <span className="badge badge-success" style={{ fontSize: '0.78rem' }}>
                        <CheckCircle2 size={13} /> Connected (remivault_dev)
                      </span>
                    ) : (
                      <span className="badge badge-danger" style={{ fontSize: '0.78rem' }}>
                        <AlertCircle size={13} /> {health?.database || 'Disconnected'}
                      </span>
                    )}
                  </span>
                </div>

                <div className="status-row">
                  <span className="status-label">
                    <Activity size={15} />
                    API Round-Trip Latency
                  </span>
                  <span className="status-value" style={{ color: '#38bdf8', fontSize: '0.85rem' }}>
                    {latency !== null ? `${latency} ms` : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Live HTTP Payload Viewer */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem' }}>
                <h3 className="card-title" style={{ fontSize: '1.05rem' }}>
                  <ShieldCheck size={18} color="#34d399" />
                  Authenticated Session &amp; Health Payload
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Raw JSON Response</span>
              </div>

              <pre className="payload-viewer" style={{ fontSize: '0.78rem', maxHeight: '160px' }}>
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
          </div>

          {/* Roadmap Modules Grid */}
          <div className="roadmap-section" style={{ gap: '1rem' }}>
            <div className="section-header">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Architecture Blueprint &amp; Verified Modules</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Security implementations and modular verification status for developer reference.
              </p>
            </div>

            <div className="modules-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem' }}>
              <div className="card module-card" style={{ padding: '1rem' }}>
                <div className="module-icon-wrap" style={{ color: '#818cf8', width: '36px', height: '36px' }}>
                  <Server size={18} />
                </div>
                <h4 className="module-title" style={{ fontSize: '0.95rem' }}>Stage 1: Foundation</h4>
                <p className="module-desc" style={{ fontSize: '0.8rem' }}>Decoupled React SPA, Laravel REST API, MySQL database, and CORS proxy.</p>
                <div className="module-status" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={13} /> Completed
                </div>
              </div>

              <div className="card module-card active-stage" style={{ padding: '1rem' }}>
                <div className="module-icon-wrap" style={{ color: '#38bdf8', width: '36px', height: '36px' }}>
                  <Lock size={18} />
                </div>
                <h4 className="module-title" style={{ fontSize: '0.95rem' }}>Stage 2: Auth</h4>
                <p className="module-desc" style={{ fontSize: '0.8rem' }}>User Registration, Bcrypt hashing, and Sanctum Bearer tokens.</p>
                <div className="module-status" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={13} /> Completed &amp; Verified
                </div>
              </div>

              <div className="card module-card active-stage" style={{ padding: '1rem' }}>
                <div className="module-icon-wrap" style={{ color: '#34d399', width: '36px', height: '36px' }}>
                  <FileText size={18} />
                </div>
                <h4 className="module-title" style={{ fontSize: '0.95rem' }}>Stage 3 &amp; 4: Notes</h4>
                <p className="module-desc" style={{ fontSize: '0.8rem' }}>Personal notes CRUD, Eloquent relationship scoping, and IDOR protection.</p>
                <div className="module-status" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={13} /> Completed &amp; Verified
                </div>
              </div>

              <div className="card module-card active-stage" style={{ padding: '1rem' }}>
                <div className="module-icon-wrap" style={{ color: '#f59e0b', width: '36px', height: '36px' }}>
                  <Bell size={18} />
                </div>
                <h4 className="module-title" style={{ fontSize: '0.95rem' }}>Stage 5: Reminders</h4>
                <p className="module-desc" style={{ fontSize: '0.8rem' }}>Time-sensitive reminders, UTC normalization, and snooze controls.</p>
                <div className="module-status" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={13} /> Completed &amp; Verified
                </div>
              </div>

              <div className="card module-card active-stage" style={{ padding: '1rem' }}>
                <div className="module-icon-wrap" style={{ color: '#f43f5e', width: '36px', height: '36px' }}>
                  <Calendar size={18} />
                </div>
                <h4 className="module-title" style={{ fontSize: '0.95rem' }}>Stage 6: Important Dates</h4>
                <p className="module-desc" style={{ fontSize: '0.8rem' }}>Passports, licenses, recurring cycles, and automated countdowns.</p>
                <div className="module-status" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={13} /> Completed &amp; Verified
                </div>
              </div>

              <div className="card module-card active-stage" style={{ padding: '1rem' }}>
                <div className="module-icon-wrap" style={{ color: '#a855f7', width: '36px', height: '36px' }}>
                  <KeyRound size={18} />
                </div>
                <h4 className="module-title" style={{ fontSize: '0.95rem' }}>Stage 7: Vault</h4>
                <p className="module-desc" style={{ fontSize: '0.8rem' }}>AES-256-GCM symmetric encryption and zero-plaintext credential vault.</p>
                <div className="module-status" style={{ fontSize: '0.72rem' }}>
                  <CheckCircle2 size={13} /> Completed &amp; Verified
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
