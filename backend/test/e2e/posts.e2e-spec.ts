import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

/**
 * Posts E2E Tests
 */
describe('Posts (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let userToken: string;
  let createdPostId: number;
  let adminPostId: number;

  const adminCredentials = {
    username: 'posts-admin',
    email: `posts-admin-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  };

  const userCredentials = {
    username: 'posts-user',
    email: `posts-user-${Date.now()}@test.com`,
    password: 'Password123!',
  };

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
      }),
    );

    await app.init();

    const adminReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(adminCredentials);
    adminToken = adminReg.body.data?.access_token;

    const userReg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(userCredentials);
    userToken = userReg.body.data?.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/posts', () => {
    it('should be public and return paginated structure', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/posts')
        .expect(200);

      expect(res.body.success).toBe(true);
      const payload = res.body.data;
      expect(payload).toHaveProperty('data');
      expect(payload).toHaveProperty('total');
      expect(payload).toHaveProperty('page');
      expect(payload).toHaveProperty('limit');
      expect(Array.isArray(payload.data)).toBe(true);
    });

    it('should respect page and limit query params', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/posts?page=1&limit=5')
        .expect(200);

      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(5);
      expect(res.body.data.data.length).toBeLessThanOrEqual(5);
    });

    it('should filter by authorId', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/posts?authorId=9999')
        .expect(200);

      expect(res.body.data.total).toBe(0);
      expect(res.body.data.data).toHaveLength(0);
    });
  });

  describe('POST /api/posts', () => {
    it('should create a post when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'E2E Test Post', content: 'This post was created in a test.' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.title).toBe('E2E Test Post');
      createdPostId = res.body.data.id;
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/posts')
        .send({ title: 'Unauthorized Post', content: 'Should fail.' })
        .expect(401);
    });

    it('should return 400 on missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: '' })
        .expect(400);

      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should allow admin to delete  post', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Post to Delete', content: 'Will be deleted.' });

      const postId: number = createRes.body.data?.id;

      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.message).toMatch(/deleted/i);
    });

    it('should return 403 when a regular user tries to delete another user\'s post', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Admin Post', content: 'Only admin can delete this.' });

      adminPostId = createRes.body.data?.id;

      const res = await request(app.getHttpServer())
        .delete(`/api/posts/${adminPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(res.body.statusCode).toBe(403);
    });

    it('should return 401 when unauthenticated', async () => {
      await request(app.getHttpServer())
        .delete(`/api/posts/${createdPostId}`)
        .expect(401);
    });

    it('should return 404 for a non-existent post', async () => {
      await request(app.getHttpServer())
        .delete('/api/posts/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
