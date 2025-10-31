import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { UsersService } from '../../users/services/users.service';
import { QueryPostsDto } from '../dto/query-posts.dto';
import { PostResponseDto } from '../dto/post-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly usersService: UsersService,
  ) {}

  // ==========================
  // 🔍 FIND METHODS
  // ==========================
  async findAll(query?: QueryPostsDto): Promise<PostResponseDto[]> {
    const qb = this.postRepo
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    if (query?.authorId) {
      qb.andWhere('author.id = :authorId', { authorId: query.authorId });
    }

    if (query?.search) {
      qb.andWhere('post.title ILIKE :search OR post.content ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    if (query?.sort) {
      qb.orderBy('post.createdAt', query.sort);
    } else {
      qb.orderBy('post.createdAt', 'ASC');
    }

    if (query?.limit) qb.take(query.limit);
    if (query?.offset) qb.skip(query.offset);

    const posts = await qb.getMany();
    return plainToInstance(PostResponseDto, posts, {
      excludeExtraneousValues: true,
    });
  }

  async findOne(id: number): Promise<PostResponseDto> {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return plainToInstance(PostResponseDto, post, {
      excludeExtraneousValues: true,
    });
  }

  // ============================
  // 🧩 CREATE / UPDATE / DELETE
  // ============================
  async create(dto: CreatePostDto, userId: number): Promise<PostResponseDto> {
    console.log('Creating post for userId:', userId);
    const author = await this.usersService.findOne(userId);
    const post = this.postRepo.create({
      title: dto.title,
      content: dto.content,
      author,
    });

    const saved = await this.postRepo.save(post);
    return plainToInstance(PostResponseDto, saved, {
      excludeExtraneousValues: true,
    });
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
    const updated = await this.postRepo.save(post);
    return plainToInstance(PostResponseDto, updated, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: number, userId: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });

    console.log(post);

    if (!post) throw new NotFoundException('Post not found');

    if (!post.author || Number(post.author.id) !== Number(userId)) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    await this.postRepo.remove(post);
    return { message: `Post ${id} deleted` };
  }
}
