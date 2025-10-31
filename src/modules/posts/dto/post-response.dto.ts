import { Exclude, Expose, Type } from 'class-transformer';
import { AuthorResponse } from './author-response.dto';

@Exclude()
export class PostResponseDto {
  @Expose()
  id: number;

  @Expose()
  title: string;

  @Expose()
  content: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  @Type(() => AuthorResponse)
  author: AuthorResponse;
}
