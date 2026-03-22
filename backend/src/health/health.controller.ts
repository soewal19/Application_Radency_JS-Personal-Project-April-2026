import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Check API and Database health status' })
  async check() {
    try {
      // Simple query to check DB connection
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('env')
  @ApiOperation({ summary: 'Debug endpoint - check environment variables' })
  getEnv() {
    const dbUrl = process.env.DATABASE_URL || 'NOT_SET';
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':****@');
    
    return {
      NODE_ENV: process.env.NODE_ENV || 'NOT_SET',
      DATABASE_URL: maskedUrl,
      PORT: process.env.PORT || 'NOT_SET',
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'NOT_SET',
    };
  }
}
