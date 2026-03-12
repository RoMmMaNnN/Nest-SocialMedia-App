import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { JwtHelperService } from '../../jwt/services/jwt-helper.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { User } from '../../users/entities/user.entity';
import { MailService } from '../../mail/services/mail.service';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
  tokenVersion: number;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtHelper: JwtHelperService,
    private readonly mailService: MailService,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) throw new ForbiddenException('Email already in use');

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) throw new ForbiddenException('Username already taken');

    const emailVerificationToken = uuidv4();
    const user = await this.usersService.create({ ...dto, emailVerificationToken });
    await this.mailService.sendVerificationEmail(user, emailVerificationToken);

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) throw new NotFoundException('Invalid or expired verification token');

    await this.usersService.markEmailVerified(user.id);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async login(
    dto: LoginDto,
  ): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new ForbiddenException('Please verify your email before logging in');
    }

    return this.generateAndStoreTokens(user);
  }

  async rotateRefreshToken(dto: RefreshTokenDto): Promise<AuthTokens> {
    const { refreshToken } = dto;
    let payload: JwtPayload;

    try {
      payload = this.jwtHelper.verifyRefresh(refreshToken) as JwtPayload;
    } catch {
      throw new ForbiddenException('Invalid or expired refresh token');
    }

    const { sub: userId } = payload;

    const dbToken = await this.refreshRepo.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!dbToken) {
      throw new ForbiddenException('Refresh token not found');
    }

    if (dbToken.expiresAt < new Date()) {
      await this.refreshRepo.delete({ userId });
      throw new ForbiddenException('Refresh token expired');
    }

    const valid = await bcrypt.compare(refreshToken, dbToken.token);
    if (!valid) {
      await this.refreshRepo.delete({ userId });
      throw new ForbiddenException('Invalid refresh token');
    }

    await this.refreshRepo.delete({ userId });
    const user = dbToken.user;
    const result = await this.generateAndStoreTokens(user);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user: _user, ...tokens } = result;
    return tokens;
  }

  async logout(userId: number): Promise<{ message: string }> {
    await this.refreshRepo.delete({ userId });
    return { message: 'Logged out successfully' };
  }

  private async generateAndStoreTokens(
    user: User,
  ): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion,
    };

    const access_token = this.jwtHelper.signAccess(jwtPayload);
    const refresh_token = this.jwtHelper.signRefresh(jwtPayload);

    // One session per user — delete existing refresh tokens before storing the new one
    await this.refreshRepo.delete({ userId: user.id });

    const hashedToken = await bcrypt.hash(refresh_token, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const record = this.refreshRepo.create({
      token: hashedToken,
      userId: user.id,
      expiresAt,
    });
    await this.refreshRepo.save(record);

    return { user, access_token, refresh_token };
  }
}
