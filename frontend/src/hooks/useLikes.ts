'use client';

import { useState, useCallback } from 'react';
import apiClient from '../lib/api';
import { ApiResponse } from '../types/api';

interface LikesSummaryUser {
  id: number;
  username: string;
  avatarUrl: string | null;
}

interface LikesSummary {
  likesCount: number;
  users: LikesSummaryUser[];
}

interface ToggleLikeResponse {
  liked: boolean;
  likesCount: number;
}

export function useLikes(postId: number, initialCount = 0, initiallyLiked = false) {
  const [likesCount, setLikesCount] = useState(initialCount);
  const [liked, setLiked] = useState(initiallyLiked);
  const [users, setUsers] = useState<LikesSummaryUser[]>([]);

  const fetchLikes = useCallback(async () => {
    const res = await apiClient.get<ApiResponse<LikesSummary>>(`/api/posts/${postId}/likes`);
    setLikesCount(res.data.data.likesCount);
    setUsers(res.data.data.users);
  }, [postId]);

  const toggleLike = useCallback(async () => {
    const res = await apiClient.post<ApiResponse<ToggleLikeResponse>>(`/api/posts/${postId}/likes`);
    setLiked(res.data.data.liked);
    setLikesCount(res.data.data.likesCount);
  }, [postId]);

  return { likesCount, liked, users, fetchLikes, toggleLike };
}
