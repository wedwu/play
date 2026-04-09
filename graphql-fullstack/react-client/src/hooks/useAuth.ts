/**
 * `useAuth` — centralised authentication hook.
 *
 * Reads the current user from the Apollo cache via `ME_QUERY` and exposes
 * login, register, and logout actions that keep localStorage, the Apollo
 * cache, and the React tree in sync.
 *
 * After login/register:
 *   1. JWT is stored in localStorage (picked up by the authLink on next request).
 *   2. `client.resetStore()` re-executes all active queries so the UI reflects
 *      the new user's data without a page reload.
 *
 * After logout:
 *   1. Token is removed from localStorage.
 *   2. `client.clearStore()` purges the cache entirely (don't reset — there is
 *      no user to re-fetch for).
 *   3. Hard redirect to `/login` ensures no stale component state persists.
 */
import { useState, useCallback } from 'react';
import { useMutation, useQuery, useApolloClient } from '@apollo/client';
import { LOGIN_MUTATION, REGISTER_MUTATION, ME_QUERY } from '../gql';

export function useAuth() {
  const client = useApolloClient();
  const { data: meData, loading: meLoading } = useQuery(ME_QUERY);

  const [loginMutation, { loading: loginLoading, error: loginError }] = useMutation(LOGIN_MUTATION);
  const [registerMutation, { loading: registerLoading, error: registerError }] = useMutation(REGISTER_MUTATION);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await loginMutation({ variables: { input: { email, password } } });
      if (data?.login.token) {
        localStorage.setItem('token', data.login.token);
        await client.resetStore();
      }
      return data?.login.user;
    },
    [loginMutation, client]
  );

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      const { data } = await registerMutation({ variables: { input: { email, password, name } } });
      if (data?.register.token) {
        localStorage.setItem('token', data.register.token);
        await client.resetStore();
      }
      return data?.register.user;
    },
    [registerMutation, client]
  );

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    await client.clearStore();
    window.location.href = '/login';
  }, [client]);

  return {
    user: meData?.me,
    isAuthenticated: !!meData?.me,
    loading: meLoading,
    login,
    loginLoading,
    loginError,
    register,
    registerLoading,
    registerError,
    logout,
  };
}
