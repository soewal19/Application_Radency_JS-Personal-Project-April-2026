/**
 * @module Events Module
 * @description Events module using Prisma (no TypeORM dependency)
 */

import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { EventsGateway } from './events.gateway';

@Module({
  controllers: [EventsController],
  providers: [EventsService, EventsGateway],
})
export class EventsModule {}
