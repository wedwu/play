/**
 * useAuth — unit tests.
 * All Apollo hooks mocked at the module level so tests are synchronous
 * and never depend on MockedProvider query matching.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { mockUser } from '../test/mocks';

// ─── Mock state shared across tests ──────────────────────────────────────────
let meData: { me: typeof mockUser | null } | undefined;
let meLoading = false;
const mockLoginMutate  = vi.fn();
const mockRegisterMutate = vi.fn();

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client');
  return {
    ...actual,
    useQuery: vi.fn(() => ({ data: meData, loading: meLoading })),
    useMutation: vi.fn((doc: unknown) => {
      // Return the right spy based on which mutation document is passed
      const name = (doc as any)?.definitions?.[0]?.name?.value ?? '';
      const mutate = name === 'Login' ? mockLoginMutate : mockRegisterMutate;
      return [mutate, { loading: false, error: undefined }];
    }),
    useApolloClient: vi.fn(() => ({
      resetStore: vi.fn().mockResolvedValue(null),
      clearStore: vi.fn().mockResolvedValue(null),
    })),
  };
});

import { useAuth } from '../hooks/useAuth';

// ─── Helpers ─────────────────────────────────────────────────────────────────
beforeEach(() => {
  meData = undefined;
  meLoading = false;
  vi.clearAllMocks();
  localStorage.clear();

  mockLoginMutate.mockResolvedValue({ data: { login: { token: 'jwt-abc', user: mockUser } } });
  mockRegisterMutate.mockResolvedValue({ data: { register: { token: 'jwt-reg', user: mockUser } } });
});

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('useAuth', () => {
  describe('initial state', () => {
    it('returns undefined user while loading', () => {
      meLoading = true;
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toBeUndefined();
      expect(result.current.loading).toBe(true);
    });

    it('populates user once ME_QUERY resolves', () => {
      meData = { me: mockUser };
      const { result } = renderHook(() => useAuth());
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('isAuthenticated is false when me is null', () => {
      meData = { me: null };
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('isAuthenticated is false when data is undefined', () => {
      meData = undefined;
      const { result } = renderHook(() => useAuth());
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('login()', () => {
    it('calls LOGIN_MUTATION with correct variables', async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.login('admin@taskflow.dev', 'admin123');
      });
      expect(mockLoginMutate).toHaveBeenCalledWith({
        variables: { input: { email: 'admin@taskflow.dev', password: 'admin123' } },
      });
    });

    it('stores the token in localStorage on success', async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.login('a@a.com', 'pw'); });
      expect(localStorage.getItem('token')).toBe('jwt-abc');
    });

    it('returns the user object', async () => {
      const { result } = renderHook(() => useAuth());
      let user: any;
      await act(async () => { user = await result.current.login('a@a.com', 'pw'); });
      expect(user).toEqual(mockUser);
    });

    it('does not store token when mutation rejects', async () => {
      mockLoginMutate.mockRejectedValue(new Error('Invalid credentials'));
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        try { await result.current.login('bad@x.com', 'wrong'); } catch {}
      });
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('throws when mutation rejects', async () => {
      mockLoginMutate.mockRejectedValue(new Error('Invalid credentials'));
      const { result } = renderHook(() => useAuth());
      await expect(
        act(async () => { await result.current.login('bad@x.com', 'wrong'); })
      ).rejects.toThrow('Invalid credentials');
    });

    it('does not store token when response has no token', async () => {
      mockLoginMutate.mockResolvedValue({ data: { login: { token: null, user: mockUser } } });
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.login('a@a.com', 'pw'); });
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register()', () => {
    it('calls REGISTER_MUTATION with all three fields', async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => {
        await result.current.register('new@test.com', 'pass123', 'New User');
      });
      expect(mockRegisterMutate).toHaveBeenCalledWith({
        variables: { input: { email: 'new@test.com', password: 'pass123', name: 'New User' } },
      });
    });

    it('stores token on success', async () => {
      const { result } = renderHook(() => useAuth());
      await act(async () => { await result.current.register('n@t.com', 'pw', 'N'); });
      expect(localStorage.getItem('token')).toBe('jwt-reg');
    });

    it('returns the user object', async () => {
      const { result } = renderHook(() => useAuth());
      let user: any;
      await act(async () => { user = await result.current.register('n@t.com', 'pw', 'N'); });
      expect(user).toEqual(mockUser);
    });

    it('throws when mutation rejects', async () => {
      mockRegisterMutate.mockRejectedValue(new Error('Email already in use'));
      const { result } = renderHook(() => useAuth());
      await expect(
        act(async () => { await result.current.register('dup@x.com', 'pw', 'Dup'); })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('logout()', () => {
    it('removes token from localStorage', async () => {
      localStorage.setItem('token', 'existing');
      const { result } = renderHook(() => useAuth());
      await act(async () => { result.current.logout(); });
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('does not throw when localStorage has no token', async () => {
      const { result } = renderHook(() => useAuth());
      await expect(act(async () => { result.current.logout(); })).resolves.not.toThrow();
    });
  });
});
