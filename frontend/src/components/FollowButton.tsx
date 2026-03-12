'use client';

import { useState } from 'react';
import apiClient from '../lib/api';
import { ApiResponse } from '../types/api';
import { Button } from './ui/Button';

interface FollowToggleResponse {
  following: boolean;
  followersCount: number;
}

interface FollowButtonProps {
  userId: number;
  initialFollowing?: boolean;
  onChanged?: (followersCount: number) => void;
}

export function FollowButton({ userId, initialFollowing = false, onChanged }: FollowButtonProps) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<FollowToggleResponse>>(`/api/users/${userId}/follow`);
      setFollowing(res.data.data.following);
      onChanged?.(res.data.data.followersCount);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant={following ? 'secondary' : 'primary'} onClick={() => void toggle()} isLoading={loading}>
      {following ? 'Following' : 'Follow'}
    </Button>
  );
}
