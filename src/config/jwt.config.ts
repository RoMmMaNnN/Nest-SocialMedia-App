import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const expiresInRaw = process.env.JWT_EXPIRES_IN ?? '1d';
  const expiresIn = /^\d+$/.test(expiresInRaw)
    ? parseInt(expiresInRaw, 10)
    : expiresInRaw;

  return {
    secret: process.env.JWT_SECRET ?? 'super_secret_jwt_key',
    expiresIn,
  };
});
