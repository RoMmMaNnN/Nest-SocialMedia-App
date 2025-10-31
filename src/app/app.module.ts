import { Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { DatabaseModule } from '../modules/database/database.module';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { PostsModule } from '../modules/posts/posts.module';
import { AppController } from './controllers/app.controller';
import { AppService } from './services/app.service';
import { SeederService } from '../modules/database/services/seeder.service';

@Module({
  imports: [ConfigModule, DatabaseModule, UsersModule, AuthModule, PostsModule],
  controllers: [AppController],
  providers: [AppService, SeederService],
})
export class AppModule {}
