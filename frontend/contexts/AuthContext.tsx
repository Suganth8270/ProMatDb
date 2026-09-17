"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAuthSession, login as apiLogin, logout as apiLogout } from "@/services/api";

export interface AuthUser {
  id: number;
  username: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const session = await getAuthSession();
      setUser(session.authenticated ? session.user : null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => refresh());
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    await apiLogin(username, password);
    const session = await getAuthSession();
    if (!session.authenticated || !session.user) {
      throw new Error("Login succeeded but no authenticated session was returned.");
    }
    setUser(session.user);
    setLoading(false);
    return session.user as AuthUser;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, login, logout }),
    [user, loading, refresh, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
