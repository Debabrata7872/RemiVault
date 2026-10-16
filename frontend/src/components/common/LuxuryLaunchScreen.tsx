import React, { useState, useEffect, useRef } from 'react';
import { BrandLogo } from './BrandLogo';
import './LuxuryLaunchScreen.css';

export interface LuxuryLaunchScreenProps {
  /** Callback fired when the launch sequence is complete and screen is faded out */
  onFinish?: () => void;
  /** Whether the underlying auth/session hydration is complete */
  isDataReady?: boolean;
  /** Minimum time in ms to show the loading screen (default: 500ms) */
  minDurationMs?: number;
  /** Whether this is a manual test preview triggered from settings */
  isManualPreview?: boolean;
}

export const LuxuryLaunchScreen: React.FC<LuxuryLaunchScreenProps> = ({
  onFinish,
  isDataReady = true,
  minDurationMs = 600,
  isManualPreview = false,
}) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [minTimeElapsed, setMinTimeElapsed] = useState<boolean>(false);
  const hasFinishedRef = useRef<boolean>(false);

  // Minimum display timer (short, non-blocking)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true);
    }, isManualPreview ? 1200 : minDurationMs);

    return () => clearTimeout(timer);
  }, [minDurationMs, isManualPreview]);

  // Handle smooth exit once data is ready and min time elapsed
  useEffect(() => {
    if (minTimeElapsed && (isDataReady || isManualPreview) && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      setIsExiting(true);

      const exitTimer = setTimeout(() => {
        onFinish?.();
      }, 350); // Matches CSS transition duration

      return () => clearTimeout(exitTimer);
    }
  }, [minTimeElapsed, isDataReady, isManualPreview, onFinish]);

  return (
    <div 
      className={`rv-launch-overlay ${isExiting ? 'exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading RemiVault"
    >
      <div className="rv-launch-ambient-glow" />

      <div className="rv-launch-simple-content">
        {/* Glowing Central Crest */}
        <div className="rv-launch-logo-box">
          <div className="rv-launch-logo-aura" />
          <BrandLogo size={76} />
        </div>

        {/* Brand Title & Tagline */}
        <div className="rv-launch-title-group">
          <h1 className="rv-launch-brand-title">RemiVault</h1>
          <p className="rv-launch-status-text">
            <span>Encrypted Personal Vault</span>
          </p>
        </div>

        {/* Minimalist Micro Progress Track */}
        <div className="rv-launch-loader-track">
          <div className="rv-launch-loader-bar" />
        </div>
      </div>
    </div>
  );
};

export default LuxuryLaunchScreen;
