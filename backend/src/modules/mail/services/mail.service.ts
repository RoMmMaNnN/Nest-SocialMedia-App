import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

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
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

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
}
