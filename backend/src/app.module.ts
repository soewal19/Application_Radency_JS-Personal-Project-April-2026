/**
 * @module AppModule
 * @description Root NestJS module — uses Prisma ORM (replaces TypeORM)
 * Follows best practice: Fastify adapter, global modules, config module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EventsModule } from './events/events.module';
import { AiModule } from './ai/ai.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: process.env.NODE_ENV === 'production', // Use env vars in production, not .env file
    }),
    PrismaModule,
    AuthModule,
    EventsModule,
    AiModule,
    HealthModule,
  ],
})
export class AppModule {}
