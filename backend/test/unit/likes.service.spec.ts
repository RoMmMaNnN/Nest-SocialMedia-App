import { Test, TestingModule } from '@nestjs/testing';
import { LikesService } from '../../src/modules/likes/services/likes.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from '../../src/modules/likes/entities/like.entity';
import { createMockRepository } from '../mocks/repository.mock';
import { mockUser } from '../mocks/entities.mock';

const mockLike = {
  id: 1,
  userId: mockUser.id,
  postId: 10,
  user: { id: mockUser.id, username: mockUser.username, avatarUrl: mockUser.avatarUrl },
} as unknown as Like;

describe('LikesService', () => {
  let service: LikesService;
  let likesRepo: jest.Mocked<Repository<Like>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: getRepositoryToken(Like),
          useValue: createMockRepository(),
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
    likesRepo = module.get(getRepositoryToken(Like));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------- TOGGLE ----------
  it('should like a post when not yet liked', async () => {
    likesRepo.findOne.mockResolvedValue(null);
    likesRepo.create.mockReturnValue(mockLike);
    likesRepo.save.mockResolvedValue(mockLike);
    likesRepo.count.mockResolvedValue(1);

    const result = await service.toggle(mockUser.id, 10);
    expect(result.liked).toBe(true);
    expect(result.likesCount).toBe(1);
    expect(likesRepo.save).toHaveBeenCalled();
  });

  it('should unlike a post when already liked', async () => {
    likesRepo.findOne.mockResolvedValue(mockLike);
    likesRepo.remove.mockResolvedValue(mockLike);
    likesRepo.count.mockResolvedValue(0);

    const result = await service.toggle(mockUser.id, 10);
    expect(result.liked).toBe(false);
    expect(result.likesCount).toBe(0);
    expect(likesRepo.remove).toHaveBeenCalledWith(mockLike);
  });

  // ---------- GET LIKES ----------
  it('should return likes count and users for a post', async () => {
    likesRepo.find.mockResolvedValue([mockLike]);

    const result = await service.getLikes(10);
    expect(result.likesCount).toBe(1);
    expect(result.users).toHaveLength(1);
    expect(result.users[0].username).toBe(mockUser.username);
  });

  it('should return zero likes when no one liked', async () => {
    likesRepo.find.mockResolvedValue([]);

    const result = await service.getLikes(10);
    expect(result.likesCount).toBe(0);
    expect(result.users).toHaveLength(0);
  });

  // ---------- HAS LIKED ----------
  it('should return true when user has liked the post', async () => {
    likesRepo.findOne.mockResolvedValue(mockLike);
    const result = await service.hasLiked(mockUser.id, 10);
    expect(result).toBe(true);
  });

  it('should return false when user has not liked the post', async () => {
    likesRepo.findOne.mockResolvedValue(null);
    const result = await service.hasLiked(mockUser.id, 10);
    expect(result).toBe(false);
  });

  // ---------- COUNT LIKES ----------
  it('should count likes for a post', async () => {
    likesRepo.count.mockResolvedValue(5);
    const count = await service.countLikes(10);
    expect(count).toBe(5);
    expect(likesRepo.count).toHaveBeenCalledWith({ where: { postId: 10 } });
  });
});
