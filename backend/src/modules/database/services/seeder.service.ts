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
      const username = faker.internet.username().replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
      const dto = {
        email: faker.internet.email(),
        username: `${username}${i}`,
        password: '12345678',
        role: i === 0 ? UserRole.ADMIN : UserRole.USER,
        emailVerificationToken: undefined,
        isEmailVerified: true,
      };
      try {
        const user = await this.usersService.create(dto);
        // Mark email verified for seed users
        await this.usersService.markEmailVerified(user.id);
        users.push(user);
      } catch {
        // Skip on conflict
      }
    }
    return users;
  }

  async seedPosts(users: User[], count = 20) {
    for (let i = 0; i < count; i++) {
      const user = faker.helpers.arrayElement(users);
      if (!user) continue;
      await this.postsService.create(
        {
          title: faker.lorem.sentence(),
          content: faker.lorem.paragraph(),
          published: true,
        },
        user.id,
      );
    }
  }

  async run() {
    const users = await this.seedUsers(10);
    if (users.length > 0) {
      await this.seedPosts(users, 30);
    }
    console.log('🎉 Seeding completed!');
  }
}
