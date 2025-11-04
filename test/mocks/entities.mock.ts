import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { Post } from '../../src/modules/posts/entities/post.entity';

export const mockUser: User = {
  id: 1,
  email: 'user@test.com',
  name: 'Test User',
  password: 'hashed_password',
  tokenVersion: 0,
  role: UserRole.USER,
  refreshTokens: [],
  posts: [],
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockPost: Post = {
  id: 1,
  title: 'Test Post',
  content: 'This is a test post',
  author: mockUser,
  createdAt: new Date(),
  updatedAt: new Date(),
};
