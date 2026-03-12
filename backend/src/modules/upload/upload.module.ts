import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { UploadService } from './services/upload.service';
import { UploadController } from './controllers/upload.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UploadService],
  controllers: [UploadController],
})
export class UploadModule {}
