/**
 * @module API Service
 * @description HTTP client with JWT access/refresh token handling
 * - Auto-attaches Bearer token from auth store
 * - On 401, attempts silent refresh via refreshToken
 * - On refresh failure, triggers logout
 */

import { API_BASE_URL, isAllowedOrigin } from '@/config/whitelist';
import { logger } from '@/lib/logger';
import type { AuthResponse, IUser, LoginDto, RegisterDto } from '@/types/auth';
import type { CreateEventDto, EventsListResponse, EventsQueryParams, IEvent, ITag, UpdateEventDto } from '@/types/event';

/** Lazy import to avoid circular dependency — resolved at runtime */
const getAuthStore = () => import('@/store/useAuthStore').then(m => m.useAuthStore);

class ApiService {
  private baseUrl: string;
  private refreshPromise: Promise<AuthResponse> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.validateOrigin();
  }

  private validateOrigin(): void {
    try {
      const origin = new URL(this.baseUrl).origin;
      if (!isAllowedOrigin(origin)) {
        console.warn(`[API] Origin ${origin} is not in the whitelist, continuing for development`);
      }
    } catch {
      // Invalid URL during SSR or test
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    // Read token from zustand persisted state (single source of truth)
    try {
      const raw = localStorage.getItem('auth-storage');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.accessToken;
        if (token && token !== 'mock-token') {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }
    } catch {
      // localStorage unavailable
    }
    return headers;
  }

  public async request<T>(endpoint: string, options?: RequestInit, isRetry = false): Promise<T> {
    const method = options?.method ?? 'GET';
    const start = performance.now();
    logger.debug(`${method} ${endpoint}`, 'API');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: { ...this.getHeaders(), ...options?.headers },
    });

    const duration = Math.round(performance.now() - start);
    logger.api(method, endpoint, response.status, duration);

    // Handle 401 — attempt token refresh (once)
    if (response.status === 401 && !isRetry) {
      logger.warn('Access token expired, attempting refresh', 'API');
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        return this.request<T>(endpoint, options, true);
      }
      // Refresh failed — force logout
      logger.warn('Refresh failed, logging out', 'API');
      const store = await getAuthStore();
      store.getState().logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Server error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Attempt to refresh the access token using the stored refresh token.
   * Deduplicates concurrent refresh calls.
   */
  private async tryRefreshToken(): Promise<boolean> {
    try {
      const raw = localStorage.getItem('auth-storage');
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      const refreshToken = parsed?.state?.refreshToken;
      if (!refreshToken || refreshToken === 'mock-refresh') return false;

      // Deduplicate — only one refresh at a time
      if (!this.refreshPromise) {
        this.refreshPromise = fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        }).then(async (res) => {
          if (!res.ok) throw new Error('Refresh failed');
          return res.json() as Promise<AuthResponse>;
        });
      }

      const data = await this.refreshPromise;
      this.refreshPromise = null;

      // Update zustand store with new tokens
      const store = await getAuthStore();
      store.setState({
        accessToken: data.accessToken,
        user: data.user,
      });
      // Also update the persisted refreshToken
      const currentRaw = localStorage.getItem('auth-storage');
      if (currentRaw) {
        const current = JSON.parse(currentRaw);
        current.state.accessToken = data.accessToken;
        current.state.refreshToken = data.refreshToken;
        localStorage.setItem('auth-storage', JSON.stringify(current));
      }

      logger.info('Token refreshed successfully', 'API');
      return true;
    } catch (error) {
      this.refreshPromise = null;
      logger.error('Token refresh failed', 'API');
      return false;
    }
  }

  // Auth
  async login(dto: LoginDto): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  // Events
  async getEvents(params: EventsQueryParams): Promise<EventsListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (key === 'tags' && Array.isArray(value)) {
        searchParams.set(key, value.join(','));
        return;
      }
      searchParams.set(key, String(value));
    });
    return this.request<EventsListResponse>(`/events?${searchParams}`);
  }

  async getEvent(id: string): Promise<IEvent> {
    return this.request<IEvent>(`/events/${encodeURIComponent(id)}`);
  }

  async getTags(): Promise<ITag[]> {
    return this.request<ITag[]>(`/events/tags`);
  }

  async createEvent(dto: CreateEventDto): Promise<IEvent> {
    return this.request<IEvent>('/events', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateEvent(id: string, dto: UpdateEventDto): Promise<IEvent> {
    return this.request<IEvent>(`/events/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }

  async deleteEvent(id: string): Promise<void> {
    await this.request(`/events/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async joinEvent(id: string): Promise<void> {
    await this.request(`/events/${encodeURIComponent(id)}/join`, { method: 'POST' });
  }

  async leaveEvent(id: string): Promise<void> {
    await this.request(`/events/${encodeURIComponent(id)}/leave`, { method: 'POST' });
  }

  async registerSomeone(eventId: string, email: string): Promise<IEvent> {
    return this.request<IEvent>(`/events/${encodeURIComponent(eventId)}/register-someone`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async updateProfile(data: { name?: string; email?: string; avatar?: string }): Promise<IUser> {
    return this.request<IUser>('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Password Recovery
  async requestPasswordReset(email: string): Promise<void> {
    await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async getMyEvents(params: EventsQueryParams): Promise<EventsListResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    return this.request<EventsListResponse>(`/events/my?${searchParams}`);
  }

  async checkHealth(): Promise<{ status: string; database: string }> {
    return this.request<{ status: string; database: string }>('/health');
  }

  async aiQuery(query: string, context?: string): Promise<{ assistant: string; toolCall: any }> {
    return this.request<{ assistant: string; toolCall: any }>('/ai/query', {
      method: 'POST',
      body: JSON.stringify({ query, context }),
    });
  }
}

export const apiService = new ApiService(API_BASE_URL);
