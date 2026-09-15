import React, { useState } from 'react';
import { X, Lock, Mail, User, Eye, EyeOff, KeyRound, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { login, register, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  // UI states
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    clearError();
    setClientError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearError();

    // Client-side quick checks
    if (!email || !password) {
      setClientError('Please fill in all required fields.');
      return;
    }

    if (mode === 'register') {
      if (!name) {
        setClientError('Name is required.');
        return;
      }
      if (password.length < 8) {
        setClientError('Password must be at least 8 characters long.');
        return;
      }
      if (password !== passwordConfirmation) {
        setClientError('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, passwordConfirmation);
      }
      onClose();
    } catch {
      // Error handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = clientError || error;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon">
              <Lock size={20} />
            </div>
            <div>
              <h2 className="modal-title">
                {mode === 'login' ? 'Sign In to RemiVault' : 'Create Your Vault'}
              </h2>
              <p className="modal-subtitle">
                {mode === 'login'
                  ? 'Access your encrypted notes, reminders, and credentials.'
                  : 'Start safeguarding your personal information securely.'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="auth-tab-group">
          <button
            type="button"
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('login')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => handleModeSwitch('register')}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {activeError && (
          <div className="auth-error-alert">
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{activeError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="reg-name" className="form-label">Full Name</label>
              <div className="input-with-icon">
                <User size={18} className="input-icon" />
                <input
                  id="reg-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth-email" className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="auth-password" className="form-label">
              {mode === 'login' ? 'Account Password' : 'Create Strong Password'}
            </label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder={mode === 'login' ? 'Enter password' : 'Min 8 chars, letters & numbers'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="auth-confirm" className="form-label">Confirm Password</label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="auth-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Re-enter password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ marginTop: '0.75rem', width: '100%' }}
          >
            {isSubmitting ? (
              'Authenticating...'
            ) : mode === 'login' ? (
              <>Sign In <ArrowRight size={16} /></>
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        {/* Security Note Footer */}
        <div className="modal-footer-note">
          <Lock size={13} />
          <span>Protected by Bcrypt password hashing &amp; Sanctum Bearer tokens.</span>
        </div>
      </div>
    </div>
  );
};
