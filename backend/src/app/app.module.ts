import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import KeyvRedis from '@keyv/redis';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../modules/database/database.module';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { PostsModule } from '../modules/posts/posts.module';
import { CommentsModule } from '../modules/comments/comments.module';
import { LikesModule } from '../modules/likes/likes.module';
import { FollowsModule } from '../modules/follows/follows.module';
import { UploadModule } from '../modules/upload/upload.module';
import { MailModule } from '../modules/mail/mail.module';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { SeederService } from '../modules/database/services/seeder.service';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    UsersModule,
    AuthModule,
    PostsModule,
    CommentsModule,
    LikesModule,
    FollowsModule,
    UploadModule,
    MailModule,
    ThrottlerModule.forRoot([
      {
        name: 'global',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        stores: [
          new Keyv({
            store: new KeyvRedis(config.get<string>('redis.url', 'redis://localhost:6379')),
            ttl: 60_000,
          }),
        ],
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    SeederService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
