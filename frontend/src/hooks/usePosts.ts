'use client';

import { useState, useCallback } from 'react';
import apiClient from '../lib/api';
import { ApiResponse } from '../types/api';
import { Post, PaginatedPosts } from '../types/post';

interface PostsQuery {
  page?: number;
  limit?: number;
  search?: string;
  authorId?: number;
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (query: PostsQuery = {}): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.search) params.set('search', query.search);
      if (query.authorId) params.set('authorId', String(query.authorId));

      const res = await apiClient.get<ApiResponse<PaginatedPosts>>(
        `/api/posts?${params.toString()}`,
      );
      const data = res.data.data;
      setPosts(data.data);
      setTotal(data.total);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    posts,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    fetchPosts,
  };
}
