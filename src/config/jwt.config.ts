import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'super_secret_jwt_key',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
}));
