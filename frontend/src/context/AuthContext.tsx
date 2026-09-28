import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { 
  getStoredToken, 
  setStoredToken, 
  loginApi, 
  registerApi, 
  getMeApi, 
  logoutApi,
  verifyEmailOtpRegisterApi,
  verifyEmailOtpResetApi,
  firebaseLoginApi
} from '../services/api';
import type { User, ApiError, RequestOptions } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, options?: RequestOptions) => Promise<void>;
  register: (name: string, email: string, password: string, confirmation: string, options?: RequestOptions) => Promise<void>;
  registerWithOtp: (name: string, email: string, password: string, confirmation: string, otp: string, options?: RequestOptions) => Promise<void>;
  resetPasswordWithOtp: (email: string, password: string, confirmation: string, otp: string, options?: RequestOptions) => Promise<void>;
  loginWithFirebase: (idToken: string, email?: string | null, name?: string | null, phone?: string | null, options?: RequestOptions) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * On Initial Mount:
   * Verify if a previously saved token in localStorage is still valid with Laravel.
   * If valid: populate the user state.
   * If invalid/expired: purge token from storage.
   */
  useEffect(() => {
    const verifyToken = async () => {
      const savedToken = getStoredToken();
      if (!savedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await getMeApi();
        setUser(response.user);
        setToken(savedToken);
      } catch {
        // Token was revoked or expired
        setStoredToken(null);
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email: string, password: string, options?: RequestOptions): Promise<void> => {
    setError(null);
    try {
      const response = await loginApi({ email, password }, options);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const msg = apiErr.errors?.email?.[0] || apiErr.message || 'Login failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const register = async (
    name: string, 
    email: string, 
    password: string, 
    confirmation: string,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await registerApi({
        name,
        email,
        password,
        password_confirmation: confirmation,
      }, options);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const firstField = apiErr.errors ? Object.keys(apiErr.errors)[0] : null;
        const msg = firstField ? apiErr.errors![firstField][0] : apiErr.message || 'Registration failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const registerWithOtp = async (
    name: string,
    email: string,
    password: string,
    confirmation: string,
    otp: string,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await verifyEmailOtpRegisterApi({
        name,
        email,
        password,
        password_confirmation: confirmation,
        otp,
      }, options);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const firstField = apiErr.errors ? Object.keys(apiErr.errors)[0] : null;
        const msg = firstField ? apiErr.errors![firstField][0] : apiErr.message || 'OTP Verification failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const resetPasswordWithOtp = async (
    email: string,
    password: string,
    confirmation: string,
    otp: string,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await verifyEmailOtpResetApi({
        email,
        password,
        password_confirmation: confirmation,
        otp,
      }, options);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const msg = apiErr.message || 'Password reset failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const loginWithFirebase = async (
    idToken: string,
    email?: string | null,
    name?: string | null,
    phone?: string | null,
    options?: RequestOptions
  ): Promise<void> => {
    setError(null);
    try {
      const response = await firebaseLoginApi({ idToken, email, name, phone }, options);
      setStoredToken(response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      if (!apiErr.isAborted) {
        const msg = apiErr.message || 'Firebase authentication failed';
        setError(msg);
      }
      throw apiErr;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      if (token) {
        await logoutApi();
      }
    } catch {
      // Even if network call fails, always clear local state
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setError(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        error,
        login,
        register,
        registerWithOtp,
        resetPasswordWithOtp,
        loginWithFirebase,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
