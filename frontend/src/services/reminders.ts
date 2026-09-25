/**
 * RemiVault Reminders API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReminderStatus = 'pending' | 'completed' | 'cancelled';

export interface Reminder {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  remind_at: string;
  priority: ReminderPriority;
  status: ReminderStatus;
  snooze_until: string | null;
  completed_at: string | null;
  is_overdue: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReminderCounts {
  total: number;
  pending: number;
  upcoming: number;
  overdue: number;
  completed: number;
}

export interface RemindersResponse {
  reminders: Reminder[];
  counts: ReminderCounts;
}

export interface CreateReminderPayload {
  title: string;
  description?: string;
  remind_at: string;
  priority?: ReminderPriority;
}

export interface UpdateReminderPayload {
  title?: string;
  description?: string;
  remind_at?: string;
  priority?: ReminderPriority;
  status?: ReminderStatus;
  snooze_until?: string | null;
}

/**
 * Fetch all reminders owned by the authenticated user with optional filtering
 */
export async function fetchRemindersApi(params?: {
  status?: string;
  priority?: string;
  search?: string;
}): Promise<RemindersResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') {
    query.set('status', params.status);
  }
  if (params?.priority && params.priority !== 'all') {
    query.set('priority', params.priority);
  }
  if (params?.search) {
    query.set('search', params.search);
  }

  const endpoint = query.toString() ? `/reminders?${query.toString()}` : '/reminders';
  return apiGet<RemindersResponse>(endpoint);
}

/**
 * Create a new reminder
 */
export async function createReminderApi(payload: CreateReminderPayload): Promise<Reminder> {
  const response = await apiPost<{ message: string; reminder: Reminder }>('/reminders', payload);
  return response.reminder;
}

/**
 * Update an existing reminder
 */
export async function updateReminderApi(id: number, payload: UpdateReminderPayload): Promise<Reminder> {
  const response = await apiPut<{ message: string; reminder: Reminder }>(`/reminders/${id}`, payload);
  return response.reminder;
}

/**
 * Delete a reminder
 */
export async function deleteReminderApi(id: number): Promise<void> {
  await apiDelete<{ message: string }>(`/reminders/${id}`);
}

/**
 * Fast atomic toggle for completed status
 */
export async function toggleCompleteReminderApi(id: number): Promise<Reminder> {
  const response = await apiPatch<{ message: string; reminder: Reminder }>(`/reminders/${id}/toggle-complete`);
  return response.reminder;
}

/**
 * Snooze a reminder by minutes or to an exact datetime
 */
export async function snoozeReminderApi(id: number, minutes?: number, snoozeUntil?: string): Promise<Reminder> {
  const payload: { minutes?: number; snooze_until?: string } = {};
  if (minutes !== undefined) payload.minutes = minutes;
  if (snoozeUntil !== undefined) payload.snooze_until = snoozeUntil;

  const response = await apiPost<{ message: string; reminder: Reminder }>(`/reminders/${id}/snooze`, payload);
  return response.reminder;
}
