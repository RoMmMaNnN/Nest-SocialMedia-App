import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../../../../src/modules/posts/services/posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../../../src/modules/posts/entities/post.entity';
import { UsersService } from '../../../../src/modules/users/services/users.service';
import { mockUser, mockPost } from '../../../mocks/entities.mock';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { createMockRepository } from '../../../mocks/repository.mock';

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: jest.Mocked<Repository<Post>>;
  let usersService: Partial<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: createMockRepository() },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn().mockResolvedValue(mockUser) },
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get(getRepositoryToken(Post));
    usersService = module.get(UsersService);
  });

  it('should create a post', async () => {
    postRepo.create.mockReturnValue(mockPost as any);
    postRepo.save.mockResolvedValue(mockPost as any);

    const result = await service.create(
      { title: 'Test Post', content: 'Content' },
      mockUser.id,
    );
    expect(result.id).toBe(mockPost.id);
    expect(result.title).toBe(mockPost.title);
  });

  it('should find a post by id', async () => {
    postRepo.findOne.mockResolvedValue(mockPost as any);
    const result = await service.findOne(mockPost.id);
    expect(result.id).toBe(mockPost.id);
  });

  it('should throw NotFoundException if post not found', async () => {
    postRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should update a post if author matches', async () => {
    postRepo.findOne.mockResolvedValue(mockPost as any);
    postRepo.save.mockResolvedValue({ ...mockPost, title: 'Updated' } as any);

    const result = await service.update(
      mockPost.id,
      { title: 'Updated' },
      mockUser.id,
    );
    expect(result.title).toBe('Updated');
  });

  it("should throw ForbiddenException if updating someone else's post", async () => {
    postRepo.findOne.mockResolvedValue({
      ...mockPost,
      author: { ...mockUser, id: 2 },
    } as any);
    await expect(
      service.update(mockPost.id, { title: 'X' }, mockUser.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should remove a post if author matches', async () => {
    postRepo.findOne.mockResolvedValue(mockPost as any);
    postRepo.remove.mockResolvedValue(mockPost as any);

    const result = await service.remove(mockPost.id, mockUser.id);
    expect(result.message).toContain('deleted');
  });

  it("should throw ForbiddenException if removing someone else's post", async () => {
    postRepo.findOne.mockResolvedValue({
      ...mockPost,
      author: { ...mockUser, id: 2 },
    } as any);
    await expect(service.remove(mockPost.id, mockUser.id)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should return all posts', async () => {
    postRepo.createQueryBuilder = jest.fn(() => {
      return {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockPost]),
      } as any;
    });

    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockPost.id);
  });

  it('should filter posts by authorId', async () => {
    postRepo.createQueryBuilder = jest.fn(
      () =>
        ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockPost]),
        }) as any,
    );

    const result = await service.findAll({ authorId: mockUser.id });
    expect(result[0].author.id).toBe(mockUser.id);
  });

  it('should search posts by title or content', async () => {
    postRepo.createQueryBuilder = jest.fn(
      () =>
        ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          getMany: jest.fn().mockResolvedValue([mockPost]),
        }) as any,
    );

    const result = await service.findAll({ search: 'Test' });
    expect(result[0].title).toContain('Test');
  });

  it('should apply sort, limit and offset', async () => {
    const getManyMock = jest.fn().mockResolvedValue([mockPost]);
    postRepo.createQueryBuilder = jest.fn(
      () =>
        ({
          leftJoinAndSelect: jest.fn().mockReturnThis(),
          andWhere: jest.fn().mockReturnThis(),
          orderBy: jest.fn().mockReturnThis(),
          take: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          getMany: getManyMock,
        }) as any,
    );

    const result = await service.findAll({
      sort: 'DESC',
      limit: 10,
      offset: 5,
    });
    expect(getManyMock).toHaveBeenCalled();
    expect(result[0].id).toBe(mockPost.id);
  });
});
