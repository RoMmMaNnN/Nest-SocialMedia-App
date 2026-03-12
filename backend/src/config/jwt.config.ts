import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'access_secret_change_me',
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret_change_me',
  accessExpires: process.env.JWT_ACCESS_EXPIRES ?? '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES ?? '7d',
}));
