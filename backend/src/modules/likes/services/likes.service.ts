import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../entities/like.entity';
import { LikeResponseDto } from '../dto/like-response.dto';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likesRepo: Repository<Like>,
  ) {}

  async toggle(userId: number, postId: number): Promise<LikeResponseDto> {
    const existing = await this.likesRepo.findOne({ where: { userId, postId } });
    if (existing) {
      await this.likesRepo.remove(existing);
      return { liked: false, likesCount: await this.countLikes(postId) };
    }
    await this.likesRepo.save(this.likesRepo.create({ userId, postId }));
    return { liked: true, likesCount: await this.countLikes(postId) };
  }

  async getLikes(postId: number): Promise<{ likesCount: number; users: { id: number; username: string; avatarUrl: string | null }[] }> {
    const likes = await this.likesRepo.find({
      where: { postId },
      relations: ['user'],
    });
    return {
      likesCount: likes.length,
      users: likes.map((l) => ({
        id: l.user.id,
        username: l.user.username,
        avatarUrl: l.user.avatarUrl,
      })),
    };
  }

  async countLikes(postId: number): Promise<number> {
    return this.likesRepo.count({ where: { postId } });
  }

  async hasLiked(userId: number, postId: number): Promise<boolean> {
    const like = await this.likesRepo.findOne({ where: { userId, postId } });
    return !!like;
  }
}
