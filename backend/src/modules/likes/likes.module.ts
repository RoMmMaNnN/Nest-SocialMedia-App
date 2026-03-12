import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './entities/like.entity';
import { LikesService } from './services/likes.service';
import { LikesController } from './controllers/likes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Like])],
  providers: [LikesService],
  controllers: [LikesController],
  exports: [LikesService],
})
export class LikesModule {}
