'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/auth.service';
import { clearToken, setToken, getToken, setUnauthorizedHandler } from '@/lib/apiClient';
import { ROLES } from '@/utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  // Any 401 from any request drops the session.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  // Restore the session on first paint.
  useEffect(() => {
    let active = true;
    async function restore() {
      if (!getToken()) {
        if (active) setLoading(false);
        return;
      }
      try {
        const response = await authService.me();
        if (active) setUser(response?.data ?? null);
      } catch {
        if (active) clearSession();
      } finally {
        if (active) setLoading(false);
      }
    }
    restore();
    return () => {
      active = false;
    };
  }, [clearSession]);

  const login = useCallback(async (loginId, password) => {
    const response = await authService.login(loginId, password);
    const { token, user: loggedIn } = response.data;
    setToken(token);
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* the token is dropped locally regardless of the server answer */
    }
    clearSession();
    router.replace('/login');
  }, [clearSession, router]);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === ROLES.ADMIN,
      isAccountant: user?.role === ROLES.ACCOUNTANT,
      isPortalUser: user?.role === ROLES.USER,
      isInternal: user?.role === ROLES.ADMIN || user?.role === ROLES.ACCOUNTANT,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

/** Landing route for a role, used after login and by the root redirect. */
export function homeRouteForRole(role) {
  return role === ROLES.USER ? '/portal' : '/dashboard';
}
