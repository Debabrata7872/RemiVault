/**
 * RemiVault Frontend API Client
 * 
 * Architecture Notes:
 * - Centralizes HTTP communication with the Laravel REST API.
 * - Uses relative '/api' base path by default so Vite dev server proxy seamlessly
 *   routes requests from both localhost and mobile devices on local Wi-Fi.
 * - Supports AbortController and automatic 15s request timeouts to prevent UI hang.
 * - Always sends 'Accept: application/json' so Laravel returns JSON responses.
 * - Manages Bearer tokens for stateless authorization.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'remivault_auth_token';

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  has_pin?: boolean;
  pin_updated_at?: string | null;
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
  isAborted?: boolean;
}

export interface RequestOptions {
  signal?: AbortSignal;
  timeoutMs?: number;
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
 * Internal fetch wrapper with timeout and abort handling
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  options?: RequestOptions
): Promise<Response> {
  const timeoutMs = options?.timeoutMs ?? 15000; // 15 seconds default timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const onAbort = () => controller.abort();
  if (options?.signal) {
    options.signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (controller.signal.aborted) {
      if (options?.signal?.aborted) {
        throw { message: 'Operation cancelled.', isAborted: true } as ApiError;
      }
      throw {
        message: 'Connection timed out. Please check your connection and try again.',
        status: 408,
      } as ApiError;
    }
    throw {
      message: (err as Error)?.message || 'Network error occurred. Please verify backend is running.',
    } as ApiError;
  } finally {
    clearTimeout(timeoutId);
    if (options?.signal) {
      options.signal.removeEventListener('abort', onAbort);
    }
  }
}

/**
 * Perform a typed HTTP GET request
 */
export async function apiGet<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers: getHeaders(),
      credentials: 'include',
    },
    options
  );

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
export async function apiPost<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    },
    options
  );

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
 * Perform a typed HTTP PUT request
 */
export async function apiPut<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'PUT',
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    },
    options
  );

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
 * Perform a typed HTTP PATCH request
 */
export async function apiPatch<T, B = unknown>(
  endpoint: string,
  body?: B,
  options?: RequestOptions
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'PATCH',
      headers: getHeaders(),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: 'include',
    },
    options
  );

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
 * Perform a typed HTTP DELETE request
 */
export async function apiDelete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetchWithTimeout(
    url,
    {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    },
    options
  );

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

export async function registerApi(
  data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
  },
  options?: RequestOptions
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/register', data, options);
}

export async function loginApi(
  data: {
    email: string;
    password: string;
  },
  options?: RequestOptions
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/login', data, options);
}

export async function getMeApi(options?: RequestOptions): Promise<{ user: User }> {
  return apiGet<{ user: User }>('/auth/me', options);
}

export async function logoutApi(options?: RequestOptions): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/logout', undefined, options);
}

export async function sendEmailOtpApi(
  data: {
    email: string;
    type: 'register' | 'forgot_password';
    name?: string;
  },
  options?: RequestOptions
): Promise<{ message: string; cooldown_seconds: number }> {
  return apiPost<{ message: string; cooldown_seconds: number }>(
    '/auth/send-email-otp',
    data,
    { timeoutMs: 30000, ...options }
  );
}

export async function checkEmailOtpApi(
  data: {
    email: string;
    type: 'register' | 'forgot_password';
    otp: string;
  },
  options?: RequestOptions
): Promise<{ valid: boolean; message: string }> {
  return apiPost<{ valid: boolean; message: string }>('/auth/check-email-otp', data, options);
}

export async function verifyEmailOtpRegisterApi(
  data: {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    otp: string;
  },
  options?: RequestOptions
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/verify-email-otp-register', data, options);
}

export async function verifyEmailOtpResetApi(
  data: {
    email: string;
    password: string;
    password_confirmation: string;
    otp: string;
  },
  options?: RequestOptions
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/verify-email-otp-reset', data, options);
}

export async function firebaseLoginApi(
  data: {
    idToken: string;
    email?: string | null;
    name?: string | null;
    phone?: string | null;
    photo_url?: string | null;
  },
  options?: RequestOptions
): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/auth/firebase-login', data, options);
}

export async function changePasswordApi(
  data: {
    current_password: string;
    password: string;
    password_confirmation: string;
  },
  options?: RequestOptions
): Promise<{ message: string }> {
  return apiPost<{ message: string }>('/auth/change-password', data, options);
}

export interface SendFeedbackPayload {
  type: 'improvement' | 'feature' | 'bug';
  message: string;
  name?: string;
  email?: string;
}

export interface FeedbackResponse {
  message: string;
  feedback: {
    id: number;
    type: string;
    submitted_at: string;
    status: string;
  };
}

export async function sendFeedbackApi(
  data: SendFeedbackPayload,
  options?: RequestOptions
): Promise<FeedbackResponse> {
  return apiPost<FeedbackResponse>('/feedback', data, options);
}

export async function updateAvatarApi(
  avatarUrl: string,
  options?: RequestOptions
): Promise<{ message: string; avatar_url: string; user: User }> {
  return apiPost<{ message: string; avatar_url: string; user: User }>('/auth/update-avatar', { avatar_url: avatarUrl }, options);
}

export async function setSecurityPinApi(
  pin: string,
  currentPin?: string,
  options?: RequestOptions
): Promise<{ message: string; has_pin: boolean; user: User }> {
  return apiPost<{ message: string; has_pin: boolean; user: User }>(
    '/auth/security-pin',
    {
      pin,
      ...(currentPin ? { current_pin: currentPin } : {}),
    },
    options
  );
}

export async function verifySecurityPinApi(
  pin: string,
  token?: string,
  options?: RequestOptions
): Promise<{ valid: boolean; message: string; user?: User }> {
  if (token) {
    setStoredToken(token);
  }
  try {
    return await apiPost<{ valid: boolean; message: string; user?: User }>(
      '/auth/security-pin/verify',
      { pin },
      options
    );
  } catch (err: unknown) {
    const apiErr = err as ApiError;
    if (apiErr?.status === 422) {
      return { valid: false, message: apiErr.message || 'Incorrect PIN.' };
    }
    throw err;
  }
}

export async function resetPinWithOtpApi(
  data: {
    email: string;
    otp: string;
    pin: string;
  },
  options?: RequestOptions
): Promise<{ message: string; has_pin: boolean; user: User; token: string }> {
  return apiPost<{ message: string; has_pin: boolean; user: User; token: string }>(
    '/auth/verify-email-otp-pin',
    data,
    options
  );
}


