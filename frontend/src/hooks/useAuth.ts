'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../lib/api';
import { saveTokens, clearTokens, isAuthenticated } from '../lib/auth';
import { ApiResponse } from '../types/api';
import { User } from '../types/user';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.post<ApiResponse<AuthTokens>>(
          '/api/auth/login',
          { email, password },
        );
        const { access_token, refresh_token } = res.data.data;
        saveTokens(access_token, refresh_token);
        router.push('/posts');
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Login failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const register = useCallback(
    async (username: string, email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await apiClient.post<ApiResponse<RegisterResponse>>(
          '/api/auth/register',
          { username, email, password },
        );
        router.push('/verify-email');
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Registration failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [router],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      clearTokens();
      router.push('/login');
    }
  }, [router]);

  return {
    login,
    register,
    logout,
    loading,
    error,
    isAuthenticated: isAuthenticated(),
  };
}
