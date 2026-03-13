'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card } from '../../../components/ui/Card';

export default function RegisterPage() {
  const { register, loading, error, fieldErrors } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    await register(username, email, password);
  };

  const confirmPasswordErrors = localError && localError.includes('match') ? [localError] : [];
  const passwordLocalErrors = localError && localError.includes('least') ? [localError] : [];

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-sm">
        <Card>
          <h1 className="mb-6 text-2xl font-bold text-gray-900">Create account</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="john_doe"
              required
              autoComplete="username"
              error={fieldErrors.username?.[0]}
            />
            {fieldErrors.username?.map((err, i) => (
              <p key={`username-${i}`} className="text-red-500 text-sm -mt-2">
                {err}
              </p>
            ))}

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
              <p key={`email-${i}`} className="text-red-500 text-sm -mt-2">
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
              autoComplete="new-password"
              error={fieldErrors.password?.[0] ?? passwordLocalErrors[0]}
            />
            {fieldErrors.password?.map((err, i) => (
              <p key={`password-api-${i}`} className="text-red-500 text-sm -mt-2">
                {err}
              </p>
            ))}
            {passwordLocalErrors.map((err, i) => (
              <p key={`password-local-${i}`} className="text-red-500 text-sm -mt-2">
                {err}
              </p>
            ))}

            <Input
              id="confirmPassword"
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              error={confirmPasswordErrors[0]}
            />
            {confirmPasswordErrors.map((err, i) => (
              <p key={`confirm-password-${i}`} className="text-red-500 text-sm -mt-2">
                {err}
              </p>
            ))}

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <Button type="submit" isLoading={loading} className="mt-2 w-full">
              Create account
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
