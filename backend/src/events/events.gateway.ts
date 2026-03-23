/**
 * @module Events Gateway
 * @description WebSocket Gateway with JWT authentication on connection
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { EventsService } from './events.service';

interface AuthenticatedSocket extends Socket {
  user?: { id: string; email: string };
}

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
  ? ['https://application-frontend-fjji.onrender.com', 'https://application-backend-54iw.onrender.com']
  : (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8080,http://localhost:3000').split(',').map((o) => o.trim());

@WebSocketGateway({
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(EventsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
  ) {}

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @SubscribeMessage('joinEvent')
  async handleJoinEvent(client: AuthenticatedSocket, id: string) {
    if (!client.user) return { error: 'Unauthorized' };
    try {
      const updated = await this.eventsService.join(id, client.user.id);
      return { success: true, data: updated };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('leaveEvent')
  async handleLeaveEvent(client: AuthenticatedSocket, id: string) {
    if (!client.user) return { error: 'Unauthorized' };
    try {
      const updated = await this.eventsService.leave(id, client.user.id);
      return { success: true, data: updated };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('registerSomeone')
  async handleRegisterSomeone(client: AuthenticatedSocket, payload: { eventId: string, email: string }) {
    if (!client.user) return { error: 'Unauthorized' };
    try {
      const updated = await this.eventsService.registerSomeone(payload.eventId, client.user.id, payload.email);
      return { success: true, data: updated };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('createEvent')
  async handleCreateEvent(client: AuthenticatedSocket, dto: any) {
    if (!client.user) return { error: 'Unauthorized' };
    try {
      const created = await this.eventsService.create(dto, client.user.id);
      return { success: true, data: created };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('updateEvent')
  async handleUpdateEvent(client: AuthenticatedSocket, payload: { id: string, data: any }) {
    if (!client.user) return { error: 'Unauthorized' };
    try {
      const updated = await this.eventsService.update(payload.id, payload.data, client.user.id);
      return { success: true, data: updated };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  @SubscribeMessage('deleteEvent')
  async handleDeleteEvent(client: AuthenticatedSocket, id: string) {
    if (!client.user) return { error: 'Unauthorized' };
    try {
      await this.eventsService.remove(id, client.user.id);
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      this.logger.warn(`WS connection rejected — no token: ${client.id}`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    const user = await this.authService.validateToken(token);
    if (!user) {
      this.logger.warn(`WS connection rejected — invalid token: ${client.id}`);
      client.emit('error', { message: 'Invalid token' });
      client.disconnect(true);
      return;
    }

    // Attach user to socket for later use
    (client as AuthenticatedSocket).user = user;
    this.logger.log(`WS client connected: ${client.id} (user: ${user.id})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  emitEvent(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
