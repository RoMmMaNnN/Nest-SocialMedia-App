import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtHelperService {
  constructor(
    private readonly jwt: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  signAccess(payload: any) {
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: '15m',
    });
  }

  signRefresh(payload: any) {
    return this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  verifyAccess(token: string) {
    return this.jwt.verify(token, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
    });
  }

  verifyRefresh(token: string) {
    return this.jwt.verify(token, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
    });
  }
}
