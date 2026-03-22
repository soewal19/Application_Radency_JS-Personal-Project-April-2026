/**
 * @module PrismaService
 * @description Prisma client lifecycle management
 * Best practice: graceful shutdown, connection logging
 */

import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    this.logger.log('Connecting to PostgreSQL via Prisma...');
    
    // Retry connection logic for cloud environments (Render, etc.)
    // Using exponential backoff for better reliability
    const maxRetries = 10;
    let retryDelay = 2000; // Start with 2 seconds
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected successfully');
        return;
      } catch (error) {
        this.logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
        if (attempt < maxRetries) {
          this.logger.log(`Retrying in ${retryDelay / 1000} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          // Exponential backoff: double the delay each time, max 30 seconds
          retryDelay = Math.min(retryDelay * 2, 30000);
        }
      }
    }
    
    // If all retries fail, throw
    this.logger.error('All database connection attempts failed');
    throw new Error('Failed to connect to database after multiple attempts');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
