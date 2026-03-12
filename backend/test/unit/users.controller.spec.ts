import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../src/modules/users/services/users.service';
import {
  User,
  UserRole,
} from '../../src/modules/users/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { mockUsersService } from '../mocks/users-service.mock';

const mockCacheManager = { get: jest.fn(), set: jest.fn(), clear: jest.fn() };

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll and return data', async () => {
    const result = { data: [], meta: { total: 0, page: 1, lastPage: 1 } };
    mockUsersService.findAll.mockResolvedValue(result);

    const query = { page: 1, limit: 10, search: '' };
    expect(await controller.findAll(query)).toEqual(result);
    expect(mockUsersService.findAll).toHaveBeenCalledWith(query);
  });

  it('should return a single user by id (public route)', async () => {
    const mockUser = { id: 1, role: UserRole.USER } as User;
    mockUsersService.findOne.mockResolvedValue(mockUser);

    expect(await controller.findOne(1)).toEqual(mockUser);
    expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
  });

  it('should call create and return new user', async () => {
    const dto = { email: 'a@a.com', password: '1234', username: 'newuser', role: UserRole.USER };
    const createdUser = { id: 1, ...dto } as User;
    mockUsersService.create.mockResolvedValue(createdUser);

    expect(await controller.create(dto as any)).toEqual(createdUser);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('should call update and return updated user', async () => {
    const user = { id: 1, displayName: 'Old' } as User;
    const dto = { displayName: 'New' };
    const currentUser = { id: 1, role: UserRole.USER };

    mockUsersService.update.mockResolvedValue({ ...user, ...dto });

    const updated = await controller.update(1, dto as any, currentUser);
    expect(updated.displayName).toBe('New');
    expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
  });

  it('should throw ForbiddenException on update if non-admin updates another user', async () => {
    const dto = { displayName: 'New' };
    const currentUser = { id: 2, role: UserRole.USER };

    await expect(controller.update(1, dto as any, currentUser)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should allow admin to update any user', async () => {
    const dto = { displayName: 'Admin Updated' };
    const currentUser = { id: 99, role: UserRole.ADMIN };
    mockUsersService.update.mockResolvedValue({ id: 1, ...dto } as any);

    const updated = await controller.update(1, dto as any, currentUser);
    expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
    expect(updated.displayName).toBe('Admin Updated');
  });

  it('should remove user and sessions', async () => {
    mockUsersService.removeUserAndSessions.mockResolvedValue({
      message: 'deleted',
    });
    const result = await controller.remove(1);
    expect(result).toEqual({
      message: 'User 1 deleted and all sessions revoked.',
    });
    expect(mockUsersService.removeUserAndSessions).toHaveBeenCalledWith(1);
  });
});
