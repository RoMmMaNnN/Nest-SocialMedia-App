import {
  Controller,
  Post,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { UploadService } from '../services/upload.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: 'Upload avatar image' })
  @ApiConsumes('multipart/form-data')
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: number },
  ) {
    return this.uploadService.uploadAvatar(user.id, file);
  }

  @ApiOperation({ summary: 'Upload post image' })
  @ApiConsumes('multipart/form-data')
  @Post('post-image')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadPostImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: number },
  ) {
    return this.uploadService.uploadPostImage(user.id, file);
  }
}
