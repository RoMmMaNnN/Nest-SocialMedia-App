import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class AuthorResponse {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  displayName: string | null;

  @Expose()
  avatarUrl: string | null;
}
