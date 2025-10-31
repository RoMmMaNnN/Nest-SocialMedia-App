import { Injectable } from '@nestjs/common';
import { UsersService } from '../../users/services/users.service';
import { PostsService } from '../../posts/services/posts.service';
import { User, UserRole } from '../../users/entities/user.entity';
import { faker } from '@faker-js/faker';

@Injectable()
export class SeederService {
  constructor(
    private readonly usersService: UsersService,
    private readonly postsService: PostsService,
  ) {}

  async seedUsers(count = 10): Promise<User[]> {
    const users: User[] = [];
    for (let i = 0; i < count; i++) {
      const dto = {
        email: faker.internet.email(),
        name: faker.person.fullName(),
        password: '12345678',
        role:
          i === 0
            ? UserRole.ADMIN
            : i === 1
              ? UserRole.MODERATOR
              : UserRole.USER,
      };
      users.push(await this.usersService.create(dto));
    }
    return users;
  }

  async seedPosts(users: User[], count = 20) {
    for (let i = 0; i < count; i++) {
      const user = faker.helpers.arrayElement(users);
      await this.postsService.create(
        {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
        },
        user.id,
      );
    }
  }

  async run() {
    const users = await this.seedUsers(10);
    await this.seedPosts(users, 30);
    console.log('🎉 Seeding completed!');
  }
}
