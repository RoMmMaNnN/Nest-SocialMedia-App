'use client';

import { Button } from './ui/Button';

interface LikeButtonProps {
  liked?: boolean;
  likesCount: number;
  onToggle: () => Promise<void>;
}

export function LikeButton({ liked, likesCount, onToggle }: LikeButtonProps) {
  return (
    <Button
      variant={liked ? 'primary' : 'secondary'}
      onClick={() => void onToggle()}
      className="min-w-28"
    >
      {liked ? 'Unlike' : 'Like'} ({likesCount})
    </Button>
  );
}
