import { Controller, Get, Post, Param, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LikesService } from '../services/likes.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('likes')
@ApiBearerAuth()
@Controller('posts/:postId/likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Public()
  @ApiOperation({ summary: 'Get likes for a post' })
  @Get()
  getLikes(@Param('postId', ParseIntPipe) postId: number) {
    return this.likesService.getLikes(postId);
  }

  @ApiOperation({ summary: 'Toggle like on a post' })
  @Post()
  toggle(
    @Param('postId', ParseIntPipe) postId: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.likesService.toggle(user.id, postId);
  }
}
