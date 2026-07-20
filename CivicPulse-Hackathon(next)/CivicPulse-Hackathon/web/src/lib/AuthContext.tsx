import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiPost, apiGet } from "./api";

export type UserRole = "citizen" | "officer" | "admin" | null;

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  avatarInitial?: string;
  reputation?: number;
  reportsCount?: number;
  resolvedCount?: number;
  supportedCount?: number;
  createdAt?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, city: string, role: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem("civicpulse_token");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const data = await apiGet<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {
      localStorage.removeItem("civicpulse_token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiPost<{ token: string; user: User }>("/api/auth/login", { email, password });
    localStorage.setItem("civicpulse_token", data.token);
    setUser(data.user);
  };

  const signup = async (name: string, email: string, password: string, city: string, role: string) => {
    const data = await apiPost<{ token: string; user: User }>("/api/auth/signup", { name, email, password, city, role });
    localStorage.setItem("civicpulse_token", data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("civicpulse_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
