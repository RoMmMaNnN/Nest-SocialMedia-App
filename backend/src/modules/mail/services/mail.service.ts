import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../../users/entities/user.entity';

export interface VerificationEmailData {
  id: number;
  email: string;
  username: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  async sendVerificationEmail(
    user: VerificationEmailData,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.getFrontendUrl()}/verify-email?token=${token}`;

    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[MAIL] Verification email for ${user.email}`);
      this.logger.log(`[MAIL] Verification URL: ${verificationUrl}`);
      return;
    }

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Verify your SocialApp email',
      template: 'verify-email',
      context: {
        username: user.username,
        verificationUrl,
      },
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    const resetUrl = `${this.getFrontendUrl()}/reset-password?token=${token}`;

    if (process.env.NODE_ENV === 'development') {
      this.logger.log(`[MAIL] Password reset email for ${user.email}`);
      this.logger.log(`[MAIL] Password reset URL: ${resetUrl}`);
      return;
    }

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Reset your SocialApp password',
      template: 'reset-password',
      context: {
        username: user.displayName ?? user.username,
        resetUrl,
      },
    });
  }

  private getFrontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:3001';
  }
}
