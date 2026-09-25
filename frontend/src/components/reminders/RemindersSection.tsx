import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Bell,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit3,
  X,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Flame,
  Check,
  Tag
} from 'lucide-react';
import {
  fetchRemindersApi,
  createReminderApi,
  updateReminderApi,
  deleteReminderApi,
  toggleCompleteReminderApi,
  snoozeReminderApi
} from '../../services/reminders';
import type {
  Reminder,
  ReminderPriority,
  ReminderCounts
} from '../../services/reminders';

const PRIORITY_CONFIG: Record<ReminderPriority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'Urgent', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
  high: { label: 'High', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.3)' },
  medium: { label: 'Medium', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.3)' },
  low: { label: 'Low', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.12)', border: 'rgba(148, 163, 184, 0.3)' },
};

function formatRelativeTime(dateString: string, isOverdue: boolean, isCompleted: boolean): string {
  if (isCompleted) {
    return 'Completed';
  }

  const target = new Date(dateString).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const absDiffSec = Math.floor(Math.abs(diffMs) / 1000);

  const minutes = Math.floor(absDiffSec / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (isOverdue) {
    if (minutes < 1) return 'Overdue just now';
    if (minutes < 60) return `Overdue by ${minutes}m`;
    if (hours < 24) return `Overdue by ${hours}h`;
    return `Overdue by ${days}d`;
  }

  if (diffMs <= 0) {
    return 'Due now';
  }

  if (minutes < 60) return `In ${minutes}m`;
  if (hours < 24) return `In ${hours}h ${minutes % 60}m`;
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toLocalDatetimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

export const RemindersSection: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [counts, setCounts] = useState<ReminderCounts>({
    total: 0,
    pending: 0,
    upcoming: 0,
    overdue: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formRemindAt, setFormRemindAt] = useState<string>('');
  const [formPriority, setFormPriority] = useState<ReminderPriority>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Snooze dropdown menu active ID
  const [openSnoozeMenuId, setOpenSnoozeMenuId] = useState<number | null>(null);

  // Smooth animation tracking states
  const [newReminderId, setNewReminderId] = useState<number | null>(null);
  const [deletingReminderIds, setDeletingReminderIds] = useState<Set<number>>(new Set());
  const [snoozedReminderId, setSnoozedReminderId] = useState<number | null>(null);

  const titleInputId = useId();
  const remindAtInputId = useId();
  const descriptionInputId = useId();

  const loadReminders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchRemindersApi({
        status: activeTab,
        priority: priorityFilter,
        search: searchQuery,
      });
      setReminders(data.reminders);
      setCounts(data.counts);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }, [activeTab, priorityFilter, searchQuery]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const openCreateModal = () => {
    setEditingReminder(null);
    setFormTitle('');
    setFormDescription('');
    // Default to 2 hours from now rounded to next 15 min
    const defaultTime = new Date();
    defaultTime.setHours(defaultTime.getHours() + 2);
    defaultTime.setMinutes(Math.ceil(defaultTime.getMinutes() / 15) * 15);
    setFormRemindAt(toLocalDatetimeInput(defaultTime));
    setFormPriority('medium');
    setIsModalOpen(true);
  };

  const openEditModal = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormTitle(reminder.title);
    setFormDescription(reminder.description || '');
    setFormRemindAt(toLocalDatetimeInput(new Date(reminder.remind_at)));
    setFormPriority(reminder.priority);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
  };

  const applyPresetTime = (hoursFromNow: number) => {
    const d = new Date();
    d.setHours(d.getHours() + hoursFromNow);
    d.setMinutes(0);
    setFormRemindAt(toLocalDatetimeInput(d));
  };

  const applyTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    setFormRemindAt(toLocalDatetimeInput(d));
  };

  const applyWeekend = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = (day <= 5 ? 6 - day : 7);
    d.setDate(d.getDate() + diff);
    d.setHours(10, 0, 0, 0);
    setFormRemindAt(toLocalDatetimeInput(d));
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formRemindAt) return;

    setIsSubmitting(true);
    try {
      if (editingReminder) {
        await updateReminderApi(editingReminder.id, {
          title: formTitle,
          description: formDescription,
          remind_at: new Date(formRemindAt).toISOString(),
          priority: formPriority,
        });
      } else {
        const created = await createReminderApi({
          title: formTitle,
          description: formDescription,
          remind_at: new Date(formRemindAt).toISOString(),
          priority: formPriority,
        });
        setNewReminderId(created.id);
        setTimeout(() => setNewReminderId(null), 2500);
      }
      closeModal();
      await loadReminders();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e?.message || 'Failed to save reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleComplete = async (reminder: Reminder) => {
    try {
      const updated = await toggleCompleteReminderApi(reminder.id);
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      // Refresh count badges
      const data = await fetchRemindersApi({
        status: activeTab,
        priority: priorityFilter,
        search: searchQuery,
      });
      setCounts(data.counts);
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e?.message || 'Failed to update reminder status');
    }
  };

  const handleSnooze = async (reminder: Reminder, minutes: number) => {
    try {
      setSnoozedReminderId(reminder.id);
      const updated = await snoozeReminderApi(reminder.id, minutes);
      setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setOpenSnoozeMenuId(null);
      setTimeout(() => setSnoozedReminderId(null), 1200);
      await loadReminders();
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e?.message || 'Failed to snooze reminder');
      setSnoozedReminderId(null);
    }
  };

  const handleDelete = async (reminder: Reminder) => {
    if (!window.confirm(`Delete reminder "${reminder.title}"?`)) return;

    try {
      setDeletingReminderIds((prev) => new Set(prev).add(reminder.id));
      setTimeout(async () => {
        try {
          await deleteReminderApi(reminder.id);
          setReminders((prev) => prev.filter((r) => r.id !== reminder.id));
          await loadReminders();
        } catch (err: unknown) {
          const e = err as { message?: string };
          alert(e?.message || 'Failed to delete reminder');
        } finally {
          setDeletingReminderIds((prev) => {
            const next = new Set(prev);
            next.delete(reminder.id);
            return next;
          });
        }
      }, 280);
    } catch (err: unknown) {
      const e = err as { message?: string };
      alert(e?.message || 'Failed to delete reminder');
    }
  };

  return (
    <section className="reminders-container">
      {/* Section Header */}
      <div className="reminders-header">
        <div className="reminders-header-left">
          <div className="reminders-icon-badge">
            <Bell size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Time-Sensitive Reminders</h2>
              <span className="badge badge-warning" style={{ fontSize: '0.72rem', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                Stage 5 Active
              </span>
            </div>
            <p className="section-desc" style={{ margin: '0.2rem 0 0 0' }}>
              Schedule critical alerts with UTC normalization, status lifecycle, and snooze controls.
            </p>
          </div>
        </div>

        <div className="reminders-header-actions">
          <button
            className="btn btn-secondary"
            onClick={loadReminders}
            disabled={loading}
            title="Refresh reminders"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button className="btn btn-primary reminders-create-btn" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Schedule Reminder</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="reminder-metrics-grid">
        <div 
          className={`reminder-kpi-card ${activeTab === 'all' ? 'active-kpi' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          <div className="kpi-icon" style={{ color: '#818cf8', background: 'rgba(129, 140, 248, 0.12)' }}>
            <Bell size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Total Scheduled</span>
            <span className="kpi-value">{counts.total}</span>
          </div>
        </div>

        <div 
          className={`reminder-kpi-card ${activeTab === 'upcoming' ? 'active-kpi' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          <div className="kpi-icon" style={{ color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)' }}>
            <Clock size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Upcoming</span>
            <span className="kpi-value" style={{ color: '#38bdf8' }}>{counts.upcoming}</span>
          </div>
        </div>

        <div 
          className={`reminder-kpi-card ${counts.overdue > 0 ? 'kpi-alert' : ''} ${activeTab === 'overdue' ? 'active-kpi' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          <div className="kpi-icon" style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.15)' }}>
            <Flame size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Overdue Alerts</span>
            <span className="kpi-value" style={{ color: counts.overdue > 0 ? '#f43f5e' : 'inherit' }}>
              {counts.overdue}
            </span>
          </div>
        </div>

        <div 
          className={`reminder-kpi-card ${activeTab === 'completed' ? 'active-kpi' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <div className="kpi-icon" style={{ color: '#34d399', background: 'rgba(52, 211, 153, 0.12)' }}>
            <CheckCircle2 size={18} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Completed</span>
            <span className="kpi-value" style={{ color: '#34d399' }}>{counts.completed}</span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="reminders-controls">
        <div className="reminders-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
            <span className="tab-badge">{counts.total}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            Upcoming
            <span className="tab-badge">{counts.upcoming}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''} ${counts.overdue > 0 ? 'tab-alert' : ''}`}
            onClick={() => setActiveTab('overdue')}
          >
            Overdue
            <span className="tab-badge overdue-badge">{counts.overdue}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            Completed
            <span className="tab-badge">{counts.completed}</span>
          </button>
        </div>

        <div className="reminders-filters">
          {/* Priority filter */}
          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Search input */}
          <div className="input-with-icon" style={{ minWidth: '220px' }}>
            <Search size={15} className="input-icon" style={{ left: '0.75rem' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search reminders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '0.45rem 0.75rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
            />
            {searchQuery && (
              <button
                className="btn-icon-xs"
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '0.6rem' }}
                title="Clear search"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Reminders List */}
      {loading && reminders.length === 0 ? (
        <div className="loading-state">
          <RefreshCw size={24} className="spin" color="#818cf8" />
          <p>Loading your secure reminders...</p>
        </div>
      ) : reminders.length === 0 ? (
        <div className="card reminders-empty-state">
          <div className="reminders-empty-icon">
            <Bell size={28} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>No Reminders Found</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)', maxWidth: '420px', fontSize: '0.92rem', lineHeight: 1.6 }}>
            {activeTab === 'overdue'
              ? 'Great news! You have no overdue reminders right now.'
              : activeTab === 'completed'
              ? 'No completed reminders yet. Mark items done to see them here.'
              : 'Keep track of appointments, deadlines, and renewals. Every entry is isolated to your account.'}
          </p>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: '0.5rem' }}>
            <Plus size={16} />
            <span>Create First Reminder</span>
          </button>
        </div>
      ) : (
        <div className="reminders-list">
          {reminders.map((reminder) => {
            const isCompleted = reminder.status === 'completed';
            const isOverdue = reminder.is_overdue;
            const priorityStyle = PRIORITY_CONFIG[reminder.priority] || PRIORITY_CONFIG.medium;
            const relativeTimeStr = formatRelativeTime(reminder.snooze_until || reminder.remind_at, isOverdue, isCompleted);
            const isSnoozed = Boolean(reminder.snooze_until && new Date(reminder.snooze_until) > new Date());

            return (
              <div
                key={reminder.id}
                className={`reminder-card ${isCompleted ? 'is-completed' : ''} ${isOverdue ? 'is-overdue' : ''} ${newReminderId === reminder.id ? 'reminder-card-new' : ''} ${deletingReminderIds.has(reminder.id) ? 'reminder-card-deleting' : ''} ${snoozedReminderId === reminder.id ? 'reminder-card-snoozed' : ''}`}
                style={{
                  borderLeft: `4px solid ${isCompleted ? 'var(--text-muted)' : isOverdue ? '#f43f5e' : priorityStyle.color}`,
                }}
              >
                {/* Completion Checkbox */}
                <button
                  className={`reminder-check-btn ${isCompleted ? 'checked' : ''}`}
                  onClick={() => handleToggleComplete(reminder)}
                  title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
                >
                  {isCompleted && <Check size={14} />}
                </button>

                {/* Reminder Content */}
                <div className="reminder-body">
                  <div className="reminder-header-row">
                    <h3 className={`reminder-title ${isCompleted ? 'strikethrough' : ''}`}>
                      {reminder.title}
                    </h3>

                    {/* Badges */}
                    <div className="reminder-badges">
                      {isOverdue && !isCompleted && (
                        <span className="badge badge-danger" style={{ fontSize: '0.72rem', animation: 'pulse 2s infinite' }}>
                          <Flame size={12} /> Overdue
                        </span>
                      )}
                      {isSnoozed && !isCompleted && (
                        <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                          <RotateCcw size={12} /> Snoozed
                        </span>
                      )}
                      <span
                        className="badge"
                        style={{
                          background: priorityStyle.bg,
                          color: priorityStyle.color,
                          borderColor: priorityStyle.border,
                          fontSize: '0.72rem',
                          textTransform: 'capitalize',
                        }}
                      >
                        {priorityStyle.label}
                      </span>
                    </div>
                  </div>

                  {reminder.description && (
                    <p className={`reminder-desc ${isCompleted ? 'dimmed' : ''}`}>
                      {reminder.description}
                    </p>
                  )}

                  {/* Metadata & Timestamp Row */}
                  <div className="reminder-meta-row">
                    <div className="reminder-time-tag">
                      <Clock size={13} color={isOverdue ? '#f43f5e' : isCompleted ? 'var(--text-muted)' : 'var(--text-secondary)'} />
                      <span style={{ color: isOverdue ? '#f43f5e' : 'inherit', fontWeight: isOverdue ? 600 : 400 }}>
                        {relativeTimeStr}
                      </span>
                      <span className="dot-separator">•</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {new Date(reminder.remind_at).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="reminder-actions">
                  {/* Snooze button (only for pending) */}
                  {!isCompleted && (
                    <div className="snooze-menu-container">
                      <button
                        className={`btn-icon btn-icon-snooze ${openSnoozeMenuId === reminder.id ? 'active' : ''}`}
                        onClick={() => setOpenSnoozeMenuId(openSnoozeMenuId === reminder.id ? null : reminder.id)}
                        title="Snooze reminder"
                        aria-label="Snooze reminder"
                      >
                        <RotateCcw size={15} />
                      </button>

                      {openSnoozeMenuId === reminder.id && (
                        <div className="snooze-dropdown">
                          <span className="snooze-title">Snooze for:</span>
                          <button onClick={() => handleSnooze(reminder, 15)}>+ 15 Minutes</button>
                          <button onClick={() => handleSnooze(reminder, 60)}>+ 1 Hour</button>
                          <button onClick={() => handleSnooze(reminder, 180)}>+ 3 Hours</button>
                          <button onClick={() => handleSnooze(reminder, 1440)}>Tomorrow Morning</button>
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    className="btn-icon btn-icon-edit"
                    onClick={() => openEditModal(reminder)}
                    title="Edit Reminder"
                    aria-label="Edit Reminder"
                  >
                    <Edit3 size={15} />
                  </button>

                  <button
                    className="btn-icon btn-icon-danger"
                    onClick={() => handleDelete(reminder)}
                    title="Delete Reminder"
                    aria-label="Delete Reminder"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-content reminder-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px', width: '100%' }}>
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-badge-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                  <Bell size={20} />
                </div>
                <div>
                  <h2 className="modal-title">
                    {editingReminder ? 'Edit Reminder' : 'Schedule New Reminder'}
                  </h2>
                  <p className="modal-subtitle">UTC-normalized time-sensitive notifications &amp; alerts.</p>
                </div>
              </div>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveReminder} className="reminder-form" autoComplete="off">
              <div className="form-group">
                <label className="form-label" htmlFor={titleInputId}>Reminder Title *</label>
                <div className="input-with-icon">
                  <Tag size={16} className="input-icon" />
                  <input
                    id={titleInputId}
                    type="text"
                    className="form-input"
                    placeholder="e.g. Renew Passport & Visa, Submit Tax Return..."
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    autoComplete="off"
                    data-lpignore="true"
                    data-form-type="other"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={remindAtInputId}>Trigger Date &amp; Time (UTC Normalized) *</label>
                <div className="input-with-icon">
                  <Clock size={16} className="input-icon" />
                  <input
                    id={remindAtInputId}
                    type="datetime-local"
                    className="form-input"
                    value={formRemindAt}
                    onChange={(e) => setFormRemindAt(e.target.value)}
                    required
                  />
                </div>
                
                {/* Quick Presets */}
                <div className="datetime-presets">
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>Presets:</span>
                  <button type="button" className="preset-pill" onClick={() => applyPresetTime(1)}>+1 Hour</button>
                  <button type="button" className="preset-pill" onClick={() => applyPresetTime(3)}>+3 Hours</button>
                  <button type="button" className="preset-pill" onClick={applyTomorrowMorning}>Tomorrow 9 AM</button>
                  <button type="button" className="preset-pill" onClick={applyWeekend}>This Weekend</button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Priority Level</label>
                <div className="priority-selector">
                  {(['low', 'medium', 'high', 'urgent'] as ReminderPriority[]).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const isSelected = formPriority === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`priority-btn ${isSelected ? 'selected' : ''}`}
                        style={{
                          borderColor: isSelected ? cfg.color : 'rgba(255, 255, 255, 0.08)',
                          background: isSelected ? cfg.bg : 'rgba(255, 255, 255, 0.03)',
                          color: isSelected ? cfg.color : 'var(--text-secondary)',
                        }}
                        onClick={() => setFormPriority(p)}
                      >
                        <span className="priority-dot" style={{ background: cfg.color }}></span>
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={descriptionInputId}>Notes / Details (Optional)</label>
                <textarea
                  id={descriptionInputId}
                  className="form-textarea"
                  rows={3}
                  style={{ minHeight: '85px' }}
                  placeholder="Additional context, documents needed, or location details..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting || !formTitle.trim() || !formRemindAt}>
                  <Sparkles size={16} />
                  <span>{isSubmitting ? 'Saving...' : editingReminder ? 'Update Reminder' : 'Schedule Reminder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
