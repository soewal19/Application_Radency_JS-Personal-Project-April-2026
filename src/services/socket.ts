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
      // Log more details for debugging
      if (error.message?.includes('CORS')) {
        console.error('[Socket] CORS error - check allowed origins');
      }
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

  on(event: EventSocketAction | string, callback: (...args: any[]) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: EventSocketAction | string): void {
    this.socket?.off(event);
  }

  emit(event: EventSocketAction | string, data?: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('Socket not initialized. Please log in again.'));
      }

      if (!this.socket.connected) {
        // If not connected, wait up to 5 seconds for it to connect
        let attempts = 0;
        const checkConnection = setInterval(() => {
          if (this.socket?.connected) {
            clearInterval(checkConnection);
            this.performEmit(event, data, resolve, reject);
          } else if (attempts > 50) { // 5 seconds
            clearInterval(checkConnection);
            reject(new Error('Socket not connected after timeout'));
          }
          attempts++;
        }, 100);
        return;
      }

      this.performEmit(event, data, resolve, reject);
    });
  }

  private performEmit(
    event: string, 
    data: any, 
    resolve: (val: any) => void, 
    reject: (err: Error) => void
  ) {
    this.socket?.emit(event, data, (response: any) => {
      if (response?.error) reject(new Error(response.error));
      else resolve(response?.data || response);
    });
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
