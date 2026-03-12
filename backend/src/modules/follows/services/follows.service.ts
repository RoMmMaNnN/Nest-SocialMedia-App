import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from '../entities/follow.entity';
import { FollowResponseDto } from '../dto/follow-response.dto';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followsRepo: Repository<Follow>,
  ) {}

  async toggle(followerId: number, followingId: number): Promise<FollowResponseDto> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const existing = await this.followsRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      await this.followsRepo.remove(existing);
      return { following: false, followersCount: await this.countFollowers(followingId) };
    }

    await this.followsRepo.save(this.followsRepo.create({ followerId, followingId }));
    return { following: true, followersCount: await this.countFollowers(followingId) };
  }

  async getFollowers(
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: { id: number; username: string; avatarUrl: string | null }[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [follows, total] = await this.followsRepo.findAndCount({
      where: { followingId: userId },
      relations: ['follower'],
      skip,
      take: limit,
    });
    return {
      data: follows.map((f) => ({
        id: f.follower.id,
        username: f.follower.username,
        avatarUrl: f.follower.avatarUrl,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getFollowing(
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: { id: number; username: string; avatarUrl: string | null }[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [follows, total] = await this.followsRepo.findAndCount({
      where: { followerId: userId },
      relations: ['following'],
      skip,
      take: limit,
    });
    return {
      data: follows.map((f) => ({
        id: f.following.id,
        username: f.following.username,
        avatarUrl: f.following.avatarUrl,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async countFollowers(userId: number): Promise<number> {
    return this.followsRepo.count({ where: { followingId: userId } });
  }

  async countFollowing(userId: number): Promise<number> {
    return this.followsRepo.count({ where: { followerId: userId } });
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const f = await this.followsRepo.findOne({ where: { followerId, followingId } });
    return !!f;
  }
}
