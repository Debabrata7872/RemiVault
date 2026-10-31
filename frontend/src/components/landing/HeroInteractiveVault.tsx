import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Sparkles, 
  RefreshCw, 
  Clock, 
  Calendar, 
  ArrowRight,
  Smartphone
} from 'lucide-react';
import { playFintechChime } from '../../services/notificationService';
import { 
  triggerHapticTick, 
  triggerHapticMedium, 
  triggerHapticSuccess, 
  triggerHapticSelection 
} from '../../services/hapticsService';
import './HeroInteractiveVault.css';

interface HeroInteractiveVaultProps {
  onOpenRegister: () => void;
}

type SandboxMode = 'credentials' | 'pin' | 'dates';

export const HeroInteractiveVault: React.FC<HeroInteractiveVaultProps> = ({
  onOpenRegister,
}) => {
  const [activeMode, setActiveMode] = useState<SandboxMode>('credentials');

  // Mode 1: Credential Decrypt & Cipher Scramble States
  const [isRevealed, setIsRevealed] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [displayedPassword, setDisplayedPassword] = useState('••••••••••••••••');
  const [targetPassword, setTargetPassword] = useState('Tr34sury$V4ult#2026!');
  const [autoLockSeconds, setAutoLockSeconds] = useState(8);
  const [isCopied, setIsCopied] = useState(false);

  const autoLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrambleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mode 2: 4-Digit PIN Simulation States
  const [pinDigits, setPinDigits] = useState<string[]>([]);
  const [isPinUnlocked, setIsPinUnlocked] = useState(false);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (autoLockTimerRef.current) clearInterval(autoLockTimerRef.current);
      if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current);
    };
  }, []);

  // Handle Live Cipher Decrypt Scramble Animation
  const handleToggleReveal = () => {
    triggerHapticMedium();
    if (isRevealed) {
      // Re-lock
      setIsRevealed(false);
      setDisplayedPassword('••••••••••••••••');
      if (autoLockTimerRef.current) clearInterval(autoLockTimerRef.current);
      playFintechChime();
      return;
    }

    // Start scramble reveal
    setIsScrambling(true);
    playFintechChime();
    const glyphs = '!@#$%^&*()_+-=[]{}|;:,.<>?0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    let iterations = 0;
    const maxIterations = 10;

    if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current);

    scrambleTimerRef.current = setInterval(() => {
      iterations++;
      const scrambled = targetPassword
        .split('')
        .map((char, index) => {
          if (index < Math.floor((iterations / maxIterations) * targetPassword.length)) {
            return char;
          }
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        })
        .join('');

      setDisplayedPassword(scrambled);

      if (iterations >= maxIterations) {
        if (scrambleTimerRef.current) clearInterval(scrambleTimerRef.current);
        setDisplayedPassword(targetPassword);
        setIsScrambling(false);
        setIsRevealed(true);
        triggerHapticSuccess();
        startAutoLockCountdown();
      }
    }, 35);
  };

  // Start 8-second auto-lock countdown
  const startAutoLockCountdown = () => {
    if (autoLockTimerRef.current) clearInterval(autoLockTimerRef.current);
    setAutoLockSeconds(8);

    autoLockTimerRef.current = setInterval(() => {
      setAutoLockSeconds((prev) => {
        if (prev <= 1) {
          if (autoLockTimerRef.current) clearInterval(autoLockTimerRef.current);
          setIsRevealed(false);
          setDisplayedPassword('••••••••••••••••');
          triggerHapticMedium();
          playFintechChime();
          return 8;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Re-roll password generator
  const handleRegenerateDemoPassword = () => {
    triggerHapticMedium();
    const prefixes = ['Remi', 'Vault', 'Cipher', 'Shield', 'Fintech', 'Alpha'];
    const specials = ['!@', '#$', '%^', '&*', '$2026!'];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const chosenPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const chosenSpecial = specials[Math.floor(Math.random() * specials.length)];
    const newPass = `${chosenPrefix}#${randomNum}${chosenSpecial}`;

    setTargetPassword(newPass);
    if (isRevealed) {
      setDisplayedPassword(newPass);
      setAutoLockSeconds(8);
    }
    playFintechChime();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(targetPassword);
    setIsCopied(true);
    triggerHapticSuccess();
    playFintechChime();
    setTimeout(() => setIsCopied(false), 2000);
  };

  // PIN Keypad Simulation Actions
  const handlePinPress = (digit: string) => {
    if (pinDigits.length >= 4 || isPinUnlocked) return;
    triggerHapticTick();
    const updated = [...pinDigits, digit];
    setPinDigits(updated);
    playFintechChime();

    if (updated.length === 4) {
      // Auto unlock check
      setTimeout(() => {
        setIsPinUnlocked(true);
        triggerHapticSuccess();
        playFintechChime();
      }, 200);
    }
  };

  const handlePinReset = () => {
    triggerHapticTick();
    setPinDigits([]);
    setIsPinUnlocked(false);
    playFintechChime();
  };

  return (
    <section className="hero-vault-preview-section" aria-label="Interactive Live Vault Demo">
      <div className="hero-vault-card">
        <div className="hero-vault-ambient-glow" />

        {/* Top Sandbox Header */}
        <div className="hero-vault-header">
          <div className="hero-vault-header-left">
            <div className="vault-badge-icon-box">
              <KeyRound size={22} />
            </div>
            <div className="hero-vault-title-box">
              <h3>
                <span>Live Vault Security Sandbox</span>
                <Sparkles size={14} color="#f59e0b" />
              </h3>
              <p>Experience real-time zero-knowledge encryption directly in your browser</p>
            </div>
          </div>

          <div className="hero-vault-header-right">
            <span className="vault-cipher-chip">
              <span className="vault-pulse-dot" />
              <span>AES-256 GCM ENGINE</span>
            </span>
          </div>
        </div>

        {/* Feature Mode Switcher Tabs */}
        <div className="hero-vault-modes-nav" role="tablist">
          <button
            type="button"
            className={`hero-vault-mode-btn ${activeMode === 'credentials' ? 'active' : ''}`}
            onClick={() => {
              triggerHapticSelection();
              setActiveMode('credentials');
            }}
            role="tab"
            aria-selected={activeMode === 'credentials'}
          >
            <KeyRound size={15} />
            <span>Cipher Flip &amp; Auto-Lock</span>
          </button>

          <button
            type="button"
            className={`hero-vault-mode-btn ${activeMode === 'pin' ? 'active' : ''}`}
            onClick={() => {
              triggerHapticSelection();
              setActiveMode('pin');
            }}
            role="tab"
            aria-selected={activeMode === 'pin'}
          >
            <Smartphone size={15} />
            <span>4-Digit PIN Simulation</span>
          </button>

          <button
            type="button"
            className={`hero-vault-mode-btn ${activeMode === 'dates' ? 'active' : ''}`}
            onClick={() => {
              triggerHapticSelection();
              setActiveMode('dates');
            }}
            role="tab"
            aria-selected={activeMode === 'dates'}
          >
            <Calendar size={15} />
            <span>Milestone Countdown</span>
          </button>
        </div>

        {/* MODE 1: PASSWORD DECRYPT & CIPHER FLIP */}
        {activeMode === 'credentials' && (
          <div className="credential-demo-wrapper">
            <div className={`credential-display-box ${isRevealed ? 'unlocked' : ''}`}>
              <div className="credential-top-meta">
                <div className="credential-identity-group">
                  <div className="credential-avatar">
                    <span>RV</span>
                  </div>
                  <div className="credential-titles">
                    <h4>Primary Financial Treasury</h4>
                    <span>alex.mitchell@luxurymail.com</span>
                  </div>
                </div>

                <span className={`credential-status-pill ${isRevealed ? 'revealed' : 'locked'}`}>
                  {isRevealed ? (
                    <>
                      <Unlock size={11} />
                      <span>Decrypted in RAM</span>
                    </>
                  ) : (
                    <>
                      <Lock size={11} />
                      <span>Zero-Knowledge Locked</span>
                    </>
                  )}
                </span>
              </div>

              {/* Password Value & Controls */}
              <div className="credential-value-row">
                <div 
                  className={`cipher-code-text ${isScrambling ? 'scrambling' : isRevealed ? 'revealed' : 'masked'}`}
                  title={isRevealed ? 'Decrypted in secure memory' : 'Cryptographically encrypted'}
                >
                  {displayedPassword}
                </div>

                <div className="credential-actions-group">
                  <button
                    type="button"
                    className="btn cipher-btn reveal-btn"
                    onClick={handleToggleReveal}
                    title={isRevealed ? 'Re-lock immediately' : 'Decrypt with master cipher'}
                  >
                    {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{isRevealed ? 'Lock' : 'Reveal'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary cipher-btn"
                    onClick={handleCopy}
                    title="Copy password to clipboard"
                  >
                    {isCopied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary cipher-btn"
                    onClick={handleRegenerateDemoPassword}
                    title="Generate new 128-bit password"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
              </div>

              {/* Auto-Lock Countdown Bar (Only active when decrypted) */}
              {isRevealed && (
                <div className="auto-lock-countdown-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={12} />
                        <span>Security Auto-Lock Active</span>
                      </span>
                      <span>Relocking in <strong>{autoLockSeconds}s</strong></span>
                    </div>

                    <div className="auto-lock-linear-progress">
                      <div 
                        className="auto-lock-linear-fill" 
                        style={{ width: `${(autoLockSeconds / 8) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Entropy & Password Strength Metrics */}
              <div className="credential-entropy-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Entropy:</span>
                  <div className="entropy-bars-group">
                    <span className="entropy-bar-segment active" />
                    <span className="entropy-bar-segment active" />
                    <span className="entropy-bar-segment active" />
                    <span className="entropy-bar-segment active" />
                  </div>
                  <strong style={{ color: '#10b981' }}>128-bit Military Grade</strong>
                </div>

                <div style={{ color: 'var(--text-muted)' }}>
                  <span>Zero LocalStorage • Client RAM Only</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: 4-DIGIT PIN KEYPAD SIMULATION */}
        {activeMode === 'pin' && (
          <div className="pin-sim-box">
            <div className="pin-sim-dial-crest">
              {isPinUnlocked ? <ShieldCheck size={28} color="#10b981" /> : <Lock size={26} />}
            </div>

            <h4 className="pin-sim-title">
              {isPinUnlocked ? 'Vault Successfully Unlocked!' : 'Simulate 4-Digit Security PIN'}
            </h4>
            <p className="pin-sim-sub">
              {isPinUnlocked 
                ? 'Hardware-backed biometric & PIN authorization confirmed'
                : 'Enter any 4 digits below to test rapid mobile lock authorization'}
            </p>

            {/* Visual 4-Dot Indicators */}
            <div className="pin-sim-dots-row">
              {[0, 1, 2, 3].map((index) => (
                <span
                  key={index}
                  className={`pin-sim-dot ${pinDigits.length > index ? 'filled' : ''}`}
                />
              ))}
            </div>

            {/* Virtual Keypad */}
            {!isPinUnlocked ? (
              <div className="pin-sim-keypad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    className="pin-sim-key-btn"
                    onClick={() => handlePinPress(digit)}
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  className="pin-sim-key-btn"
                  onClick={() => setPinDigits([])}
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="pin-sim-key-btn"
                  onClick={() => handlePinPress('0')}
                >
                  0
                </button>
                <button
                  type="button"
                  className="pin-sim-key-btn"
                  onClick={() => setPinDigits((prev) => prev.slice(0, -1))}
                  style={{ fontSize: '0.85rem' }}
                >
                  ⌫
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handlePinReset}
                style={{ marginTop: '0.5rem' }}
              >
                <span>Reset &amp; Try Again</span>
              </button>
            )}
          </div>
        )}

        {/* MODE 3: EXPIRING DOCUMENT COUNTDOWN */}
        {activeMode === 'dates' && (
          <div className="dates-sim-box">
            <div className="dates-sim-left">
              <div className="dates-sim-icon-box">
                <Calendar size={24} />
              </div>
              <div className="dates-sim-titles">
                <h4>International Biometric Passport</h4>
                <p>Doc No: PA-9812402 • Category: Government ID &amp; Travel</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem' }}>
                  <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>
                    Critical Deadline
                  </span>
                  <span className="badge badge-primary" style={{ fontSize: '0.65rem' }}>
                    Push Tray Alert Set
                  </span>
                </div>
              </div>
            </div>

            <div className="dates-sim-countdown-badge">
              <span className="countdown-number">18</span>
              <span className="countdown-label">Days Left</span>
            </div>
          </div>
        )}

        {/* Bottom Sandbox Footer Ribbon */}
        <div className="hero-vault-footer-ribbon">
          <div className="ribbon-info-text">
            <ShieldCheck size={16} color="#10b981" />
            <span>Real vaults are sealed with your private PBKDF2 Master Key. Zero plaintext exposure.</span>
          </div>

          <button
            type="button"
            className="btn btn-primary ribbon-cta-btn"
            onClick={onOpenRegister}
          >
            <span>Create Your Free Vault</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
};
