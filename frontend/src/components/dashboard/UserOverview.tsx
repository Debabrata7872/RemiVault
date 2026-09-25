import React from 'react';
import { 
  KeyRound, 
  Calendar, 
  Bell, 
  FileText, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock
} from 'lucide-react';

interface UserOverviewProps {
  userName: string;
  onNavigate: (tab: 'vault' | 'dates' | 'reminders' | 'notes') => void;
  vaultCount?: number;
  datesCount?: number;
  remindersCount?: number;
  notesCount?: number;
  urgentDatesCount?: number;
  upcomingRemindersCount?: number;
}

export const UserOverview: React.FC<UserOverviewProps> = ({
  userName,
  onNavigate,
  vaultCount = 0,
  datesCount = 0,
  remindersCount = 0,
  notesCount = 0,
  urgentDatesCount = 0,
  upcomingRemindersCount = 0,
}) => {
  // Determine greeting based on current time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const hasUrgentItems = urgentDatesCount > 0 || upcomingRemindersCount > 0;

  return (
    <div className="user-overview-container">
      {/* Welcome Hero Banner */}
      <section className="overview-welcome-card">
        <div className="overview-welcome-content">
          <div className="overview-welcome-pill">
            <span className="overview-pulse-dot"></span>
            <span>Personal Vault Active</span>
          </div>
          <h2 className="overview-greeting">
            {getGreeting()}, <span className="overview-name-gradient">{userName}</span> 👋
          </h2>
          <p className="overview-subtitle">
            Your personal reminders, critical dates, passwords, and private notes are safely isolated and encrypted.
          </p>
        </div>
      </section>

      {/* 4 Interactive Hub Cards */}
      <div className="overview-modules-grid">
        {/* Password Vault Card */}
        <div 
          className="overview-module-card vault-card-theme"
          onClick={() => onNavigate('vault')}
          role="button"
          tabIndex={0}
        >
          <div className="overview-card-header">
            <div className="overview-icon-box vault-icon-box">
              <KeyRound size={22} />
            </div>
            <span className="overview-card-count">{vaultCount}</span>
          </div>
          <h3 className="overview-card-title">Password Vault</h3>
          <p className="overview-card-desc">
            Encrypted logins, API keys, and sensitive credentials with zero-plaintext storage.
          </p>
          <div className="overview-card-footer">
            <span>Open Vault</span>
            <ArrowRight size={15} />
          </div>
        </div>

        {/* Important Dates Card */}
        <div 
          className="overview-module-card dates-card-theme"
          onClick={() => onNavigate('dates')}
          role="button"
          tabIndex={0}
        >
          <div className="overview-card-header">
            <div className="overview-icon-box dates-icon-box">
              <Calendar size={22} />
            </div>
            <span className="overview-card-count">{datesCount}</span>
          </div>
          <h3 className="overview-card-title">Important Dates</h3>
          <p className="overview-card-desc">
            Passports, driver licenses, renewals, and anniversaries with automated countdowns.
          </p>
          <div className="overview-card-footer">
            <span>Track Milestones</span>
            <ArrowRight size={15} />
          </div>
        </div>

        {/* Reminders Card */}
        <div 
          className="overview-module-card reminders-card-theme"
          onClick={() => onNavigate('reminders')}
          role="button"
          tabIndex={0}
        >
          <div className="overview-card-header">
            <div className="overview-icon-box reminders-icon-box">
              <Bell size={22} />
            </div>
            <span className="overview-card-count">{remindersCount}</span>
          </div>
          <h3 className="overview-card-title">Time-Sensitive Reminders</h3>
          <p className="overview-card-desc">
            Stay on top of critical tasks with UTC normalized scheduling and snooze controls.
          </p>
          <div className="overview-card-footer">
            <span>View Alerts</span>
            <ArrowRight size={15} />
          </div>
        </div>

        {/* Personal Notes Card */}
        <div 
          className="overview-module-card notes-card-theme"
          onClick={() => onNavigate('notes')}
          role="button"
          tabIndex={0}
        >
          <div className="overview-card-header">
            <div className="overview-icon-box notes-icon-box">
              <FileText size={22} />
            </div>
            <span className="overview-card-count">{notesCount}</span>
          </div>
          <h3 className="overview-card-title">Personal Notes</h3>
          <p className="overview-card-desc">
            Quick, distraction-free markdown notes, pinned thoughts, and color-coded lists.
          </p>
          <div className="overview-card-footer">
            <span>Read Notes</span>
            <ArrowRight size={15} />
          </div>
        </div>
      </div>

      {/* Priority Focus Widget */}
      <section className="overview-priority-widget">
        <div className="priority-widget-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="priority-pulse-badge">
              <Clock size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0, fontWeight: 700 }}>Priority Status</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Items that require your immediate attention
              </p>
            </div>
          </div>

          <span className={`badge ${hasUrgentItems ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.78rem' }}>
            {hasUrgentItems ? 'Action Needed' : 'All Clear'}
          </span>
        </div>

        {hasUrgentItems ? (
          <div className="priority-items-list">
            {urgentDatesCount > 0 && (
              <div 
                className="priority-item urgent-date-item"
                onClick={() => onNavigate('dates')}
              >
                <AlertTriangle size={18} color="#f43f5e" />
                <div className="priority-item-info">
                  <span className="priority-item-title">
                    {urgentDatesCount} Important Date{urgentDatesCount > 1 ? 's' : ''} Expiring Soon
                  </span>
                  <span className="priority-item-sub">Passports or documents near expiration</span>
                </div>
                <button className="btn btn-secondary priority-item-btn">Review</button>
              </div>
            )}

            {upcomingRemindersCount > 0 && (
              <div 
                className="priority-item upcoming-alert-item"
                onClick={() => onNavigate('reminders')}
              >
                <Bell size={18} color="#f59e0b" />
                <div className="priority-item-info">
                  <span className="priority-item-title">
                    {upcomingRemindersCount} Active Alert{upcomingRemindersCount > 1 ? 's' : ''} Scheduled
                  </span>
                  <span className="priority-item-sub">Upcoming tasks and deadlines</span>
                </div>
                <button className="btn btn-secondary priority-item-btn">Open Alerts</button>
              </div>
            )}
          </div>
        ) : (
          <div className="priority-empty-state">
            <div className="priority-empty-icon">
              <CheckCircle2 size={24} color="#10b981" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem' }}>You're all caught up!</h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                No overdue reminders or critical document expirations today.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Security & Multi-User Privacy Statement */}
      <section className="overview-security-card">
        <div className="security-card-inner">
          <div className="security-card-left">
            <div className="security-shield-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>Your Privacy is Guaranteed</h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                RemiVault isolates every user's data with cryptographic encryption and strict ownership checks. Only you have access to your vault secrets.
              </p>
            </div>
          </div>
          <div className="security-badges-row">
            <span className="security-pill">AES-256-GCM</span>
            <span className="security-pill">Strict IDOR Proof</span>
            <span className="security-pill">Zero Data Mining</span>
          </div>
        </div>
      </section>
    </div>
  );
};
