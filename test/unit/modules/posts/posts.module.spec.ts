import { Test, TestingModule } from '@nestjs/testing';
import { PostsModule } from '../../../../src/modules/posts/posts.module';
import { PostsService } from '../../../../src/modules/posts/services/posts.service';
import { PostsController } from '../../../../src/modules/posts/controllers/posts.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post } from '../../../../src/modules/posts/entities/post.entity';
import { UsersService } from '../../../../src/modules/users/services/users.service';

describe('PostsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [],
      controllers: [PostsController],
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              orderBy: jest.fn().mockReturnThis(),
              skip: jest.fn().mockReturnThis(),
              take: jest.fn().mockReturnThis(),
              getMany: jest.fn(),
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should have PostsService provider', () => {
    const service = module.get<PostsService>(PostsService);
    expect(service).toBeDefined();
  });

  it('should have PostsController', () => {
    const controller = module.get<PostsController>(PostsController);
    expect(controller).toBeDefined();
  });

  it('should have Post repository injected', () => {
    const repo = module.get(getRepositoryToken(Post));
    expect(repo).toBeDefined();
    expect(repo.create).toBeDefined();
    expect(repo.save).toBeDefined();
  });

  it('should have UsersService injected', () => {
    const userService = module.get<UsersService>(UsersService);
    expect(userService).toBeDefined();
  });
});
