import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { plainToInstance } from 'class-transformer';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { UsersService } from '../../users/services/users.service';
import { QueryPostsDto } from '../dto/query-posts.dto';
import { PostResponseDto } from '../dto/post-response.dto';
import { UserRole } from '../../users/entities/user.entity';

export interface PaginatedPosts {
  data: PostResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(query?: QueryPostsDto, currentUserId?: number): Promise<PaginatedPosts> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const sortField = query?.sort ?? 'createdAt';
    const sortOrder = query?.order ?? 'DESC';

    const qb = this.dataSource
      .createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.author', 'author')
      .loadRelationCountAndMap('post.likesCount', 'post.likes')
      .loadRelationCountAndMap('post.commentsCount', 'post.comments')
      .where('post.published = :published', { published: true });

    if (query?.feed && currentUserId) {
      qb.andWhere(
        `post.authorId IN (SELECT "followingId" FROM follows WHERE "followerId" = :uid)`,
        { uid: currentUserId },
      );
    }

    if (query?.authorId) {
      qb.andWhere('author.id = :authorId', { authorId: query.authorId });
    }

    if (query?.search) {
      qb.andWhere(
        'post.title ILIKE :search OR post.content ILIKE :search',
        { search: `%${query.search}%` },
      );
    }

    if (sortField === 'likesCount') {
      qb.orderBy('post.likesCount', sortOrder);
    } else {
      qb.orderBy(`post.${sortField}`, sortOrder);
    }

    qb.take(limit).skip((page - 1) * limit);

    const [posts, total] = await qb.getManyAndCount();

    // Attach isLiked for authenticated requests
    if (currentUserId) {
      const postIds = posts.map((p) => p.id);
      if (postIds.length > 0) {
        const likedRows = await this.dataSource.query<{ postId: number }[]>(
          `SELECT "postId" FROM likes WHERE "userId" = $1 AND "postId" = ANY($2)`,
          [currentUserId, postIds],
        );
        const likedSet = new Set(likedRows.map((r) => r.postId));
        posts.forEach((p) => {
          p.isLiked = likedSet.has(p.id);
        });
      }
    }

    return {
      data: plainToInstance(PostResponseDto, posts, { excludeExtraneousValues: true }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number, currentUserId?: number): Promise<PostResponseDto> {
    const qb = this.dataSource
      .createQueryBuilder(Post, 'post')
      .leftJoinAndSelect('post.author', 'author')
      .loadRelationCountAndMap('post.likesCount', 'post.likes')
      .loadRelationCountAndMap('post.commentsCount', 'post.comments')
      .where('post.id = :id', { id });

    const post = await qb.getOne();
    if (!post) throw new NotFoundException('Post not found');

    if (currentUserId) {
      const [row] = await this.dataSource.query<{ exists: boolean }[]>(
        `SELECT EXISTS(SELECT 1 FROM likes WHERE "userId" = $1 AND "postId" = $2) AS exists`,
        [currentUserId, id],
      );
      post.isLiked = row.exists;
    }

    return plainToInstance(PostResponseDto, post, { excludeExtraneousValues: true });
  }

  async create(dto: CreatePostDto, userId: number): Promise<PostResponseDto> {
    const author = await this.usersService.findOne(userId);

    const post = this.postRepo.create({
      title: dto.title,
      content: dto.content,
      imageUrl: dto.imageUrl ?? null,
      published: dto.published ?? false,
      author,
    });

    const saved = await this.postRepo.save(post);
    await this.invalidatePostsCache();

    return this.findOne(saved.id);
  }

  async update(
    id: number,
    dto: UpdatePostDto,
    userId: number,
  ): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException('Post not found');

    if (!post.author || Number(post.author.id) !== Number(userId)) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    Object.assign(post, dto);
    await this.postRepo.save(post);
    await this.invalidatePostsCache();

    return this.findOne(id, userId);
  }

  async remove(
    id: number,
    userId: number,
    userRole: string,
  ): Promise<{ message: string }> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!post) throw new NotFoundException('Post not found');

    if (
      userRole !== UserRole.ADMIN &&
      (!post.author || Number(post.author.id) !== Number(userId))
    ) {
      throw new ForbiddenException('You do not have permission to delete this post');
    }

    await this.postRepo.remove(post);
    await this.invalidatePostsCache();

    return { message: `Post ${id} deleted successfully` };
  }

  private async invalidatePostsCache(): Promise<void> {
    await this.cacheManager.clear();
  }
}
