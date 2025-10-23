import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepo: Repository<UserEntity>,
  ) {}

  findAll() {
    return this.usersRepo.find();
  }

  async create(data: CreateUserDto) {
    const user = this.usersRepo.create(data);
    return await this.usersRepo.save(user);
  }
}
