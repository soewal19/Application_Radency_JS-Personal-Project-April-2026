/**
 * @module Main Entry Point
 * @description NestJS bootstrap with Fastify adapter (performance optimization),
 * Swagger, CORS and validation
 * Reference: https://dou.ua/forums/topic/48951/ — NestJS perf best practices
 */

// CRITICAL: Ensure production DATABASE_URL from Render takes precedence
// This must happen BEFORE any other imports that might load .env
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  // The DATABASE_URL from Render should already be in env, but verify it's not localhost
  if (process.env.DATABASE_URL.includes('localhost')) {
    console.error('FATAL: Production mode using localhost DATABASE_URL!');
    process.exit(1);
  }
}

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
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8080,http://localhost:3000')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
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
      `- **AI Swarm**: Specialized agents for search, management, and analytics\n` +
      `- **Real-time**: Socket.IO WebSocket notifications\n` +
      `- **Validation**: class-validator DTOs with strict whitelist\n\n` +
      `### Tech Stack\n` +
      `NestJS 10 + Fastify · Prisma ORM · SQLite/PostgreSQL · Passport JWT · Socket.IO`
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
    .addTag('ai', 'AI assistant (tool calling) for event discovery')
    .addTag('agents', 'Custom AI agent management and skill assignment')
    .addServer(`http://localhost:${process.env.PORT || 3000}`, 'Local Development')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
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
