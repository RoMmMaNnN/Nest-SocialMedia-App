'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePosts } from '../../../hooks/usePosts';
import { PostCard } from '../../../components/PostCard';
import { Pagination } from '../../../components/Pagination';
import { Input } from '../../../components/ui/Input';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function PostsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { posts, page, totalPages, loading, error, fetchPosts } = usePosts();

  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const debouncedSearch = useDebounce(search, 400);

  const currentPage = Number(searchParams.get('page') ?? '1');

  const load = useCallback(
    (p: number, s: string) => {
      fetchPosts({ page: p, limit: 10, search: s || undefined });
    },
    [fetchPosts],
  );

  useEffect(() => {
    load(currentPage, debouncedSearch);
  }, [currentPage, debouncedSearch, load]);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/posts?${params.toString()}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set('search', value);
    else params.delete('search');
    params.set('page', '1');
    router.push(`/posts?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Feed</h1>
        <Link href="/upload" className="text-sm font-medium text-gray-900 hover:underline">
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
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-700" />
        </div>
      )}

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && posts.length === 0 && (
        <p className="py-12 text-center text-gray-500">No posts found.</p>
      )}

      {!loading && posts.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsContent />
    </Suspense>
  );
}
