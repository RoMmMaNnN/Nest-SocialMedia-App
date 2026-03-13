'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '../../../lib/api';
import { ApiResponse } from '../../../types/api';
import { User } from '../../../types/user';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export default function SettingsPage() {
  const [loadingUser, setLoadingUser] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const savedTheme =
      typeof window !== 'undefined' && localStorage.getItem(THEME_STORAGE_KEY) === 'dark'
        ? 'dark'
        : 'light';
    setTheme(savedTheme);
    applyTheme(savedTheme);

    const loadCurrentUser = async () => {
      try {
        const meRes = await apiClient.get<ApiResponse<User>>('/api/auth/me');
        const me = meRes.data.data;
        setCurrentUser(me);
        setDisplayName(me.displayName ?? '');
        setUsername(me.username);
        setBio(me.bio ?? '');
      } catch {
        setCurrentUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    void loadCurrentUser();
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(null);

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        await apiClient.post('/api/upload/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      const res = await apiClient.patch<ApiResponse<User>>(`/api/users/${currentUser.id}`, {
        displayName: displayName.trim() || null,
        username: username.trim(),
        bio: bio.trim() || null,
      });

      const updated = res.data.data;
      setCurrentUser(updated);
      setDisplayName(updated.displayName ?? '');
      setUsername(updated.username);
      setBio(updated.bio ?? '');
      setAvatarFile(null);
      setProfileSuccess('Profile updated successfully');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile';
      setProfileError(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await apiClient.patch<ApiResponse<{ message: string }>>('/api/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess(res.data.data.message || 'Password changed successfully');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password';
      setPasswordError(message);
    } finally {
      setSavingPassword(false);
    }
  };

  if (loadingUser) {
    return <p className="text-sm text-gray-700 dark:text-slate-300">Loading settings...</p>;
  }

  if (!currentUser) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Settings</h1>
        <p className="mt-2 text-sm text-gray-700 dark:text-slate-300">
          You need to be logged in to manage your settings.
        </p>
        <Link href="/login" className="mt-4 inline-block text-sm font-medium text-gray-900 hover:underline dark:text-sky-300">
          Login to continue
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Settings</h1>

      <Card>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-slate-100">Profile Settings</h2>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <Input
            id="displayName"
            label="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={80}
          />

          <Input
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            minLength={3}
            maxLength={30}
            required
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="bio" className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={300}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-sky-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="avatar" className="text-sm font-medium text-gray-700 dark:text-slate-200">
              Avatar upload
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:file:rounded-md dark:file:border-0 dark:file:bg-slate-800 dark:file:px-3 dark:file:py-1.5 dark:file:text-sm dark:file:font-medium dark:file:text-slate-200"
            />
          </div>

          {profileError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-1 dark:ring-rose-400/30">{profileError}</p>
          ) : null}
          {profileSuccess ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-400/30">{profileSuccess}</p>
          ) : null}

          <Button type="submit" isLoading={savingProfile}>
            Save
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-slate-100">Security</h2>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input
            id="currentPassword"
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />

          <Input
            id="newPassword"
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <Input
            id="confirmPassword"
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {passwordError ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-1 dark:ring-rose-400/30">{passwordError}</p>
          ) : null}
          {passwordSuccess ? (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-400/30">{passwordSuccess}</p>
          ) : null}

          <Button type="submit" isLoading={savingPassword}>
            Update password
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-slate-100">Appearance</h2>
        <p className="mb-4 text-sm text-gray-700 dark:text-slate-300">Switch between light and dark mode.</p>
        <Button variant="secondary" onClick={toggleTheme}>
          {theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </Button>
      </Card>
    </div>
  );
}
