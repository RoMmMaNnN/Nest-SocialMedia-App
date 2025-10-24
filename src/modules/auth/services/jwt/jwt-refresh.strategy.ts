import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'),
      secretOrKey:
        config.get<string>('JWT_REFRESH_SECRET') || 'fallback_secret',
      passReqToCallback: true,
    });
  }

  async validate(req, payload: any) {
    const refreshToken = req.body.refresh_token;
    return { ...payload, refreshToken };
  }
}
