import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { fetchDashboardOverviewApi } from '../services/dashboard';
import type { DashboardOverviewResponse, DashboardCounts } from '../services/dashboard';
import { fetchNotesApi } from '../services/notes';
import type { Note } from '../services/notes';
import { fetchRemindersApi } from '../services/reminders';
import type { Reminder, ReminderCounts } from '../services/reminders';
import { fetchImportantDatesApi } from '../services/importantDates';
import type { ImportantDate, ImportantDateCounts } from '../services/importantDates';
import { fetchVaultEntriesApi } from '../services/vault';
import type { VaultEntry, VaultCounts } from '../services/vault';

interface PreloadDataContextType {
  // Dashboard Overview state
  overview: DashboardOverviewResponse | null;
  counts: DashboardCounts;
  isOverviewLoading: boolean;
  isHeavyData: boolean;
  
  // In-Memory Notes (Zero LocalStorage)
  notes: Note[];
  notesLoaded: boolean;
  notesLoading: boolean;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  refreshNotes: () => Promise<void>;

  // In-Memory Reminders (Zero LocalStorage)
  reminders: Reminder[];
  reminderCounts: ReminderCounts;
  remindersLoaded: boolean;
  remindersLoading: boolean;
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  setReminderCounts: React.Dispatch<React.SetStateAction<ReminderCounts>>;
  refreshReminders: () => Promise<void>;

  // In-Memory Important Dates (Zero LocalStorage)
  dates: ImportantDate[];
  dateCounts: ImportantDateCounts;
  datesLoaded: boolean;
  datesLoading: boolean;
  setDates: React.Dispatch<React.SetStateAction<ImportantDate[]>>;
  setDateCounts: React.Dispatch<React.SetStateAction<ImportantDateCounts>>;
  refreshDates: () => Promise<void>;

  // In-Memory Vault Entries (Zero LocalStorage)
  vaultEntries: VaultEntry[];
  vaultCounts: VaultCounts;
  vaultLoaded: boolean;
  vaultLoading: boolean;
  setVaultEntries: React.Dispatch<React.SetStateAction<VaultEntry[]>>;
  setVaultCounts: React.Dispatch<React.SetStateAction<VaultCounts>>;
  refreshVault: () => Promise<void>;

  // Global Actions
  refreshDashboard: () => Promise<void>;
  resetMemory: () => void;
}

const DEFAULT_DASHBOARD_COUNTS: DashboardCounts = {
  vault: 0,
  dates: 0,
  reminders: 0,
  notes: 0,
  urgent_dates: 0,
  expired_dates: 0,
  upcoming_reminders: 0,
  overdue_reminders: 0,
  total_items: 0,
};

const DEFAULT_REMINDER_COUNTS: ReminderCounts = {
  total: 0,
  pending: 0,
  upcoming: 0,
  overdue: 0,
  completed: 0,
};

const DEFAULT_DATE_COUNTS: ImportantDateCounts = {
  total: 0,
  pinned: 0,
  urgent: 0,
  upcoming: 0,
  expired: 0,
};

const DEFAULT_VAULT_COUNTS: VaultCounts = {
  total: 0,
  favorites: 0,
  logins: 0,
  api_keys: 0,
  cards: 0,
  servers: 0,
  weak_passwords: 0,
};

const PreloadDataContext = createContext<PreloadDataContextType | null>(null);

