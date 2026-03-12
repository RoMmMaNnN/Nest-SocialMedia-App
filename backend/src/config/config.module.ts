import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import appConfig from './app.config';
import databaseConfig from './database.config';
import jwtConfig from './jwt.config';
import redisConfig from './redis.config';
import mailConfig from './mail.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, mailConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        APP_PORT: Joi.number().default(3000),

        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().default('postgres'),
        DB_NAME: Joi.string().default('socialapp'),
        DB_SYNC: Joi.string().valid('true', 'false').default('true'),

        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        JWT_ACCESS_EXPIRES: Joi.string().default('15m'),
        JWT_REFRESH_EXPIRES: Joi.string().default('7d'),

        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),

        MAIL_HOST: Joi.string().default('smtp.mailtrap.io'),
        MAIL_PORT: Joi.number().default(2525),
        MAIL_USER: Joi.string().allow('').default(''),
        MAIL_PASS: Joi.string().allow('').default(''),

        FRONTEND_URL: Joi.string().default('http://localhost:3001'),
        CORS_ORIGIN: Joi.string().default('http://localhost:3001'),
      }),
      validationOptions: { allowUnknown: true },
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
