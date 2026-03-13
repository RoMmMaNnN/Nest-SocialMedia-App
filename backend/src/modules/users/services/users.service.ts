import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, FindOptionsWhere, ILike } from 'typeorm';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findAll(query?: { page?: number; limit?: number; search?: string }): Promise<{
    data: User[];
    meta: { total: number; page: number; lastPage: number };
  }> {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User>[] = query?.search
      ? [
          { username: ILike(`%${query.search}%`) },
          { email: ILike(`%${query.search}%`) },
        ]
      : [];

    const [data, total] = await this.userRepo.findAndCount({
      where,
      skip,
      take: limit,
      order: { id: 'ASC' },
    });

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['refreshTokens'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOneBy({ email });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepo.findOneBy({ username });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepo.findOneBy({ emailVerificationToken: token });
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    return this.userRepo.findOneBy({ resetPasswordToken: token });
  }

  async setPasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void> {
    await this.userRepo.update(userId, {
      resetPasswordToken: token,
      resetPasswordExpiresAt: expiresAt,
    });
    await this.cacheManager.clear();
  }

  async clearPasswordResetToken(userId: number): Promise<void> {
    await this.userRepo.update(userId, {
      resetPasswordToken: null,
      resetPasswordExpiresAt: null,
    });
    await this.cacheManager.clear();
  }

  async updatePasswordHash(userId: number, passwordHash: string): Promise<void> {
    await this.userRepo.update(userId, { password: passwordHash });
    await this.cacheManager.clear();
  }

  async markEmailVerified(userId: number): Promise<void> {
    await this.userRepo.update(userId, {
      isEmailVerified: true,
      emailVerificationToken: null,
    });
    await this.cacheManager.clear();
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepo.findOne({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    const exists = await this.userRepo.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('Email already exists');

    const usernameExists = await this.userRepo.findOneBy({ username: dto.username });
    if (usernameExists) throw new ConflictException('Username already taken');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      role: dto.role || UserRole.USER,
      isEmailVerified: false,
    });

    const saved = await this.userRepo.save(user);
    await this.cacheManager.clear();
    return saved;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, dto);
    const updated = await this.userRepo.save(user);
    await this.cacheManager.clear();
    return updated;
  }

  async remove(id: number): Promise<{ message: string }> {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    await this.cacheManager.clear();
    return { message: `User with id ${id} deleted successfully` };
  }

  async incrementTokenVersion(userId: number): Promise<void> {
    await this.userRepo.increment({ id: userId }, 'tokenVersion', 1);
  }

  async removeUserAndSessions(userId: number): Promise<{ message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager.increment(User, { id: userId }, 'tokenVersion', 1);
      await queryRunner.manager.delete(RefreshToken, { user: { id: userId } });
      await queryRunner.manager.delete(User, { id: userId });
      await queryRunner.commitTransaction();
      await this.cacheManager.clear();
      return { message: `User ${userId} deleted and all sessions revoked.` };
    } catch {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to remove user and sessions');
    } finally {
      await queryRunner.release();
    }
  }
}
