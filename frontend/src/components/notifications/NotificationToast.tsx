import React, { useEffect } from 'react';
import { Bell, Calendar, X, AlertTriangle, CheckCircle2 } from 'lucide-react';

export interface ToastAlert {
  id: string;
  type: 'reminder' | 'date' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  onAction?: () => void;
}

interface NotificationToastProps {
  toast: ToastAlert | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;

    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const renderIcon = () => {
    switch (toast.type) {
      case 'reminder':
        return <Bell size={18} color="#f59e0b" />;
      case 'date':
        return <Calendar size={18} color="#818cf8" />;
      case 'success':
        return <CheckCircle2 size={18} color="#10b981" />;
      default:
        return <AlertTriangle size={18} color="#38bdf8" />;
    }
  };

  return (
    <div className="notif-toast-container" onClick={toast.onAction}>
      <div className={`notif-toast-card type-${toast.type}`}>
        <div className="notif-toast-icon-wrap">
          {renderIcon()}
        </div>

        <div className="notif-toast-content">
          <div className="notif-toast-header-row">
            <strong className="notif-toast-title">{toast.title}</strong>
            <span className="notif-toast-time">Just now</span>
          </div>
          <p className="notif-toast-msg">{toast.message}</p>
        </div>

        <button
          type="button"
          className="notif-toast-close"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          title="Dismiss alert"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
