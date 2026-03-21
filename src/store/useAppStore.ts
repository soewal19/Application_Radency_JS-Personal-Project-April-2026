import { create } from 'zustand';
import { apiService } from '@/services/api';
import { socketService } from '@/services/socket';

interface AppState {
  isDbConnected: boolean;
  isWsConnected: boolean;
  lastPing: number | null;
  
  checkHealth: () => Promise<void>;
  setWsConnected: (connected: boolean) => void;
  pingWs: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isDbConnected: false,
  isWsConnected: false,
  lastPing: null,

  checkHealth: async () => {
    try {
      const health = await apiService.checkHealth();
      set({ isDbConnected: health.database === 'connected' });
    } catch {
      set({ isDbConnected: false });
    }
  },

  setWsConnected: (connected: boolean) => {
    set({ isWsConnected: connected });
  },

  pingWs: () => {
    if (socketService.socket?.connected) {
      const start = Date.now();
      socketService.socket.emit('ping', () => {
        set({ lastPing: Date.now() - start });
      });
    }
  }
}));
