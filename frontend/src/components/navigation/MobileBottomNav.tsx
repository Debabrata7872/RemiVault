import React from 'react';
import { 
  LayoutDashboard, 
  KeyRound, 
  Calendar, 
  Bell, 
  FileText 
} from 'lucide-react';
import { triggerHapticTick } from '../../services/hapticsService';
import './MobileBottomNav.css';

export type WorkspaceTab = 'overview' | 'vault' | 'dates' | 'reminders' | 'notes';

interface MobileBottomNavProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  vaultCount?: number;
  urgentDatesCount?: number;
  upcomingRemindersCount?: number;
  overdueRemindersCount?: number;
  notesCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  vaultCount = 0,
  urgentDatesCount = 0,
  upcomingRemindersCount = 0,
  overdueRemindersCount = 0,
  notesCount = 0,
}) => {
  const formatBadge = (num: number) => {
    if (num > 99) return '99+';
    return num.toString();
  };

  const navItems = [
    {
      id: 'overview' as WorkspaceTab,
      label: 'Home',
      icon: LayoutDashboard,
      badge: null,
      hasAlert: false,
    },
    {
      id: 'vault' as WorkspaceTab,
      label: 'Vault',
      icon: KeyRound,
      badge: vaultCount > 0 ? formatBadge(vaultCount) : null,
      hasAlert: false,
    },
    {
      id: 'dates' as WorkspaceTab,
      label: 'Dates',
      icon: Calendar,
      badge: null,
      hasAlert: urgentDatesCount > 0,
    },
    {
      id: 'reminders' as WorkspaceTab,
      label: 'Alerts',
      icon: Bell,
      badge: overdueRemindersCount > 0 ? formatBadge(overdueRemindersCount) : null,
      hasAlert: upcomingRemindersCount > 0 && overdueRemindersCount === 0,
    },
    {
      id: 'notes' as WorkspaceTab,
      label: 'Notes',
      icon: FileText,
      badge: notesCount > 0 ? formatBadge(notesCount) : null,
      hasAlert: false,
    },
  ];

  return (
    <nav 
      className="mobile-bottom-nav-container" 
      aria-label="Mobile Navigation Bar"
      role="navigation"
    >
      <div className="mobile-bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-bottom-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                triggerHapticTick();
                onTabChange(item.id);
              }}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="mobile-tab-icon-wrap">
                {isActive && <span className="mobile-tab-active-pip" />}
                <Icon className="mobile-tab-icon" />

                {item.hasAlert && (
                  <span 
                    className="mobile-tab-alert-dot" 
                    title="Time-sensitive items due"
                  />
                )}

                {item.badge && (
                  <span className="mobile-tab-badge-pill">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className="mobile-tab-label">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

