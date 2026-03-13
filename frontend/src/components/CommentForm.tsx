'use client';

import { useState } from 'react';
import { Button } from './ui/Button';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  loading?: boolean;
}

export function CommentForm({ onSubmit, loading = false }: CommentFormProps) {
  const [content, setContent] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-sky-500 dark:focus:outline-none dark:focus:ring-1 dark:focus:ring-sky-500"
        placeholder="Write a comment..."
      />
      <div>
        <Button type="submit" isLoading={loading}>
          Post Comment
        </Button>
      </div>
    </form>
  );
}
