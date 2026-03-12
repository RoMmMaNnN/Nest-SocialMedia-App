import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './entities/follow.entity';
import { FollowsService } from './services/follows.service';
import { FollowsController } from './controllers/follows.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Follow])],
  providers: [FollowsService],
  controllers: [FollowsController],
  exports: [FollowsService],
})
export class FollowsModule {}
