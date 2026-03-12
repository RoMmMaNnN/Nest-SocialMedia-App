import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../entities/comment.entity';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { CommentResponseDto } from '../dto/comment-response.dto';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepo: Repository<Comment>,
  ) {}

  async findByPost(
    postId: number,
    page = 1,
    limit = 10,
  ): Promise<{ data: CommentResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    const [comments, total] = await this.commentsRepo.findAndCount({
      where: { postId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return {
      data: comments.map((c) => this.toDto(c)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(postId: number, authorId: number, dto: CreateCommentDto): Promise<CommentResponseDto> {
    const comment = this.commentsRepo.create({
      content: dto.content,
      postId,
      authorId,
    });
    const saved = await this.commentsRepo.save(comment);
    const full = await this.commentsRepo.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
    if (!full) throw new NotFoundException('Comment not found after creation');
    return this.toDto(full);
  }

  async update(id: number, userId: number, userRole: string, dto: UpdateCommentDto): Promise<CommentResponseDto> {
    const comment = await this.commentsRepo.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    comment.content = dto.content ?? comment.content;
    const updated = await this.commentsRepo.save(comment);
    return this.toDto(updated);
  }

  async remove(id: number, userId: number, userRole: string): Promise<{ message: string }> {
    const comment = await this.commentsRepo.findOne({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    await this.commentsRepo.remove(comment);
    return { message: 'Comment deleted successfully' };
  }

  private toDto(comment: Comment): CommentResponseDto {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        username: comment.author.username,
        avatarUrl: comment.author.avatarUrl,
      },
    };
  }
}
