import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { JwtHelperService } from '../../jwt/services/jwt-helper.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtHelper: JwtHelperService,
    private readonly config: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ForbiddenException('Email already in use');

    const user = await this.usersService.create(dto);
    const tokens = await this.generateTokens(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.saveRefreshToken(
      user.id,
      tokens.jti,
      tokens.refresh_token,
      expiresAt,
    );

    return { user, ...tokens };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.saveRefreshToken(
      user.id,
      tokens.jti,
      tokens.refresh_token,
      expiresAt,
    );

    return { user, ...tokens };
  }

  async rotateRefreshToken(payload: any, userAgent?: string) {
    const refreshToken = payload.refreshToken;
    let tokenPayload: any;
    try {
      tokenPayload = this.jwtHelper.verifyRefresh(refreshToken);
    } catch (err) {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const { sub: userId, jti } = tokenPayload;

    const session = await this.refreshRepo.findOne({
      where: { jti },
      relations: ['user'],
    });

    if (!session) {
      await this.usersService.incrementTokenVersion(userId);
      throw new ForbiddenException('Refresh token reuse detected');
    }

    if (session.revokedAt || session.expiresAt < new Date()) {
      throw new ForbiddenException('Token expired or revoked');
    }

    const valid = await bcrypt.compare(refreshToken, session.hashedToken);
    if (!valid) {
      await this.usersService.incrementTokenVersion(userId);
      throw new ForbiddenException('Invalid refresh token');
    }

    session.revokedAt = new Date();
    await this.refreshRepo.save(session);

    const user = session.user;
    const tokens = await this.generateTokens(user);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.saveRefreshToken(
      user.id,
      tokens.jti,
      tokens.refresh_token,
      expiresAt,
      userAgent,
    );

    return tokens;
  }

  async logout(userId: number) {
    await this.refreshRepo.delete({ user: { id: userId } });
    return { message: 'Logged out successfully' };
  }

  private async generateTokens(user: User) {
    const jti = uuidv4();
    const payload = {
      sub: user.id,
      email: user.email,
      tokenVersion: user.tokenVersion,
      jti,
    };

    const access_token = this.jwtHelper.signAccess(payload);
    const refresh_token = this.jwtHelper.signRefresh(payload);

    return { access_token, refresh_token, jti };
  }

  private async saveRefreshToken(
    userId: number,
    jti: string,
    plainToken: string,
    expiresAt: Date,
    deviceInfo?: string,
  ) {
    // Завжди хешуємо тільки 1 раз
    const hashed = await bcrypt.hash(plainToken, 10);
    const token = this.refreshRepo.create({
      user: { id: userId } as User,
      jti,
      hashedToken: hashed,
      expiresAt,
      deviceInfo,
    });
    await this.refreshRepo.save(token);
  }
}
