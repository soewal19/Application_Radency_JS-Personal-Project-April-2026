/**
 * @module Users Store
 * @description Zustand store for managing mock users list
 * Single Responsibility Principle (SOLID)
 */

import { create } from 'zustand';
import type { IUser } from '@/types/auth';
import { logger } from '@/lib/logger';

const AVATAR_BASE = 'https://i.pravatar.cc/150?img=';

const generateMockUsers = (): IUser[] => {
  const names = [
    'Alice Johnson', 'Bob Smith', 'Charlie Brown', 'Diana Prince', 'Edward Norton',
    'Fiona Apple', 'George Lucas', 'Hannah Montana', 'Ivan Petrov', 'Julia Roberts',
    'Kevin Hart', 'Laura Palmer', 'Mike Tyson', 'Nina Simone', 'Oscar Wilde',
    'Paula Abdul', 'Quinn Hughes', 'Rachel Green', 'Steve Rogers', 'Tina Turner',
  ];

  return names.map((name, i) => ({
    id: `user-${i + 1}`,
    email: `${name.toLowerCase().replace(' ', '.')}@eventhub.com`,
    name,
    avatar: `${AVATAR_BASE}${i + 1}`,
    createdAt: new Date(2026, 0, 1 + i * 3).toISOString(),
  }));
};

interface UsersState {
  users: IUser[];
  isLoading: boolean;
  fetchUsers: () => void;
}

export const useUsersStore = create<UsersState>()((set) => ({
  users: [],
  isLoading: false,

  fetchUsers: () => {
    set({ isLoading: true });
    logger.store('Users', 'fetchUsers', { count: 20 });
    setTimeout(() => {
      logger.info('Users loaded successfully', 'Store:Users');
      set({ users: generateMockUsers(), isLoading: false });
    }, 800);
  },
}));
