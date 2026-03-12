import { Exclude, Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthorResponse } from './author-response.dto';

@Exclude()
export class PostResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'My First Post' })
  @Expose()
  title: string;

  @ApiProperty({ example: 'Post content goes here...' })
  @Expose()
  content: string;

  @ApiPropertyOptional({ example: '/uploads/posts/1-1234567890.jpg' })
  @Expose()
  imageUrl: string | null;

  @ApiProperty({ example: false })
  @Expose()
  published: boolean;

  @ApiProperty({ example: 5 })
  @Expose()
  likesCount: number;

  @ApiProperty({ example: 3 })
  @Expose()
  commentsCount: number;

  @ApiPropertyOptional({ example: false })
  @Expose()
  isLiked: boolean | undefined;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: () => AuthorResponse })
  @Expose()
  @Type(() => AuthorResponse)
  author: AuthorResponse;
}
