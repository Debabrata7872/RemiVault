/**
 * RemiVault Notes API Client
 */

import { apiGet, apiPost } from './api';

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
  // Using custom PUT via fetch wrapper
  const cleanUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/notes/${id}`;
  const token = localStorage.getItem('remivault_auth_token');

  const response = await fetch(cleanUrl, {
    method: 'PUT',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update note' }));
    throw error;
  }

  const data = await response.json();
  return data.note;
}

/**
 * Delete a note
 */
export async function deleteNoteApi(id: number): Promise<void> {
  const cleanUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/notes/${id}`;
  const token = localStorage.getItem('remivault_auth_token');

  const response = await fetch(cleanUrl, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete note' }));
    throw error;
  }
}
