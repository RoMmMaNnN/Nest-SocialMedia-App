'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '../../../../lib/api';
import { getAccessToken } from '../../../../lib/auth';
import { Avatar } from '../../../../components/Avatar';
import { CommentForm } from '../../../../components/CommentForm';
import { CommentList } from '../../../../components/CommentList';
import { LikeButton } from '../../../../components/LikeButton';
import { Spinner } from '../../../../components/Spinner';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { useComments } from '../../../../hooks/useComments';
import { usePost } from '../../../../hooks/usePost';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = Number(params.id);

  const { post, loading, error, fetchPost, toggleLike } = usePost(id);
  const {
    comments,
    total,
    loading: commentsLoading,
    submitting,
    fetchComments,
    addComment,
  } = useComments(id);
  const [deleting, setDeleting] = useState(false);

  const isLoggedIn = !!getAccessToken();

  useEffect(() => {
    if (!Number.isFinite(id)) return;
    void fetchPost();
    void fetchComments();
  }, [id, fetchPost, fetchComments]);

  const handleDelete = async () => {
    if (!post || !confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await apiClient.delete(`/api/posts/${post.id}`);
      router.push('/posts');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddComment = async (content: string) => {
    await addComment(content);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg text-gray-600 dark:text-slate-300">{error ?? 'Post not found'}</p>
        <Link href="/posts" className="mt-4 inline-block text-sm text-gray-500 hover:underline dark:text-slate-400">
          ← Back to posts
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <Link href="/posts" className="text-sm text-gray-500 hover:underline dark:text-slate-400 dark:hover:text-sky-300">
          ← Back to feed
        </Link>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Avatar username={post.author.username} avatarUrl={post.author.avatarUrl} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">@{post.author.username}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">{formatDate(post.createdAt)}</p>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{post.title}</h1>

          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt={post.title} className="max-h-96 w-full rounded-md object-cover" />
          ) : null}

          <p className="whitespace-pre-wrap text-gray-700 dark:text-slate-300">{post.content}</p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <LikeButton liked={post.isLiked} likesCount={post.likesCount} onToggle={toggleLike} />
            <span className="text-sm text-gray-500 dark:text-slate-400">{total} comments</span>
            {isLoggedIn ? (
              <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
                Delete
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100">
            {total} comments
          </h2>
          {!isLoggedIn ? (
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:underline dark:text-sky-300">
              Login to comment
            </Link>
          ) : null}
        </div>

        {isLoggedIn ? (
          <div className="mb-5 rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/65">
            <CommentForm onSubmit={handleAddComment} loading={submitting} />
          </div>
        ) : null}

        {commentsLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <CommentList comments={comments} />
        )}
      </Card>
    </div>
  );
}
