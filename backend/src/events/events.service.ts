/**
 * @module Events Service
 * @description Business logic for event management using Prisma ORM
 * Best practices: structured logging, transactional joins/leaves, pagination
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { QueryEventsDto } from './dto/query-events.dto';
import { EventsGateway } from './events.gateway';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(query: QueryEventsDto) {
    const { page = 1, limit = 6, search, category, sortBy = 'createdAt', sortOrder = 'DESC', tags } = query;

    const where: Prisma.EventWhereInput = {};
    if (search) where.title = { contains: search };
    if (category) where.category = category;

    if (tags) {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean).map(t => t.toLowerCase());
      if (tagList.length > 0) {
        where.tags = {
          some: {
            normalized: { in: tagList },
          },
        } as any;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        include: { tags: true },
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    const normalized = data.map(event => ({
      ...event,
      tags: event.tags?.map(tag => tag.name) ?? [],
    }));

    this.logger.debug(`findAll: page=${page}, total=${total}`);
    return { data: normalized, total, page, limit, totalPages: Math.ceil(total / limit) };

    this.logger.debug(`findAll: page=${page}, total=${total}`);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Search events by flexible criteria (city/location, date range, category).
   * This method is intended for AI tools (function calling) to avoid exposing raw SQL.
   */
  async searchEvents(options: {
    city?: string;
    dateFrom?: Date;
    dateTo?: Date;
    category?: string;
    limit?: number;
  }) {
    const where: Prisma.EventWhereInput = {};

    if (options.city) {
      where.location = { contains: options.city };
    }
    if (options.category) {
      where.category = options.category;
    }

    if (options.dateFrom || options.dateTo) {
      where.date = {};
      if (options.dateFrom) where.date.gte = options.dateFrom;
      if (options.dateTo) where.date.lte = options.dateTo;
    }

    const limit = Math.min(Math.max(options.limit ?? 5, 1), 25);

    const events = await this.prisma.event.findMany({
      where,
      orderBy: { date: 'asc' },
      take: limit,
    });

    return events;
  }

  async findByUser(userId: string, query: QueryEventsDto) {
    const { page = 1, limit = 15 } = query;

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { organizerId: userId },
        include: { tags: true },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where: { organizerId: userId } }),
    ]);

    const normalized = data.map(event => ({
      ...event,
      tags: event.tags?.map(tag => tag.name) ?? [],
    }));

    return { data: normalized, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id }, include: { tags: true } });
    if (!event) throw new NotFoundException('Event not found');
    return { ...event, tags: event.tags?.map(tag => tag.name) ?? [] };
  }

  async create(dto: CreateEventDto, userId: string) {
    this.logger.debug(`Creating event for user ${userId}: ${dto.title}`);
    const { tags: dtoTags, creatorType, ...rest } = dto as any;

    // Fetch user to get the organizer name
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      this.logger.error(`Create event failed: User ${userId} not found`);
      throw new Error('User not found');
    }

    const tags = (dtoTags || []).slice(0, 5).map((tag: string) => tag.trim()).filter(Boolean);
    
    // Requirement 3: Add "ai-generated" tag for AI-created events
    if (creatorType === 'ai' && !tags.some((t: string) => t.toLowerCase() === 'ai-generated')) {
      if (tags.length < 5) {
        tags.push('ai-generated');
      }
    }

    const connectOrCreate = tags.map((tag: string) => ({
      where: { normalized: tag.toLowerCase() },
      create: { name: tag, normalized: tag.toLowerCase() },
    }));

    // Ensure date is a valid Date object
    const eventDate = new Date(rest.date);
    if (isNaN(eventDate.getTime())) {
      this.logger.error(`Create event failed: Invalid date format ${rest.date}`);
      throw new BadRequestException('Invalid date format');
    }

    try {
      const event = await this.prisma.event.create({
        data: {
          title: rest.title,
          description: rest.description,
          location: rest.location,
          category: rest.category,
          maxParticipants: Number(rest.maxParticipants) || 50,
          date: eventDate,
          organizerId: userId,
          organizerName: user.name,
          creatorType: creatorType || 'manual', // Requirement 4
          tags: connectOrCreate.length ? { connectOrCreate } : undefined,
        },
        include: { tags: true },
      });

      const result = { ...event, tags: event.tags?.map((t) => t.name) ?? [] };
      this.logger.log(`Event created successfully: ${event.title} (ID: ${event.id})`);
      
      // Requirement 1: Emit created event to notify all clients
      this.eventsGateway.emitEvent('event:created', result);
      return result;
    } catch (error) {
      this.logger.error(`Prisma error creating event: ${error.message}`, error.stack);
      throw error;
    }
  }

  async update(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.findOne(id);
    if (event.organizerId !== userId) {
      this.logger.warn(`User ${userId} attempted to edit event ${id} without permission`);
      throw new ForbiddenException('Only the organizer can edit this event');
    }

    const { tags: dtoTags, ...rest } = dto as any;
    const tags = (dtoTags || []).slice(0, 5).map((tag: string) => tag.trim()).filter(Boolean);
    const connectOrCreate = tags.map((tag: string) => ({
      where: { normalized: tag.toLowerCase() },
      create: { name: tag, normalized: tag.toLowerCase() },
    }));

    // Data for update
    const updateData: any = {
      title: rest.title,
      description: rest.description,
      location: rest.location,
      category: rest.category,
      maxParticipants: rest.maxParticipants ? Number(rest.maxParticipants) : undefined,
    };

    if (rest.date) {
      const eventDate = new Date(rest.date);
      if (isNaN(eventDate.getTime())) {
        throw new BadRequestException('Invalid date format');
      }
      updateData.date = eventDate;
    }

    if (dtoTags) {
      updateData.tags = {
        set: [],
        connectOrCreate: connectOrCreate,
      };
    }

    try {
      const updated = await this.prisma.event.update({
        where: { id },
        data: updateData,
        include: { tags: true },
      });

      const result = { ...updated, tags: updated.tags?.map((t) => t.name) ?? [] };
      this.logger.log(`Event updated: ${updated.title}`);
      this.eventsGateway.emitEvent('event:updated', result);
      return result;
    } catch (error) {
      this.logger.error(`Error updating event ${id}: ${error.message}`);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    const event = await this.findOne(id);
    if (event.organizerId !== userId) throw new ForbiddenException('Only the organizer can delete this event');

    await this.prisma.event.delete({ where: { id } });
    this.logger.log(`Event deleted: ${id}`);
    this.eventsGateway.emitEvent('event:deleted', event);
  }

  /**
   * Join event — uses Prisma transaction to ensure atomicity
   */
  async join(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id } });
      if (!event) throw new NotFoundException('Event not found');
      if (event.currentParticipants >= event.maxParticipants) {
        throw new BadRequestException('No spots available');
      }

      const existing = await tx.eventParticipant.findUnique({
        where: { eventId_userId: { eventId: id, userId } },
      });
      if (existing) throw new BadRequestException('You are already a participant');

      await tx.eventParticipant.create({ data: { eventId: id, userId } });
      const updated = await tx.event.update({
        where: { id },
        data: { currentParticipants: { increment: 1 } },
      });

      this.logger.log(`User ${userId} joined event ${id}`);
      this.eventsGateway.emitEvent('event:joined', updated);
      return updated;
    });
  }

  /**
   * Leave event — uses Prisma transaction to ensure atomicity
   */
  async leave(id: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.event.findUnique({ where: { id } });
      if (!event) throw new NotFoundException('Event not found');

      const participant = await tx.eventParticipant.findUnique({
        where: { eventId_userId: { eventId: id, userId } },
      });
      if (!participant) throw new BadRequestException('You are not a participant');

      await tx.eventParticipant.delete({
        where: { id: participant.id },
      });
      const updated = await tx.event.update({
        where: { id },
        data: { currentParticipants: { decrement: 1 } },
      });

      this.logger.log(`User ${userId} left event ${id}`);
      this.eventsGateway.emitEvent('event:left', updated);
      return updated;
    });
  }

  async registerSomeone(eventId: string, organizerId: string, userEmail: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');
    if (event.organizerId !== organizerId) {
      throw new ForbiddenException('Only the organizer can register other participants');
    }

    if (event.currentParticipants >= event.maxParticipants) {
      throw new BadRequestException('No spots available');
    }

    const targetUser = await this.prisma.user.findUnique({ where: { email: userEmail } });
    if (!targetUser) {
      throw new NotFoundException(`User with email ${userEmail} not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.eventParticipant.findUnique({
        where: { eventId_userId: { eventId, userId: targetUser.id } },
      });
      if (existing) throw new BadRequestException('User is already registered for this event');

      await tx.eventParticipant.create({ data: { eventId, userId: targetUser.id } });
      const updated = await tx.event.update({
        where: { id: eventId },
        data: { currentParticipants: { increment: 1 } },
      });

      this.logger.log(`Organizer ${organizerId} registered user ${targetUser.id} for event ${eventId}`);
      this.eventsGateway.emitEvent('event:joined', updated);
      return updated;
    });
  }

  async getTags() {
    const tags = await this.prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return tags.map((tag) => tag.name);
  }

  async getEventsStats(userId?: string) {
    const where: Prisma.EventWhereInput = userId ? { organizerId: userId } : {};
    
    const [totalEvents, totalParticipants, categoryStats, upcomingEvents] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.aggregate({
        where,
        _sum: { currentParticipants: true },
      }),
      this.prisma.event.groupBy({
        where,
        by: ['category'],
        _count: { _all: true },
      }),
      this.prisma.event.findMany({
        where: {
          ...where,
          date: { gte: new Date() },
        },
        orderBy: { date: 'asc' },
        take: 5,
      }),
    ]);

    return {
      totalEvents,
      totalParticipants: totalParticipants._sum.currentParticipants || 0,
      categories: categoryStats.map((stat) => ({
        category: stat.category,
        count: stat._count._all,
      })),
      upcoming: upcomingEvents.map((e) => ({
        title: e.title,
        date: e.date.toISOString(),
        location: e.location,
      })),
    };
  }
}
