import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../../src/modules/users/services/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { RefreshToken } from '../../../../src/modules/auth/entities/refresh-token.entity';
import * as bcrypt from 'bcrypt';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { createMockRepository } from '../../../mocks/repository.mock';
import { createMockDataSource } from '../../../mocks/data-source.mock';

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let refreshRepo: jest.Mocked<Repository<RefreshToken>>;
  let dataSource: jest.Mocked<DataSource>;

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
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
    refreshRepo = module.get(getRepositoryToken(RefreshToken));
    dataSource = module.get(DataSource);
  });

  // ---------- CREATE ----------
  it('should create a user successfully', async () => {
    const dto = { email: 'test@mail.com', password: '1234' };
    userRepo.findOneBy.mockResolvedValue(null);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password' as never);
    userRepo.create.mockReturnValue({
      ...dto,
      password: 'hashed_password',
    } as User);
    userRepo.save.mockResolvedValue({
      id: 1,
      ...dto,
      password: 'hashed_password',
    } as User);

    const user = await service.create(dto as any);

    expect(userRepo.findOneBy).toHaveBeenCalledWith({ email: dto.email });
    expect(bcrypt.hash).toHaveBeenCalledWith('1234', 10);
    expect(user.id).toBe(1);
    expect(user.password).toBe('hashed_password');
  });

  it('should throw ConflictException if email exists', async () => {
    userRepo.findOneBy.mockResolvedValue({ id: 1 } as User);

    await expect(
      service.create({ email: 'test@mail.com', password: '1234' } as any),
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

  // ---------- UPDATE ----------
  it('should update user password if provided', async () => {
    const user = { id: 1, email: 'a', password: 'old' } as User;
    jest.spyOn(service, 'findOne').mockResolvedValue(user);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('new_hashed' as never);
    userRepo.save.mockResolvedValue({
      ...user,
      password: 'new_hashed',
    } as User);

    const updated = await service.update(1, { password: '1234' } as any);
    expect(updated.password).toBe('new_hashed');
  });

  it('should update user email only', async () => {
    const user = { id: 1, email: 'old@mail.com', password: 'p' } as User;
    jest.spyOn(service, 'findOne').mockResolvedValue(user);
    userRepo.save.mockResolvedValue({
      ...user,
      email: 'new@mail.com',
    } as User);

    const updated = await service.update(1, { email: 'new@mail.com' } as any);
    expect(updated.email).toBe('new@mail.com');
    expect(bcrypt.hash).not.toHaveBeenCalled();
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

    dataSource.createQueryRunner.mockReturnValue(queryRunnerMock);

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

    dataSource.createQueryRunner.mockReturnValue(queryRunnerMock);

    await expect(service.removeUserAndSessions(1)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
  });
});
