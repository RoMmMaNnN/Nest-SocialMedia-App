import { Exclude, Expose } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

@Exclude()
export class UserResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'john@example.com' })
  @Expose()
  email: string;

  @ApiProperty({ example: 'john_doe' })
  @Expose()
  username: string;

  @ApiPropertyOptional({ example: 'John Doe' })
  @Expose()
  displayName: string | null;

  @ApiPropertyOptional({ example: '/uploads/avatars/1-1234567890.jpg' })
  @Expose()
  avatarUrl: string | null;

  @ApiPropertyOptional({ example: 'Frontend developer & coffee lover' })
  @Expose()
  bio: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @Expose()
  role: UserRole;

  @ApiProperty({ example: true })
  @Expose()
  isEmailVerified: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiPropertyOptional({ example: 42 })
  @Expose()
  followersCount?: number;

  @ApiPropertyOptional({ example: 17 })
  @Expose()
  followingCount?: number;

  @ApiPropertyOptional({ example: 10 })
  @Expose()
  postsCount?: number;
}
