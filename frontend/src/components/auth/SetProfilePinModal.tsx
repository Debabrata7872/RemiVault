import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, ArrowLeft, CheckCircle2, RotateCcw, Delete, X, Loader2 } from 'lucide-react';
import type { DeviceProfile } from '../../services/deviceProfiles';

interface SetProfilePinModalProps {
  isOpen: boolean;
  profile: DeviceProfile | null;
  onSavePin: (pin: string) => Promise<void>;
  onSkip?: () => void;
}

export const SetProfilePinModal: React.FC<SetProfilePinModalProps> = ({
  isOpen,
  profile,
  onSavePin,
  onSkip,
}) => {
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Reset internal state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('create');
      setPin('');
      setConfirmPin('');
      setError(null);
      setIsSuccess(false);
      setIsSubmitting(false);
      setIsShaking(false);
    }
  }, [isOpen]);

  const activeValue = step === 'create' ? pin : confirmPin;

  // Handle final confirmation
  const handleFinalSubmit = useCallback(async (confirmedPin: string) => {
    setIsSubmitting(true);
    setError(null);
    try {
      setIsSuccess(true);
      await onSavePin(confirmedPin);
    } catch (err: unknown) {
      const e = err as Error;
      setIsSuccess(false);
      setError(e.message || 'Failed to save PIN.');
      setConfirmPin('');
      setStep('create');
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  }, [onSavePin]);

  // Handle digit input
  const handleDigit = useCallback((digit: string) => {
    if (isSubmitting || isSuccess) return;
    setError(null);

    if (step === 'create') {
      if (pin.length < 4) {
        const next = pin + digit;
        setPin(next);
        if (next.length === 4) {
          // Smooth auto-transition to confirm step
          setTimeout(() => {
            setStep('confirm');
          }, 200);
        }
      }
    } else {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            handleFinalSubmit(pin);
          } else {
            // Mismatch
            setIsShaking(true);
            setError('PINs do not match. Please try again.');
            setTimeout(() => {
              setIsShaking(false);
              setConfirmPin('');
              setPin('');
              setStep('create');
            }, 600);
          }
        }
      }
    }
  }, [step, pin, confirmPin, isSubmitting, isSuccess, handleFinalSubmit]);

  const handleBackspace = useCallback(() => {
    if (isSubmitting || isSuccess) return;
    setError(null);
    if (step === 'create') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (confirmPin.length === 0) {
        setStep('create');
      } else {
        setConfirmPin((prev) => prev.slice(0, -1));
      }
    }
  }, [step, confirmPin.length, isSubmitting, isSuccess]);

  const handleClear = useCallback(() => {
    if (isSubmitting || isSuccess) return;
    setError(null);
    if (step === 'confirm') {
      setConfirmPin('');
    } else {
      setPin('');
    }
  }, [step, isSubmitting, isSuccess]);

  // Listen to physical keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' && onSkip) {
        onSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDigit, handleBackspace, onSkip]);

  if (!isOpen || !profile) return null;

  return (
    <div className="modal-backdrop pin-onboarding-backdrop" onClick={onSkip} style={{ zIndex: 1100 }}>
      <div 
        className="modal-content pin-onboarding-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close / Skip button */}
        {onSkip && (
          <button 
            type="button" 
            className="pin-onboarding-close-btn" 
            onClick={onSkip}
            title="Maybe later"
          >
            <X size={18} />
          </button>
        )}

        {/* Back button if on confirm step */}
        {step === 'confirm' && !isSuccess && (
          <button
            type="button"
            className="pin-onboarding-back-btn"
            onClick={() => {
              setConfirmPin('');
              setStep('create');
              setError(null);
            }}
            title="Change chosen PIN"
          >
            <ArrowLeft size={16} />
            <span>Change</span>
          </button>
        )}

        {/* Brand Icon & Heading */}
        <div className="pin-onboarding-hero">
          <div className={`pin-onboarding-badge ${isSuccess ? 'success' : ''}`}>
            {isSuccess ? <CheckCircle2 size={26} color="#10b981" /> : <ShieldCheck size={26} />}
          </div>
          <h3 className="pin-onboarding-title">
            {isSuccess 
              ? 'PIN Configured!' 
              : step === 'create' 
              ? 'Create 4-Digit PIN' 
              : 'Confirm 4-Digit PIN'}
          </h3>
          <p className="pin-onboarding-subtitle">
            {isSuccess
              ? 'Your profile PIN is securely synced and active.'
              : step === 'create'
              ? 'Set a fast 4-digit code to quickly unlock your vault on any device.'
              : 'Re-enter your 4 digits to verify.'}
          </p>
        </div>

        {/* 4-Slot PIN Visual Dots */}
        <div className={`pin-onboarding-slots-row ${isShaking ? 'shake-animation' : ''} ${isSubmitting ? 'submitting' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < activeValue.length;
            return (
              <div 
                key={idx} 
                className={`pin-onboarding-slot ${isFilled ? 'filled' : ''} ${error ? 'error' : ''} ${isSuccess ? 'success' : ''} ${isSubmitting ? 'verifying' : ''}`}
              >
                {isFilled && <div className="pin-onboarding-dot-fill" />}
              </div>
            );
          })}
        </div>

        {/* Status / Error Message */}
        <div className="pin-onboarding-feedback">
          {error && <span className="pin-error-text">{error}</span>}
          {isSubmitting && (
            <span className="pin-loading-text">
              <Loader2 size={13} className="spin" />
              <span>Saving &amp; securing PIN...</span>
            </span>
          )}
          {isSuccess && !isSubmitting && <span className="pin-success-text">PIN configured successfully!</span>}
          {!error && !isSuccess && !isSubmitting && (
            <span className="pin-hint-text">
              {step === 'create' ? 'Step 1 of 2: Choose PIN' : 'Step 2 of 2: Confirm PIN'}
            </span>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="pin-onboarding-keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              className="pin-keypad-btn"
              onClick={() => handleDigit(d)}
              disabled={isSubmitting || isSuccess}
            >
              <span>{d}</span>
            </button>
          ))}

          <button
            type="button"
            className="pin-keypad-btn action"
            onClick={handleClear}
            disabled={activeValue.length === 0 || isSubmitting || isSuccess}
            title="Clear"
          >
            <RotateCcw size={18} />
          </button>

          <button
            type="button"
            className="pin-keypad-btn"
            onClick={() => handleDigit('0')}
            disabled={isSubmitting || isSuccess}
          >
            <span>0</span>
          </button>

          <button
            type="button"
            className="pin-keypad-btn action"
            onClick={handleBackspace}
            disabled={activeValue.length === 0 || isSubmitting || isSuccess}
            title="Backspace"
          >
            <Delete size={20} />
          </button>
        </div>

        {/* Footer / Skip Action */}
        {onSkip && (
          <div className="pin-onboarding-footer">
            <button
              type="button"
              className="pin-onboarding-skip-btn"
              onClick={onSkip}
              disabled={isSubmitting || isSuccess}
            >
              Maybe Later
            </button>
            <span className="pin-onboarding-note">You can also configure this anytime in Settings.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetProfilePinModal;
