import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryPostsDto {
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sort?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  authorId?: number;
}
