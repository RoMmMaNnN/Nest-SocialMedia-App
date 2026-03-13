import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { randomUUID, createHash } from 'crypto';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/services/users.service';
import { JwtHelperService } from '../../jwt/services/jwt-helper.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
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

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('This username is already taken');
    }

    const emailVerificationToken = randomUUID();
    const user = await this.usersService.create({ ...dto, emailVerificationToken });
    const usersServiceWithOptionalUpdate = this.usersService as UsersService & {
      update?: (id: number, dto: { isEmailVerified: boolean }) => Promise<unknown>;
    };

    if (typeof usersServiceWithOptionalUpdate.update === 'function') {
      await usersServiceWithOptionalUpdate.update(user.id, { isEmailVerified: true });
    } else {
      await this.usersService.markEmailVerified(user.id);
    }

    try {
      await this.mailService.sendVerificationEmail(user, emailVerificationToken);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.warn('Failed to send verification email:', message);
    }

    return { message: 'Registration successful. Please check your email to verify your account.' };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByVerificationToken(token);
    if (!user) throw new NotFoundException('Invalid or expired verification token');

    await this.usersService.markEmailVerified(user.id);
    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      return { message: 'If this email exists, a reset link has been sent' };
    }

    const resetToken = randomUUID();
    const hashedResetToken = this.hashResetToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.setPasswordResetToken(user.id, hashedResetToken, expiresAt);
    await this.mailService.sendPasswordResetEmail(user, resetToken);

    return { message: 'If this email exists, a reset link has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashedToken = this.hashResetToken(token);
    const user = await this.usersService.findByResetPasswordToken(hashedToken);

    if (!user || !user.resetPasswordToken || !user.resetPasswordExpiresAt || user.resetPasswordExpiresAt < new Date()) {
      throw new BadRequestException('Reset token is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePasswordHash(user.id, passwordHash);
    await this.usersService.clearPasswordResetToken(user.id);
    await this.refreshRepo.delete({ userId: user.id });

    return { message: 'Password reset successfully' };
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<{ message: string }> {
    const { currentPassword, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (newPassword === currentPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid user');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePasswordHash(user.id, passwordHash);
    await this.refreshRepo.delete({ userId: user.id });

    return { message: 'Password changed successfully' };
  }

  async login(dto: LoginDto): Promise<{ user: User; access_token: string; refresh_token: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Incorrect email or password');

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) throw new UnauthorizedException('Incorrect email or password');

    if (!user.isEmailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in. Check your inbox.',
      );
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

  private hashResetToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
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
