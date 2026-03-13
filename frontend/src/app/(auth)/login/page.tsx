'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';

export default function LoginPage() {
  const { login, loading, error, fieldErrors } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-slate-100">Sign in</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              error={fieldErrors.email?.[0]}
            />
            {fieldErrors.email?.map((err, i) => (
              <p key={`email-${i}`} className="-mt-2 text-sm text-red-500 dark:text-rose-300">
                {err}
              </p>
            ))}

            <Input
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              error={fieldErrors.password?.[0]}
            />
            {fieldErrors.password?.map((err, i) => (
              <p key={`password-${i}`} className="-mt-2 text-sm text-red-500 dark:text-rose-300">
                {err}
              </p>
            ))}

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-1 dark:ring-rose-400/30">
                {error}
              </p>
            )}

            <Button type="submit" isLoading={loading} className="mt-2 w-full">
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-slate-300">
            No account?{' '}
            <Link href="/register" className="font-medium text-gray-900 hover:underline dark:text-sky-300">
              Register
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
