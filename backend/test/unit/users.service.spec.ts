import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../src/modules/users/services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../../src/modules/users/entities/user.entity';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import * as bcrypt from 'bcrypt';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

jest.mock('bcrypt');
import { createMockRepository } from '../mocks/repository.mock';
import { createMockDataSource } from '../mocks/data-source.mock';

const mockCacheManager = { clear: jest.fn().mockResolvedValue(undefined) };

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let refreshRepo: jest.Mocked<Repository<RefreshToken>>;
  let dataSource: ReturnType<typeof createMockDataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: createMockRepository() },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: createMockRepository(),
        },
        { provide: DataSource, useValue: createMockDataSource() },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    refreshRepo = module.get(getRepositoryToken(RefreshToken));
    dataSource = module.get(DataSource);
  });

  afterEach(() => jest.clearAllMocks());

  // ---------- CREATE ----------
  it('should create a user successfully', async () => {
    const dto = { email: 'test@mail.com', password: '1234', username: 'newuser' };
    userRepo.findOneBy.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');
    userRepo.create.mockReturnValue({ ...dto, password: 'hashed_password' } as User);
    userRepo.save.mockResolvedValue({ id: 1, ...dto, password: 'hashed_password' } as User);

    const user = await service.create(dto as any);

    expect(bcrypt.hash).toHaveBeenCalledWith('1234', 12);
    expect(user.id).toBe(1);
    expect(user.password).toBe('hashed_password');
  });

  it('should throw ConflictException if email exists', async () => {
    userRepo.findOneBy.mockResolvedValue({ id: 1 } as User);

    await expect(
      service.create({ email: 'test@mail.com', password: '1234', username: 'u' } as any),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw ConflictException if username is taken', async () => {
    // First call (email check) returns null, second call (username check) returns existing user
    userRepo.findOneBy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 2 } as User);

    await expect(
      service.create({ email: 'new@mail.com', password: '1234', username: 'taken' } as any),
    ).rejects.toThrow(ConflictException);
  });

  // ---------- FIND ONE ----------
  it('should find a user by id', async () => {
    userRepo.findOne.mockResolvedValue({ id: 1, email: 'a' } as User);
    const user = await service.findOne(1);

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['refreshTokens'],
    });
    expect(user.id).toBe(1);
  });

  it('should throw NotFoundException if user not found', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  // ---------- FIND BY EMAIL ----------
  it('should find a user by email', async () => {
    const email = 'a@mail.com';
    const mockUser = { id: 2, email } as User;
    userRepo.findOneBy.mockResolvedValue(mockUser);

    const result = await service.findByEmail(email);
    expect(result).toEqual(mockUser);
    expect(userRepo.findOneBy).toHaveBeenCalledWith({ email });
  });

  // ---------- FIND BY USERNAME ----------
  it('should find a user by username', async () => {
    const username = 'testuser';
    const mockUser = { id: 3, username } as User;
    userRepo.findOneBy.mockResolvedValue(mockUser);

    const result = await service.findByUsername(username);
    expect(result).toEqual(mockUser);
    expect(userRepo.findOneBy).toHaveBeenCalledWith({ username });
  });

  it('should return null when username not found', async () => {
    userRepo.findOneBy.mockResolvedValue(null);
    const result = await service.findByUsername('noone');
    expect(result).toBeNull();
  });

  // ---------- MARK EMAIL VERIFIED ----------
  it('should mark email as verified', async () => {
    userRepo.update = jest.fn().mockResolvedValue({ affected: 1 });

    await service.markEmailVerified(1);

    expect(userRepo.update).toHaveBeenCalledWith(1, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
    expect(mockCacheManager.clear).toHaveBeenCalled();
  });

  // ---------- UPDATE ----------
  it('should update user profile fields', async () => {
    const user = { id: 1, username: 'old', displayName: 'Old' } as User;
    jest.spyOn(service, 'findOne').mockResolvedValue(user);
    userRepo.save.mockResolvedValue({ ...user, displayName: 'New Name' } as User);

    const updated = await service.update(1, { displayName: 'New Name' } as any);
    expect(updated.displayName).toBe('New Name');
  });

  // ---------- REMOVE USER ----------
  it('should remove a user and sessions', async () => {
    const queryRunnerMock = {
      manager: {
        increment: jest.fn(),
        delete: jest.fn(),
      },
      release: jest.fn(),
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
    } as unknown as QueryRunner;

    dataSource.createQueryRunner.mockReturnValue(queryRunnerMock as any);

    const result = await service.removeUserAndSessions(1);
    expect(result.message).toContain('deleted and all sessions revoked');
    expect(queryRunnerMock.manager.increment).toHaveBeenCalled();
    expect(queryRunnerMock.manager.delete).toHaveBeenCalled();
  });

  it('should handle error during user removal and rollback transaction', async () => {
    const queryRunnerMock = {
      manager: {
        increment: jest.fn().mockImplementation(() => {
          throw new Error('fail');
        }),
        delete: jest.fn(),
      },
      release: jest.fn(),
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
    } as unknown as QueryRunner;

    dataSource.createQueryRunner.mockReturnValue(queryRunnerMock as any);

    await expect(service.removeUserAndSessions(1)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
  });
});
