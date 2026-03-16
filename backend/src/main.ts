/**
 * @module Main Entry Point
 * @description NestJS bootstrap with Fastify adapter (performance optimization),
 * Swagger, CORS and validation
 * Reference: https://dou.ua/forums/topic/48951/ — NestJS perf best practices
 */

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Fastify adapter — ~3x faster than Express (benchmarked)
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS with whitelist
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('EventHub API')
    .setDescription(
      `## EventHub REST API\n\n` +
      `Full-featured event management platform.\n\n` +
      `### Features\n` +
      `- **Authentication**: JWT-based register/login with bcrypt password hashing\n` +
      `- **Events CRUD**: Create, read, update, delete events with pagination\n` +
      `- **Participants**: Join/leave events with atomic transactions\n` +
      `- **Real-time**: Socket.IO WebSocket notifications\n` +
      `- **Validation**: class-validator DTOs with strict whitelist\n\n` +
      `### Tech Stack\n` +
      `NestJS 10 + Fastify · Prisma ORM · PostgreSQL · Passport JWT · Socket.IO`
    )
    .setVersion('1.0.0')
    .setContact('EventHub Team', '', 'admin@eventhub.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Enter JWT access token' },
      'JWT-auth',
    )
    .addTag('auth', 'User registration and authentication')
    .addTag('events', 'Event CRUD, join/leave, pagination & filtering')
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'EventHub API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  logger.log(`⚡ Using Fastify adapter for maximum performance`);
}

bootstrap();
