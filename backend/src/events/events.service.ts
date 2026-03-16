/**
 * @module Events Service
 * @description Business logic for event management using Prisma ORM
 * Best practices: structured logging, transactional joins/leaves, pagination
 */

import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
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
    private eventsGateway: EventsGateway,
  ) {}

  async findAll(query: QueryEventsDto) {
    const { page = 1, limit = 15, search, category, sortBy = 'createdAt', sortOrder = 'DESC' } = query;

    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where }),
    ]);

    this.logger.debug(`findAll: page=${page}, total=${total}`);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByUser(userId: string, query: QueryEventsDto) {
    const { page = 1, limit = 15 } = query;

    const [data, total] = await Promise.all([
      this.prisma.event.findMany({
        where: { organizerId: userId },
        orderBy: { date: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.event.count({ where: { organizerId: userId } }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(dto: CreateEventDto, userId: string) {
    const event = await this.prisma.event.create({
      data: { ...dto, organizerId: userId },
    });
    this.logger.log(`Event created: ${event.id} by user ${userId}`);
    this.eventsGateway.emitEvent('event:created', event);
    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId: string) {
    const event = await this.findOne(id);
    if (event.organizerId !== userId) throw new ForbiddenException('Only the organizer can edit this event');

    const updated = await this.prisma.event.update({
      where: { id },
      data: dto,
    });
    this.logger.log(`Event updated: ${id}`);
    this.eventsGateway.emitEvent('event:updated', updated);
    return updated;
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
}
