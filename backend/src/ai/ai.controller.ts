import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiService } from './ai.service';
import { AiQueryDto } from './dto/ai-query.dto';

type AuthenticatedRequest = (ExpressRequest | FastifyRequest) & { user: { id: string; email: string } };

@ApiTags('ai')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('query')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Query AI assistant for event-related questions' })
  @ApiResponse({ status: 200, description: 'Assistant answer with optional tool call details' })
  async query(@Body() dto: AiQueryDto, @Request() req: AuthenticatedRequest) {
    return this.aiService.query(req.user.id, dto);
  }
}
