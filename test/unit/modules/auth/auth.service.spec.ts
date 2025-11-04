import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../../../src/modules/auth/services/auth.service';
import { UsersService } from '../../../../src/modules/users/services/users.service';
import { JwtHelperService } from '../../../../src/modules/jwt/services/jwt-helper.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../../../../src/modules/auth/entities/refresh-token.entity';
import { User } from '../../../../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

// 🧱 Mock repositories
const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtHelper: jest.Mocked<JwtHelperService>;
  let refreshRepo: jest.Mocked<Repository<RefreshToken>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            incrementTokenVersion: jest.fn(),
          },
        },
        {
          provide: JwtHelperService,
          useValue: {
            signAccess: jest.fn(),
            signRefresh: jest.fn(),
            verifyRefresh: jest.fn(),
          },
        },
        { provide: ConfigService, useValue: {} },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: mockRepository(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtHelper = module.get(JwtHelperService);
    refreshRepo = module.get(getRepositoryToken(RefreshToken));
  });

  // ================================================
  // ✅ REGISTER
  // ================================================
  it('should register new user and return tokens', async () => {
    const dto = { email: 'new@mail.com', password: '1234' };

    usersService.findByEmail.mockResolvedValue(null);
    usersService.create.mockResolvedValue({ id: 1, email: dto.email } as User);
    jwtHelper.signAccess.mockReturnValue('access');
    jwtHelper.signRefresh.mockReturnValue('refresh');

    const result = await service.register(dto as any);

    expect(usersService.create).toHaveBeenCalled();
    expect(result.access_token).toBe('access');
    expect(result.refresh_token).toBe('refresh');
    expect(refreshRepo.save).toHaveBeenCalled();
  });

  it('should throw ForbiddenException if email already exists', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 1 } as User);

    await expect(
      service.register({ email: 'a@b.com', password: '1' } as any),
    ).rejects.toThrow(ForbiddenException);
  });

  // ================================================
  // ✅ LOGIN
  // ================================================
  it('should login user successfully', async () => {
    const user = { id: 1, email: 't@mail.com', password: 'hashed' } as User;
    usersService.findByEmail.mockResolvedValue(user);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jwtHelper.signAccess.mockReturnValue('access');
    jwtHelper.signRefresh.mockReturnValue('refresh');

    const result = await service.login({
      email: user.email,
      password: '1234',
    } as any);

    expect(result.access_token).toBe('access');
    expect(result.refresh_token).toBe('refresh');
    expect(refreshRepo.save).toHaveBeenCalled();
  });

  it('should throw UnauthorizedException if wrong password', async () => {
    usersService.findByEmail.mockResolvedValue({
      email: 'x@mail.com',
      password: 'hash',
    } as User);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      service.login({ email: 'x@mail.com', password: 'wrong' } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if user not found', async () => {
    usersService.findByEmail.mockResolvedValue(null);

    await expect(
      service.login({ email: 'no@mail.com', password: '1234' } as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  // ================================================
  // ✅ LOGOUT
  // ================================================
  it('should delete refresh tokens on logout', async () => {
    refreshRepo.delete.mockResolvedValue({ affected: 1 } as any);
    const result = await service.logout(5);
    expect(result.message).toBe('Logged out successfully');
    expect(refreshRepo.delete).toHaveBeenCalledWith({ user: { id: 5 } });
  });

  // ================================================
  // ✅ ROTATE REFRESH TOKEN
  // ================================================
  it('should throw ForbiddenException if refresh token invalid', async () => {
    jwtHelper.verifyRefresh.mockImplementation(() => {
      throw new Error('invalid');
    });

    await expect(
      service.rotateRefreshToken({ refreshToken: 'bad' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should issue new tokens when refresh token valid', async () => {
    const user = { id: 1, email: 'ok@mail.com', tokenVersion: 1 } as User;
    const oldToken = {
      jti: uuidv4(),
      hashedToken: await bcrypt.hash('refresh', 10),
      user,
      expiresAt: new Date(Date.now() + 100000),
    } as RefreshToken;

    jwtHelper.verifyRefresh.mockReturnValue({ sub: 1, jti: oldToken.jti });
    refreshRepo.findOne.mockResolvedValue(oldToken);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
    jwtHelper.signAccess.mockReturnValue('new_access');
    jwtHelper.signRefresh.mockReturnValue('new_refresh');

    const result = await service.rotateRefreshToken({
      refreshToken: 'refresh',
    });

    expect(result.access_token).toBe('new_access');
    expect(result.refresh_token).toBe('new_refresh');
    expect(refreshRepo.save).toHaveBeenCalled();
  });
});
