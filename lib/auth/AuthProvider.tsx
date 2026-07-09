"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi } from "@/lib/api/auth";
import { onUnauthorized, purgeLegacyToken } from "./token";
import type { UserDto, LoginDto } from "@/lib/types/api";

type AuthState = {
  user: UserDto | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (dto: LoginDto) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount, resolve the current user from the auth cookie (#15). If the JWT has
  // expired, the API client transparently refreshes and retries; a hard 401 means
  // "not signed in" and we land on the login page.
  useEffect(() => {
    purgeLegacyToken();
    let active = true;
    authApi.me()
      .then((u) => { if (active) setUser(u); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // If any API call hits an unrecoverable 401, clear the user.
  useEffect(() => onUnauthorized(() => setUser(null)), []);

  const login = useCallback(async (dto: LoginDto) => {
    // The backend sets httpOnly session cookies on this response; the body's user
    // object is all the client keeps.
    const result = await authApi.login(dto);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    // Revoke the refresh token and clear cookies server-side. keepalive lets the
    // request survive the hard reload that follows; best-effort otherwise.
    fetch("/backend/api/auth/logout", {
      method: "POST",
      credentials: "include",
      keepalive: true,
    }).catch(() => {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: user !== null,
        isAdmin: user?.role === "Admin",
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
