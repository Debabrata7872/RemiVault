import React, { useEffect } from 'react';
import { X, Sun, Moon, Monitor, Check, User, Shield, HardDrive, Sliders } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import type { Theme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { userPreference, setTheme } = useTheme();
  const { user } = useAuth();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const themeOptions: {
    mode: Theme;
    title: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      mode: 'light',
      title: 'Light Mode',
      description: 'Clean, high-contrast bright theme with crisp pearl surfaces.',
      icon: <Sun size={20} color="#f59e0b" />,
    },
    {
      mode: 'dark',
      title: 'Dark Mode',
      description: 'Deep obsidian glassmorphism with vivid neon vault accents.',
      icon: <Moon size={20} color="#818cf8" />,
    },
    {
      mode: 'system',
      title: 'System Theme',
      description: 'Automatically matches your device or OS color scheme schedule.',
      icon: <Monitor size={20} color="#06b6d4" />,
    },
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content settings-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon" style={{ background: 'rgba(79, 70, 229, 0.12)', color: 'var(--primary)' }}>
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="modal-title">Settings &amp; Preferences</h2>
              <p className="modal-subtitle">Configure your RemiVault workspace and display preferences.</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close settings">
            <X size={20} />
          </button>
        </div>

        {/* Theme Preferences Section */}
        <section className="settings-section">
          <div className="settings-section-header">
            <h3 className="settings-section-title">Theme &amp; Appearance</h3>
            <p className="settings-section-desc">
              Choose your display mode. Your preference is securely stored in this browser for future logins.
            </p>
          </div>

          <div className="theme-preference-grid">
            {themeOptions.map((opt) => {
              const isSelected = userPreference === opt.mode;
              return (
                <div
                  key={opt.mode}
                  className={`theme-card-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => setTheme(opt.mode)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setTheme(opt.mode);
                    }
                  }}
                >
                  <div className="theme-card-header">
                    <div className="theme-card-icon">{opt.icon}</div>
                    {isSelected && (
                      <span className="theme-card-badge">
                        <Check size={13} />
                        <span>Active</span>
                      </span>
                    )}
                  </div>
                  <h4 className="theme-card-title">{opt.title}</h4>
                  <p className="theme-card-desc">{opt.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Account Details Section */}
        {user && (
          <section className="settings-section" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
            <div className="settings-section-header">
              <h3 className="settings-section-title">Account Details</h3>
              <p className="settings-section-desc">Authenticated user session information.</p>
            </div>

            <div className="settings-user-info-card">
              <div className="settings-user-profile-group">
                <div className="settings-user-avatar">
                  <User size={18} />
                </div>
                <div className="settings-user-meta">
                  <span className="settings-user-name">{user.name}</span>
                  <span className="settings-user-email" title={user.email}>{user.email}</span>
                </div>
              </div>
              <div className="settings-security-tag">
                <Shield size={13} color="#10b981" />
                <span>Isolated Vault</span>
              </div>
            </div>
          </section>
        )}

        {/* System & Storage Info */}
        <div className="settings-footer-info">
          <div className="settings-footer-info-text">
            <HardDrive size={13} />
            <span>Preferences saved to localStorage</span>
          </div>
          <button className="btn btn-primary settings-footer-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
