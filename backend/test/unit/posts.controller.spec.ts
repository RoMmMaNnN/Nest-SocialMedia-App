import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../src/modules/posts/controllers/posts.controller';
import { PostsService } from '../../src/modules/posts/services/posts.service';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockPost, mockUser } from '../mocks/entities.mock';
import { QueryPostsDto } from '../../src/modules/posts/dto/query-posts.dto';
import { UserRole } from '../../src/modules/users/entities/user.entity';

const mockCacheManager = { get: jest.fn(), set: jest.fn(), clear: jest.fn() };

describe('PostsController', () => {
  let controller: PostsController;
  let service: PostsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            findAll: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all posts with query', async () => {
    const query: QueryPostsDto = {
      page: 1,
      limit: 10,
      search: 'test',
      sort: 'createdAt',
      order: 'ASC',
    };
    const paginated = { data: [mockPost], total: 1, page: 1, limit: 10, totalPages: 1 };
    jest.spyOn(service, 'findAll').mockResolvedValue(paginated as any);

    const result = await controller.findAll(query, { user: undefined });
    expect(service.findAll).toHaveBeenCalledWith(query, undefined);
    expect(result).toEqual(paginated);
  });

  it('should pass currentUserId when user is authenticated', async () => {
    const paginated = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    jest.spyOn(service, 'findAll').mockResolvedValue(paginated as any);

    await controller.findAll({}, { user: { id: mockUser.id } });
    expect(service.findAll).toHaveBeenCalledWith({}, mockUser.id);
  });

  it('should return one post', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockPost as any);
    const result = await controller.findOne(1, { user: undefined });
    expect(service.findOne).toHaveBeenCalledWith(1, undefined);
    expect(result).toEqual(mockPost);
  });

  it('should throw NotFoundException if post not found', async () => {
    jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
    await expect(controller.findOne(999, { user: undefined })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should create a post', async () => {
    jest.spyOn(service, 'create').mockResolvedValue(mockPost as any);
    const dto = { title: 'Test', content: 'Content' };
    const result = await controller.create(dto as any, { id: mockUser.id });
    expect(service.create).toHaveBeenCalledWith(dto, mockUser.id);
    expect(result).toEqual(mockPost);
  });

  it('should update a post', async () => {
    jest.spyOn(service, 'update').mockResolvedValue(mockPost as any);
    const dto = { title: 'Updated' };
    const result = await controller.update(1, dto as any, { id: mockUser.id });
    expect(service.update).toHaveBeenCalledWith(1, dto, mockUser.id);
    expect(result).toEqual(mockPost);
  });

  it('should remove a post (admin)', async () => {
    jest
      .spyOn(service, 'remove')
      .mockResolvedValue({ message: 'Post 1 deleted successfully' });
    const result = await controller.remove(1, {
      id: mockUser.id,
      role: UserRole.ADMIN,
    });
    expect(service.remove).toHaveBeenCalledWith(1, mockUser.id, UserRole.ADMIN);
    expect(result.message).toContain('deleted');
  });

  it('should remove a post (owner)', async () => {
    jest
      .spyOn(service, 'remove')
      .mockResolvedValue({ message: 'Post 1 deleted successfully' });
    const result = await controller.remove(1, {
      id: mockUser.id,
      role: UserRole.USER,
    });
    expect(service.remove).toHaveBeenCalledWith(1, mockUser.id, UserRole.USER);
    expect(result.message).toContain('deleted');
  });
});
