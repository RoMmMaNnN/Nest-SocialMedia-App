'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let imageUrl: string | undefined;

      if (file) {
        const form = new FormData();
        form.append('file', file);
        const uploadRes = await apiClient.post('/api/upload/post-image', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data?.data?.imageUrl;
      }

      const postRes = await apiClient.post('/api/posts', {
        title,
        content,
        imageUrl,
        published,
      });

      const postId = postRes.data?.data?.id;
      if (postId) {
        router.push(`/posts/${postId}`);
      } else {
        router.push('/posts');
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create post';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Create a post</h1>

        <form onSubmit={submit} className="space-y-4">
          <Input
            id="title"
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={180}
          />

          <div className="flex flex-col gap-1">
            <label htmlFor="content" className="text-sm font-medium text-gray-700">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              required
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="image" className="text-sm font-medium text-gray-700">
              Image (optional)
            </label>
            <input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish immediately
          </label>

          {error ? (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          ) : null}

          <Button type="submit" isLoading={loading}>
            Create post
          </Button>
        </form>
      </Card>
    </div>
  );
}
