import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiQueryDto } from './dto/ai-query.dto';
import { AuthService } from '../auth/auth.service';

interface AuthenticatedSocket extends Socket {
  user?: { id: string; email: string };
}

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:8080,http://localhost:3000').split(',');

@WebSocketGateway({
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
})
export class AiGateway implements OnGatewayConnection {
  private readonly logger = new Logger(AiGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly aiService: AiService,
    private readonly authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) return;

    try {
      const user = await this.authService.validateToken(token);
      if (user) {
        (client as AuthenticatedSocket).user = user;
      }
    } catch {
      // Ignore auth errors during connection for AI
    }
  }

  @SubscribeMessage('aiQuery')
  async handleAiQuery(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() dto: AiQueryDto,
  ) {
    if (!client.user) {
      return { error: 'Unauthorized' };
    }

    this.logger.log(`AI Query from user ${client.user.id}: ${dto.query}`);
    
    try {
      const result = await this.aiService.query(client.user.id, dto);
      return { success: true, data: result };
    } catch (error) {
      this.logger.error(`AI Gateway Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}
