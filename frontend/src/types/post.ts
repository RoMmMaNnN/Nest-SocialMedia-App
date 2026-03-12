export interface PostAuthor {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  published: boolean;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  author: PostAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPosts {
  data: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
