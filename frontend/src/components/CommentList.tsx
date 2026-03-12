import { Comment } from '../types/comment';
import { Card } from './ui/Card';

interface CommentListProps {
  comments: Comment[];
}

export function CommentList({ comments }: CommentListProps) {
  if (!comments.length) {
    return <p className="text-sm text-gray-500">No comments yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {comments.map((comment) => (
        <Card key={comment.id} className="p-4">
          <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
            <span>@{comment.author.username}</span>
            <span>{new Date(comment.createdAt).toLocaleString()}</span>
          </div>
          <p className="text-sm text-gray-800">{comment.content}</p>
        </Card>
      ))}
    </div>
  );
}