export const PreloadDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLocked } = useAuth();

  // Overview state
  const [overview, setOverview] = useState<DashboardOverviewResponse | null>(null);
  const [counts, setCounts] = useState<DashboardCounts>(DEFAULT_DASHBOARD_COUNTS);
  const [isOverviewLoading, setIsOverviewLoading] = useState<boolean>(true);
  const [isHeavyData, setIsHeavyData] = useState<boolean>(false);

  // In-Memory Module States (ZERO LOCALSTORAGE)
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLoaded, setNotesLoaded] = useState<boolean>(false);
  const [notesLoading, setNotesLoading] = useState<boolean>(false);

  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderCounts, setReminderCounts] = useState<ReminderCounts>(DEFAULT_REMINDER_COUNTS);
  const [remindersLoaded, setRemindersLoaded] = useState<boolean>(false);
  const [remindersLoading, setRemindersLoading] = useState<boolean>(false);

  const [dates, setDates] = useState<ImportantDate[]>([]);
  const [dateCounts, setDateCounts] = useState<ImportantDateCounts>(DEFAULT_DATE_COUNTS);
  const [datesLoaded, setDatesLoaded] = useState<boolean>(false);
  const [datesLoading, setDatesLoading] = useState<boolean>(false);

  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [vaultCounts, setVaultCounts] = useState<VaultCounts>(DEFAULT_VAULT_COUNTS);
  const [vaultLoaded, setVaultLoaded] = useState<boolean>(false);
  const [vaultLoading, setVaultLoading] = useState<boolean>(false);

  // Guard against simultaneous background fetches
  const isPreloadingRef = useRef<boolean>(false);

  // Reset entire in-memory cache
  const resetMemory = useCallback(() => {
    setOverview(null);
    setCounts(DEFAULT_DASHBOARD_COUNTS);
    setIsOverviewLoading(false);
    setIsHeavyData(false);

    setNotes([]);
    setNotesLoaded(false);
    setNotesLoading(false);

    setReminders([]);
    setReminderCounts(DEFAULT_REMINDER_COUNTS);
    setRemindersLoaded(false);
    setRemindersLoading(false);

    setDates([]);
    setDateCounts(DEFAULT_DATE_COUNTS);
    setDatesLoaded(false);
    setDatesLoading(false);

    setVaultEntries([]);
    setVaultCounts(DEFAULT_VAULT_COUNTS);
    setVaultLoaded(false);
    setVaultLoading(false);

    isPreloadingRef.current = false;
  }, []);

  // Individual Section Refreshers
  const refreshNotes = useCallback(async () => {
    if (!user) return;
    setNotesLoading(true);
    try {
      const data = await fetchNotesApi();
      setNotes(data);
      setNotesLoaded(true);
      setCounts((prev) => ({ ...prev, notes: data.length }));
    } catch {
      // Keep existing state on error
    } finally {
      setNotesLoading(false);
    }
  }, [user]);

  const refreshReminders = useCallback(async () => {
    if (!user) return;
    setRemindersLoading(true);
    try {
      const data = await fetchRemindersApi();
      setReminders(data.reminders);
      setReminderCounts(data.counts);
      setRemindersLoaded(true);
      setCounts((prev) => ({
        ...prev,
        reminders: data.counts.total,
        upcoming_reminders: data.counts.upcoming,
        overdue_reminders: data.counts.overdue,
      }));
    } catch {
      // Keep existing state on error
    } finally {
      setRemindersLoading(false);
    }
  }, [user]);

  const refreshDates = useCallback(async () => {
    if (!user) return;
    setDatesLoading(true);
    try {
      const data = await fetchImportantDatesApi();
      setDates(data.important_dates);
      setDateCounts(data.counts);
      setDatesLoaded(true);
      setCounts((prev) => ({
        ...prev,
        dates: data.counts.total,
        urgent_dates: data.counts.urgent,
        expired_dates: data.counts.expired,
      }));
    } catch {
      // Keep existing state on error
    } finally {
      setDatesLoading(false);
    }
  }, [user]);

  const refreshVault = useCallback(async () => {
    if (!user) return;
    setVaultLoading(true);
    try {
      const data = await fetchVaultEntriesApi();
      setVaultEntries(data.vault_entries);
      setVaultCounts(data.counts);
      setVaultLoaded(true);
      setCounts((prev) => ({
        ...prev,
        vault: data.counts.total,
      }));
    } catch {
      // Keep existing state on error
    } finally {
      setVaultLoading(false);
    }
  }, [user]);

  // Progressive background preloader for Heavy-Data users
  // Sequenced with micro-delays so requests never block each other or choke the UI
  const preloadProgressively = useCallback(async () => {
    if (isPreloadingRef.current || !user) return;
    isPreloadingRef.current = true;

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 1: Preload Important Dates
      if (!datesLoaded) {
        setDatesLoading(true);
        try {
          const datesData = await fetchImportantDatesApi();
          setDates(datesData.important_dates);
          setDateCounts(datesData.counts);
          setDatesLoaded(true);
        } catch {
          // Soft fail
        } finally {
          setDatesLoading(false);
        }
      }

      await delay(60);

      // Step 2: Preload Reminders
      if (!remindersLoaded) {
        setRemindersLoading(true);
        try {
          const remindersData = await fetchRemindersApi();
          setReminders(remindersData.reminders);
          setReminderCounts(remindersData.counts);
          setRemindersLoaded(true);
        } catch {
          // Soft fail
        } finally {
          setRemindersLoading(false);
        }
      }

      await delay(60);

      // Step 3: Preload Notes
      if (!notesLoaded) {
        setNotesLoading(true);
        try {
          const notesData = await fetchNotesApi();
          setNotes(notesData);
          setNotesLoaded(true);
        } catch {
          // Soft fail
        } finally {
          setNotesLoading(false);
        }
      }

      await delay(60);

      // Step 4: Preload Vault Entries (Heaviest step)
      if (!vaultLoaded) {
        setVaultLoading(true);
        try {
          const vaultData = await fetchVaultEntriesApi();
          setVaultEntries(vaultData.vault_entries);
          setVaultCounts(vaultData.counts);
          setVaultLoaded(true);
        } catch {
          // Soft fail
        } finally {
          setVaultLoading(false);
        }
      }
    } finally {
      isPreloadingRef.current = false;
    }
  }, [user, datesLoaded, remindersLoaded, notesLoaded, vaultLoaded]);

  // Main Dashboard Overview Fetcher
  const refreshDashboard = useCallback(async () => {
    if (!user || isLocked) return;

    setIsOverviewLoading(true);

    try {
      const data = await fetchDashboardOverviewApi();
      setOverview(data);
      setCounts(data.counts);
      setIsHeavyData(data.performance.is_heavy_data);

      if (data.performance.strategy === 'full_preload' && data.full_data) {
        // Low-Data User: Instant full in-memory hydration
        setNotes(data.full_data.notes || []);
        setNotesLoaded(true);

        setReminders(data.full_data.reminders || []);
        setReminderCounts({
          total: data.counts.reminders,
          pending: data.counts.reminders - (data.counts.overdue_reminders || 0),
          upcoming: data.counts.upcoming_reminders,
          overdue: data.counts.overdue_reminders,
          completed: 0,
        });
        setRemindersLoaded(true);

        setDates(data.full_data.dates || []);
        setDateCounts({
          total: data.counts.dates,
          pinned: 0,
          urgent: data.counts.urgent_dates,
          upcoming: data.counts.dates - data.counts.urgent_dates - data.counts.expired_dates,
          expired: data.counts.expired_dates,
        });
        setDatesLoaded(true);

        setVaultEntries(data.full_data.vault || []);
        setVaultCounts({
          total: data.counts.vault,
          favorites: (data.full_data.vault || []).filter((v) => v.is_favorite).length,
          logins: (data.full_data.vault || []).filter((v) => v.category === 'login').length,
          api_keys: (data.full_data.vault || []).filter((v) => v.category === 'api_key').length,
          cards: (data.full_data.vault || []).filter((v) => v.category === 'credit_card').length,
          servers: (data.full_data.vault || []).filter((v) => v.category === 'server').length,
          weak_passwords: (data.full_data.vault || []).filter((v) => v.password_strength === 'weak').length,
        });
        setVaultLoaded(true);
      } else if (data.previews) {
        // Heavy-Data User: Immediately warm in-memory previews
        if (data.previews.notes) setNotes(data.previews.notes);
        if (data.previews.reminders) setReminders(data.previews.reminders);
        if (data.previews.dates) setDates(data.previews.dates);
        if (data.previews.vault) setVaultEntries(data.previews.vault);

        // Initiate progressive non-blocking preload in background
        setTimeout(() => {
          preloadProgressively();
        }, 100);
      }
    } catch {
      // Quiet fallback
    } finally {
      setIsOverviewLoading(false);
    }
  }, [user, isLocked, preloadProgressively]);

  // Trigger dashboard fetch whenever user authenticates or unlocks
  useEffect(() => {
    if (user && !isLocked) {
      refreshDashboard();
    } else if (!user) {
      resetMemory();
    }
  }, [user, isLocked, refreshDashboard, resetMemory]);

  return (
    <PreloadDataContext.Provider
      value={{
        overview,
        counts,
        isOverviewLoading,
        isHeavyData,

        notes,
        notesLoaded,
        notesLoading,
        setNotes,
        refreshNotes,

        reminders,
        reminderCounts,
        remindersLoaded,
        remindersLoading,
        setReminders,
        setReminderCounts,
        refreshReminders,

        dates,
        dateCounts,
        datesLoaded,
        datesLoading,
        setDates,
        setDateCounts,
        refreshDates,

        vaultEntries,
        vaultCounts,
        vaultLoaded,
        vaultLoading,
        setVaultEntries,
        setVaultCounts,
        refreshVault,

        refreshDashboard,
        resetMemory,
      }}
    >
      {children}
    </PreloadDataContext.Provider>
  );
};

export const usePreloadData = (): PreloadDataContextType => {
  const context = useContext(PreloadDataContext);
  if (!context) {
    throw new Error('usePreloadData must be used within a PreloadDataProvider');
  }
  return context;
};
