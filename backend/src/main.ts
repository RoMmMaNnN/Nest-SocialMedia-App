import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app/app.module';
import cookieParser from 'cookie-parser';
import { SeederService } from './modules/database/services/seeder.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');

  // Serve uploaded files
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads' });

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
    new LoggingInterceptor(),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('SocialApp API')
    .setDescription(
      'Production-style Social Media REST API: users, posts, comments, likes, follows, file upload, email verification.',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication & email verification')
    .addTag('users', 'User profiles & management')
    .addTag('posts', 'Posts & social feed')
    .addTag('comments', 'Post comments')
    .addTag('likes', 'Post likes (toggle)')
    .addTag('follows', 'User follows (toggle)')
    .addTag('upload', 'File uploads (avatar, post image)')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.APP_PORT ?? 3000;
  await app.listen(port);

  if (process.env.NODE_ENV === 'development') {
    const seeder = app.get(SeederService);
    await seeder.run();
  }
}
bootstrap();
