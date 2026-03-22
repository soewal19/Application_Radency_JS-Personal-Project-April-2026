import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventsModule } from '../events/events.module';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { AiGateway } from './ai.gateway';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [ConfigModule, EventsModule, AuthModule],
  controllers: [AiController, AgentsController],
  providers: [AiService, AiGateway, AgentsService],
  exports: [AiService],
})
export class AiModule {}
