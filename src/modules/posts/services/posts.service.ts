import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { UsersService } from '../../users/services/users.service';
import { QueryPostsDto } from '../dto/query-posts.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(query?: QueryPostsDto) {
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

    if (query?.limit) {
      qb.take(query.limit);
    }

    if (query?.offset) {
      qb.skip(query.offset);
    }

    return qb.getMany();
  }

  async findOne(id: number) {
    const post = await this.postRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(dto: CreatePostDto) {
    const author = await this.usersService.findOne(dto.authorId);
    const post = this.postRepo.create({ ...dto, author });
    return this.postRepo.save(post);
  }

  async update(id: number, dto: UpdatePostDto) {
    const post = await this.findOne(id);
    if (dto.authorId) {
      post.author = await this.usersService.findOne(dto.authorId);
    }
    Object.assign(post, dto);
    return this.postRepo.save(post);
  }

  async remove(id: number) {
    const post = await this.findOne(id);
    await this.postRepo.remove(post);
    return { message: `Post ${id} deleted` };
  }
}
