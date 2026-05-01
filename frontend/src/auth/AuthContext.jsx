import { createContext, useContext, useState, useEffect, useCallback } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

const TOKEN_KEY = "lm_token";
const ADMIN_KEY = "lm_admin";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem(ADMIN_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_KEY);
    setToken(null);
    setAdmin(null);
  }, []);

  const saveSession = useCallback((newToken, newAdmin) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(ADMIN_KEY, JSON.stringify(newAdmin));
    setToken(newToken);
    setAdmin(newAdmin);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    client
      .get("/auth/me")
      .then(({ data }) => {
        const freshAdmin = data.admin;
        localStorage.setItem(ADMIN_KEY, JSON.stringify(freshAdmin));
        setAdmin(freshAdmin);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearSession]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await client.post("/auth/login", { email, password });
      saveSession(data.token, data.admin);
      return data;
    },
    [saveSession]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await client.post("/auth/register", { name, email, password });
      saveSession(data.token, data.admin);
      return data;
    },
    [saveSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = { token, admin, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
