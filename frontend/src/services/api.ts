/**
 * RemiVault Frontend API Client
 * 
 * Architecture Notes:
 * - This module centralizes all HTTP communication with the Laravel backend.
 * - Always includes 'Accept: application/json' to instruct Laravel's content-negotiation
 *   middleware to return JSON responses rather than HTML redirects on validation or auth errors.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export interface HealthResponse {
  status: 'ok' | 'error';
  application: string;
  environment: string;
  database: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

/**
 * Perform a typed HTTP GET request to the API
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${cleanEndpoint}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Permits CORS credentials / cookies if needed
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
 * Check backend and database connectivity
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health');
}
