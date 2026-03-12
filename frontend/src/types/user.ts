export interface User {
  id: number;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin' | 'moderator';
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
