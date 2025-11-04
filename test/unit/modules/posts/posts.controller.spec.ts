import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../../../src/modules/posts/controllers/posts.controller';
import { PostsService } from '../../../../src/modules/posts/services/posts.service';
import { NotFoundException } from '@nestjs/common';
import { mockPost, mockUser } from '../../../mocks/entities.mock';
import { QueryPostsDto } from '../../../../src/modules/posts/dto/query-posts.dto';

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
      ],
    }).compile();

    controller = module.get<PostsController>(PostsController);
    service = module.get<PostsService>(PostsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return all posts with query', async () => {
    const query: QueryPostsDto = {
      limit: 10,
      offset: 0,
      search: 'test',
      sort: 'ASC',
    };
    jest.spyOn(service, 'findAll').mockResolvedValue([mockPost] as any);

    const result = await controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockPost.id);
  });

  it('should return one post', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue(mockPost as any);
    const result = await controller.findOne(1);
    expect(result.id).toBe(mockPost.id);
  });

  it('should throw NotFoundException if post not found', async () => {
    jest.spyOn(service, 'findOne').mockRejectedValue(new NotFoundException());
    await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('should create a post', async () => {
    jest.spyOn(service, 'create').mockResolvedValue(mockPost as any);
    const dto = { title: 'Test', content: 'Content' };
    const result = await controller.create(dto, { user: { id: mockUser.id } });
    expect(service.create).toHaveBeenCalledWith(dto, mockUser.id);
    expect(result.id).toBe(mockPost.id);
  });

  it('should update a post', async () => {
    jest.spyOn(service, 'update').mockResolvedValue(mockPost as any);
    const dto = { title: 'Updated' };
    const result = await controller.update(1, dto, {
      user: { id: mockUser.id },
    });
    expect(service.update).toHaveBeenCalledWith(1, dto, mockUser.id);
    expect(result.title).toBe(mockPost.title);
  });

  it('should remove a post', async () => {
    jest
      .spyOn(service, 'remove')
      .mockResolvedValue({ message: 'Post 1 deleted' } as any);
    const result = await controller.remove(1, { user: { id: mockUser.id } });
    expect(service.remove).toHaveBeenCalledWith(1, mockUser.id);
    expect(result.message).toContain('deleted');
  });
});
