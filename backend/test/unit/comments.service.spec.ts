import { Test, TestingModule } from '@nestjs/testing';
import { CommentsService } from '../../src/modules/comments/services/comments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from '../../src/modules/comments/entities/comment.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { createMockRepository } from '../mocks/repository.mock';
import { mockUser } from '../mocks/entities.mock';
import { UserRole } from '../../src/modules/users/entities/user.entity';

const mockComment = {
  id: 1,
  content: 'Test comment',
  postId: 10,
  authorId: mockUser.id,
  author: { id: mockUser.id, username: mockUser.username, avatarUrl: mockUser.avatarUrl },
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Comment;

describe('CommentsService', () => {
  let service: CommentsService;
  let commentsRepo: jest.Mocked<Repository<Comment>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentsRepo = module.get(getRepositoryToken(Comment));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------- FIND BY POST ----------
  it('should return paginated comments for a post', async () => {
    commentsRepo.findAndCount.mockResolvedValue([[mockComment], 1]);

    const result = await service.findByPost(10, 1, 10);
    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(commentsRepo.findAndCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: { postId: 10 } }),
    );
  });

  it('should return empty list when no comments', async () => {
    commentsRepo.findAndCount.mockResolvedValue([[], 0]);
    const result = await service.findByPost(99);
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // ---------- CREATE ----------
  it('should create a comment and return it', async () => {
    commentsRepo.create.mockReturnValue(mockComment);
    commentsRepo.save.mockResolvedValue(mockComment);
    commentsRepo.findOne.mockResolvedValue(mockComment);

    const result = await service.create(10, mockUser.id, { content: 'Test comment' });
    expect(result.content).toBe('Test comment');
    expect(commentsRepo.save).toHaveBeenCalled();
  });

  it('should throw NotFoundException if comment missing after creation', async () => {
    commentsRepo.create.mockReturnValue(mockComment);
    commentsRepo.save.mockResolvedValue(mockComment);
    commentsRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create(10, mockUser.id, { content: 'Test' }),
    ).rejects.toThrow(NotFoundException);
  });

  // ---------- UPDATE ----------
  it('should update own comment', async () => {
    commentsRepo.findOne.mockResolvedValue(mockComment);
    commentsRepo.save.mockResolvedValue({ ...mockComment, content: 'Updated' });

    const result = await service.update(1, mockUser.id, UserRole.USER, { content: 'Updated' });
    expect(result.content).toBe('Updated');
  });

  it('should allow admin to update any comment', async () => {
    const otherUserComment = { ...mockComment, authorId: 999 };
    commentsRepo.findOne.mockResolvedValue(otherUserComment as unknown as Comment);
    commentsRepo.save.mockResolvedValue({ ...otherUserComment, content: 'Admin edit' } as unknown as Comment);

    const result = await service.update(1, mockUser.id, UserRole.ADMIN, { content: 'Admin edit' });
    expect(result.content).toBe('Admin edit');
  });

  it('should throw ForbiddenException if non-owner tries to update', async () => {
    const otherUserComment = { ...mockComment, authorId: 999 };
    commentsRepo.findOne.mockResolvedValue(otherUserComment as unknown as Comment);

    await expect(
      service.update(1, mockUser.id, UserRole.USER, { content: 'X' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when updating missing comment', async () => {
    commentsRepo.findOne.mockResolvedValue(null);
    await expect(
      service.update(99, mockUser.id, UserRole.USER, { content: 'X' }),
    ).rejects.toThrow(NotFoundException);
  });

  // ---------- REMOVE ----------
  it('should remove own comment', async () => {
    commentsRepo.findOne.mockResolvedValue(mockComment);
    commentsRepo.remove.mockResolvedValue(mockComment);

    const result = await service.remove(1, mockUser.id, UserRole.USER);
    expect(result.message).toContain('deleted');
  });

  it('should allow admin to remove any comment', async () => {
    const otherUserComment = { ...mockComment, authorId: 999 };
    commentsRepo.findOne.mockResolvedValue(otherUserComment as unknown as Comment);
    commentsRepo.remove.mockResolvedValue(otherUserComment as unknown as Comment);

    const result = await service.remove(1, mockUser.id, UserRole.ADMIN);
    expect(result.message).toContain('deleted');
  });

  it('should throw ForbiddenException if non-owner tries to remove', async () => {
    const otherUserComment = { ...mockComment, authorId: 999 };
    commentsRepo.findOne.mockResolvedValue(otherUserComment as unknown as Comment);

    await expect(
      service.remove(1, mockUser.id, UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException when removing missing comment', async () => {
    commentsRepo.findOne.mockResolvedValue(null);
    await expect(service.remove(99, mockUser.id, UserRole.USER)).rejects.toThrow(
      NotFoundException,
    );
  });
});
