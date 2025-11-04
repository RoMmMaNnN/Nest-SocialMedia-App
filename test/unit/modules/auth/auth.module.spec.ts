import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from '../../../../src/modules/auth/auth.module';
import { AuthService } from '../../../../src/modules/auth/services/auth.service';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { JwtModule } from '../../../../src/modules/jwt/jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from '../../../../src/modules/auth/entities/refresh-token.entity';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from '../../../../src/modules/jwt/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../../../../src/modules/jwt/strategies/jwt-refresh.strategy';
import { AuthController } from '../../../../src/modules/auth/controllers/auth.controller';

describe('AuthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        UsersModule,
        JwtModule,
        TypeOrmModule.forFeature([RefreshToken]),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
    }).compile();
  });

  it('should compile AuthModule', () => {
    expect(module).toBeDefined();
  });

  it('should have AuthService provider', () => {
    const service = module.get<AuthService>(AuthService);
    expect(service).toBeDefined();
  });

  it('should have AuthController', () => {
    const controller = module.get<AuthController>(AuthController);
    expect(controller).toBeDefined();
  });

  it('should have JwtStrategy provider', () => {
    const strategy = module.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });

  it('should have JwtRefreshStrategy provider', () => {
    const refreshStrategy = module.get<JwtRefreshStrategy>(JwtRefreshStrategy);
    expect(refreshStrategy).toBeDefined();
  });
});
