import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Eye, 
  EyeOff, 
  KeyRound, 
  ShieldAlert, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sendEmailOtpApi, checkEmailOtpApi, type ApiError } from '../../services/api';
import { auth, googleProvider } from '../../config/firebase';
import { 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber
} from 'firebase/auth';
import type { ConfirmationResult } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register' | 'forgot_password';
type Step = 'details' | 'otp' | 'password';

/**
 * Mask email or phone number for secure preview
 * Example: debabratasahoo499905@gmail.com -> de.....05@gmail.com
 * Example: 8512345631 -> 85******31
 */
function maskIdentifier(val: string): string {
  const trimmed = val.trim();
  if (trimmed.includes('@')) {
    const [username, domain] = trimmed.split('@');
    if (!domain) return trimmed;
    if (username.length <= 4) {
      return `${username.slice(0, 1)}.....${username.slice(-1)}@${domain}`;
    }
    return `${username.slice(0, 2)}.....${username.slice(-2)}@${domain}`;
  } else {
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 8) {
      const firstTwo = digits.slice(0, 2);
      const lastTwo = digits.slice(-2);
      const stars = '*'.repeat(Math.max(6, digits.length - 4));
      return `${firstTwo}${stars}${lastTwo}`;
    }
    return trimmed;
  }
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
}) => {
  const { 
    login, 
    registerWithOtp, 
    resetPasswordWithOtp, 
    loginWithFirebase, 
    error, 
    clearError 
  } = useAuth();
  
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<Step>('details');
  
  // Input fields
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState(''); // Email or Phone number
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  
  // OTP state
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Phone auth Firebase state
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verifiedFirebaseToken, setVerifiedFirebaseToken] = useState<string | null>(null);

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Helper to start an abortable async operation
  const startAsyncOp = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    isCancelledRef.current = false;
    return abortControllerRef.current;
  };

  // Forceful closure: immediately aborts network calls, ignores pending Google/SMS results, and closes modal
  const handleForceClose = () => {
    isCancelledRef.current = true;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch {
        // ignore
      }
      recaptchaVerifierRef.current = null;
    }
    setIsSubmitting(false);
    setIsGoogleSubmitting(false);
    setClientError(null);
    clearError();
    onClose();
  };

  // Close forcefully on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleForceClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {
          // ignore
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  // Sync state whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      isCancelledRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      setMode(initialMode);
      setStep('details');
      setName('');
      setIdentifier('');
      setPassword('');
      setPasswordConfirmation('');
      setOtp('');
      setCooldown(0);
      setSuccessNotice(null);
      setClientError(null);
      setConfirmationResult(null);
      setVerifiedFirebaseToken(null);
      setIsSubmitting(false);
      setIsGoogleSubmitting(false);
      clearError();
    }
  }, [isOpen, initialMode]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: AuthMode) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsSubmitting(false);
    setIsGoogleSubmitting(false);
    setMode(newMode);
    setStep('details');
    setOtp('');
    setPassword('');
    setPasswordConfirmation('');
    setSuccessNotice(null);
    setClientError(null);
    clearError();
  };

  const isEmail = (val: string) => val.includes('@');

  /**
   * Google Sign-In with Firebase Popup (Sleek 1-click)
   */
  const handleGoogleSignIn = async () => {
    const controller = startAsyncOp();
    setClientError(null);
    clearError();
    setIsGoogleSubmitting(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);

      if (isCancelledRef.current || controller.signal.aborted) {
        return;
      }

      const idToken = await result.user.getIdToken();
      if (isCancelledRef.current || controller.signal.aborted) {
        return;
      }

      const photoUrl = result.user.photoURL;

      await loginWithFirebase(
        idToken, 
        result.user.email, 
        result.user.displayName, 
        result.user.phoneNumber,
        photoUrl,
        { signal: controller.signal }
      );

      if (isCancelledRef.current || controller.signal.aborted) {
        return;
      }

      onClose();
    } catch (err: unknown) {
      if (isCancelledRef.current || controller.signal.aborted) {
        return;
      }
      const errorObj = err as { code?: string; message?: string; isAborted?: boolean };
      if (errorObj.isAborted) {
        return;
      }
      if (errorObj.code === 'auth/popup-closed-by-user' || errorObj.code === 'auth/cancelled-popup-request') {
        setClientError('Google sign-in was cancelled.');
      } else {
        setClientError(errorObj.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      if (!isCancelledRef.current) {
        setIsGoogleSubmitting(false);
      }
    }
  };

  /**
   * Step 1: Send OTP to Email or Phone (Registration or Forgot Password)
   */
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearError();

    const cleanInput = identifier.trim();
    if (!cleanInput) {
      setClientError('Please enter your email or phone number.');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setClientError('Please enter your full name.');
      return;
    }

    const controller = startAsyncOp();
    setIsSubmitting(true);

    try {
      if (isEmail(cleanInput)) {
        // Email OTP via Gmail SMTP
        const otpType = mode === 'register' ? 'register' : 'forgot_password';
        const res = await sendEmailOtpApi(
          {
            email: cleanInput,
            type: otpType,
            name: mode === 'register' ? name.trim() : undefined,
          },
          { signal: controller.signal }
        );

        if (isCancelledRef.current || controller.signal.aborted) return;

        setSuccessNotice(res.message);
        setCooldown(res.cooldown_seconds || 60);
        setStep('otp');
      } else {
        // Phone OTP via Firebase
        const cleanPhone = cleanInput.startsWith('+') ? cleanInput : `+91${cleanInput}`;
        if (!recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
          });
        }

        const confirmation = await signInWithPhoneNumber(auth, cleanPhone, recaptchaVerifierRef.current);
        if (isCancelledRef.current || controller.signal.aborted) return;

        setConfirmationResult(confirmation);
        setCooldown(60);
        setSuccessNotice(`Verification code sent to ${maskIdentifier(cleanPhone)}`);
        setStep('otp');
      }
    } catch (err: unknown) {
      if (isCancelledRef.current || controller.signal.aborted) return;
      const apiErr = err as ApiError;
      if (apiErr?.isAborted) return;
      setClientError(apiErr?.message || 'Failed to dispatch verification code. Please check your input.');
    } finally {
      if (!isCancelledRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  /**
   * Step 2: Validate OTP Code before advancing to Password Panel
   */
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearError();

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setClientError('Please enter the 6-digit verification code.');
      return;
    }

    const controller = startAsyncOp();
    setIsSubmitting(true);

    try {
      const cleanInput = identifier.trim();

      if (isEmail(cleanInput)) {
        // Check email OTP with backend
        const otpType = mode === 'register' ? 'register' : 'forgot_password';
        await checkEmailOtpApi(
          {
            email: cleanInput,
            type: otpType,
            otp: cleanOtp,
          },
          { signal: controller.signal }
        );

        if (isCancelledRef.current || controller.signal.aborted) return;

        // OTP matches! Advance to password panel
        setSuccessNotice('Security code verified! Please set your password.');
        setStep('password');
      } else {
        // Check phone OTP with Firebase
        if (!confirmationResult) {
          throw new Error('No active phone verification session found.');
        }

        const userCredential = await confirmationResult.confirm(cleanOtp);
        if (isCancelledRef.current || controller.signal.aborted) return;

        const idToken = await userCredential.user.getIdToken();
        if (isCancelledRef.current || controller.signal.aborted) return;

        setVerifiedFirebaseToken(idToken);

        // OTP matches! Advance to password panel
        setSuccessNotice('Phone verified! Please set your password.');
        setStep('password');
      }
    } catch (err: unknown) {
      if (isCancelledRef.current || controller.signal.aborted) return;
      const apiErr = err as ApiError;
      if (apiErr?.isAborted) return;
      setClientError(apiErr?.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      if (!isCancelledRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  /**
   * Step 3: Set Password and Complete Registration or Reset
   */
  const handleCompleteWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearError();

    if (password.length < 8) {
      setClientError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== passwordConfirmation) {
      setClientError('Passwords do not match.');
      return;
    }

    const controller = startAsyncOp();
    setIsSubmitting(true);

    try {
      const cleanInput = identifier.trim();

      if (mode === 'register') {
        if (isEmail(cleanInput)) {
          await registerWithOtp(
            name.trim(), 
            cleanInput, 
            password, 
            passwordConfirmation, 
            otp.trim(),
            { signal: controller.signal }
          );
        } else {
          // Phone registration
          if (!verifiedFirebaseToken) {
            throw new Error('Phone verification expired. Please try again.');
          }
          await loginWithFirebase(
            verifiedFirebaseToken, 
            null, 
            name.trim(), 
            cleanInput,
            null,
            { signal: controller.signal }
          );
        }
        if (isCancelledRef.current || controller.signal.aborted) return;
        onClose();
      } else if (mode === 'forgot_password') {
        await resetPasswordWithOtp(
          cleanInput, 
          password, 
          passwordConfirmation, 
          otp.trim(),
          { signal: controller.signal }
        );
        if (isCancelledRef.current || controller.signal.aborted) return;
        onClose();
      }
    } catch (err: unknown) {
      if (isCancelledRef.current || controller.signal.aborted) return;
      const apiErr = err as ApiError;
      if (apiErr?.isAborted) return;
      setClientError(apiErr?.message || 'Failed to complete. Please try again.');
    } finally {
      if (!isCancelledRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  /**
   * Standard Sign In (Email or Phone + Password)
   */
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearError();

    if (!identifier.trim() || !password) {
      setClientError('Please enter both your email/phone and password.');
      return;
    }

    const controller = startAsyncOp();
    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password, { signal: controller.signal });
      if (isCancelledRef.current || controller.signal.aborted) return;
      onClose();
    } catch (err: unknown) {
      if (isCancelledRef.current || controller.signal.aborted) return;
      // Error handled in AuthContext
    } finally {
      if (!isCancelledRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  const activeError = clientError || error;

  return (
    <div className="modal-backdrop" onClick={handleForceClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Hidden recaptcha element for Firebase Phone SMS */}
        <div id="recaptcha-container"></div>

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="modal-badge-icon">
              {step === 'password' ? <ShieldCheck size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <h2 className="modal-title">
                {step === 'password'
                  ? 'Set Your Password'
                  : step === 'otp'
                  ? 'Verify Security Code'
                  : mode === 'login'
                  ? 'Sign In to RemiVault'
                  : mode === 'register'
                  ? 'Create Your Vault'
                  : 'Reset Password'}
              </h2>
              <p className="modal-subtitle">
                {step === 'password'
                  ? 'Create a strong password to protect your account.'
                  : step === 'otp'
                  ? 'Enter the 6-digit code sent to your email.'
                  : mode === 'login'
                  ? 'Access your saved notes, reminders, and passwords.'
                  : mode === 'register'
                  ? 'Start organizing your personal information securely.'
                  : 'Verify your email to reset your account password.'}
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleForceClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem'
          }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Alert */}
        {activeError && (
          <div className="auth-error-alert">
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{activeError}</span>
          </div>
        )}

        {/* =============================================================
            VIEW 1: SIGN IN MODE (Direct & Focused)
            ============================================================= */}
        {mode === 'login' && step === 'details' && (
          <div className="auth-form-wrapper">
            {/* Sleek Google Sign-In Button */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
            >
              <svg 
                className="google-icon-svg" 
                viewBox="0 0 24 24" 
                width="18" 
                height="18"
                style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0 }}
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSubmitting ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleStandardLogin} className="auth-form">
              <div className="form-group">
                <label htmlFor="login-identifier" className="form-label">Email or Phone</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="login-identifier"
                    type="text"
                    className="form-input"
                    placeholder="Email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <button
                    type="button"
                    className="auth-link-btn"
                    onClick={() => handleModeSwitch('forgot_password')}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="input-with-icon">
                  <KeyRound size={18} className="input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
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

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Signing in...' : <>Sign In <ArrowRight size={16} /></>}
              </button>

              {/* Link below sign in button */}
              <div className="auth-switch-text">
                Don't have an account?{' '}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => handleModeSwitch('register')}
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =============================================================
            VIEW 2: CREATE ACCOUNT - STEP 1 (Name + Email/Phone, NO Password yet)
            ============================================================= */}
        {mode === 'register' && step === 'details' && (
          <div className="auth-form-wrapper">
            {/* Sleek Google Sign-In Button */}
            <button
              type="button"
              className="auth-google-btn"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
            >
              <svg 
                className="google-icon-svg" 
                viewBox="0 0 24 24" 
                width="18" 
                height="18"
                style={{ width: 18, height: 18, minWidth: 18, minHeight: 18, flexShrink: 0 }}
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isGoogleSubmitting ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <form onSubmit={handleSendOtp} className="auth-form">
              <div className="form-group">
                <label htmlFor="reg-name" className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="reg-name"
                    type="text"
                    className="form-input"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-identifier" className="form-label">Email or Phone</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="reg-identifier"
                    type="text"
                    className="form-input"
                    placeholder="Email or phone"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '0.5rem' }}
              >
                {isSubmitting ? 'Sending code...' : <>Get Code <ArrowRight size={16} /></>}
              </button>

              <div className="auth-switch-text">
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-link-btn"
                  onClick={() => handleModeSwitch('login')}
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =============================================================
            VIEW 3: FORGOT PASSWORD - STEP 1 (Enter Email or Phone)
            ============================================================= */}
        {mode === 'forgot_password' && step === 'details' && (
          <form onSubmit={handleSendOtp} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-identifier" className="form-label">Email or Phone</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  id="forgot-identifier"
                  type="text"
                  className="form-input"
                  placeholder="Email or phone"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Sending code...' : <>Send Code <ArrowRight size={16} /></>}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => handleModeSwitch('login')}
              >
                ← Back to Sign in
              </button>
            </div>
          </form>
        )}

        {/* =============================================================
            VIEW 4: STEP 2 - OTP VERIFICATION (With Masked Preview at Top)
            ============================================================= */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="auth-form">
            {/* Masked Preview at Top e.g. de.....05@gmail.com or 85******31 */}
            <div className="otp-preview-banner">
              <span className="otp-preview-label">Verification Code Sent To</span>
              <span className="otp-preview-masked">{maskIdentifier(identifier)}</span>
            </div>

            <div className="form-group">
              <label htmlFor="otp-input" className="form-label" style={{ textAlign: 'center' }}>
                Enter 6-Digit Code
              </label>
              <input
                id="otp-input"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="otp-digit-input"
                placeholder="••••••"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                autoFocus
                required
              />
            </div>

            <div className="otp-resend-row">
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setStep('details');
                  setOtp('');
                }}
              >
                ← Change Email/Phone
              </button>

              <button
                type="button"
                className="auth-link-btn"
                disabled={cooldown > 0 || isSubmitting}
                onClick={handleSendOtp}
              >
                {cooldown > 0 ? (
                  `Resend code in ${cooldown}s`
                ) : (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <RotateCcw size={13} /> Resend Code
                  </span>
                )}
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting || otp.length < 6}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Verifying Code...' : <>Verify Code <ArrowRight size={16} /></>}
            </button>
          </form>
        )}

        {/* =============================================================
            VIEW 5: STEP 3 - PASSWORD PANEL (Only shown AFTER OTP matches!)
            ============================================================= */}
        {step === 'password' && (
          <form onSubmit={handleCompleteWithPassword} className="auth-form">
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem'
            }}>
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Verified:</strong> {maskIdentifier(identifier)}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="create-password" className="form-label">
                {mode === 'register' ? 'Create Password' : 'New Password'}
              </label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="create-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Password (min 8 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
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

            <div className="form-group">
              <label htmlFor="create-password-confirm" className="form-label">
                {mode === 'register' ? 'Confirm Password' : 'Confirm New Password'}
              </label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="create-password-confirm"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Confirm password"
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {isSubmitting ? (
                'Saving...'
              ) : mode === 'register' ? (
                <>Create Account <ArrowRight size={16} /></>
              ) : (
                <>Reset Password <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        )}

        {/* Security Note Footer */}
        <div className="modal-footer-note">
          <Lock size={13} />
          <span>End-to-end encrypted &amp; private to your account.</span>
        </div>
      </div>
    </div>
  );
};
