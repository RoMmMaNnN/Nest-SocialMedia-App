'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../lib/api';
import { saveTokens, clearTokens, isAuthenticated } from '../lib/auth';
import { ApiErrorResponse, ApiResponse } from '../types/api';
import { User } from '../types/user';

interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface RegisterResponse {
  message: string;
}

type FieldErrors = Record<string, string[]>;

function parseFieldErrors(errors: string[] | undefined): FieldErrors {
  if (!errors?.length) return {};

  const parsed: FieldErrors = {};

  for (const error of errors) {
    const separatorIndex = error.indexOf(':');

    if (separatorIndex <= 0) {
      if (!parsed.general) parsed.general = [];
      parsed.general.push(error);
      continue;
    }

    const field = error.slice(0, separatorIndex).trim();
    const message = error.slice(separatorIndex + 1).trim();
    if (!field || !message) continue;

    if (!parsed[field]) parsed[field] = [];
    parsed[field].push(message);
  }

  return parsed;
}

export function useAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const login = useCallback(
    async (email: string, password: string): Promise<void> => {
      setLoading(true);
      setError(null);
      setFieldErrors({});
      try {
        const res = await apiClient.post<ApiResponse<AuthTokens>>(
          '/api/auth/login',
          { email, password },
        );
        const { access_token, refresh_token } = res.data.data;
        saveTokens(access_token, refresh_token);
        router.push('/posts');
      } catch (err: unknown) {
        const errorResponse = (err as { response?: { data?: ApiErrorResponse } })
          ?.response?.data;
        const parsed = parseFieldErrors(errorResponse?.errors);
        const message = errorResponse?.message || 'Login failed';
        setError(message);
        setFieldErrors(parsed);
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
      setFieldErrors({});
      try {
        await apiClient.post<ApiResponse<RegisterResponse>>(
          '/api/auth/register',
          { username, email, password },
        );
        router.push('/verify-email');
      } catch (err: unknown) {
        const errorResponse = (err as { response?: { data?: ApiErrorResponse } })
          ?.response?.data;
        const parsed = parseFieldErrors(errorResponse?.errors);
        const message = errorResponse?.message || 'Registration failed';
        setError(message);
        setFieldErrors(parsed);
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
    fieldErrors,
    isAuthenticated: isAuthenticated(),
  };
}
