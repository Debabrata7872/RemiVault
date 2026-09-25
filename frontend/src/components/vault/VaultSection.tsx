import React, { useState, useEffect, useCallback, useId } from 'react';
import {
  KeyRound,
  Plus,
  Search,
  Star,
  Trash2,
  Edit3,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  CreditCard,
  Server,
  FileText,
  Terminal,
  Sparkles,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Tag
} from 'lucide-react';
import {
  fetchVaultEntriesApi,
  createVaultEntryApi,
  updateVaultEntryApi,
  deleteVaultEntryApi,
  toggleFavoriteVaultApi,
  recordVaultAccessApi
} from '../../services/vault';
import type {
  VaultEntry,
  VaultCategory,
  PasswordStrength,
  VaultCounts
} from '../../services/vault';

interface CategoryMeta {
  label: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  border: string;
}

const CATEGORY_CONFIG: Record<VaultCategory, CategoryMeta> = {
  login: {
    label: 'Login & Account',
    icon: <KeyRound size={15} />,
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.12)',
    border: 'rgba(56, 189, 248, 0.3)',
  },
  api_key: {
    label: 'API Key & Token',
    icon: <Terminal size={15} />,
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.3)',
  },
  server: {
    label: 'Server & SSH',
    icon: <Server size={15} />,
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.3)',
  },
  credit_card: {
    label: 'Payment Card',
    icon: <CreditCard size={15} />,
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.3)',
  },
  secure_note: {
    label: 'Secure Note',
    icon: <FileText size={15} />,
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.12)',
    border: 'rgba(236, 72, 153, 0.3)',
  },
  other: {
    label: 'Other Credential',
    icon: <Tag size={15} />,
    color: '#818cf8',
    bg: 'rgba(129, 140, 248, 0.12)',
    border: 'rgba(129, 140, 248, 0.3)',
  },
};

const STRENGTH_CONFIG: Record<PasswordStrength, { label: string; color: string; percent: number }> = {
  weak: { label: 'Weak', color: '#f43f5e', percent: 25 },
  fair: { label: 'Fair', color: '#f97316', percent: 50 },
  good: { label: 'Good', color: '#38bdf8', percent: 75 },
  strong: { label: 'Strong', color: '#10b981', percent: 100 },
};

