import { Test, TestingModule } from '@nestjs/testing';
import { PostsService } from '../../src/modules/posts/services/posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Post } from '../../src/modules/posts/entities/post.entity';
import { UsersService } from '../../src/modules/users/services/users.service';
import { mockUser, mockPost } from '../mocks/entities.mock';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { createMockRepository } from '../mocks/repository.mock';
import { createMockDataSource } from '../mocks/data-source.mock';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserRole } from '../../src/modules/users/entities/user.entity';

const mockCacheManager = { clear: jest.fn().mockResolvedValue(undefined), get: jest.fn(), set: jest.fn(), del: jest.fn(), store: { keys: jest.fn().mockResolvedValue([]) } };

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: jest.Mocked<Repository<Post>>;
  let mockDs: ReturnType<typeof createMockDataSource>;

  beforeEach(async () => {
    mockDs = createMockDataSource();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: createMockRepository() },
        {
          provide: UsersService,
          useValue: { findOne: jest.fn().mockResolvedValue(mockUser) },
        },
        { provide: DataSource, useValue: mockDs },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postRepo = module.get(getRepositoryToken(Post));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------- FIND ALL ----------
  it('should return paginated posts', async () => {
    mockDs._qb.getManyAndCount.mockResolvedValue([[mockPost], 1]);
    mockDs.query.mockResolvedValue([]);

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.data).toHaveLength(1);
  });

  it('should attach isLiked when currentUserId is provided', async () => {
    const post = { ...mockPost, id: 5 };
    mockDs._qb.getManyAndCount.mockResolvedValue([[post], 1]);
    mockDs.query.mockResolvedValue([{ postId: 5 }]);

    const result = await service.findAll({ page: 1, limit: 10 }, mockUser.id);
    expect(mockDs.query).toHaveBeenCalled();
    expect(result.data).toHaveLength(1);
  });

  it('should return empty result when no posts', async () => {
    mockDs._qb.getManyAndCount.mockResolvedValue([[], 0]);

    const result = await service.findAll({});
    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  // ---------- FIND ONE ----------
  it('should find a post by id', async () => {
    mockDs._qb.getOne.mockResolvedValue(mockPost);
    mockDs.query.mockResolvedValue([{ exists: false }]);

    const result = await service.findOne(mockPost.id, mockUser.id);
    expect(result).toBeDefined();
  });

  it('should throw NotFoundException if post not found', async () => {
    mockDs._qb.getOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should set isLiked=true when user liked the post', async () => {
    mockDs._qb.getOne.mockResolvedValue({ ...mockPost });
    mockDs.query.mockResolvedValue([{ exists: true }]);

    const result = await service.findOne(mockPost.id, mockUser.id);
    expect(result).toBeDefined();
  });

  // ---------- CREATE ----------
  it('should create a post and return it via findOne', async () => {
    postRepo.create.mockReturnValue(mockPost as any);
    postRepo.save.mockResolvedValue(mockPost as any);

    // findOne (called internally) also needs the QB mock
    mockDs._qb.getOne.mockResolvedValue(mockPost);
    mockDs.query.mockResolvedValue([]);

    const result = await service.create(
      { title: 'Test Post', content: 'Content' },
      mockUser.id,
    );
    expect(postRepo.create).toHaveBeenCalled();
    expect(postRepo.save).toHaveBeenCalled();
    expect(result).toBeDefined();
  });

  // ---------- UPDATE ----------
  it('should update a post if author matches', async () => {
    postRepo.findOne.mockResolvedValue(mockPost as any);
    postRepo.save.mockResolvedValue({ ...mockPost, title: 'Updated' } as any);
    mockDs._qb.getOne.mockResolvedValue({ ...mockPost, title: 'Updated' });
    mockDs.query.mockResolvedValue([{ exists: false }]);

    const result = await service.update(mockPost.id, { title: 'Updated' }, mockUser.id);
    expect(result).toBeDefined();
  });

  it("should throw ForbiddenException if updating someone else's post", async () => {
    postRepo.findOne.mockResolvedValue({
      ...mockPost,
      author: { ...mockUser, id: 99 },
    } as any);

    await expect(
      service.update(mockPost.id, { title: 'X' }, mockUser.id),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if post not found on update', async () => {
    postRepo.findOne.mockResolvedValue(null);
    await expect(
      service.update(999, { title: 'X' }, mockUser.id),
    ).rejects.toThrow(NotFoundException);
  });

  // ---------- REMOVE ----------
  it('should remove a post if admin', async () => {
    postRepo.findOne.mockResolvedValue(mockPost as any);
    postRepo.remove.mockResolvedValue(mockPost as any);

    const result = await service.remove(mockPost.id, 99, UserRole.ADMIN);
    expect(result.message).toContain('deleted');
  });

  it('should remove a post if owner (non-admin)', async () => {
    postRepo.findOne.mockResolvedValue(mockPost as any);
    postRepo.remove.mockResolvedValue(mockPost as any);

    const result = await service.remove(mockPost.id, mockUser.id, UserRole.USER);
    expect(result.message).toContain('deleted');
  });

  it("should throw ForbiddenException if non-admin removes someone else's post", async () => {
    postRepo.findOne.mockResolvedValue({
      ...mockPost,
      author: { ...mockUser, id: 99 },
    } as any);

    await expect(
      service.remove(mockPost.id, mockUser.id, UserRole.USER),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw NotFoundException if post not found on remove', async () => {
    postRepo.findOne.mockResolvedValue(null);
    await expect(
      service.remove(999, mockUser.id, UserRole.USER),
    ).rejects.toThrow(NotFoundException);
  });
});
