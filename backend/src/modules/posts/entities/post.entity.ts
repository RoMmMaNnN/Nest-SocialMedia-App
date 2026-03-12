import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  imageUrl: string | null;

  @Column({ default: false })
  published: boolean;

  @Column({ nullable: true })
  authorId: number | null;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @OneToMany('Comment', 'post')
  comments: import('../../comments/entities/comment.entity').Comment[];

  @OneToMany('Like', 'post')
  likes: import('../../likes/entities/like.entity').Like[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual fields (populated by service)
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}
