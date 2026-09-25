/**
 * RemiVault Password & Credential Vault API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from './api';

export type VaultCategory = 
  | 'login' 
  | 'credit_card' 
  | 'api_key' 
  | 'server' 
  | 'secure_note' 
  | 'other';

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong';

export interface VaultEntry {
  id: number;
  user_id: number;
  title: string;
  category: VaultCategory;
  username: string | null;
  password: string;
  url: string | null;
  notes: string | null;
  is_favorite: boolean;
  password_strength: PasswordStrength;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VaultCounts {
  total: number;
  favorites: number;
  logins: number;
  api_keys: number;
  cards: number;
  servers: number;
  weak_passwords: number;
}

export interface VaultResponse {
  vault_entries: VaultEntry[];
  counts: VaultCounts;
}

export interface CreateVaultEntryPayload {
  title: string;
  category: VaultCategory;
  password: string;
  username?: string;
  url?: string;
  notes?: string;
  is_favorite?: boolean;
}

export interface UpdateVaultEntryPayload {
  title?: string;
  category?: VaultCategory;
  password?: string;
  username?: string;
  url?: string;
  notes?: string;
  is_favorite?: boolean;
}

/**
 * Fetch all vault entries for the authenticated user with optional filtering
 */
export async function fetchVaultEntriesApi(params?: {
  category?: string;
  favorites?: boolean;
  search?: string;
}): Promise<VaultResponse> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'all') {
    query.set('category', params.category);
  }
  if (params?.favorites) {
    query.set('favorites', 'true');
  }
  if (params?.search) {
    query.set('search', params.search);
  }

  const endpoint = query.toString() ? `/vault-entries?${query.toString()}` : '/vault-entries';
  return apiGet<VaultResponse>(endpoint);
}

/**
 * Create a new encrypted vault entry
 */
export async function createVaultEntryApi(payload: CreateVaultEntryPayload): Promise<VaultEntry> {
  const response = await apiPost<{ message: string; vault_entry: VaultEntry }>('/vault-entries', payload);
  return response.vault_entry;
}

/**
 * Update an existing vault entry
 */
export async function updateVaultEntryApi(id: number, payload: UpdateVaultEntryPayload): Promise<VaultEntry> {
  const response = await apiPut<{ message: string; vault_entry: VaultEntry }>(`/vault-entries/${id}`, payload);
  return response.vault_entry;
}

/**
 * Delete a vault entry
 */
export async function deleteVaultEntryApi(id: number): Promise<void> {
  await apiDelete<{ message: string }>(`/vault-entries/${id}`);
}

/**
 * Toggle favorite status on a vault entry
 */
export async function toggleFavoriteVaultApi(id: number): Promise<VaultEntry> {
  const response = await apiPatch<{ message: string; vault_entry: VaultEntry }>(`/vault-entries/${id}/toggle-favorite`);
  return response.vault_entry;
}

/**
 * Record an access/copy event for audit and last used tracking
 */
export async function recordVaultAccessApi(id: number): Promise<void> {
  await apiPost<{ message: string }>(`/vault-entries/${id}/record-access`, {});
}
