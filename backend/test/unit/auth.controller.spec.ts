import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { RegisterDto } from '../../src/modules/auth/dto/register.dto';
import { LoginDto } from '../../src/modules/auth/dto/login.dto';
import { RefreshTokenDto } from '../../src/modules/auth/dto/refresh-token.dto';
import { VerifyEmailDto } from '../../src/modules/auth/dto/verify-email.dto';
import { mockUser } from '../mocks/entities.mock';

const mockAuthService = () => ({
  register: jest.fn(),
  verifyEmail: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  rotateRefreshToken: jest.fn(),
});

describe('AuthController', () => {
  let controller: AuthController;
  let service: ReturnType<typeof mockAuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useFactory: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('should register and return message', async () => {
      const dto: RegisterDto = { username: 'testuser', email: 'a@mail.com', password: 'password123' };
      const msg = { message: 'Registration successful. Please check your email.' };

      service.register.mockResolvedValue(msg);

      const result = await controller.register(dto);
      expect(result).toEqual(msg);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return message', async () => {
      const dto: VerifyEmailDto = { token: 'valid-token' };
      const msg = { message: 'Email verified successfully.' };

      service.verifyEmail.mockResolvedValue(msg);

      const result = await controller.verifyEmail(dto);
      expect(result).toEqual(msg);
      expect(service.verifyEmail).toHaveBeenCalledWith(dto.token);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const dto: LoginDto = { email: 'a@mail.com', password: '1234' };
      const tokens = { user: mockUser, access_token: 'a', refresh_token: 'r' };

      service.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);
      expect(result).toEqual(tokens);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  describe('me', () => {
    it('should return the current user', () => {
      const result = controller.me(mockUser);
      expect(result).toBe(mockUser);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const user = { id: 5 };
      const response = { message: 'Logged out successfully' };

      service.logout.mockResolvedValue(response);

      const result = await controller.logout(user);
      expect(result).toEqual(response);
      expect(service.logout).toHaveBeenCalledWith(user.id);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const dto: RefreshTokenDto = { refreshToken: 'refresh' };
      const tokens = { access_token: 'new_acc', refresh_token: 'new_ref' };

      service.rotateRefreshToken.mockResolvedValue(tokens);

      const result = await controller.refresh(dto);
      expect(result).toEqual(tokens);
      expect(service.rotateRefreshToken).toHaveBeenCalledWith(dto);
    });
  });
});

