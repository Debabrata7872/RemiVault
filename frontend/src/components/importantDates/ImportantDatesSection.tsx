import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  Calendar,
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  Edit3,
  X,
  AlertTriangle,
  Clock,
  RefreshCw,
  Tag,
  Shield,
  Heart,
  Plane,
  CreditCard,
  Gift,
  RotateCw,
  Award,
  Sparkles,
  Check
} from 'lucide-react';
import {
  fetchImportantDatesApi,
  createImportantDateApi,
  updateImportantDateApi,
  deleteImportantDateApi,
  togglePinImportantDateApi
} from '../../services/importantDates';
import type {
  ImportantDate,
  ImportantDateCategory,
  RecurrenceType,
  ImportantDateCounts
} from '../../services/importantDates';

interface CategoryMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}

const CATEGORY_CONFIG: Record<ImportantDateCategory, CategoryMeta> = {
  passport: {
    label: 'Passport & Travel',
    icon: <Plane size={15} />,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  license: {
    label: 'License & ID',
    icon: <Award size={15} />,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  anniversary: {
    label: 'Anniversary',
    icon: <Heart size={15} />,
    color: '#f43f5e',
    bg: 'rgba(244, 63, 94, 0.12)',
    border: 'rgba(244, 63, 94, 0.3)',
  },
  birthday: {
    label: 'Birthday',
    icon: <Gift size={15} />,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
  },
  warranty: {
    label: 'Warranty & Guarantee',
    icon: <Shield size={15} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  subscription: {
    label: 'Subscription Renewal',
    icon: <CreditCard size={15} />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  custom: {
    label: 'Custom Milestone',
    icon: <Tag size={15} />,
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.3)',
  },
};

const NOTIFY_PRESETS = [
  { label: '7 days before', value: 7 },
  { label: '14 days before', value: 14 },
  { label: '30 days before (Recommended)', value: 30 },
  { label: '60 days before', value: 60 },
  { label: '90 days before (Passports)', value: 90 },
];

function formatDateDisplay(dateStr: string): string {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export const ImportantDatesSection: React.FC = () => {
  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [counts, setCounts] = useState<ImportantDateCounts>({
    total: 0,
    pinned: 0,
    urgent: 0,
    upcoming: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'urgent' | 'pinned' | 'upcoming' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingDate, setEditingDate] = useState<ImportantDate | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<ImportantDateCategory>('passport');
  const [formTargetDate, setFormTargetDate] = useState<string>('');
  const [formRecurrence, setFormRecurrence] = useState<RecurrenceType>('none');
  const [formNotifyDays, setFormNotifyDays] = useState<number>(30);
  const [formIsPinned, setFormIsPinned] = useState<boolean>(false);
  const [formNotes, setFormNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Deleting item ID tracker
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const titleInputId = useId();
  const targetDateInputId = useId();
  const notesInputId = useId();

  const loadDates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchImportantDatesApi({
        category: activeCategory,
        filter: activeFilter,
        search: searchQuery,
      });
      setDates(data.important_dates);
      setCounts(data.counts);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to load important dates');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, activeFilter, searchQuery]);

  useEffect(() => {
    loadDates();
  }, [loadDates]);

  const openCreateModal = () => {
    setEditingDate(null);
    setFormTitle('');
    setFormCategory('passport');
    // Default target date: 6 months from now
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    setFormTargetDate(d.toISOString().split('T')[0]);
    setFormRecurrence('none');
    setFormNotifyDays(30);
    setFormIsPinned(false);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ImportantDate) => {
    setEditingDate(item);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormTargetDate(item.target_date);
    setFormRecurrence(item.recurrence);
    setFormNotifyDays(item.notify_days_before);
    setFormIsPinned(item.is_pinned);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDate(null);
  };

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formTargetDate) return;

    setIsSubmitting(true);
    setError(null);
    try {
      if (editingDate) {
        await updateImportantDateApi(editingDate.id, {
          title: formTitle.trim(),
          category: formCategory,
          target_date: formTargetDate,
          recurrence: formRecurrence,
          notify_days_before: formNotifyDays,
          is_pinned: formIsPinned,
          notes: formNotes.trim() || undefined,
        });
      } else {
        await createImportantDateApi({
          title: formTitle.trim(),
          category: formCategory,
          target_date: formTargetDate,
          recurrence: formRecurrence,
          notify_days_before: formNotifyDays,
          is_pinned: formIsPinned,
          notes: formNotes.trim() || undefined,
        });
      }
      closeModal();
      loadDates();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to save important date');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDate = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this important date?')) return;
    setDeletingId(id);
    try {
      await deleteImportantDateApi(id);
      loadDates();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to delete important date');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePin = async (id: number) => {
    try {
      await togglePinImportantDateApi(id);
      loadDates();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to toggle pin');
    }
  };

  return (
    <section className="dates-module-container">
      {/* Module Header */}
      <div className="dates-header-row">
        <div className="dates-title-group">
          <div className="dates-icon-badge">
            <Calendar size={24} color="#f43f5e" />
          </div>
          <div>
            <h2 className="dates-main-title">Important Dates &amp; Expirations</h2>
            <p className="dates-main-subtitle">
              Passports, visas, driver&apos;s licenses, warranties, anniversaries, and countdowns.
            </p>
          </div>
        </div>

        <div className="dates-actions-group">
          <button
            className="btn btn-secondary"
            onClick={loadDates}
            disabled={loading}
            title="Refresh dates"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button className="btn btn-primary dates-create-btn" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Date</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="dates-metrics-grid">
        <div
          className={`dates-metric-card ${activeFilter === 'all' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <div className="dates-metric-top">
            <span className="dates-metric-label">Total Tracked</span>
            <Calendar size={17} color="#818cf8" />
          </div>
          <span className="dates-metric-number">{counts.total}</span>
          <span className="dates-metric-sub">Critical documents &amp; events</span>
        </div>

        <div
          className={`dates-metric-card urgent ${activeFilter === 'urgent' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('urgent')}
        >
          <div className="dates-metric-top">
            <span className="dates-metric-label">Urgent / Soon</span>
            <AlertTriangle size={17} color="#f43f5e" />
          </div>
          <span className="dates-metric-number urgent-number">{counts.urgent}</span>
          <span className="dates-metric-sub">Expiring within notice window</span>
        </div>

        <div
          className={`dates-metric-card ${activeFilter === 'upcoming' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('upcoming')}
        >
          <div className="dates-metric-top">
            <span className="dates-metric-label">All Upcoming</span>
            <Clock size={17} color="#38bdf8" />
          </div>
          <span className="dates-metric-number">{counts.upcoming}</span>
          <span className="dates-metric-sub">Active future countdowns</span>
        </div>

        <div
          className={`dates-metric-card ${activeFilter === 'pinned' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('pinned')}
        >
          <div className="dates-metric-top">
            <span className="dates-metric-label">Pinned Priority</span>
            <Pin size={17} color="#f59e0b" />
          </div>
          <span className="dates-metric-number">{counts.pinned}</span>
          <span className="dates-metric-sub">Featured at top</span>
        </div>

        <div
          className={`dates-metric-card ${activeFilter === 'expired' ? 'selected' : ''}`}
          onClick={() => setActiveFilter('expired')}
        >
          <div className="dates-metric-top">
            <span className="dates-metric-label">Expired</span>
            <X size={17} color="#94a3b8" />
          </div>
          <span className="dates-metric-number">{counts.expired}</span>
          <span className="dates-metric-sub">Past deadlines</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="dates-toolbar">
        {/* Category Pills */}
        <div className="dates-category-pills">
          <button
            className={`dates-pill-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Categories
          </button>
          {(Object.keys(CATEGORY_CONFIG) as ImportantDateCategory[]).map((catKey) => {
            const meta = CATEGORY_CONFIG[catKey];
            const isSelected = activeCategory === catKey;
            return (
              <button
                key={catKey}
                className={`dates-pill-btn ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? meta.color : undefined,
                  color: isSelected ? meta.color : undefined,
                  backgroundColor: isSelected ? meta.bg : undefined,
                }}
                onClick={() => setActiveCategory(catKey)}
              >
                {meta.icon}
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="dates-search-wrap">
          <Search size={15} className="dates-search-icon" />
          <input
            type="text"
            className="dates-search-input"
            placeholder="Search dates, notes, milestones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="dates-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="dates-error-banner">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dates Cards Grid */}
      {loading && dates.length === 0 ? (
        <div className="dates-empty-box">
          <RefreshCw size={28} className="spin" color="#818cf8" />
          <p>Loading your important dates...</p>
        </div>
      ) : dates.length === 0 ? (
        <div className="dates-empty-box">
          <div className="dates-empty-icon">
            <Calendar size={36} color="#f43f5e" />
          </div>
          <h3>No Important Dates Found</h3>
          <p>
            {searchQuery || activeCategory !== 'all' || activeFilter !== 'all'
              ? 'No dates match your active filters. Try resetting the filters or search query.'
              : 'Keep track of passport renewals, driver licenses, warranties, and special anniversaries with automated countdowns.'}
          </p>
          <button className="btn btn-primary" onClick={openCreateModal} style={{ marginTop: '1rem' }}>
            <Plus size={16} />
            <span>Add Your First Date</span>
          </button>
        </div>
      ) : (
        <div className="dates-cards-grid">
          {dates.map((item) => {
            const catMeta = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.custom;
            const isDeleting = deletingId === item.id;

            return (
              <div
                key={item.id}
                className={`dates-card ${item.is_pinned ? 'is-pinned' : ''} ${item.urgency_status}`}
                style={{
                  borderTopColor: catMeta.color,
                }}
              >
                {/* Card Top Row */}
                <div className="dates-card-top">
                  <div
                    className="dates-card-badge"
                    style={{
                      color: catMeta.color,
                      backgroundColor: catMeta.bg,
                      borderColor: catMeta.border,
                    }}
                  >
                    {catMeta.icon}
                    <span>{catMeta.label}</span>
                  </div>

                  <div className="dates-card-actions">
                    <button
                      className={`dates-action-icon-btn ${item.is_pinned ? 'pinned-active' : ''}`}
                      onClick={() => handleTogglePin(item.id)}
                      title={item.is_pinned ? 'Unpin from top' : 'Pin to top'}
                    >
                      {item.is_pinned ? <Pin size={15} color="#f59e0b" /> : <PinOff size={15} />}
                    </button>
                    <button
                      className="dates-action-icon-btn"
                      onClick={() => openEditModal(item)}
                      title="Edit date"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="dates-action-icon-btn delete"
                      onClick={() => handleDeleteDate(item.id)}
                      disabled={isDeleting}
                      title="Delete date"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Card Title */}
                <h3 className="dates-card-title">{item.title}</h3>

                {/* Countdown Spotlight */}
                <div className={`dates-countdown-box ${item.urgency_status}`}>
                  <div className="dates-countdown-left">
                    {item.urgency_status === 'today' ? (
                      <span className="dates-countdown-main today-text">
                        <Sparkles size={18} /> Today!
                      </span>
                    ) : item.urgency_status === 'expired' ? (
                      <span className="dates-countdown-main expired-text">
                        Expired ({Math.abs(item.days_remaining)}d ago)
                      </span>
                    ) : (
                      <div className="dates-countdown-number-group">
                        <span className="dates-countdown-big">{item.days_remaining}</span>
                        <span className="dates-countdown-sub">
                          {item.days_remaining === 1 ? 'day left' : 'days left'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Recurrence / Status Pill */}
                  <div className="dates-countdown-right">
                    {item.recurrence !== 'none' && (
                      <span className="dates-recurrence-pill" title={`Repeats ${item.recurrence}`}>
                        <RotateCw size={12} />
                        <span>Repeats {item.recurrence}</span>
                      </span>
                    )}
                    {item.urgency_status === 'urgent' && (
                      <span className="dates-urgency-pill urgent">
                        <AlertTriangle size={12} />
                        <span>Action Soon</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Timeline Info */}
                <div className="dates-info-block">
                  <div className="dates-info-row">
                    <span className="dates-info-label">
                      {item.recurrence !== 'none' ? 'Next Occurrence:' : 'Target Date:'}
                    </span>
                    <span className="dates-info-value">
                      {formatDateDisplay(item.next_occurrence || item.target_date)}
                    </span>
                  </div>

                  {item.recurrence !== 'none' && (
                    <div className="dates-info-row">
                      <span className="dates-info-label">Original Date:</span>
                      <span className="dates-info-value muted">
                        {formatDateDisplay(item.target_date)}
                      </span>
                    </div>
                  )}

                  {item.notify_days_before > 0 && (
                    <div className="dates-info-row">
                      <span className="dates-info-label">Alert Notice:</span>
                      <span className="dates-info-value muted">
                        {item.notify_days_before} days prior
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes (if any) */}
                {item.notes && (
                  <div className="dates-notes-snippet">
                    <p>{item.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add or Edit Date */}
      {isModalOpen && (
        <div className="dates-modal-backdrop" onClick={closeModal}>
          <div className="dates-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="dates-modal-header">
              <div className="dates-modal-title-group">
                <Calendar size={20} color="#f43f5e" />
                <h3>{editingDate ? 'Edit Important Date' : 'Add Important Date'}</h3>
              </div>
              <button className="dates-modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveDate} className="dates-modal-form">
              {/* Category Selector Grid */}
              <div className="dates-form-group">
                <label className="dates-form-label">Category</label>
                <div className="dates-category-select-grid">
                  {(Object.keys(CATEGORY_CONFIG) as ImportantDateCategory[]).map((catKey) => {
                    const meta = CATEGORY_CONFIG[catKey];
                    const isSelected = formCategory === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        className={`dates-cat-pick-btn ${isSelected ? 'selected' : ''}`}
                        style={{
                          borderColor: isSelected ? meta.color : undefined,
                          backgroundColor: isSelected ? meta.bg : undefined,
                          color: isSelected ? meta.color : undefined,
                        }}
                        onClick={() => setFormCategory(catKey)}
                      >
                        {meta.icon}
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title Input */}
              <div className="dates-form-group">
                <label htmlFor={titleInputId} className="dates-form-label">
                  Event / Document Title <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  className="dates-form-input"
                  placeholder="e.g. US Passport Expiration, Wedding Anniversary, Car Insurance..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Target Date Input */}
              <div className="dates-form-row-2">
                <div className="dates-form-group">
                  <label htmlFor={targetDateInputId} className="dates-form-label">
                    Target Date <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <input
                    id={targetDateInputId}
                    type="date"
                    className="dates-form-input"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    required
                  />
                </div>

                {/* Recurrence Selector */}
                <div className="dates-form-group">
                  <label className="dates-form-label">Recurrence Cycle</label>
                  <select
                    className="dates-form-select"
                    value={formRecurrence}
                    onChange={(e) => setFormRecurrence(e.target.value as RecurrenceType)}
                  >
                    <option value="none">One-time (No Recurrence)</option>
                    <option value="yearly">Repeats Yearly (Birthdays, Anniversaries)</option>
                    <option value="monthly">Repeats Monthly (Subscriptions, Rent)</option>
                  </select>
                </div>
              </div>

              {/* Notification Notice Window */}
              <div className="dates-form-row-2">
                <div className="dates-form-group">
                  <label className="dates-form-label">Urgency Alert Threshold</label>
                  <select
                    className="dates-form-select"
                    value={formNotifyDays}
                    onChange={(e) => setFormNotifyDays(Number(e.target.value))}
                  >
                    {NOTIFY_PRESETS.map((preset) => (
                      <option key={preset.value} value={preset.value}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pin Checkbox */}
                <div className="dates-form-group dates-pin-checkbox-group">
                  <label className="dates-checkbox-label">
                    <input
                      type="checkbox"
                      checked={formIsPinned}
                      onChange={(e) => setFormIsPinned(e.target.checked)}
                      className="dates-form-checkbox"
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Pin size={15} color={formIsPinned ? '#f59e0b' : 'var(--text-muted)'} />
                      <span>Pin to top of workspace</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="dates-form-group">
                <label htmlFor={notesInputId} className="dates-form-label">
                  Notes &amp; Document Numbers (Optional)
                </label>
                <textarea
                  id={notesInputId}
                  className="dates-form-textarea"
                  placeholder="Reference number, renewal website link, or reminder details..."
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Modal Buttons */}
              <div className="dates-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary dates-modal-submit-btn"
                  disabled={isSubmitting || !formTitle.trim() || !formTargetDate}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingDate ? 'Save Changes' : 'Record Date'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
