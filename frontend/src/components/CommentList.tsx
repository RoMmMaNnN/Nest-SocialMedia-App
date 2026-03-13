import { Comment } from '../types/comment';
import { Card } from './ui/Card';
import { Avatar } from './Avatar';

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  const timeAgo = (value: string) => {
    const date = new Date(value).getTime();
    const now = Date.now();
    const diffSeconds = Math.max(1, Math.floor((now - date) / 1000));

    if (diffSeconds < 60) return 'just now';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86_400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    if (diffSeconds < 604_800) return `${Math.floor(diffSeconds / 86_400)}d ago`;

    return new Date(value).toLocaleDateString();
  };

  if (!comments.length) {
    return <p className="text-sm text-gray-500 dark:text-slate-400">No comments yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <Avatar
                username={comment.author.username}
                avatarUrl={comment.author.avatarUrl}
                size={32}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                  @{comment.author.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  {timeAgo(comment.createdAt)}
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-800 dark:text-slate-200">{comment.content}</p>
        </Card>
      ))}
    </div>
  );
}
