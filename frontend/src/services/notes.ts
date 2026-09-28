/**
 * RemiVault Notes API Client
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';

export type NoteColor = 'default' | 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  is_pinned: boolean;
  color: NoteColor;
  created_at: string;
  updated_at: string;
}

export interface NotePayload {
  title: string;
  content: string;
  is_pinned?: boolean;
  color?: NoteColor;
}

/**
 * Fetch all notes owned by the authenticated user
 */
export async function fetchNotesApi(): Promise<Note[]> {
  const response = await apiGet<{ notes: Note[] }>('/notes');
  return response.notes;
}

/**
 * Create a new personal note
 */
export async function createNoteApi(payload: NotePayload): Promise<Note> {
  const response = await apiPost<{ message: string; note: Note }>('/notes', payload);
  return response.note;
}

/**
 * Update an existing note
 */
export async function updateNoteApi(id: number, payload: Partial<NotePayload>): Promise<Note> {
  const response = await apiPut<{ message: string; note: Note }>(`/notes/${id}`, payload);
  return response.note;
}

/**
 * Delete a note
 */
export async function deleteNoteApi(id: number): Promise<void> {
  await apiDelete<{ message: string }>(`/notes/${id}`);
}
