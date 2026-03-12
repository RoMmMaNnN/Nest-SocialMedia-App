import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async uploadAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<{ avatarUrl: string }> {
    this.validateImageFile(file, 5 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp']);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${userId}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    // Remove old avatar file if it exists locally
    if (user.avatarUrl) {
      const oldPath = path.join(process.cwd(), user.avatarUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarUrl = `/uploads/avatars/${filename}`;
    await this.userRepo.update(userId, { avatarUrl });
    return { avatarUrl };
  }

  async uploadPostImage(
    _userId: number,
    file: Express.Multer.File,
  ): Promise<{ imageUrl: string }> {
    this.validateImageFile(file, 10 * 1024 * 1024, [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
    ]);

    const uploadsDir = path.join(process.cwd(), 'uploads', 'posts');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `${_userId}-${Date.now()}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    return { imageUrl: `/uploads/posts/${filename}` };
  }

  private validateImageFile(
    file: Express.Multer.File,
    maxSizeBytes: number,
    allowedMimeTypes: string[],
  ): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`,
      );
    }
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Max size: ${maxSizeBytes / (1024 * 1024)}MB`,
      );
    }
  }
}
