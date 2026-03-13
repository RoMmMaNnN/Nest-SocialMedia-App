'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import apiClient from '../../../../lib/api';
import { ApiResponse } from '../../../../types/api';
import { User } from '../../../../types/user';
import { Post } from '../../../../types/post';
import { Avatar } from '../../../../components/Avatar';
import { Card } from '../../../../components/ui/Card';
import { PostCard } from '../../../../components/PostCard';
import { FollowButton } from '../../../../components/FollowButton';

type FollowListResponse = {
  data: { id: number; username: string; avatarUrl: string | null }[];
  total: number;
  page: number;
  totalPages: number;
};

type PostsResponse = {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = Number(params.id);

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(userId)) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [userRes, postsRes, followersRes, followingRes] = await Promise.all([
          apiClient.get<ApiResponse<User>>(`/api/users/${userId}`),
          apiClient.get<ApiResponse<PostsResponse>>(`/api/posts?authorId=${userId}&page=1&limit=20`),
          apiClient.get<ApiResponse<FollowListResponse>>(`/api/users/${userId}/followers?page=1&limit=1`),
          apiClient.get<ApiResponse<FollowListResponse>>(`/api/users/${userId}/following?page=1&limit=1`),
        ]);

        setUser(userRes.data.data);
        setPosts(postsRes.data.data.data);
        setFollowers(followersRes.data.data.total);
        setFollowing(followingRes.data.data.total);

        try {
          const me = await apiClient.get<User>('/api/auth/me');
          setCurrentUserId(me.data.id);
        } catch {
          setCurrentUserId(null);
        }
      } catch {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [userId]);

  const canFollow = useMemo(() => {
    return user && currentUserId && currentUserId !== user.id;
  }, [user, currentUserId]);

  if (loading) return <p className="text-sm text-gray-700 dark:text-slate-300">Loading profile...</p>;
  if (error || !user) return <p className="text-sm text-red-600 dark:text-rose-300">{error ?? 'Profile not found'}</p>;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar username={user.username} avatarUrl={user.avatarUrl} size={64} />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">@{user.username}</h1>
              {user.displayName ? <p className="text-sm text-gray-700 dark:text-slate-300">{user.displayName}</p> : null}
              {user.bio ? <p className="mt-1 text-sm text-gray-800 dark:text-slate-200">{user.bio}</p> : null}
            </div>
          </div>
          {canFollow ? (
            <FollowButton
              userId={user.id}
              onChanged={(followersCount) => setFollowers(followersCount)}
            />
          ) : null}
        </div>

        <div className="mt-4 flex gap-6 text-sm text-gray-800 dark:text-slate-300">
          <span><strong>{posts.length}</strong> posts</span>
          <span><strong>{followers}</strong> followers</span>
          <span><strong>{following}</strong> following</span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
