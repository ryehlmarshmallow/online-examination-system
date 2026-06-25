import { act } from '@testing-library/react';
import { useAuthStore } from './auth-store';
import { getCurrentUser } from '@/features/auth/api/auth-api';
import type { AuthUser } from '@/features/auth/types/auth';

vi.mock('@/features/auth/api/auth-api', () => ({
  getCurrentUser: vi.fn(),
}));

describe('auth-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    act(() => {
      useAuthStore.getState().clearAuthUser();
    });
  });

  const mockUser: AuthUser = {
    username: 'testuser',
    firstName: 'Test',
    middleName: null,
    lastName: 'User',
    email: 'test@example.com',
    userRole: 'STUDENT',
  };

  it('should initialize with authUser as null and isHydrating as true', () => {
    const state = useAuthStore.getState();
    expect(state.authUser).toBeNull();
    expect(state.isHydrating).toBe(true);
  });

  it('should setAuthUser correctly', () => {
    act(() => {
      useAuthStore.getState().setAuthUser(mockUser);
    });
    expect(useAuthStore.getState().authUser).toEqual(mockUser);
  });

  it('should clearAuthUser correctly', () => {
    act(() => {
      useAuthStore.getState().setAuthUser(mockUser);
    });
    expect(useAuthStore.getState().authUser).toEqual(mockUser);

    act(() => {
      useAuthStore.getState().clearAuthUser();
    });
    expect(useAuthStore.getState().authUser).toBeNull();
  });

  it('should hydrateCurrentUser successfully', async () => {
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);

    let promise: Promise<void> | undefined;
    act(() => {
      promise = useAuthStore.getState().hydrateCurrentUser();
    });

    expect(useAuthStore.getState().isHydrating).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(useAuthStore.getState().authUser).toEqual(mockUser);
    expect(useAuthStore.getState().isHydrating).toBe(false);
  });

  it('should handle failed hydrateCurrentUser gracefully', async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error('Unauthorized'));

    let promise: Promise<void> | undefined;
    act(() => {
      promise = useAuthStore.getState().hydrateCurrentUser();
    });

    expect(useAuthStore.getState().isHydrating).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(useAuthStore.getState().authUser).toBeNull();
    expect(useAuthStore.getState().isHydrating).toBe(false);
  });
});
