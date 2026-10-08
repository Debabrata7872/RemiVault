import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Calendar, 
  Smartphone, 
  Volume2, 
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { 
  requestNotificationPermission, 
  dismissPermissionPrompt,
  type NotificationPermissionState
} from '../../services/notificationService';

interface NotificationPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionChange?: (permission: NotificationPermissionState) => void;
}

export const NotificationPromptModal: React.FC<NotificationPromptModalProps> = ({
  isOpen,
  onClose,
  onPermissionChange,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleEnable = async () => {
    setIsRequesting(true);
    try {
      const result = await requestNotificationPermission();
      if (onPermissionChange) {
        onPermissionChange(result);
      }
      onClose();
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    dismissPermissionPrompt();
    onClose();
  };

  return (
    <div className="modal-backdrop notif-prompt-backdrop" onClick={handleDismiss} style={{ zIndex: 1060 }}>
      <div 
        className="modal-content notif-prompt-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          type="button" 
          className="modal-close-btn notif-prompt-close"
          onClick={handleDismiss}
          title="Dismiss for now"
        >
          <X size={18} />
        </button>

        {/* Ambient Top Glow & Icon */}
        <div className="notif-prompt-hero">
          <div className="notif-prompt-icon-ring">
            <Bell size={28} className="notif-bell-icon" />
            <span className="notif-icon-sparkle">
              <Sparkles size={14} />
            </span>
          </div>
          <span className="badge badge-primary notif-badge">System Alerts</span>
          <h2 className="notif-prompt-title">Never Miss Due Tasks &amp; Critical Dates</h2>
          <p className="notif-prompt-subtitle">
            Receive proactive reminders right in your mobile notification bar and desktop system tray — even when you're working in other apps.
          </p>
        </div>

        {/* Feature Highlights Grid */}
        <div className="notif-prompt-features">
          <div className="notif-feature-item">
            <div className="notif-feature-icon-box bell">
              <Bell size={18} />
            </div>
            <div className="notif-feature-text">
              <strong>Due Reminders &amp; Deadlines</strong>
              <span>Timely alerts the exact moment a task or reminder is scheduled.</span>
            </div>
          </div>

          <div className="notif-feature-item">
            <div className="notif-feature-icon-box calendar">
              <Calendar size={18} />
            </div>
            <div className="notif-feature-text">
              <strong>Expiring Documents &amp; Passports</strong>
              <span>Advance countdown alerts before licenses, warranties, or IDs expire.</span>
            </div>
          </div>

          <div className="notif-feature-item">
            <div className="notif-feature-icon-box phone">
              <Smartphone size={18} />
            </div>
            <div className="notif-feature-text">
              <strong>Status Bar &amp; System Tray Integration</strong>
              <span>Appears at the top of your phone (beside Wi-Fi/battery) and in desktop notifications.</span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="notif-prompt-actions">
          <button
            type="button"
            className="btn btn-primary notif-enable-btn"
            onClick={handleEnable}
            disabled={isRequesting}
          >
            <CheckCircle2 size={16} />
            <span>{isRequesting ? 'Requesting Access...' : 'Allow System Notifications'}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary notif-later-btn"
            onClick={handleDismiss}
          >
            <span>Maybe Later</span>
          </button>
        </div>

        <p className="notif-prompt-footer-hint">
          <Volume2 size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
          Includes gentle fintech audio chimes. You can customize or mute sound in Settings anytime.
        </p>
      </div>
    </div>
  );
};
