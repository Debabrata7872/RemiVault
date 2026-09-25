/**
 * RemiVault Important Dates API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

export type ImportantDateCategory = 
  | 'passport' 
  | 'license' 
  | 'anniversary' 
  | 'birthday' 
  | 'warranty' 
  | 'subscription' 
  | 'custom';

export type RecurrenceType = 'none' | 'yearly' | 'monthly';

export type UrgencyStatus = 'expired' | 'today' | 'urgent' | 'upcoming' | 'normal';

export interface ImportantDate {
  id: number;
  user_id: number;
  title: string;
  category: ImportantDateCategory;
  target_date: string;
  recurrence: RecurrenceType;
  notify_days_before: number;
  is_pinned: boolean;
  notes: string | null;
  next_occurrence: string;
  days_remaining: number;
  urgency_status: UrgencyStatus;
  created_at: string;
  updated_at: string;
}

export interface ImportantDateCounts {
  total: number;
  pinned: number;
  urgent: number;
  upcoming: number;
  expired: number;
}

export interface ImportantDatesResponse {
  important_dates: ImportantDate[];
  counts: ImportantDateCounts;
}

export interface CreateImportantDatePayload {
  title: string;
  category: ImportantDateCategory;
  target_date: string;
  recurrence?: RecurrenceType;
  notify_days_before?: number;
  is_pinned?: boolean;
  notes?: string;
}

export interface UpdateImportantDatePayload {
  title?: string;
  category?: ImportantDateCategory;
  target_date?: string;
  recurrence?: RecurrenceType;
  notify_days_before?: number;
  is_pinned?: boolean;
  notes?: string;
}

/**
 * Fetch all important dates for the authenticated user with optional filtering
 */
export async function fetchImportantDatesApi(params?: {
  category?: string;
  filter?: string;
  search?: string;
}): Promise<ImportantDatesResponse> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    query.set('category', params.category);
  }
  if (params?.filter && params.filter !== 'all') {
    query.set('filter', params.filter);
  }
  if (params?.search) {
    query.set('search', params.search);
  }

  const endpoint = query.toString() ? `/important-dates?${query.toString()}` : '/important-dates';
  return apiGet<ImportantDatesResponse>(endpoint);
}

/**
 * Create a new important date entry
 */
export async function createImportantDateApi(payload: CreateImportantDatePayload): Promise<ImportantDate> {
  const response = await apiPost<{ message: string; important_date: ImportantDate }>('/important-dates', payload);
  return response.important_date;
}

/**
 * Update an existing important date entry
 */
export async function updateImportantDateApi(id: number, payload: UpdateImportantDatePayload): Promise<ImportantDate> {
  const response = await apiPut<{ message: string; important_date: ImportantDate }>(`/important-dates/${id}`, payload);
  return response.important_date;
}

/**
 * Delete an important date entry
 */
export async function deleteImportantDateApi(id: number): Promise<void> {
  await apiDelete<{ message: string }>(`/important-dates/${id}`);
}

/**
 * Toggle the pinned status of an important date
 */
export async function togglePinImportantDateApi(id: number): Promise<ImportantDate> {
  const response = await apiPatch<{ message: string; important_date: ImportantDate }>(`/important-dates/${id}/toggle-pin`);
  return response.important_date;
}
