import { Test, TestingModule } from '@nestjs/testing';
import { UsersModule } from '../../../../src/modules/users/users.module';
import { UsersService } from '../../../../src/modules/users/services/users.service';
import { UsersController } from '../../../../src/modules/users/controllers/users.controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../../../src/modules/users/entities/user.entity';
import { RefreshToken } from '../../../../src/modules/auth/entities/refresh-token.entity';
import { DataSource } from 'typeorm';
import { createMockRepository } from '../../../mocks/repository.mock';
import { createMockDataSource } from '../../../mocks/data-source.mock';

describe('UsersModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [UsersModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(createMockRepository())
      .overrideProvider(getRepositoryToken(RefreshToken))
      .useValue(createMockRepository())
      .overrideProvider(DataSource)
      .useValue(createMockDataSource())
      .compile();
  });

  it('should compile the module', () => {
    expect(module).toBeDefined();
  });

  it('should provide UsersService', () => {
    const service = module.get<UsersService>(UsersService);
    expect(service).toBeDefined();
  });

  it('should provide UsersController', () => {
    const controller = module.get<UsersController>(UsersController);
    expect(controller).toBeDefined();
  });
});
