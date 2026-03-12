import { Controller, Get, Post, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FollowsService } from '../services/follows.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('follows')
@ApiBearerAuth()
@Controller('users/:id')
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @ApiOperation({ summary: 'Follow or unfollow a user (toggle)' })
  @Post('follow')
  toggle(
    @Param('id', ParseIntPipe) followingId: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.followsService.toggle(user.id, followingId);
  }

  @Public()
  @ApiOperation({ summary: 'Get followers of a user' })
  @Get('followers')
  getFollowers(
    @Param('id', ParseIntPipe) userId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.followsService.getFollowers(userId, Number(page), Number(limit));
  }

  @Public()
  @ApiOperation({ summary: 'Get users a user is following' })
  @Get('following')
  getFollowing(
    @Param('id', ParseIntPipe) userId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.followsService.getFollowing(userId, Number(page), Number(limit));
  }
}
