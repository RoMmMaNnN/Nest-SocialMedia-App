'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '../../../lib/api';
import { Card } from '../../../components/ui/Card';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      setStatus('verifying');
      try {
        const res = await apiClient.post('/api/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data?.data?.message ?? 'Email verified successfully. You can now log in.');
      } catch {
        setStatus('error');
        setMessage('Verification link is invalid or expired.');
      }
    };

    void verify();
  }, [token]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm text-center">
        <Card>
          <div className="mb-4 text-5xl">📬</div>

          {!token ? (
            <>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="mb-6 text-sm text-gray-600">
                We sent a verification link to your inbox. Click it to activate your account before logging in.
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">Email verification</h1>
              <p className="mb-6 text-sm text-gray-600">
                {status === 'verifying' ? 'Verifying your email...' : message}
              </p>
            </>
          )}

          <Link href="/login" className="text-sm font-medium text-gray-900 hover:underline">
            Back to sign in
          </Link>
        </Card>
      </div>
    </div>
  );
}
