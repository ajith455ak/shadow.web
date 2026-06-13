import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "@/src/api/client";

export type User = { id: string; username: string; email: string };
export type Character = any | null;

type AuthState = {
  loading: boolean;
  user: User | null;
  character: Character;
  hasCharacter: boolean;
  login: (email: string, password: string, remember: boolean) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setCharacter: (c: Character) => void;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacterState] = useState<Character>(null);

  const refresh = useCallback(async () => {
    const token = await getToken();
    if (!token) {
      setUser(null);
      setCharacterState(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<{ user: User; character: Character }>("/auth/me");
      setUser(me.user);
      setCharacterState(me.character);
    } catch {
      await clearToken();
      setUser(null);
      setCharacterState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const res = await api.post<{ token: string; user: User; has_character: boolean }>("/auth/login", {
      email, password, remember_me: remember,
    });
    await setToken(res.token);
    setUser(res.user);
    if (res.has_character) {
      const c = await api.get<any>("/character");
      setCharacterState(c);
    } else {
      setCharacterState(null);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const res = await api.post<{ token: string; user: User }>("/auth/register", { username, email, password });
    await setToken(res.token);
    setUser(res.user);
    setCharacterState(null);
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setUser(null);
    setCharacterState(null);
  }, []);

  return (
    <Ctx.Provider value={{
      loading, user, character, hasCharacter: !!character,
      login, register, logout, refresh, setCharacter: setCharacterState,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
