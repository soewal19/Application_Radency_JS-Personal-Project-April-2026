/**
 * @module Events Controller
 * @description REST API for event management with enhanced Swagger docs
 */

import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY, Public } from '../auth/auth.constants';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';

type AuthenticatedRequest = (ExpressRequest | FastifyRequest) & { user: { id: string; email: string } };

@ApiTags('events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated list of events', description: 'Returns events with pagination, search and category filters' })
  @ApiResponse({ status: 200, description: 'Paginated events list with metadata (total, page, totalPages)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 6 })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, enum: ['conference', 'workshop', 'meetup', 'webinar', 'social', 'sport'] })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['date', 'title', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  async findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get events created by current user' })
  @ApiResponse({ status: 200, description: 'User\'s events list' })
  async findMy(@Request() req: AuthenticatedRequest, @Query() query: QueryEventsDto) {
    return this.eventsService.findByUser(req.user.id, query);
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all available tags with colors' })
  @ApiResponse({ status: 200, description: 'Tags list' })
  async getTags() {
    return this.eventsService.getTags();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new event', description: 'Creates event with current user as organizer' })
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateEventDto, @Request() req: AuthenticatedRequest) {
    return this.eventsService.create(dto, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an event', description: 'Only the organizer can update their event' })
  @ApiParam({ name: 'id', type: String, description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto, @Request() req: AuthenticatedRequest) {
    return this.eventsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event', description: 'Only the organizer can delete their event' })
  @ApiParam({ name: 'id', type: String, description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Event deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the organizer' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.remove(id, req.user.id);
  }

  @Post(':id/join')
  @ApiOperation({ summary: 'Join an event', description: 'Registers current user as participant (atomic transaction)' })
  @ApiParam({ name: 'id', type: String, description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Successfully joined' })
  @ApiResponse({ status: 400, description: 'Already a participant or no spots available' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async join(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.join(id, req.user.id);
  }

  @Post(':id/leave')
  @ApiOperation({ summary: 'Leave an event', description: 'Removes current user from participants (atomic transaction)' })
  @ApiParam({ name: 'id', type: String, description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'Successfully left' })
  @ApiResponse({ status: 400, description: 'Not a participant' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  async leave(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.eventsService.leave(id, req.user.id);
  }

  @Post(':id/register-someone')
  @ApiOperation({ summary: 'Register someone else (Organizer only)', description: 'Allows organizer to register any user by email' })
  @ApiParam({ name: 'id', type: String, description: 'Event UUID' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden — not the organizer' })
  @ApiResponse({ status: 404, description: 'Event or User not found' })
  async registerSomeone(
    @Param('id') id: string,
    @Body('email') email: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.eventsService.registerSomeone(id, req.user.id, email);
  }
}
