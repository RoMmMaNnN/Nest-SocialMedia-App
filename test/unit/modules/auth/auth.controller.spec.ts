import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../../../src/modules/auth/services/auth.service';
import { RegisterDto } from '../../../../src/modules/auth/dto/register.dto';
import { LoginDto } from '../../../../src/modules/auth/dto/login.dto';
import { RefreshTokenDto } from '../../../../src/modules/auth/dto/refresh-token.dto';
import { JwtAuthGuard } from '../../../../src/common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../../src/common/decorators/current-user.decorator';
import { ExecutionContext } from '@nestjs/common';

// 🧱 Mock AuthService
const mockAuthService = () => ({
  register: jest.fn(),
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
      providers: [
        {
          provide: AuthService,
          useFactory: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  // ================================================
  // ✅ REGISTER
  // ================================================
  describe('register', () => {
    it('should register user and return tokens', async () => {
      const dto: RegisterDto = {
        name: 'Test User',
        email: 'a@mail.com',
        password: '1234',
      };
      const tokens = { access_token: 'acc', refresh_token: 'ref' };

      service.register.mockResolvedValue(tokens);

      const result = await controller.register(dto);

      expect(result).toEqual(tokens);
      expect(service.register).toHaveBeenCalledWith(dto);
    });
  });

  // ================================================
  // ✅ LOGIN
  // ================================================
  describe('login', () => {
    it('should login user successfully', async () => {
      const dto: LoginDto = { email: 'a@mail.com', password: '1234' };
      const tokens = { access_token: 'a', refresh_token: 'r' };

      service.login.mockResolvedValue(tokens);

      const result = await controller.login(dto);

      expect(result).toEqual(tokens);
      expect(service.login).toHaveBeenCalledWith(dto);
    });
  });

  // ================================================
  // ✅ LOGOUT
  // ================================================
  describe('logout', () => {
    it('should logout user successfully', async () => {
      const user = { id: 5, email: 'user@mail.com' };
      const response = { message: 'Logged out successfully' };

      service.logout.mockResolvedValue(response);

      const result = await controller.logout(user);

      expect(result).toEqual(response);
      expect(service.logout).toHaveBeenCalledWith(user.id);
    });
  });

  // ================================================
  // ✅ REFRESH TOKEN
  // ================================================
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

  // ================================================
  // ✅ SECURITY & GUARDS (behavioral)
  // ================================================
  describe('security', () => {
    it('JwtAuthGuard should exist and be defined', () => {
      expect(JwtAuthGuard).toBeDefined();
    });

    it('CurrentUser decorator should return user from request', () => {
      const mockUser = { id: 1, email: 'a@mail.com' };
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ user: mockUser }),
        }),
      } as unknown as ExecutionContext;

      const result = (CurrentUser() as any).factory(null, mockContext);
      expect(result).toBe(mockUser);
    });
  });
});
