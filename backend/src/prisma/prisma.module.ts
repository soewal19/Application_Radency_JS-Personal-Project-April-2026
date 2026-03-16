/**
 * @module PrismaModule
 * @description Global Prisma ORM module (replaces TypeORM)
 * Follows Singleton pattern for database connection
 */

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
