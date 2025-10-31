import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class AuthorResponse {
  @Expose()
  id: number;

  @Expose()
  email: string;
}
