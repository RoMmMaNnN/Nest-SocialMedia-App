import Link from 'next/link';
import { Card } from './ui/Card';
import { Post } from '../types/post';

interface PostCardProps {
  post: Post;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function excerpt(content: string, maxLength = 150): string {
  return content.length > maxLength
    ? content.slice(0, maxLength) + '...'
    : content;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link href={`/posts/${post.id}`} className="block">
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md dark:hover:shadow-[0_20px_40px_-24px_rgba(56,189,248,0.65)]">
        <div className="flex flex-col gap-3">
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          ) : null}

          <div className="flex items-start justify-between gap-2">
            <h2 className="line-clamp-2 text-lg font-semibold text-gray-900 dark:text-slate-100">
              {post.title}
            </h2>
            {post.published && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-emerald-500/20 dark:text-emerald-300 dark:ring-1 dark:ring-emerald-400/30">
                Published
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300">
            {excerpt(post.content)}
          </p>
          <div className="mt-auto flex items-center justify-between text-xs text-gray-400 dark:text-slate-400">
            <span>@{post.author?.username ?? 'unknown'}</span>
            <div className="flex items-center gap-3">
              <span>♥ {post.likesCount ?? 0}</span>
              <span>💬 {post.commentsCount ?? 0}</span>
              <span>{formatDate(post.createdAt)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
