import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { verifyAdminPinApi } from '../../services/api';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPinVerified: () => void;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onPinVerified,
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '']);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const inputRefs = [
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
    useRef<HTMLInputElement | null>(null),
  ];

  // Auto focus first input on open & reset state
  useEffect(() => {
    if (isOpen) {
      setDigits(['', '', '', '']);
      setError(null);
      setIsVerifying(false);
      setTimeout(() => {
        inputRefs[0].current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Auto dismiss/cancel PIN modal if window loses focus, tab changes, or Escape is pressed
  useEffect(() => {
    if (!isOpen) return;

    const handleBlurOrHide = () => {
      onClose();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('blur', handleBlurOrHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('blur', handleBlurOrHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const digit = cleaned.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);

    // Auto advance to next input
    if (index < 3) {
      inputRefs[index + 1].current?.focus();
    } else {
      // 4th digit entered - automatically verify
      const fullPin = next.join('');
      if (fullPin.length === 4) {
        verifyPin(fullPin);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs[index - 1].current?.focus();
      } else {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;

    const next = ['', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setDigits(next);

    if (pasted.length === 4) {
      inputRefs[3].current?.focus();
      verifyPin(pasted);
    } else {
      inputRefs[pasted.length].current?.focus();
    }
  };

  const verifyPin = async (pinToVerify: string) => {
    if (pinToVerify.length !== 4) {
      setError('Please enter all 4 digits of the Master Admin PIN.');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const result = await verifyAdminPinApi(pinToVerify);
      if (result.valid) {
        onPinVerified();
      } else {
        triggerShake(result.message || 'Incorrect Master Admin PIN. Access denied.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      triggerShake(e?.message || 'Verification failed. Please check network and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const triggerShake = (errMsg: string) => {
    setError(errMsg);
    setIsShaking(true);
    setDigits(['', '', '', '']);
    setTimeout(() => {
      setIsShaking(false);
      inputRefs[0].current?.focus();
    }, 500);
  };

  const handleNumpadClick = (num: string) => {
    const emptyIndex = digits.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      handleDigitChange(emptyIndex, num);
    }
  };

  const handleNumpadBackspace = () => {
    const lastFilledIndex = [...digits].reverse().findIndex(d => d !== '');
    if (lastFilledIndex !== -1) {
      const actualIndex = 3 - lastFilledIndex;
      const next = [...digits];
      next[actualIndex] = '';
      setDigits(next);
      inputRefs[actualIndex].current?.focus();
    }
  };

  const fullPinString = digits.join('');

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1050 }}>
      <div 
        className={`modal-content admin-pin-modal ${isShaking ? 'shake-animation' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '440px',
          width: '92vw',
          padding: '2rem 1.75rem',
          borderRadius: '20px',
          background: 'var(--surface-color, #131722)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button 
          type="button"
          className="modal-close-btn" 
          onClick={onClose} 
          title="Cancel"
          style={{ position: 'absolute', top: '1.25rem', right: '1.25rem' }}
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.25)',
              marginBottom: '1rem'
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Admin Console Access
            </h2>
            <span 
              className="badge" 
              style={{ 
                background: 'rgba(99, 102, 241, 0.2)', 
                color: '#a5b4fc', 
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontSize: '0.68rem',
                fontWeight: 600,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px'
              }}
            >
              Master PIN
            </span>
          </div>

          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            Enter your 4-digit Master Admin PIN to unlock the live user analytics and system telemetry console.
          </p>
        </div>

        {/* PIN Input Row */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: '0.75rem',
              marginBottom: '1rem' 
            }}
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isVerifying}
                autoComplete="off"
                style={{
                  width: '54px',
                  height: '62px',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  borderRadius: '12px',
                  background: 'var(--card-bg, rgba(255, 255, 255, 0.04))',
                  border: digit ? '2px solid #818cf8' : '1px solid var(--border-color, rgba(255, 255, 255, 0.12))',
                  color: 'var(--text-primary)',
                  boxShadow: digit ? '0 0 16px rgba(99, 102, 241, 0.3)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none'
                }}
              />
            ))}
          </div>

          {/* Toggle PIN visibility */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                transition: 'color 0.2s'
              }}
            >
              {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{showPin ? 'Hide PIN Digits' : 'View Entered PIN'}</span>
            </button>
          </div>
        </div>

        {/* Error message banner */}
        {error && (
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.65rem 0.9rem',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#f87171',
              fontSize: '0.82rem',
              marginBottom: '1.25rem',
              textAlign: 'left'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Submit / Unlock Button */}
        <button
          type="button"
          onClick={() => verifyPin(fullPinString)}
          disabled={fullPinString.length !== 4 || isVerifying}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '0.8rem',
            fontSize: '0.95rem',
            fontWeight: 600,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.35)',
            cursor: fullPinString.length === 4 && !isVerifying ? 'pointer' : 'not-allowed',
            opacity: fullPinString.length === 4 && !isVerifying ? 1 : 0.65,
          }}
        >
          {isVerifying ? (
            <>
              <Loader2 size={18} className="spin" />
              <span>Verifying Authorization...</span>
            </>
          ) : (
            <>
              <Lock size={16} />
              <span>Unlock Admin Console</span>
            </>
          )}
        </button>

        {/* Numeric On-Screen Keypad for mobile / quick entry */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            marginTop: '1.25rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))'
          }}
        >
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleNumpadClick(n)}
              disabled={isVerifying}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
                borderRadius: '10px',
                padding: '0.65rem 0',
                color: 'var(--text-primary)',
                fontSize: '1.1rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.15s, transform 0.1s',
              }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {n}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleNumpadClick('0')}
            disabled={isVerifying}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              borderRadius: '10px',
              padding: '0.65rem 0',
              color: 'var(--text-primary)',
              fontSize: '1.1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s, transform 0.1s',
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            0
          </button>
          <button
            type="button"
            onClick={handleNumpadBackspace}
            disabled={isVerifying}
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color, rgba(255, 255, 255, 0.08))',
              borderRadius: '10px',
              padding: '0.65rem 0',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s, transform 0.1s',
            }}
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  );
};