function generatePassword(length = 20, useUpper = true, useLower = true, useDigits = true, useSymbols = true): string {
  let chars = '';
  if (useLower) chars += 'abcdefghijklmnopqrstuvwxyz';
  if (useUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (useDigits) chars += '0123456789';
  if (useSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

  let result = '';
  const cryptoObj = window.crypto || (window as unknown as { msCrypto: Crypto }).msCrypto;
  const randomValues = new Uint32Array(length);
  cryptoObj.getRandomValues(randomValues);

  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

export const VaultSection: React.FC = () => {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [counts, setCounts] = useState<VaultCounts>({
    total: 0,
    favorites: 0,
    logins: 0,
    api_keys: 0,
    cards: 0,
    servers: 0,
    weak_passwords: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Password visibility tracking by entry ID
  const [visiblePasswordIds, setVisiblePasswordIds] = useState<Set<number>>(new Set());
  // Copied indicator tracking by key: `${id}-username` or `${id}-password`
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [formTitle, setFormTitle] = useState<string>('');
  const [formCategory, setFormCategory] = useState<VaultCategory>('login');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formUrl, setFormUrl] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formIsFavorite, setFormIsFavorite] = useState<boolean>(false);
  const [showFormPassword, setShowFormPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Standalone Generator Modal State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [genLength, setGenLength] = useState<number>(20);
  const [genUpper, setGenUpper] = useState<boolean>(true);
  const [genLower, setGenLower] = useState<boolean>(true);
  const [genDigits, setGenDigits] = useState<boolean>(true);
  const [genSymbols, setGenSymbols] = useState<boolean>(true);
  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [isGenCopied, setIsGenCopied] = useState<boolean>(false);

  // Deleting ID
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const titleInputId = useId();
  const usernameInputId = useId();
  const passwordInputId = useId();
  const urlInputId = useId();
  const notesInputId = useId();

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchVaultEntriesApi({
        category: activeCategory,
        favorites: onlyFavorites,
        search: searchQuery,
      });
      setEntries(data.vault_entries);
      setCounts(data.counts);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to load vault entries');
    } finally {
      setLoading(false);
    }
  }, [activeCategory, onlyFavorites, searchQuery]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Handle password generation
  const handleRegeneratePassword = useCallback(() => {
    const pwd = generatePassword(genLength, genUpper, genLower, genDigits, genSymbols);
    setGeneratedPassword(pwd);
    setIsGenCopied(false);
  }, [genLength, genUpper, genLower, genDigits, genSymbols]);

  useEffect(() => {
    handleRegeneratePassword();
  }, [handleRegeneratePassword]);

  const openCreateModal = () => {
    setEditingEntry(null);
    setFormTitle('');
    setFormCategory('login');
    setFormUsername('');
    setFormPassword(generatePassword(20));
    setFormUrl('');
    setFormNotes('');
    setFormIsFavorite(false);
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const openEditModal = (entry: VaultEntry) => {
    setEditingEntry(entry);
    setFormTitle(entry.title);
    setFormCategory(entry.category);
    setFormUsername(entry.username || '');
    setFormPassword(entry.password || '');
    setFormUrl(entry.url || '');
    setFormNotes(entry.notes || '');
    setFormIsFavorite(entry.is_favorite);
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEntry(null);
  };

  const handleSaveEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formPassword) return;

    setIsSubmitting(true);
    setError(null);
    try {
      if (editingEntry) {
        await updateVaultEntryApi(editingEntry.id, {
          title: formTitle.trim(),
          category: formCategory,
          username: formUsername.trim() || undefined,
          password: formPassword,
          url: formUrl.trim() || undefined,
          notes: formNotes.trim() || undefined,
          is_favorite: formIsFavorite,
        });
      } else {
        await createVaultEntryApi({
          title: formTitle.trim(),
          category: formCategory,
          username: formUsername.trim() || undefined,
          password: formPassword,
          url: formUrl.trim() || undefined,
          notes: formNotes.trim() || undefined,
          is_favorite: formIsFavorite,
        });
      }
      closeModal();
      loadEntries();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to save vault entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this secret from your vault? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteVaultEntryApi(id);
      loadEntries();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to delete vault entry');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleFavorite = async (id: number) => {
    try {
      await toggleFavoriteVaultApi(id);
      loadEntries();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e?.message || 'Failed to toggle favorite');
    }
  };

  const togglePasswordVisibility = (id: number) => {
    setVisiblePasswordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = async (text: string, key: string, entryId?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);

      if (entryId) {
        recordVaultAccessApi(entryId).catch(() => {});
      }
    } catch {
      // Fallback
    }
  };

  return (
    <section className="vault-module-container">
      {/* Module Header */}
      <div className="vault-header-row">
        <div className="vault-title-group">
          <div className="vault-icon-badge">
            <KeyRound size={24} color="#a855f7" />
          </div>
          <div>
            <h2 className="vault-main-title">Password &amp; Credential Vault</h2>
            <p className="vault-main-subtitle">
              Zero-plaintext storage with authenticated AES-256-GCM symmetric encryption.
            </p>
          </div>
        </div>

        <div className="vault-actions-group">
          <button
            className="btn btn-secondary"
            onClick={() => setIsGeneratorOpen(true)}
            title="Generate secure password"
          >
            <Sliders size={15} />
            Password Generator
          </button>

          <button
            className="btn btn-secondary"
            onClick={loadEntries}
            disabled={loading}
            title="Refresh vault"
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button className="btn btn-primary vault-create-btn" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Secret</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="vault-metrics-grid">
        <div
          className={`vault-metric-card ${activeCategory === 'all' && !onlyFavorites ? 'selected' : ''}`}
          onClick={() => {
            setActiveCategory('all');
            setOnlyFavorites(false);
          }}
        >
          <div className="vault-metric-top">
            <span className="vault-metric-label">Total Secrets</span>
            <KeyRound size={17} color="#a855f7" />
          </div>
          <span className="vault-metric-number">{counts.total}</span>
          <span className="vault-metric-sub">Encrypted credentials stored</span>
        </div>

        <div
          className={`vault-metric-card ${onlyFavorites ? 'selected' : ''}`}
          onClick={() => {
            setOnlyFavorites(!onlyFavorites);
          }}
        >
          <div className="vault-metric-top">
            <span className="vault-metric-label">Starred Favorites</span>
            <Star size={17} color="#f59e0b" fill={counts.favorites > 0 ? '#f59e0b' : 'none'} />
          </div>
          <span className="vault-metric-number" style={{ color: '#f59e0b' }}>{counts.favorites}</span>
          <span className="vault-metric-sub">Quick-access priority items</span>
        </div>

        <div
          className={`vault-metric-card ${activeCategory === 'login' ? 'selected' : ''}`}
          onClick={() => {
            setActiveCategory('login');
            setOnlyFavorites(false);
          }}
        >
          <div className="vault-metric-top">
            <span className="vault-metric-label">Logins &amp; Accounts</span>
            <KeyRound size={17} color="#38bdf8" />
          </div>
          <span className="vault-metric-number">{counts.logins}</span>
          <span className="vault-metric-sub">Websites &amp; service accounts</span>
        </div>

        <div
          className={`vault-metric-card ${activeCategory === 'api_key' ? 'selected' : ''}`}
          onClick={() => {
            setActiveCategory('api_key');
            setOnlyFavorites(false);
          }}
        >
          <div className="vault-metric-top">
            <span className="vault-metric-label">API Keys &amp; Tokens</span>
            <Terminal size={17} color="#a855f7" />
          </div>
          <span className="vault-metric-number">{counts.api_keys}</span>
          <span className="vault-metric-sub">Developer &amp; cloud access tokens</span>
        </div>

        <div className="vault-metric-card vault-health-card">
          <div className="vault-metric-top">
            <span className="vault-metric-label">Vault Health</span>
            {counts.weak_passwords > 0 ? (
              <ShieldAlert size={17} color="#f43f5e" />
            ) : (
              <ShieldCheck size={17} color="#10b981" />
            )}
          </div>
          <span className="vault-metric-number" style={{ color: counts.weak_passwords > 0 ? '#f43f5e' : '#10b981' }}>
            {counts.weak_passwords > 0 ? `${counts.weak_passwords} Weak` : '100% Strong'}
          </span>
          <span className="vault-metric-sub">
            {counts.weak_passwords > 0 ? 'Action suggested: update weak passwords' : 'All credentials meet entropy rules'}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="vault-toolbar">
        {/* Category Pills */}
        <div className="vault-category-pills">
          <button
            className={`vault-pill-btn ${activeCategory === 'all' && !onlyFavorites ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory('all');
              setOnlyFavorites(false);
            }}
          >
            All Secrets
          </button>
          <button
            className={`vault-pill-btn ${onlyFavorites ? 'active' : ''}`}
            style={{
              borderColor: onlyFavorites ? '#f59e0b' : undefined,
              color: onlyFavorites ? '#f59e0b' : undefined,
              backgroundColor: onlyFavorites ? 'rgba(245, 158, 11, 0.12)' : undefined,
            }}
            onClick={() => setOnlyFavorites(!onlyFavorites)}
          >
            <Star size={14} fill={onlyFavorites ? '#f59e0b' : 'none'} />
            <span>Favorites</span>
          </button>
          {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map((catKey) => {
            const meta = CATEGORY_CONFIG[catKey];
            const isSelected = activeCategory === catKey && !onlyFavorites;
            return (
              <button
                key={catKey}
                className={`vault-pill-btn ${isSelected ? 'active' : ''}`}
                style={{
                  borderColor: isSelected ? meta.color : undefined,
                  color: isSelected ? meta.color : undefined,
                  backgroundColor: isSelected ? meta.bg : undefined,
                }}
                onClick={() => {
                  setActiveCategory(catKey);
                  setOnlyFavorites(false);
                }}
              >
                {meta.icon}
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="vault-search-wrap">
          <Search size={15} className="vault-search-icon" />
          <input
            type="text"
            className="vault-search-input"
            placeholder="Search credentials by title, username, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="vault-search-clear"
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
        <div className="vault-error-banner">
          <ShieldAlert size={17} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Vault Cards Grid */}
      {loading && entries.length === 0 ? (
        <div className="vault-empty-box">
          <RefreshCw size={28} className="spin" color="#a855f7" />
          <p>Decrypting vault credentials...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="vault-empty-box">
          <div className="vault-empty-icon">
            <KeyRound size={36} color="#a855f7" />
          </div>
          <h3>Your Password Vault is Empty</h3>
          <p>
            {searchQuery || activeCategory !== 'all' || onlyFavorites
              ? 'No credentials match your active filters. Try clearing the search or category filters.'
              : 'Safely store complex passwords, API tokens, credit cards, and SSH credentials with zero-plaintext encryption.'}
          </p>
          <button className="btn btn-primary vault-create-btn" onClick={openCreateModal} style={{ marginTop: '1rem' }}>
            <Plus size={16} />
            <span>Store Your First Secret</span>
          </button>
        </div>
      ) : (
        <div className="vault-cards-grid">
          {entries.map((entry) => {
            const catMeta = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.other;
            const strengthMeta = STRENGTH_CONFIG[entry.password_strength] || STRENGTH_CONFIG.good;
            const isPasswordVisible = visiblePasswordIds.has(entry.id);
            const isDeleting = deletingId === entry.id;

            return (
              <div
                key={entry.id}
                className={`vault-card ${entry.is_favorite ? 'is-fav' : ''}`}
                style={{ borderTopColor: catMeta.color }}
              >
                {/* Top Row */}
                <div className="vault-card-top">
                  <div
                    className="vault-card-badge"
                    style={{
                      color: catMeta.color,
                      backgroundColor: catMeta.bg,
                      borderColor: catMeta.border,
                    }}
                  >
                    {catMeta.icon}
                    <span>{catMeta.label}</span>
                  </div>

                  <div className="vault-card-actions">
                    <button
                      className={`vault-action-btn ${entry.is_favorite ? 'fav-active' : ''}`}
                      onClick={() => handleToggleFavorite(entry.id)}
                      title={entry.is_favorite ? 'Remove from favorites' : 'Mark as favorite'}
                    >
                      <Star size={15} fill={entry.is_favorite ? '#f59e0b' : 'none'} color={entry.is_favorite ? '#f59e0b' : 'var(--text-muted)'} />
                    </button>
                    <button
                      className="vault-action-btn"
                      onClick={() => openEditModal(entry)}
                      title="Edit secret"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      className="vault-action-btn delete"
                      onClick={() => handleDeleteEntry(entry.id)}
                      disabled={isDeleting}
                      title="Delete secret"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Title and Website URL */}
                <div className="vault-card-main">
                  <h3 className="vault-card-title">{entry.title}</h3>
                  {entry.url && (
                    <a
                      href={entry.url.startsWith('http') ? entry.url : `https://${entry.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vault-card-url"
                    >
                      <span>{entry.url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                {/* Username / Account Row */}
                {entry.username && (
                  <div className="vault-secret-row">
                    <span className="vault-field-label">Username / Account:</span>
                    <div className="vault-field-box">
                      <span className="vault-field-text">{entry.username}</span>
                      <button
                        className="vault-copy-btn"
                        onClick={() => copyToClipboard(entry.username!, `${entry.id}-username`)}
                        title="Copy username"
                      >
                        {copiedKey === `${entry.id}-username` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedKey === `${entry.id}-username` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Password Row */}
                <div className="vault-secret-row">
                  <div className="vault-pwd-label-row">
                    <span className="vault-field-label">Password / Key:</span>
                    <span className="vault-strength-pill" style={{ color: strengthMeta.color }}>
                      {strengthMeta.label}
                    </span>
                  </div>
                  <div className="vault-field-box">
                    <span className="vault-field-text vault-pwd-text">
                      {isPasswordVisible ? entry.password : '••••••••••••••••'}
                    </span>
                    <div className="vault-pwd-buttons">
                      <button
                        className="vault-icon-action-btn"
                        onClick={() => togglePasswordVisibility(entry.id)}
                        title={isPasswordVisible ? 'Hide password' : 'Show password'}
                      >
                        {isPasswordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        className="vault-copy-btn"
                        onClick={() => copyToClipboard(entry.password, `${entry.id}-password`, entry.id)}
                        title="Copy password to clipboard"
                      >
                        {copiedKey === `${entry.id}-password` ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        <span>{copiedKey === `${entry.id}-password` ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Password Strength Progress Bar */}
                  <div className="vault-strength-track">
                    <div
                      className="vault-strength-fill"
                      style={{
                        width: `${strengthMeta.percent}%`,
                        backgroundColor: strengthMeta.color,
                      }}
                    />
                  </div>
                </div>

                {/* Notes (if any) */}
                {entry.notes && (
                  <div className="vault-notes-snippet">
                    <p>{entry.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Standalone Password Generator Modal */}
      {isGeneratorOpen && (
        <div className="vault-modal-backdrop" onClick={() => setIsGeneratorOpen(false)}>
          <div className="vault-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="vault-modal-header">
              <div className="vault-modal-title-group">
                <Sliders size={20} color="#a855f7" />
                <h3>Strong Password Generator</h3>
              </div>
              <button className="vault-modal-close-btn" onClick={() => setIsGeneratorOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="vault-generator-body">
              {/* Generated Password Box */}
              <div className="vault-gen-display-box">
                <span className="vault-gen-pwd-value">{generatedPassword}</span>
                <div className="vault-gen-display-actions">
                  <button
                    className="vault-icon-action-btn"
                    onClick={handleRegeneratePassword}
                    title="Regenerate"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    className="vault-copy-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedPassword);
                      setIsGenCopied(true);
                      setTimeout(() => setIsGenCopied(false), 2000);
                    }}
                  >
                    {isGenCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{isGenCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Length Slider */}
              <div className="vault-gen-slider-group">
                <div className="vault-gen-slider-label">
                  <span>Password Length:</span>
                  <span className="vault-gen-length-badge">{genLength} chars</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="64"
                  value={genLength}
                  onChange={(e) => setGenLength(Number(e.target.value))}
                  className="vault-slider"
                />
              </div>

              {/* Character Set Checkboxes */}
              <div className="vault-gen-options-grid">
                <label className="vault-checkbox-label">
                  <input
                    type="checkbox"
                    checked={genUpper}
                    onChange={(e) => setGenUpper(e.target.checked)}
                    className="vault-form-checkbox"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>

                <label className="vault-checkbox-label">
                  <input
                    type="checkbox"
                    checked={genLower}
                    onChange={(e) => setGenLower(e.target.checked)}
                    className="vault-form-checkbox"
                  />
                  <span>Lowercase (a-z)</span>
                </label>

                <label className="vault-checkbox-label">
                  <input
                    type="checkbox"
                    checked={genDigits}
                    onChange={(e) => setGenDigits(e.target.checked)}
                    className="vault-form-checkbox"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="vault-checkbox-label">
                  <input
                    type="checkbox"
                    checked={genSymbols}
                    onChange={(e) => setGenSymbols(e.target.checked)}
                    className="vault-form-checkbox"
                  />
                  <span>Symbols (!@#$%)</span>
                </label>
              </div>

              <div className="vault-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsGeneratorOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-primary vault-create-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    setIsGeneratorOpen(false);
                  }}
                >
                  <Copy size={16} />
                  <span>Copy &amp; Done</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add or Edit Modal */}
      {isModalOpen && (
        <div className="vault-modal-backdrop" onClick={closeModal}>
          <div className="vault-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="vault-modal-header">
              <div className="vault-modal-title-group">
                <KeyRound size={20} color="#a855f7" />
                <h3>{editingEntry ? 'Edit Vault Secret' : 'Add New Secret'}</h3>
              </div>
              <button className="vault-modal-close-btn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="vault-modal-form">
              {/* Category Selector Grid */}
              <div className="vault-form-group">
                <label className="vault-form-label">Secret Category</label>
                <div className="vault-category-select-grid">
                  {(Object.keys(CATEGORY_CONFIG) as VaultCategory[]).map((catKey) => {
                    const meta = CATEGORY_CONFIG[catKey];
                    const isSelected = formCategory === catKey;
                    return (
                      <button
                        type="button"
                        key={catKey}
                        className={`vault-cat-pick-btn ${isSelected ? 'selected' : ''}`}
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

              {/* Title */}
              <div className="vault-form-group">
                <label htmlFor={titleInputId} className="vault-form-label">
                  Title / Service Name <span style={{ color: '#f43f5e' }}>*</span>
                </label>
                <input
                  id={titleInputId}
                  type="text"
                  className="vault-form-input"
                  placeholder="e.g. GitHub Personal Access Token, AWS Console, Main Banking..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              {/* Username & URL Row */}
              <div className="vault-form-row-2">
                <div className="vault-form-group">
                  <label htmlFor={usernameInputId} className="vault-form-label">
                    Username / Email / Account ID
                  </label>
                  <input
                    id={usernameInputId}
                    type="text"
                    className="vault-form-input"
                    placeholder="e.g. admin@company.com"
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                  />
                </div>

                <div className="vault-form-group">
                  <label htmlFor={urlInputId} className="vault-form-label">
                    Website or Service URL
                  </label>
                  <input
                    id={urlInputId}
                    type="text"
                    className="vault-form-input"
                    placeholder="e.g. https://github.com/login"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field with Generator Button */}
              <div className="vault-form-group">
                <div className="vault-pwd-form-header">
                  <label htmlFor={passwordInputId} className="vault-form-label">
                    Password / Secret Key <span style={{ color: '#f43f5e' }}>*</span>
                  </label>
                  <button
                    type="button"
                    className="vault-inline-gen-btn"
                    onClick={() => setFormPassword(generatePassword(22))}
                  >
                    <Sparkles size={13} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                <div className="vault-input-with-actions">
                  <input
                    id={passwordInputId}
                    type={showFormPassword ? 'text' : 'password'}
                    className="vault-form-input"
                    placeholder="Enter password or secret token..."
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="vault-input-eye-btn"
                    onClick={() => setShowFormPassword(!showFormPassword)}
                    title={showFormPassword ? 'Hide password' : 'Show password'}
                  >
                    {showFormPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Star / Favorite Checkbox */}
              <div className="vault-form-group">
                <label className="vault-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formIsFavorite}
                    onChange={(e) => setFormIsFavorite(e.target.checked)}
                    className="vault-form-checkbox"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Star size={15} color={formIsFavorite ? '#f59e0b' : 'var(--text-muted)'} fill={formIsFavorite ? '#f59e0b' : 'none'} />
                    <span>Add to Starred Favorites for quick access</span>
                  </div>
                </label>
              </div>

              {/* Notes */}
              <div className="vault-form-group">
                <label htmlFor={notesInputId} className="vault-form-label">
                  Secure Notes / Recovery Codes (Optional)
                </label>
                <textarea
                  id={notesInputId}
                  className="vault-form-textarea"
                  placeholder="Additional security questions, 2FA backup codes, or server notes..."
                  rows={3}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Modal Buttons */}
              <div className="vault-modal-actions">
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
                  className="btn btn-primary vault-create-btn"
                  disabled={isSubmitting || !formTitle.trim() || !formPassword}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={15} className="spin" />
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingEntry ? 'Update Secret' : 'Encrypt & Store'}</span>
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
