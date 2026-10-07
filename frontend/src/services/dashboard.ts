import { apiGet } from './api';
import type { Note } from './notes';
import type { Reminder } from './reminders';
import type { ImportantDate } from './importantDates';
import type { VaultEntry } from './vault';

export interface DashboardCounts {
  vault: number;
  dates: number;
  reminders: number;
  notes: number;
  urgent_dates: number;
  expired_dates: number;
  upcoming_reminders: number;
  overdue_reminders: number;
  total_items: number;
}

export interface DashboardPerformance {
  is_heavy_data: boolean;
  strategy: 'preview_chunked' | 'full_preload';
}

export interface DashboardOverviewResponse {
  counts: DashboardCounts;
  performance: DashboardPerformance;
  previews?: {
    notes: Note[];
    reminders: Reminder[];
    dates: ImportantDate[];
    vault: VaultEntry[];
  };
  full_data?: {
    notes: Note[];
    reminders: Reminder[];
    dates: ImportantDate[];
    vault: VaultEntry[];
  };
}

export async function fetchDashboardOverviewApi(): Promise<DashboardOverviewResponse> {
  return apiGet<DashboardOverviewResponse>('/dashboard/overview');
}

