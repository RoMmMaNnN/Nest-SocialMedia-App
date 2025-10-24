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
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { UserRole } from '../entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@Query() query: { page?: number; limit?: number; search?: string }) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: number, @Request() req) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== Number(id)) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateUserDto,
    @Request() req,
  ) {
    if (req.user.role !== UserRole.ADMIN && req.user.id !== Number(id)) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: number) {
    return this.usersService.remove(id);
  }
}
