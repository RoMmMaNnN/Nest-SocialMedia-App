import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.getOrThrow<string>('DB_HOST').trim();
        const port = configService.getOrThrow<number>('DB_PORT');
        const username = configService.getOrThrow<string>('DB_USERNAME').trim();
        const password = configService.getOrThrow<string>('DB_PASSWORD');
        const database = configService.getOrThrow<string>('DB_NAME').trim();
        const synchronize = configService.get<string>('DB_SYNC', 'true').trim() === 'true';

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          autoLoadEntities: true,
          synchronize,
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
