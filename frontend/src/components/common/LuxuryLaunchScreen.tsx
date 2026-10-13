import React, { useState, useEffect, useRef } from 'react';
import { 
  KeyRound, 
  FileText, 
  Clock, 
  Calendar, 
  Lock, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { playFintechChime } from '../../services/notificationService';
import './LuxuryLaunchScreen.css';

export interface LuxuryLaunchScreenProps {
  /** Callback fired when the launch sequence is complete and screen is faded out */
  onFinish?: () => void;
  /** Whether the underlying auth/session hydration is complete */
  isDataReady?: boolean;
  /** Minimum time in ms to show the complete locking sequence (default: 2200ms) */
  minDurationMs?: number;
  /** Whether this is a manual test preview triggered from settings */
  isManualPreview?: boolean;
}

interface VaultModule {
  id: 'secrets' | 'files' | 'reminders' | 'dates';
  title: string;
  spec: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  lockThreshold: number;
}

const VAULT_MODULES: VaultModule[] = [
  {
    id: 'secrets',
    title: 'Passwords & Secrets',
    spec: 'AES-256 GCM Vault',
    icon: KeyRound,
    lockThreshold: 22,
  },
  {
    id: 'files',
    title: 'Notes & Documents',
    spec: 'Zero-Knowledge Archive',
    icon: FileText,
    lockThreshold: 48,
  },
  {
    id: 'reminders',
    title: 'Reminders & Alerts',
    spec: 'Active Scheduler Engine',
    icon: Clock,
    lockThreshold: 72,
  },
  {
    id: 'dates',
    title: 'Important Dates',
    spec: 'Expiry Guard Protected',
    icon: Calendar,
    lockThreshold: 92,
  },
];

export const LuxuryLaunchScreen: React.FC<LuxuryLaunchScreenProps> = ({
  onFinish,
  isDataReady = true,
  minDurationMs = 2400,
  isManualPreview = false,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [canSkip, setCanSkip] = useState<boolean>(false);
  const hasFinishedRef = useRef<boolean>(false);
  const chimePlayedRef = useRef<boolean>(false);

  // Allow skip button after 900ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanSkip(true);
    }, 900);
    return () => clearTimeout(timer);
  }, []);

  // Smooth progress ticker
  useEffect(() => {
    const startTime = performance.now();
    let animationFrameId: number;

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const timeRatio = Math.min(elapsed / minDurationMs, 1);

      // Non-linear cubic easing to feel intentional & mechanical
      const easedRatio = timeRatio < 0.5 
        ? 4 * timeRatio * timeRatio * timeRatio 
        : 1 - Math.pow(-2 * timeRatio + 2, 3) / 2;

      let currentTarget = Math.round(easedRatio * 100);

      // If data is still loading and reached 90%, pause briefly until isDataReady is true
      if (!isDataReady && currentTarget >= 92 && !isManualPreview) {
        currentTarget = 92;
      }

      setProgress(currentTarget);

      if (currentTarget >= 100) {
        if (!chimePlayedRef.current) {
          chimePlayedRef.current = true;
          try {
            playFintechChime();
          } catch {
            // Audio context may require prior gesture
          }
        }

        // Hold briefly at 100% so user sees "All Items Locked Safely"
        setTimeout(() => {
          triggerExit();
        }, 400);
      } else {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    animationFrameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [minDurationMs, isDataReady, isManualPreview]);

  // Clean exit transition
  const triggerExit = () => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    setIsExiting(true);

    setTimeout(() => {
      onFinish?.();
    }, 650);
  };

  // Skip handler
  const handleSkip = () => {
    setProgress(100);
    triggerExit();
  };

  // Dynamic Telemetry Messaging
  const getTelemetryMessage = () => {
    if (progress < 22) {
      return 'Initializing Zero-Knowledge Enclave...';
    } else if (progress < 48) {
      return 'Locking Credentials & Secrets Safely...';
    } else if (progress < 72) {
      return 'Securing Private Documents & Notes...';
    } else if (progress < 92) {
      return 'Synchronizing Reminders & Expiry Guard...';
    } else {
      return 'All Vault Items Locked Safely • Welcome to RemiVault';
    }
  };

  return (
    <div 
      className={`rv-launch-overlay ${isExiting ? 'exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="RemiVault Launch Screen"
    >
      <div className="rv-launch-ambient-grid" />

      {/* Skip button for quick entry */}
      {canSkip && (
        <button
          type="button"
          className="rv-launch-skip-btn"
          onClick={handleSkip}
          title="Skip Intro Animation"
        >
          <span>{progress >= 100 ? 'Enter Vault' : 'Skip Intro'}</span>
          <ArrowRight size={13} />
        </button>
      )}

      <div className="rv-launch-stage">
        {/* Central Vault Combination Dial & Crest */}
        <div className="rv-vault-hero-wrapper">
          <div className="rv-vault-aura" />
          <div className="rv-dial-outer" />
          <div className="rv-dial-inner" />

          <div className="rv-vault-crest-card">
            <BrandLogo size={62} showText={false} />

            <div className="rv-vault-badge-pill">
              {progress >= 95 ? (
                <>
                  <Lock size={11} className="text-amber-400" />
                  <span>Vault Locked</span>
                </>
              ) : (
                <>
                  <Sparkles size={11} className="text-amber-400" />
                  <span>Securing...</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 4 Category Modules: Files, Secrets, Reminders, Dates */}
        <div className="rv-vault-modules-grid">
          {VAULT_MODULES.map((mod) => {
            const isLocked = progress >= mod.lockThreshold;
            const isActive = progress >= (mod.lockThreshold - 20) && !isLocked;
            const stateClass = isLocked ? 'locked' : isActive ? 'active' : 'pending';
            const Icon = mod.icon;

            return (
              <div 
                key={mod.id} 
                className={`rv-module-card ${stateClass}`}
              >
                {isLocked && <div className="rv-module-shimmer" />}

                <div className="rv-module-header">
                  <div className="rv-module-icon-wrap">
                    <Icon size={18} />
                  </div>

                  <div className="rv-module-lock-badge">
                    {isLocked ? (
                      <CheckCircle2 size={15} />
                    ) : isActive ? (
                      <Loader2 size={14} />
                    ) : (
                      <Lock size={12} />
                    )}
                  </div>
                </div>

                <h4 className="rv-module-title">{mod.title}</h4>
                <p className="rv-module-spec">{mod.spec}</p>

                <div className="rv-module-status-pill">
                  {isLocked ? (
                    <>
                      <Lock size={10} />
                      <span>Locked Safely</span>
                    </>
                  ) : isActive ? (
                    <>
                      <span className="rv-telemetry-dot" style={{ width: 4, height: 4 }} />
                      <span>Encrypting...</span>
                    </>
                  ) : (
                    <span>Queued</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Progress Track & Telemetry Feed */}
        <div className="rv-launch-footer">
          <div className="rv-progress-meta-row">
            <div className="rv-telemetry-text">
              <span className="rv-telemetry-dot" />
              <span>{getTelemetryMessage()}</span>
            </div>
            <span className="rv-progress-percent">{progress}%</span>
          </div>

          <div className="rv-progress-bar-track">
            <div 
              className="rv-progress-bar-fill" 
              style={{ width: `${progress}%` }}
            >
              <div className="rv-progress-spark" />
            </div>
          </div>

          <div className="rv-security-compliance-tag">
            <ShieldCheck size={12} className="text-emerald-400" />
            <span>RemiVault Cryptographic Guard • Zero-Knowledge Architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
};
