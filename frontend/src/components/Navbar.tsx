'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearTokens } from '../lib/auth';
import { Button } from './ui/Button';
import apiClient from '../lib/api';

export function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      clearTokens();
      router.push('/login');
    }
  };

  const authenticated = isAuthenticated();

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/posts"
            className="text-xl font-bold text-gray-900 hover:text-gray-700"
          >
            NestSocial
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/posts"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Feed
            </Link>
            {authenticated ? (
              <Link
                href="/upload"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Upload
              </Link>
            ) : null}
            {authenticated ? (
              <Button variant="secondary" onClick={handleLogout}>
                Logout
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="secondary">Login</Button>
                </Link>
                <Link href="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
