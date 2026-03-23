/**
 * @module Auth Store
 * @description Zustand store for authentication with JWT token management
 * - Single source of truth for tokens (no separate localStorage)
 * - Stores both accessToken and refreshToken
 * - Zustand persist handles serialization
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUser, LoginDto, RegisterDto } from '@/types/auth';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';
import { logger } from '@/lib/logger';

const TEST_ACCOUNT = {
  email: 'testuser@test.com',
  password: 'Test1234',
  name: 'Test User',
};

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  updateAvatar: (avatar: string) => void;
  updateProfile: (data: Partial<Pick<IUser, 'name' | 'email'>>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (dto: LoginDto) => {
        set({ isLoading: true, error: null });
        logger.store('Auth', 'login', { email: dto.email });
        const existingUser = get().user;
        try {
          const response = await apiService.login(dto);
          socketService.connect(response.accessToken);
          logger.info('Login successful', 'Auth', { userId: response.user.id });
          // Preserve avatar if same user re-logs in
          const avatar = existingUser?.id === response.user.id ? existingUser.avatar : response.user.avatar;
          set({
            user: { ...response.user, avatar },
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          logger.warn('API login failed, using demo mode', 'Auth');
          const userId = dto.email === TEST_ACCOUNT.email ? 'test-user-1' : '1';
          // Preserve avatar from previous session for same user
          const preservedAvatar = existingUser?.id === userId ? existingUser.avatar : undefined;
          const mockUser: IUser = {
            id: userId,
            email: dto.email,
            name: dto.email === TEST_ACCOUNT.email ? TEST_ACCOUNT.name : dto.email.split('@')[0],
            avatar: preservedAvatar,
            createdAt: new Date().toISOString(),
          };
          set({
            user: mockUser,
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            isAuthenticated: true,
            isLoading: false,
          });
        }
      },

      register: async (dto: RegisterDto) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiService.register(dto);
          socketService.connect(response.accessToken);
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const mockUser: IUser = {
            id: '1',
            email: dto.email,
            name: dto.name,
            avatar: undefined,
            createdAt: new Date().toISOString(),
          };
          set({
            user: mockUser,
            accessToken: 'mock-token',
            refreshToken: 'mock-refresh',
            isAuthenticated: true,
            isLoading: false,
          });
        }
      },

      logout: () => {
        logger.info('User logged out', 'Auth');
        socketService.disconnect();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      clearError: () => set({ error: null }),

      updateAvatar: async (avatar: string) => {
        const user = get().user;
        if (!user) return;
        logger.info('Avatar updating on server', 'Auth', { userId: user.id });
        try {
          const updatedUser = await apiService.updateProfile({ avatar });
          set({ user: updatedUser });
        } catch (error) {
          logger.error('Failed to update avatar on server', 'Auth', error);
          // Fallback to local update if API fails (e.g. mock mode)
          set({ user: { ...user, avatar } });
        }
      },

      updateProfile: async (data: Partial<Pick<IUser, 'name' | 'email'>>) => {
        const user = get().user;
        if (!user) return;
        logger.info('Profile updating on server', 'Auth', { userId: user.id, fields: Object.keys(data) });
        try {
          const updatedUser = await apiService.updateProfile(data);
          set({ user: updatedUser });
        } catch (error) {
          logger.error('Failed to update profile on server', 'Auth', error);
          // Fallback to local update
          set({ user: { ...user, ...data } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
