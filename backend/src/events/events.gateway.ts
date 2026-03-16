/**
 * @module Events Gateway
 * @description WebSocket Gateway with JWT authentication on connection
 */

import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');

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

  constructor(private readonly authService: AuthService) {}

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
    (client as any).user = user;
    this.logger.log(`WS client connected: ${client.id} (user: ${user.id})`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`WS client disconnected: ${client.id}`);
  }

  emitEvent(event: string, data: any) {
    this.server.emit(event, data);
  }
}
