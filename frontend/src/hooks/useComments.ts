'use client';

import { useState, useCallback } from 'react';
import apiClient from '../lib/api';
import { ApiResponse } from '../types/api';
import { Comment, PaginatedComments } from '../types/comment';

export function useComments(postId: number) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const res = await apiClient.get<ApiResponse<PaginatedComments>>(
        `/api/posts/${postId}/comments?page=${p}&limit=10`,
      );
      const data = res.data.data;
      setComments(data.data);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  const addComment = useCallback(async (content: string) => {
    setSubmitting(true);
    try {
      const res = await apiClient.post<ApiResponse<Comment>>(`/api/posts/${postId}/comments`, {
        content,
      });
      setComments((prev) => [res.data.data, ...prev]);
      setTotal((prev) => prev + 1);
    } finally {
      setSubmitting(false);
    }
  }, [postId]);

  return { comments, total, page, totalPages, loading, submitting, fetchComments, addComment };
}
