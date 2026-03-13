import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from '../services/comments.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { UpdateCommentDto } from '../dto/update-comment.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('comments')
@ApiBearerAuth()
@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Public()
  @ApiOperation({ summary: 'Get comments for a post' })
  @Get()
  findAll(
    @Param('postId', ParseIntPipe) postId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.commentsService.findByPost(postId, Number(page), Number(limit));
  }

  @ApiOperation({ summary: 'Create a comment on a post' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('postId', ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.commentsService.create(postId, user.id, dto);
  }

  @ApiOperation({ summary: 'Update a comment' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.commentsService.update(id, user.id, user.role, dto);
  }

  @ApiOperation({ summary: 'Delete a comment' })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.commentsService.remove(id, user.id, user.role);
  }
}
