import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('refresh_token')
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  jti: string;

  @Column()
  hashedToken: string;

  @ManyToOne(() => User, (u) => u.id, { onDelete: 'CASCADE' })
  user: User;

  @Column({ nullable: true })
  deviceInfo?: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
