import {
  Controller,
  Get,
  Post as HttpPost,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
  UseInterceptors,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { PostsService } from '../services/posts.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { QueryPostsDto } from '../dto/query-posts.dto';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @ApiOperation({ summary: 'Get all published posts (paginated, filterable, feed-aware)' })
  @ApiResponse({ status: 200, description: 'Returns paginated posts.' })
  @Public()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000)
  @Get()
  findAll(@Query() query: QueryPostsDto, @Request() req: { user?: { id: number } }) {
    return this.postsService.findAll(query, req.user?.id);
  }

  @ApiOperation({ summary: 'Get a single post by ID' })
  @ApiResponse({ status: 200, description: 'Post found.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  @Public()
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req: { user?: { id: number } }) {
    return this.postsService.findOne(id, req.user?.id);
  }

  @ApiOperation({ summary: 'Create a new post (authenticated)' })
  @ApiResponse({ status: 201, description: 'Post created.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @HttpPost()
  create(@Body() dto: CreatePostDto, @CurrentUser() user: { id: number }) {
    return this.postsService.create(dto, user.id);
  }

  @ApiOperation({ summary: 'Update your own post (authenticated)' })
  @ApiResponse({ status: 200, description: 'Post updated.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: { id: number },
  ) {
    return this.postsService.update(id, dto, user.id);
  }

  @ApiOperation({ summary: 'Delete a post (owner or admin)' })
  @ApiResponse({ status: 200, description: 'Post deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number; role: string },
  ) {
    return this.postsService.remove(id, user.id, user.role);
  }
}

