/**
 * @module Frontend Tests — Auth Store
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/store/useAuthStore';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('initial state is unauthenticated', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('login sets user and token (mock)', async () => {
    await useAuthStore.getState().login({ email: 'test@test.com', password: '123456' });
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).not.toBeNull();
    expect(state.user?.email).toBe('test@test.com');
  });

  it('logout clears state', async () => {
    await useAuthStore.getState().login({ email: 'test@test.com', password: '123456' });
    useAuthStore.getState().logout();
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
