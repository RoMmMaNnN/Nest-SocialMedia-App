import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../../src/modules/users/controllers/users.controller';
import { UsersService } from '../../../../src/modules/users/services/users.service';
import {
  User,
  UserRole,
} from '../../../../src/modules/users/entities/user.entity';
import { ForbiddenException } from '@nestjs/common';
import { mockUsersService } from '../../../mocks/users-service.mock';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

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

  it('should return a single user if admin', async () => {
    const mockUser = { id: 1, role: UserRole.ADMIN } as User;
    mockUsersService.findOne.mockResolvedValue(mockUser);

    const req = { user: { id: 2, role: UserRole.ADMIN } };
    expect(await controller.findOne(1, req)).toEqual(mockUser);
  });

  it('should throw ForbiddenException if non-admin tries to access another user', async () => {
    const req = { user: { id: 2, role: UserRole.USER } };
    await expect(controller.findOne(1, req)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('should call create and return new user', async () => {
    const dto = { email: 'a@a.com', password: '1234', role: UserRole.USER };
    const createdUser = { id: 1, ...dto } as User;
    mockUsersService.create.mockResolvedValue(createdUser);

    expect(await controller.create(dto as any)).toEqual(createdUser);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('should call update and return updated user', async () => {
    const user = { id: 1, email: 'a@a.com', password: '1234' } as User;
    const dto = { password: '4321' };
    const req = { user: { id: 1, role: UserRole.USER } };

    mockUsersService.update.mockResolvedValue({ ...user, ...dto });

    const updated = await controller.update(1, dto as any, req);
    expect(updated.password).toBe('4321');
    expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
  });

  it('should throw ForbiddenException on update if non-admin updates another user', async () => {
    const dto = { password: '4321' };
    const req = { user: { id: 2, role: UserRole.USER } };

    await expect(controller.update(1, dto as any, req)).rejects.toThrow(
      ForbiddenException,
    );
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
