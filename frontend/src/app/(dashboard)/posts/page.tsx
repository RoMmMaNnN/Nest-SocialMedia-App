'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePosts } from '../../../hooks/usePosts';
import { PostCard } from '../../../components/PostCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const PAGE_LIMIT = 20;

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function PostsContent() {
  const { posts, page, totalPages, loading, error, fetchPosts } = usePosts();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [currentPage, setCurrentPage] = useState(1);

  const load = useCallback(
    (p: number, s: string, append = false) => {
      fetchPosts({ page: p, limit: PAGE_LIMIT, search: s || undefined }, append);
    },
    [fetchPosts],
  );

  useEffect(() => {
    setCurrentPage(1);
    load(1, debouncedSearch);
  }, [debouncedSearch, load]);

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    load(nextPage, debouncedSearch, true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Feed</h1>
        <Link href="/upload" className="text-sm font-medium text-gray-900 hover:underline dark:text-slate-100">
          Create post
        </Link>
      </div>

      <div className="max-w-sm">
        <Input
          id="search"
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={handleSearchChange}
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700 dark:border-slate-600 dark:border-t-slate-200" />
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="py-12 text-center text-gray-500 dark:text-slate-400">No posts found.</p>
      )}

      {!loading && posts.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Showing {posts.length} posts
            </p>
            {page < totalPages ? (
              <Button onClick={handleLoadMore} isLoading={loading}>
                Load more
              </Button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

export default function PostsPage() {
  return <PostsContent />;
}
