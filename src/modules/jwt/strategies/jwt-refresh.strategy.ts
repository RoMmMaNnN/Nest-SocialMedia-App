import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refresh_token,
        (req: Request) => req?.body?.refresh_token,
      ]),
      secretOrKey:
        config.get<string>('JWT_REFRESH_SECRET') || 'fallback_secret',
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken =
      req?.cookies?.refresh_token || req?.body?.refresh_token;
    return { id: payload.sub, email: payload.email, refreshToken };
  }
}
