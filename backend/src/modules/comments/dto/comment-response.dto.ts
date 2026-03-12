export class CommentAuthorDto {
  id: number;
  username: string;
  avatarUrl: string | null;
}

export class CommentResponseDto {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  author: CommentAuthorDto;
}
