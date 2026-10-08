import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  X, 
  Users, 
  Clock, 
  Activity, 
  Server, 
  ShieldCheck, 
  Search, 
  RefreshCw, 
  Lock, 
  Database, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  KeyRound,
  FileText,
  Bell,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { 
  fetchAdminOverviewApi, 
  fetchAdminUsersApi, 
  fetchAdminFeedbackApi,
  updateAdminFeedbackStatusApi,
  changeAdminPinApi,
  type AdminOverviewResponse, 
  type AdminUserMetric, 
  type AdminFeedbackItem 
} from '../../services/api';
import { UserAvatar } from '../common/UserAvatar';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLockAdmin: () => void;
}

type AdminTab = 'users' | 'telemetry' | 'feedback' | 'pin';

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  onLockAdmin,
}) => {
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [users, setUsers] = useState<AdminUserMetric[]>([]);
  const [feedbacks, setFeedbacks] = useState<AdminFeedbackItem[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCloseAndLock = useCallback(() => {
    onLockAdmin();
    if (onClose) onClose();
  }, [onLockAdmin, onClose]);

  // Auto-lock admin panel immediately when window/tab loses focus or user switches away
  useEffect(() => {
    if (!isOpen) return;

    const handleBlurOrHide = () => {
      handleCloseAndLock();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleCloseAndLock();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseAndLock();
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // If focus moved to an element outside the modal, lock immediately
      if (
        modalContentRef.current && 
        e.relatedTarget && 
        !modalContentRef.current.contains(e.relatedTarget as Node)
      ) {
        handleCloseAndLock();
      }
    };

    window.addEventListener('blur', handleBlurOrHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('blur', handleBlurOrHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isOpen, handleCloseAndLock]);

  // Status update indicator for feedback
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<number | null>(null);

  // Change Master PIN state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showPins, setShowPins] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);

  const loadData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const [overviewRes, usersRes, feedbackRes] = await Promise.all([
        fetchAdminOverviewApi(),
        fetchAdminUsersApi(),
        fetchAdminFeedbackApi(),
      ]);

      setOverview(overviewRes);
      setUsers(usersRes.users);
      setFeedbacks(feedbackRes.feedbacks);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to load administrative telemetry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Filter users based on search
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase().trim();
    return users.filter(u => 
      u.name.toLowerCase().includes(q) || 
      u.email.toLowerCase().includes(q)
    );
  }, [users, searchQuery]);

  const handleFeedbackStatusChange = async (
    id: number, 
    newStatus: 'new' | 'in_progress' | 'reviewed' | 'resolved'
  ) => {
    setUpdatingFeedbackId(id);
    try {
      const res = await updateAdminFeedbackStatusApi(id, newStatus);
      setFeedbacks(prev => prev.map(f => f.id === id ? res.feedback : f));
    } catch (err) {
      console.error('Failed to update feedback status:', err);
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  const handlePinChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(null);

    if (currentPin.length !== 4 || newPin.length !== 4 || confirmNewPin.length !== 4) {
      setPinChangeError('All PIN fields must contain exactly 4 numeric digits.');
      return;
    }

    if (newPin !== confirmNewPin) {
      setPinChangeError('New PIN and confirmation PIN do not match.');
      return;
    }

    if (currentPin === newPin) {
      setPinChangeError('The new PIN must be different from your current PIN.');
      return;
    }

    setIsChangingPin(true);
    try {
      const res = await changeAdminPinApi({
        current_pin: currentPin,
        new_pin: newPin,
        confirm_new_pin: confirmNewPin,
      });

      setPinChangeSuccess(res.message || 'Master Admin PIN successfully updated!');
      setCurrentPin('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPinChangeError(e?.message || 'Failed to change Master Admin PIN. Please verify your current PIN.');
    } finally {
      setIsChangingPin(false);
    }
  };

  const formatLastActive = (dateStr: string | null, isOnline: boolean) => {
    if (isOnline) return 'Active Now';
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onLockAdmin} style={{ zIndex: 1040 }}>
      <div 
        ref={modalContentRef}
        className="modal-content admin-panel-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="admin-modal-header">
          <div className="admin-header-brand-wrap">
            <div className="admin-header-icon-box">
              <ShieldCheck size={22} />
            </div>
            <div className="admin-header-text-group">
              <div className="admin-header-title-row">
                <h2 className="admin-header-title">
                  Super Admin Console
                </h2>
                <span className="badge admin-master-badge">
                  Master Console
                </span>
              </div>
              <p className="admin-header-subtitle">
                Live user usage tracking, telemetry &amp; security management.
              </p>
            </div>
          </div>

          <div className="admin-header-actions-wrap">
            <button
              type="button"
              className="btn btn-secondary admin-action-btn"
              onClick={() => loadData(true)}
              disabled={isRefreshing}
              title="Refresh live metrics"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
              <span className="btn-label-desktop">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              type="button"
              className="btn btn-secondary admin-action-btn admin-lock-btn"
              onClick={onLockAdmin}
              title="Lock Admin Console"
            >
              <Lock size={14} />
              <span className="btn-label-desktop">Lock</span>
            </button>

            <button 
              type="button"
              className="modal-close-btn admin-close-btn" 
              onClick={onLockAdmin} 
              title="Close &amp; Lock Admin Panel"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Error Alert if request failed */}
        {error && (
          <div className="admin-error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Global Summary KPI Metric Cards (Responsive Carousel / Grid) */}
        {overview && (
          <div className="admin-kpi-container">
            <div className="card admin-kpi-card kpi-users">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Registered Users</span>
                <Users size={15} />
              </div>
              <div className="admin-kpi-value">
                {overview.stats.total_users}
              </div>
              <div className="admin-kpi-subtext">
                <span className="kpi-online-num">{overview.stats.online_now}</span> online right now
              </div>
            </div>

            <div className="card admin-kpi-card kpi-active">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Active (24h)</span>
                <TrendingUp size={15} />
              </div>
              <div className="admin-kpi-value">
                {overview.stats.active_24h}
              </div>
              <div className="admin-kpi-subtext">
                Users active today
              </div>
            </div>

            <div className="card admin-kpi-card kpi-opens">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">App Opens</span>
                <Activity size={15} />
              </div>
              <div className="admin-kpi-value">
                {overview.stats.total_app_opens}
              </div>
              <div className="admin-kpi-subtext">
                Cumulative launch count
              </div>
            </div>

            <div className="card admin-kpi-card kpi-time">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Total Time Spent</span>
                <Clock size={15} />
              </div>
              <div className="admin-kpi-value">
                {overview.stats.formatted_total_time}
              </div>
              <div className="admin-kpi-subtext">
                Across all sessions
              </div>
            </div>

            <div className="card admin-kpi-card kpi-db">
              <div className="admin-kpi-top">
                <span className="admin-kpi-label">Database</span>
                <Database size={15} />
              </div>
              <div className="admin-kpi-value kpi-db-status">
                <CheckCircle2 size={16} />
                <span>Connected</span>
              </div>
              <div className="admin-kpi-subtext">
                Latency: <span className="kpi-latency">{overview.system.database.latency_ms ?? 0} ms</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation (Responsive Scrollable Pills) */}
        <div className="admin-tabs-nav">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={14} />
            <span>Users</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'telemetry' ? 'active' : ''}`}
            onClick={() => setActiveTab('telemetry')}
          >
            <Server size={14} />
            <span>System Health</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            <MessageSquare size={14} />
            <span>Feedbacks</span>
          </button>

          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'pin' ? 'active' : ''}`}
            onClick={() => setActiveTab('pin')}
          >
            <KeyRound size={14} />
            <span>Change PIN</span>
          </button>
        </div>

        {/* =========================================================================
            TAB 1: USERS USAGE & ENGAGEMENT (Responsive Table & Mobile Cards)
            ========================================================================= */}
        {activeTab === 'users' && (
          <div className="admin-tab-content-wrap">
            {/* Search Header */}
            <div className="admin-search-row">
              <div className="admin-search-box">
                <Search size={15} className="admin-search-icon" />
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="admin-search-input"
                />
                {searchQuery && (
                  <button 
                    type="button" 
                    className="admin-search-clear"
                    onClick={() => setSearchQuery('')}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              <div className="admin-search-count">
                Showing <strong>{filteredUsers.length}</strong> registered users
              </div>
            </div>

            {/* Content Container */}
            <div className="admin-users-scroll-area">
              {isLoading ? (
                <div className="admin-empty-state">
                  <RefreshCw size={24} className="spin admin-loader-icon" />
                  <p>Loading user metrics from database...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="admin-empty-state">
                  <Users size={32} style={{ opacity: 0.4 }} />
                  <p>No users found matching your search.</p>
                </div>
              ) : (
                <>
                  {/* Desktop Table View (>= 768px) */}
                  <div className="admin-desktop-table-wrap">
                    <table className="admin-desktop-table">
                      <thead>
                        <tr>
                          <th>User Identity</th>
                          <th>
                            <span className="th-icon-cell">
                              <Activity size={13} color="#f59e0b" />
                              App Opens
                            </span>
                          </th>
                          <th>
                            <span className="th-icon-cell">
                              <Clock size={13} color="#c084fc" />
                              Total Time Spent
                            </span>
                          </th>
                          <th>Status / Last Active</th>
                          <th>Stored Vault Items</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="admin-table-row">
                            <td>
                              <div className="admin-user-cell">
                                <div className="admin-avatar-wrap">
                                  <UserAvatar
                                    size={36}
                                    name={u.name}
                                    email={u.email}
                                    photoUrl={u.avatar_url}
                                    fontSize="0.75rem"
                                    style={{ borderRadius: '10px' }}
                                  />
                                  {u.is_online && <span className="admin-online-dot" title="Active right now" />}
                                </div>
                                <div>
                                  <div className="admin-user-name-row">
                                    <span className="admin-user-name">{u.name}</span>
                                    {u.has_security_pin && (
                                      <span title="PIN Protected" className="admin-user-pin-icon">
                                        <Lock size={12} />
                                      </span>
                                    )}
                                  </div>
                                  <div className="admin-user-email">{u.email}</div>
                                </div>
                              </div>
                            </td>

                            <td>
                              <div className="admin-metric-inline">
                                <span className="admin-opens-num">{u.app_opens}</span>
                                <span className={`badge admin-freq-badge ${u.app_opens > 20 ? 'power' : u.app_opens > 5 ? 'frequent' : 'occasional'}`}>
                                  {u.app_opens > 20 ? 'Power User' : u.app_opens > 5 ? 'Frequent' : 'Occasional'}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="admin-time-cell">
                                <span className="admin-time-val">{u.formatted_time_spent}</span>
                                <span className="admin-time-sec">({u.total_seconds_spent.toLocaleString()}s active)</span>
                              </div>
                            </td>

                            <td>
                              <div className="admin-status-cell">
                                <span className={`status-indicator-dot ${u.is_online ? 'online' : 'offline'}`} />
                                <span className={`status-text ${u.is_online ? 'online' : ''}`}>
                                  {formatLastActive(u.last_active_at, u.is_online)}
                                </span>
                              </div>
                            </td>

                            <td>
                              <div className="admin-resources-cell">
                                <span className="resource-pill" title={`Notes: ${u.resources_count.notes}`}>
                                  <FileText size={12} className="resource-icon note" />
                                  <span>{u.resources_count.notes}</span>
                                </span>
                                <span className="resource-pill" title={`Reminders: ${u.resources_count.reminders}`}>
                                  <Bell size={12} className="resource-icon reminder" />
                                  <span>{u.resources_count.reminders}</span>
                                </span>
                                <span className="resource-pill" title={`Vault Credentials: ${u.resources_count.vault}`}>
                                  <KeyRound size={12} className="resource-icon vault" />
                                  <span>{u.resources_count.vault}</span>
                                </span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards View (< 768px) */}
                  <div className="admin-mobile-cards-wrap">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="admin-mobile-card">
                        <div className="admin-card-header">
                          <div className="admin-card-user-info">
                            <div className="admin-avatar-wrap">
                              <UserAvatar
                                size={40}
                                name={u.name}
                                email={u.email}
                                photoUrl={u.avatar_url}
                                fontSize="0.75rem"
                                style={{ borderRadius: '10px' }}
                              />
                              {u.is_online && <span className="admin-online-dot" title="Active right now" />}
                            </div>
                            <div className="admin-card-user-text">
                              <div className="admin-user-name-row">
                                <strong className="admin-user-name">{u.name}</strong>
                                {u.has_security_pin && (
                                  <span title="PIN Protected" className="admin-user-pin-icon">
                                    <Lock size={12} />
                                  </span>
                                )}
                              </div>
                              <span className="admin-user-email">{u.email}</span>
                            </div>
                          </div>

                          <div className="admin-card-online-badge">
                            <span className={`status-indicator-dot ${u.is_online ? 'online' : 'offline'}`} />
                            <span className="status-text-mobile">
                              {formatLastActive(u.last_active_at, u.is_online)}
                            </span>
                          </div>
                        </div>

                        {/* 2-Column Metrics Bar */}
                        <div className="admin-card-metrics-grid">
                          <div className="admin-card-metric-col">
                            <span className="card-metric-title">
                              <Activity size={12} color="#f59e0b" />
                              App Opens
                            </span>
                            <div className="card-metric-val-row">
                              <span className="card-opens-count">{u.app_opens}</span>
                              <span className={`badge admin-freq-badge ${u.app_opens > 20 ? 'power' : u.app_opens > 5 ? 'frequent' : 'occasional'}`}>
                                {u.app_opens > 20 ? 'Power' : u.app_opens > 5 ? 'Frequent' : 'Normal'}
                              </span>
                            </div>
                          </div>

                          <div className="admin-card-metric-col">
                            <span className="card-metric-title">
                              <Clock size={12} color="#c084fc" />
                              Time Spent
                            </span>
                            <div className="card-metric-val-row">
                              <strong className="card-time-count">{u.formatted_time_spent}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Stored items summary */}
                        <div className="admin-card-footer">
                          <span className="admin-card-footer-label">Stored Items:</span>
                          <div className="admin-resources-cell">
                            <span className="resource-pill" title="Notes">
                              <FileText size={12} className="resource-icon note" />
                              <span>{u.resources_count.notes}</span>
                            </span>
                            <span className="resource-pill" title="Reminders">
                              <Bell size={12} className="resource-icon reminder" />
                              <span>{u.resources_count.reminders}</span>
                            </span>
                            <span className="resource-pill" title="Vault Credentials">
                              <KeyRound size={12} className="resource-icon vault" />
                              <span>{u.resources_count.vault}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: INFRASTRUCTURE TELEMETRY
            ========================================================================= */}
        {activeTab === 'telemetry' && overview && (
          <div className="admin-tab-scroll-pane">
            <div className="card telemetry-section-card">
              <h3 className="telemetry-card-title">
                <Server size={18} color="#818cf8" />
                <span>Backend Server Diagnostics</span>
              </h3>

              <div className="telemetry-grid">
                <div className="telemetry-row">
                  <span className="telemetry-label">Laravel Version:</span>
                  <strong className="telemetry-val">{overview.system.laravel_version}</strong>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">PHP Runtime:</span>
                  <strong className="telemetry-val">{overview.system.php_version}</strong>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Environment:</span>
                  <span className="badge badge-primary">{overview.system.app_env}</span>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Server Time (Kolkata):</span>
                  <strong className="telemetry-val-sm">{overview.system.server_time_kolkata}</strong>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Database Connection:</span>
                  <strong className="telemetry-val">{overview.system.database.connection} (MySQL)</strong>
                </div>

                <div className="telemetry-row">
                  <span className="telemetry-label">Memory Allocation:</span>
                  <strong className="telemetry-val text-primary-color">{overview.system.memory_usage_mb} MB</strong>
                </div>
              </div>
            </div>

            {/* Application Resource Distribution */}
            <div className="card telemetry-section-card">
              <h3 className="telemetry-card-title">
                <BarChart3 size={18} color="#10b981" />
                <span>Encrypted Vault Records Breakdown</span>
              </h3>

              <div className="resource-stats-grid">
                <div className="resource-stat-box">
                  <div className="res-stat-label">Vault Credentials</div>
                  <div className="res-stat-num">{overview.stats.resources.vault_entries}</div>
                </div>

                <div className="resource-stat-box">
                  <div className="res-stat-label">Personal Notes</div>
                  <div className="res-stat-num">{overview.stats.resources.notes}</div>
                </div>

                <div className="resource-stat-box">
                  <div className="res-stat-label">Reminders &amp; Tasks</div>
                  <div className="res-stat-num">{overview.stats.resources.reminders}</div>
                </div>

                <div className="resource-stat-box">
                  <div className="res-stat-label">Important Dates</div>
                  <div className="res-stat-num">{overview.stats.resources.dates}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 3: USER FEEDBACKS & BUG REPORTS
            ========================================================================= */}
        {activeTab === 'feedback' && (
          <div className="admin-tab-scroll-pane">
            {feedbacks.length === 0 ? (
              <div className="admin-empty-state">
                <MessageSquare size={32} style={{ opacity: 0.4 }} />
                <p>No user feedback or reports submitted yet.</p>
              </div>
            ) : (
              feedbacks.map((f) => {
                const badgeColor = 
                  f.type === 'bug' ? '#ef4444' : 
                  f.type === 'feature' ? '#8b5cf6' : '#10b981';
                
                return (
                  <div 
                    key={f.id} 
                    className="card admin-feedback-card"
                    style={{ borderLeftColor: badgeColor }}
                  >
                    <div className="feedback-card-header">
                      <div className="feedback-card-author">
                        <span 
                          className="badge feedback-type-badge" 
                          style={{ 
                            background: `${badgeColor}22`,
                            color: badgeColor,
                            borderColor: `${badgeColor}44`
                          }}
                        >
                          {f.type}
                        </span>
                        <strong className="feedback-author-name">{f.name}</strong>
                        <span className="feedback-author-email">({f.email})</span>
                      </div>

                      <div className="feedback-status-actions">
                        <span className="feedback-time">{f.submitted_at_kolkata}</span>
                        <select
                          value={f.status}
                          disabled={updatingFeedbackId === f.id}
                          onChange={(e) => handleFeedbackStatusChange(f.id, e.target.value as any)}
                          className="feedback-status-select"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="reviewed">Reviewed</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                    </div>

                    <p className="feedback-message-body">
                      {f.message}
                    </p>

                    {f.device_info && (
                      <div className="feedback-device-info">
                        <span>Device:</span>
                        <code>{f.device_info.slice(0, 90)}...</code>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: CHANGE MASTER ADMIN PIN (User Requested)
            ========================================================================= */}
        {activeTab === 'pin' && (
          <div className="admin-tab-scroll-pane">
            <div className="card admin-pin-change-card">
              <div className="pin-change-header">
                <div className="pin-change-icon-wrap">
                  <KeyRound size={22} color="#818cf8" />
                </div>
                <div>
                  <h3 className="pin-change-title">Change Master Admin PIN</h3>
                  <p className="pin-change-subtitle">
                    Update the 4-digit security PIN used to authenticate this Super Admin Console.
                  </p>
                </div>
              </div>

              {/* Informational Security Notice */}
              <div className="admin-security-notice">
                <ShieldAlert size={18} className="security-notice-icon" />
                <div className="security-notice-text">
                  <strong>Cryptographic Security (Bcrypt):</strong>
                  <p>
                    Your Master Admin PIN is salted and encrypted using one-way <strong>Bcrypt</strong> hashing. 
                    It is stored in the database cache and <em>never stored or transmitted in plain text</em>.
                  </p>
                </div>
              </div>

              {/* Error & Success Alerts */}
              {pinChangeError && (
                <div className="admin-error-banner">
                  <AlertCircle size={16} />
                  <span>{pinChangeError}</span>
                </div>
              )}

              {pinChangeSuccess && (
                <div className="admin-success-banner">
                  <CheckCircle2 size={16} />
                  <span>{pinChangeSuccess}</span>
                </div>
              )}

              <form onSubmit={handlePinChangeSubmit} className="admin-pin-form">
                <div className="admin-form-group">
                  <label className="admin-form-label">Current Master Admin PIN</label>
                  <div className="pin-input-wrap">
                    <input
                      type={showPins ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="admin-pin-input-field"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">New 4-Digit PIN</label>
                  <div className="pin-input-wrap">
                    <input
                      type={showPins ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="admin-pin-input-field"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="admin-form-label">Confirm New 4-Digit PIN</label>
                  <div className="pin-input-wrap">
                    <input
                      type={showPins ? 'text' : 'password'}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="admin-pin-input-field"
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                {/* Show/Hide PIN toggle */}
                <div className="pin-toggle-row">
                  <button
                    type="button"
                    onClick={() => setShowPins(!showPins)}
                    className="pin-toggle-btn"
                  >
                    {showPins ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{showPins ? 'Hide PIN Digits' : 'Show PIN Digits'}</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isChangingPin || currentPin.length !== 4 || newPin.length !== 4 || confirmNewPin.length !== 4}
                  className="btn btn-primary pin-submit-btn"
                >
                  {isChangingPin ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      <span>Updating Master PIN...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Save New Master Admin PIN</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
