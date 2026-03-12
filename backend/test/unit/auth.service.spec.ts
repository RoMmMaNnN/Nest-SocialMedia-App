import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { UsersService } from '../../src/modules/users/services/users.service';
import { JwtHelperService } from '../../src/modules/jwt/services/jwt-helper.service';
import { MailService } from '../../src/modules/mail/services/mail.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../../src/modules/auth/entities/refresh-token.entity';
import { User } from '../../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { mockUser } from '../mocks/entities.mock';
import { mockMailService } from '../mocks/mail-service.mock';

jest.mock('bcrypt');

const makeRefreshRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  delete: jest.fn(),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtHelper: jest.Mocked<JwtHelperService>;
  let refreshRepo: ReturnType<typeof makeRefreshRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findByVerificationToken: jest.fn(),
            markEmailVerified: jest.fn(),
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
        { provide: MailService, useValue: mockMailService },
        { provide: getRepositoryToken(RefreshToken), useFactory: makeRefreshRepo },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtHelper = module.get(JwtHelperService);
    refreshRepo = module.get(getRepositoryToken(RefreshToken));
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register new user, send email, and return message', async () => {
      const dto = { email: 'new@mail.com', username: 'newuser', password: 'password123' };
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ ...mockUser, email: dto.email } as User);

      const result = await service.register(dto as any);

      expect(usersService.create).toHaveBeenCalled();
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalled();
      expect(result.message).toContain('Registration successful');
    });

    it('should throw ForbiddenException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 1 } as User);
      await expect(
        service.register({ email: 'a@b.com', username: 'user1', password: 'pass' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if username already taken', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue({ id: 2 } as User);
      await expect(
        service.register({ email: 'new@b.com', username: 'taken', password: 'pass' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return success message', async () => {
      usersService.findByVerificationToken.mockResolvedValue({ ...mockUser, id: 1 } as User);
      usersService.markEmailVerified.mockResolvedValue(undefined);

      const result = await service.verifyEmail('valid-token');
      expect(result.message).toContain('verified');
      expect(usersService.markEmailVerified).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if token is invalid', async () => {
      usersService.findByVerificationToken.mockResolvedValue(null);
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(NotFoundException);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const user = { ...mockUser, isEmailVerified: true } as User;
      usersService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtHelper.signAccess.mockReturnValue('access');
      jwtHelper.signRefresh.mockReturnValue('refresh');
      refreshRepo.delete.mockResolvedValue({ affected: 0 });
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
      refreshRepo.create.mockReturnValue({ token: 'hashed', userId: 1 } as RefreshToken);
      refreshRepo.save.mockResolvedValue({} as RefreshToken);

      const result = await service.login({ email: user.email, password: '1234' } as any);

      expect(result.access_token).toBe('access');
      expect(result.refresh_token).toBe('refresh');
    });

    it('should throw UnauthorizedException if wrong password', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isEmailVerified: true } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
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

    it('should throw ForbiddenException if email not verified', async () => {
      usersService.findByEmail.mockResolvedValue({
        ...mockUser,
        isEmailVerified: false,
      } as User);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(
        service.login({ email: mockUser.email, password: 'pass' } as any),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('logout', () => {
    it('should delete refresh tokens on logout', async () => {
      refreshRepo.delete.mockResolvedValue({ affected: 1 });
      const result = await service.logout(5);
      expect(result.message).toBe('Logged out successfully');
      expect(refreshRepo.delete).toHaveBeenCalledWith({ userId: 5 });
    });
  });

  describe('rotateRefreshToken', () => {
    it('should throw ForbiddenException if refresh token is invalid JWT', async () => {
      jwtHelper.verifyRefresh.mockImplementation(() => {
        throw new Error('invalid');
      });
      await expect(service.rotateRefreshToken({ refreshToken: 'bad' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if refresh token not in DB', async () => {
      jwtHelper.verifyRefresh.mockReturnValue({ sub: 1, email: 'ok@mail.com' } as any);
      refreshRepo.findOne.mockResolvedValue(null);
      await expect(service.rotateRefreshToken({ refreshToken: 'valid-jwt' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if DB token is expired', async () => {
      jwtHelper.verifyRefresh.mockReturnValue({ sub: 1, email: 'ok@mail.com' } as any);
      refreshRepo.findOne.mockResolvedValue({
        token: 'hashed',
        userId: 1,
        expiresAt: new Date(Date.now() - 1000),
        user: { id: 1 },
      } as RefreshToken);
      refreshRepo.delete.mockResolvedValue({ affected: 1 });
      await expect(service.rotateRefreshToken({ refreshToken: 'valid-jwt' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should issue new tokens when refresh token is valid', async () => {
      const user = { ...mockUser, id: 1 } as User;
      refreshRepo.findOne.mockResolvedValue({
        token: 'hashed',
        userId: 1,
        expiresAt: new Date(Date.now() + 100000),
        user,
      } as RefreshToken);
      jwtHelper.verifyRefresh.mockReturnValue({ sub: 1, email: 'ok@mail.com' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hashed');
      refreshRepo.delete.mockResolvedValue({ affected: 1 });
      refreshRepo.create.mockReturnValue({ token: 'new_hashed', userId: 1 } as RefreshToken);
      refreshRepo.save.mockResolvedValue({} as RefreshToken);
      jwtHelper.signAccess.mockReturnValue('new_access');
      jwtHelper.signRefresh.mockReturnValue('new_refresh');

      const result = await service.rotateRefreshToken({ refreshToken: 'old_refresh' });

      expect(result.access_token).toBe('new_access');
      expect(result.refresh_token).toBe('new_refresh');
    });
  });
});
