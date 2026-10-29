import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Sparkles, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  Clock, 
  Pause, 
  Play, 
  CheckCircle2, 
  ArrowRight,
  Shield
} from 'lucide-react';
import { 
  getReleaseNotes, 
  markWhatsNewSeen, 
  calculateAutoDismissDuration,
  isAutoDismissEnabled,
  setAutoDismissEnabled,
} from '../../services/whatsNewService';
import { APP_VERSION, type ChangelogItem } from '../../config/version';
import './WhatsNewModal.css';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
}

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  version = APP_VERSION,
}) => {
  const release = getReleaseNotes(version);
  const scrollBodyRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss countdown states
  const [autoCloseActive, setAutoCloseActive] = useState<boolean>(() => isAutoDismissEnabled());
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [totalDurationMs, setTotalDurationMs] = useState<number>(18000);
  const [remainingMs, setRemainingMs] = useState<number>(18000);

  const handleClose = useCallback(() => {
    markWhatsNewSeen(version);
    onClose();
  }, [version, onClose]);

  // Dynamically calculate reading time based on measured DOM scroll height and items count
  useEffect(() => {
    if (!isOpen) return;

    // Small delay to allow DOM layout rendering to measure accurate scrollHeight
    const timer = setTimeout(() => {
      const scrollHeight = scrollBodyRef.current?.scrollHeight || 380;
      const { durationMs } = calculateAutoDismissDuration(scrollHeight, release.highlights.length);
      setTotalDurationMs(durationMs);
      setRemainingMs(durationMs);
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, release.highlights.length]);

  // Interval timer for countdown
  useEffect(() => {
    if (!isOpen || !autoCloseActive || isPaused) return;

    const interval = 100; // 100ms precision for smooth progress bar
    const timer = setInterval(() => {
      setRemainingMs((prev) => {
        if (prev <= interval) {
          clearInterval(timer);
          handleClose();
          return 0;
        }
        return prev - interval;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isOpen, autoCloseActive, isPaused, handleClose]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  const toggleAutoClose = () => {
    const nextState = !autoCloseActive;
    setAutoCloseActive(nextState);
    setAutoDismissEnabled(nextState);
    if (nextState) {
      setIsPaused(false);
    }
  };

  const progressPercent = totalDurationMs > 0 
    ? Math.max(0, Math.min(100, (remainingMs / totalDurationMs) * 100))
    : 0;

  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));

  const getCategoryIcon = (category: ChangelogItem['category']) => {
    switch (category) {
      case 'feature':
        return <Smartphone size={18} />;
      case 'security':
        return <ShieldCheck size={18} />;
      case 'performance':
        return <Zap size={18} />;
      case 'ui':
      default:
        return <Sparkles size={18} />;
    }
  };

  return (
    <div 
      className="modal-backdrop whats-new-backdrop" 
      onClick={handleClose} 
      role="dialog"
      aria-modal="true"
      aria-labelledby="whats-new-title"
    >
      <div 
        className="modal-content whats-new-card"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Single-tap Close Button */}
        <button 
          type="button" 
          className="whats-new-close-btn"
          onClick={handleClose}
          title="Dismiss release notes"
          aria-label="Close"
        >
          <X size={17} />
        </button>

        {/* Header */}
        <div className="whats-new-header">
          <div className="whats-new-icon-emblem">
            <Shield size={32} />
            <span className="whats-new-sparkle-badge">
              <Sparkles size={15} />
            </span>
          </div>

          <div className="whats-new-header-text">
            <div className="whats-new-badge-row">
              <span className="whats-new-pill">Release Notes</span>
              <span className="whats-new-date-tag">v{release.version} • {release.releaseDate}</span>
            </div>
            <h2 id="whats-new-title" className="whats-new-title">
              What's New in RemiVault
            </h2>
            <p className="whats-new-summary">
              {release.summary}
            </p>
          </div>
        </div>

        {/* Dynamic Auto-Dismiss Countdown Bar */}
        <div className="whats-new-auto-dismiss-bar">
          <div className="auto-dismiss-info-row">
            <span className={`auto-dismiss-text ${isPaused ? 'paused' : ''}`}>
              <Clock size={13} />
              {!autoCloseActive ? (
                <span>Auto-close disabled</span>
              ) : isPaused ? (
                <span>Auto-close paused (reading mode)</span>
              ) : (
                <span>Auto-closing in <strong>{remainingSeconds}s</strong> • Hover or scroll to pause</span>
              )}
            </span>

            <button
              type="button"
              className="auto-dismiss-toggle-btn"
              onClick={toggleAutoClose}
              title={autoCloseActive ? 'Disable auto-close timer' : 'Enable auto-close timer'}
            >
              {autoCloseActive ? (
                <>
                  <Pause size={11} />
                  <span>Pause Timer</span>
                </>
              ) : (
                <>
                  <Play size={11} />
                  <span>Resume Timer</span>
                </>
              )}
            </button>
          </div>

          {/* Smooth Hairline Progress Fill */}
          <div className="auto-dismiss-progress-track">
            <div 
              className="auto-dismiss-progress-fill" 
              style={{ 
                width: `${progressPercent}%`,
                opacity: autoCloseActive ? 1 : 0.25,
              }} 
            />
          </div>
        </div>

        {/* Scrollable Changelog Highlights */}
        <div 
          className="whats-new-scroll-body"
          ref={scrollBodyRef}
          onScroll={() => {
            // Automatically pause countdown when the user starts actively scrolling
            if (!isPaused) setIsPaused(true);
          }}
        >
          {release.highlights.map((item) => (
            <div key={item.id} className="whats-new-card-item">
              <div className={`item-cat-icon ${item.category}`}>
                {getCategoryIcon(item.category)}
              </div>

              <div className="item-body">
                <div className="item-title-row">
                  <h4 className="item-title">{item.title}</h4>
                  {item.badge && <span className="item-badge">{item.badge}</span>}
                </div>
                <p className="item-desc">{item.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="whats-new-footer">
          <div className="whats-new-footer-note">
            <CheckCircle2 size={13} color="#10b981" />
            <span>Encrypted vault updated safely</span>
          </div>

          <button
            type="button"
            className="btn btn-primary whats-new-explore-btn"
            onClick={handleClose}
          >
            <span>Got It, Explore Vault</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};
