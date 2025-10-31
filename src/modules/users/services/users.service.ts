import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, FindOptionsWhere, ILike } from 'typeorm';
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
  ) {}

  // ===========================
  // 🔍 FIND METHODS
  // ===========================
  async findAll(query?: { page?: number; limit?: number; search?: string }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<User>[] = query?.search
      ? [
          { name: ILike(`%${query.search}%`) },
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

  async findOne(id: number) {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async findById(id: number) {
    return this.userRepo.findOne({ where: { id } });
  }

  // ===========================
  // 🧩 CREATE / UPDATE / DELETE
  // ===========================
  async create(dto: CreateUserDto) {
    const exists = await this.userRepo.findOneBy({ email: dto.email });
    if (exists) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepo.create({
      ...dto,
      password: hashedPassword,
      role: dto.role || UserRole.USER,
    });

    return this.userRepo.save(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    const user = await this.findOne(id);
    if (dto.password) {
      dto.password = await bcrypt.hash(dto.password, 10);
    }
    Object.assign(user, dto);
    return this.userRepo.save(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);
    await this.userRepo.remove(user);
    return { message: `User with id ${id} deleted successfully` };
  }

  // ===========================
  // 🔑 SECURITY UTILITIES
  // ===========================
  async incrementTokenVersion(userId: number) {
    await this.userRepo.increment({ id: userId }, 'tokenVersion', 1);
  }

  async removeUserAndSessions(userId: number) {
    return await this.dataSource.transaction(async (manager) => {
      // 1️⃣ Інкрементуємо tokenVersion — всі старі access токени стають невалідними
      await manager.increment(User, { id: userId }, 'tokenVersion', 1);

      // 2️⃣ Видаляємо refresh токени
      await manager.delete(RefreshToken, { user: { id: userId } });

      // 3️⃣ Видаляємо користувача
      await manager.delete(User, { id: userId });

      return { message: `User ${userId} deleted and all sessions revoked.` };
    });
  }
}
