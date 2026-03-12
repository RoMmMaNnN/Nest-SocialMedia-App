import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST?.trim() || 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME?.trim() || 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  name: process.env.DB_NAME?.trim() || 'socialapp',
  synchronize: (process.env.DB_SYNC ?? 'true').trim() === 'true',
}));
