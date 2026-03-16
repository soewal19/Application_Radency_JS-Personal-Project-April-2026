/**
 * @module Socket Service
 * @description Singleton service for WebSocket connection via Socket.IO
 * Single Responsibility Principle (SOLID)
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, ALLOWED_ORIGINS } from '@/config/whitelist';
import type { EventSocketAction, IEvent } from '@/types/event';

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;

  private constructor() {}

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      withCredentials: true,
      extraHeaders: {
        'X-Allowed-Origins': ALLOWED_ORIGINS.join(','),
      },
    });

    this.socket.on('connect', () => {
      console.info('[Socket] Connected to server');
    });

    this.socket.on('disconnect', (reason) => {
      console.info(`[Socket] Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  on(event: EventSocketAction, callback: (data: IEvent) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: EventSocketAction): void {
    this.socket?.off(event);
  }

  emit(event: EventSocketAction, data: unknown): void {
    this.socket?.emit(event, data);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const socketService = SocketService.getInstance();
