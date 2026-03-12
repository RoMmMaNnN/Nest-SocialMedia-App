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
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {post.title}
            </h2>
            {post.published && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Published
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {excerpt(post.content)}
          </p>
          <div className="mt-auto flex items-center justify-between text-xs text-gray-400">
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
