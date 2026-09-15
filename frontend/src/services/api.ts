/**
 * RemiVault Frontend API Client
 * 
 * Architecture Notes:
 * - Centralizes HTTP communication with the Laravel REST API.
 * - Always sends 'Accept: application/json' so Laravel returns JSON responses
 *   rather than redirecting to a login or home route on errors.
 * - Manages Bearer tokens for stateless authorization.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'remivault_auth_token';

export interface User {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export interface HealthResponse {
  status: 'ok' | 'error';
  application: string;
  environment: string;
  database: string;
  timestamp: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/**
 * Token Storage Helpers
 */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

/**
 * Build default HTTP headers including Bearer token if available
 */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Perform a typed HTTP GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getHeaders(),
    credentials: 'include',
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP error ${response.status}: ${response.statusText}` };
    }
    errorData.status = response.status;
    throw errorData;
  }

  return response.json();
}

/**
 * Perform a typed HTTP POST request
 */
export async function apiPost<T, B = unknown>(endpoint: string, body?: B): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: getHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorData: ApiError;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: `HTTP error ${response.status}: ${response.statusText}` };
    }
    errorData.status = response.status;
    throw errorData;
  }

  return response.json();
}

/**
 * API Endpoints
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}

export async function registerApi(data: {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', data);
}

export async function loginApi(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', data);
}

export async function getMeApi(): Promise<{ user: User }> {
  return apiGet<{ user: User }>('/auth/me');
}

export async function logoutApi(): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/logout');
}
