import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { loginTenant, type TenantProfile } from "@/api/mockData";

type AuthContextShape = {
  user: TenantProfile | null;
  loading: boolean;
  error: string | null;
  login: (payload: { phone: string; accessCode: string }) => Promise<TenantProfile>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextShape | undefined>(undefined);

const STORAGE_KEY = "client_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<TenantProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (err) {
        console.error("Failed to parse saved user:", err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  const login = async (payload: { phone: string; accessCode: string }) => {
    setLoading(true);
    setError(null);
    try {
      const profile = await loginTenant(payload.phone, payload.accessCode);
      setUser(profile);
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      return profile;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Dang nhap that bai";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, loading, error, login, logout }),
    [user, loading, error]
  );

  // Don't render children until we've checked localStorage
  if (!isInitialized) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
