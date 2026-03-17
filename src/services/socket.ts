/**
 * @module Socket Service
 * @description Singleton service for WebSocket connection via Socket.IO.
 * Includes a keepalive ping mechanism to prevent connection drops on free hosting.
 * Single Responsibility Principle (SOLID)
 */

import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, ALLOWED_ORIGINS } from '@/config/whitelist';
import type { EventSocketAction, IEvent } from '@/types/event';

/** Interval in ms between keepalive pings (25 seconds) */
const PING_INTERVAL_MS = 25_000;

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;

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
      this.startPing();
    });

    this.socket.on('disconnect', (reason) => {
      console.info(`[Socket] Disconnected: ${reason}`);
      this.stopPing();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });

    // Listen for pong response from server
    this.socket.on('pong', () => {
      console.debug('[Socket] Pong received — connection alive');
    });
  }

  disconnect(): void {
    this.stopPing();
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

  /**
   * Start sending periodic ping events to keep the connection alive.
   * Especially useful on free-tier hosting (Render.com) that sleeps idle services.
   */
  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping');
        console.debug('[Socket] Ping sent');
      }
    }, PING_INTERVAL_MS);
  }

  /** Stop sending periodic pings */
  private stopPing(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export const socketService = SocketService.getInstance();
