'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { isAuthenticated, clearTokens } from '../lib/auth';
import { Button } from './ui/Button';
import apiClient from '../lib/api';
import { Avatar } from './Avatar';
import { ApiResponse } from '../types/api';
import { User } from '../types/user';

export function Navbar() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const auth = isAuthenticated();
    setAuthenticated(auth);

    const html = document.documentElement;
    setIsDark(html.classList.contains('dark'));

    if (!auth) return;

    const loadCurrentUser = async () => {
      try {
        const res = await apiClient.get<ApiResponse<User>>('/api/auth/me');
        setCurrentUser(res.data.data);
      } catch {
        setCurrentUser(null);
      }
    };

    void loadCurrentUser();
  }, []);

  const profileHref = useMemo(() => {
    if (!currentUser) return null;
    return `/profile/${currentUser.id}`;
  }, [currentUser]);

  const toggleDarkMode = () => {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      clearTokens();
      setAuthenticated(false);
      setCurrentUser(null);
      setMenuOpen(false);
      router.push('/login');
    }
  };

  return (
    <nav className="border-b border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link
            href="/posts"
            className="text-xl font-bold text-gray-900 hover:text-gray-700 dark:text-slate-100 dark:hover:text-slate-300"
          >
            NestSocial
          </Link>

          <div className="hidden items-center gap-4 md:flex">
            <Link href="/posts" className="text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
              Feed
            </Link>
            {profileHref ? (
              <Link href={profileHref} className="text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
                Profile
              </Link>
            ) : null}
            <Link href="/settings" className="text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-slate-100">
              Settings
            </Link>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm18 0a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM6.343 6.343a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414Zm10.607 10.607a1 1 0 0 1 1.414 0l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414Zm1.414-10.607a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM8.464 16.95a1 1 0 0 1 0 1.414l-.707.707A1 1 0 1 1 6.343 17.657l.707-.707a1 1 0 0 1 1.414 0Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a1 1 0 0 1 .88 1.47A7 7 0 1 0 19.53 11.9 1 1 0 0 1 21 12.8Z" />
                </svg>
              )}
            </button>

            {authenticated ? (
              <div className="flex items-center gap-2">
                {currentUser ? (
                  <>
                    <Avatar username={currentUser.username} avatarUrl={currentUser.avatarUrl} size={32} />
                    <span className="text-sm font-medium text-gray-800 dark:text-slate-200">@{currentUser.username}</span>
                  </>
                ) : null}
                <Button variant="secondary" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
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

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 transition-colors hover:bg-gray-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM4 11a1 1 0 1 1 0 2H3a1 1 0 1 1 0-2h1Zm18 0a1 1 0 1 1 0 2h-1a1 1 0 1 1 0-2h1ZM6.343 6.343a1 1 0 0 1 1.414 0l.707.707a1 1 0 1 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414Zm10.607 10.607a1 1 0 0 1 1.414 0l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414Zm1.414-10.607a1 1 0 0 1 0 1.414l-.707.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM8.464 16.95a1 1 0 0 1 0 1.414l-.707.707A1 1 0 1 1 6.343 17.657l.707-.707a1 1 0 0 1 1.414 0Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a1 1 0 0 1 .88 1.47A7 7 0 1 0 19.53 11.9 1 1 0 0 1 21 12.8Z" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 text-gray-700 dark:border-slate-600 dark:text-slate-200"
              aria-label="Toggle navigation menu"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="flex flex-col gap-3 border-t border-gray-200 py-4 md:hidden dark:border-slate-700">
            <Link href="/posts" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 dark:text-slate-300">
              Feed
            </Link>
            {profileHref ? (
              <Link href={profileHref} onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 dark:text-slate-300">
                Profile
              </Link>
            ) : null}
            <Link href="/settings" onClick={() => setMenuOpen(false)} className="text-sm text-gray-700 dark:text-slate-300">
              Settings
            </Link>

            {authenticated && currentUser ? (
              <div className="flex items-center gap-2 pt-2">
                <Avatar username={currentUser.username} avatarUrl={currentUser.avatarUrl} size={30} />
                <span className="text-sm text-gray-800 dark:text-slate-200">@{currentUser.username}</span>
              </div>
            ) : null}

            {authenticated ? (
              <Button variant="secondary" onClick={handleLogout} className="w-full">
                Logout
              </Button>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link href="/register" className="flex-1" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full">Register</Button>
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
