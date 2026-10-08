import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  showSystemNotification, 
  hasBeenNotified, 
  markAsNotified, 
  getNotificationSettings,
  playFintechChime
} from '../services/notificationService';
import type { Reminder } from '../services/reminders';
import type { ImportantDate } from '../services/importantDates';
import type { ToastAlert } from '../components/notifications/NotificationToast';

interface NotificationSchedulerProps {
  enabled: boolean;
  reminders?: Reminder[];
  importantDates?: ImportantDate[];
  onNavigateTab?: (tab: 'overview' | 'reminders' | 'dates' | 'vault' | 'notes') => void;
}

export function useNotificationScheduler({
  enabled,
  reminders = [],
  importantDates = [],
  onNavigateTab,
}: NotificationSchedulerProps) {
  const [activeToast, setActiveToast] = useState<ToastAlert | null>(null);
  const checkTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  const triggerToastAlert = useCallback((
    type: 'reminder' | 'date' | 'info' | 'success',
    title: string,
    message: string,
    tab?: 'overview' | 'reminders' | 'dates' | 'vault' | 'notes'
  ) => {
    setActiveToast({
      id: `${Date.now()}-${Math.random()}`,
      type,
      title,
      message,
      timestamp: new Date(),
      onAction: () => {
        if (tab && onNavigateTab) {
          onNavigateTab(tab);
        }
        setActiveToast(null);
      },
    });
  }, [onNavigateTab]);

  const checkAlerts = useCallback(async () => {
    if (!enabled) return;

    const settings = getNotificationSettings();
    const now = new Date();
    const todayDateStr = now.toISOString().split('T')[0];

    // 1. Scan Pending Reminders
    if (settings.remindersEnabled && reminders.length > 0) {
      for (const r of reminders) {
        if (r.status !== 'pending') continue;

        try {
          const remindAt = new Date(r.remind_at);
          // If reminder is due now or overdue within last 24h
          const diffMs = now.getTime() - remindAt.getTime();
          const isDue = diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000;

          if (isDue) {
            const cacheKey = `reminder-${r.id}-${r.remind_at}`;
            if (!hasBeenNotified(cacheKey)) {
              markAsNotified(cacheKey);

              const alertTitle = `⏰ Reminder: ${r.title}`;
              const alertBody = r.description 
                ? `${r.description} (Priority: ${r.priority.toUpperCase()})` 
                : `Task reminder scheduled for ${remindAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`;

              // Send system OS tray notification
              await showSystemNotification(alertTitle, {
                body: alertBody,
                tag: `reminder-${r.id}`,
                data: { tab: 'reminders', id: r.id },
              });

              // Also trigger in-app foreground toast
              triggerToastAlert('reminder', alertTitle, alertBody, 'reminders');
            }
          }
        } catch {
          // ignore date parse issues
        }
      }
    }

    // 2. Scan Expiring Important Dates (Passports, Licenses, Warranties, etc.)
    if (settings.datesEnabled && importantDates.length > 0) {
      for (const d of importantDates) {
        const thresholdDays = d.notify_days_before || 7;
        const daysLeft = d.days_remaining;

        // If expires today or within user notification threshold
        if (daysLeft <= thresholdDays && daysLeft >= -1) {
          const cacheKey = `date-${d.id}-${todayDateStr}`;
          if (!hasBeenNotified(cacheKey)) {
            markAsNotified(cacheKey);

            let statusMsg = '';
            if (daysLeft <= 0) {
              statusMsg = 'Expires today!';
            } else if (daysLeft === 1) {
              statusMsg = 'Expires tomorrow!';
            } else {
              statusMsg = `Expiring in ${daysLeft} days.`;
            }

            const alertTitle = `📅 Document Alert: ${d.title}`;
            const alertBody = `${d.title} (${d.category.toUpperCase()}) ${statusMsg} Next due: ${d.target_date}.`;

            // Send system OS tray notification
            await showSystemNotification(alertTitle, {
              body: alertBody,
              tag: `date-${d.id}`,
              data: { tab: 'dates', id: d.id },
            });

            // Trigger in-app foreground toast
            triggerToastAlert('date', alertTitle, alertBody, 'dates');
          }
        }
      }
    }
  }, [enabled, reminders, importantDates, triggerToastAlert]);

  // Periodic polling check every 45 seconds
  useEffect(() => {
    if (!enabled) return;

    // Run initial scan with slight delay so components finish mounting
    const initialTimeout = setTimeout(() => {
      checkAlerts();
    }, 2000);

    // Run every 45 seconds
    checkTimerRef.current = window.setInterval(() => {
      checkAlerts();
    }, 45000);

    return () => {
      clearTimeout(initialTimeout);
      if (checkTimerRef.current) {
        clearInterval(checkTimerRef.current);
      }
    };
  }, [enabled, checkAlerts]);

  // Manual test notification trigger for settings / demo
  const sendTestNotification = useCallback(async () => {
    const title = '🔔 RemiVault System Test Alert';
    const body = 'System tray and mobile status bar notification channels are operational and synced.';

    playFintechChime();

    const delivered = await showSystemNotification(title, {
      body,
      tag: 'test-notification',
      data: { tab: 'overview' },
    });

    triggerToastAlert('success', title, body, 'overview');
    return delivered;
  }, [triggerToastAlert]);

  return {
    activeToast,
    dismissToast,
    checkAlerts,
    sendTestNotification,
  };
}
