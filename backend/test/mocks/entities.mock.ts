import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { Post } from '../../src/modules/posts/entities/post.entity';

export const mockUser: User = {
  id: 1,
  email: 'user@test.com',
  username: 'testuser',
  displayName: 'Test User',
  avatarUrl: null,
  bio: null,
  password: 'hashed_password',
  tokenVersion: 0,
  role: UserRole.USER,
  isEmailVerified: true,
  emailVerificationToken: null,
  refreshTokens: [],
  posts: [],
  comments: [],
  likes: [],
  following: [],
  followers: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockAdmin: User = {
  ...mockUser,
  id: 2,
  email: 'admin@test.com',
  username: 'adminuser',
  role: UserRole.ADMIN,
};

export const mockPost: Post = {
  id: 1,
  title: 'Test Post',
  content: 'This is a test post',
  imageUrl: null,
  published: true,
  authorId: 1,
  author: mockUser,
  comments: [],
  likes: [],
  likesCount: 0,
  commentsCount: 0,
  isLiked: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};
