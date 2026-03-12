import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';
import { UsersService } from '../../src/modules/users/services/users.service';

/**
 * Auth E2E Tests
 *
 * Prerequisites: running PostgreSQL + Redis instances configured via .env.test
 * or environment variables.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let usersService: UsersService;

  const regularUser = {
    username: `e2e-user-${Date.now()}`,
    email: `e2e-user-${Date.now()}@test.com`,
    password: 'Password123!',
  };

  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalFilters(new GlobalExceptionFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    usersService = app.get(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return a message (email verification pending)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(regularUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message');
      expect(res.body.data.message).toMatch(/verify your email/i);
    });

    it('should reject duplicate email with 409', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(regularUser)
        .expect(409);

      expect(res.body.statusCode).toBe(409);
    });

    it('should return 400 on invalid email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'baduser', email: 'not-an-email', password: 'pass123' })
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeAll(async () => {
      // Bypass email verification for e2e login tests
      const user = await usersService.findByEmail(regularUser.email);
      if (user) {
        await usersService.markEmailVerified(user.id);
      }
    });

    it('should login and return access + refresh tokens after email verification', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: regularUser.email, password: regularUser.password })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data).toHaveProperty('refresh_token');
      expect(res.body.data.user).toMatchObject({ email: regularUser.email });

      accessToken = res.body.data.access_token;
      refreshToken = res.body.data.refresh_token;
    });

    it('should return 403 if email is not verified', async () => {
      const unverifiedUser = {
        username: `unverified-${Date.now()}`,
        email: `unverified-${Date.now()}@test.com`,
        password: 'Password123!',
      };
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(unverifiedUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: unverifiedUser.email, password: unverifiedUser.password })
        .expect(403);

      expect(res.body.statusCode).toBe(403);
      expect(res.body.message).toMatch(/verify your email/i);
    });

    it('should return 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: regularUser.email, password: 'wrong_password' })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });

    it('should return 401 on unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'whatever' })
        .expect(401);

      expect(res.body.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({ email: regularUser.email });
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should rotate tokens with valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('access_token');
      expect(res.body.data).toHaveProperty('refresh_token');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout with a valid JWT', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: regularUser.email, password: regularUser.password });

      const token: string = loginRes.body.data.access_token;

      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 401 without Authorization header', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });
  });
});
