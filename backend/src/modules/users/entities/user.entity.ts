import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password: string;

  @Index()
  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  displayName: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Exclude()
  @Column({ type: 'varchar', nullable: true })
  emailVerificationToken: string | null;

  @Column({ default: 0 })
  tokenVersion: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany('Post', 'author')
  posts: import('../../posts/entities/post.entity').Post[];

  @OneToMany('Comment', 'author')
  comments: import('../../comments/entities/comment.entity').Comment[];

  @OneToMany('Like', 'user')
  likes: import('../../likes/entities/like.entity').Like[];

  @OneToMany('Follow', 'follower')
  following: import('../../follows/entities/follow.entity').Follow[];

  @OneToMany('Follow', 'following')
  followers: import('../../follows/entities/follow.entity').Follow[];

  @OneToMany('RefreshToken', 'user', { cascade: true })
  refreshTokens: import('../../auth/entities/refresh-token.entity').RefreshToken[];
}
