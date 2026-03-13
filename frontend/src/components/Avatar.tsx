import React from 'react';

interface AvatarProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

function initialsFromUsername(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

export function Avatar({ username, avatarUrl, size = 40 }: AvatarProps) {
  const style = { width: `${size}px`, height: `${size}px` };

  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={avatarUrl} alt={username} className="rounded-full object-cover" style={style} />;
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white dark:bg-sky-500 dark:text-slate-950"
      style={style}
      aria-label={username}
      title={username}
    >
      {initialsFromUsername(username)}
    </div>
  );
}
