export interface CommentAuthor {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export interface Comment {
  id: number;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedComments {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
