import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type UserRole = "patient" | "pharmacy";

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  avatar: string | null;
  role: UserRole;
  pharmacyId: number | null;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPharmacy: boolean;
  login: (phone: string, password: string) => Promise<AuthUser>;
  register: (name: string, phone: string, password: string, role: UserRole) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "dawai_user";

function loadFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function saveToStorage(user: AuthUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  // also keep legacy keys for backward compat
  localStorage.setItem("token", user.token);
  localStorage.setItem("user", JSON.stringify({ id: user.id, name: user.name, phone: user.phone }));
}

function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? "حدث خطأ");
  return data as T;
}

interface ApiAuthResponse {
  token: string;
  user: {
    id: number;
    name: string;
    phone: string;
    avatar?: string | null;
    role: UserRole;
    pharmacyId?: number | null;
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = async (phone: string, password: string): Promise<AuthUser> => {
    const data = await apiPost<ApiAuthResponse>("/auth/login", { phone, password });
    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      phone: data.user.phone,
      avatar: data.user.avatar ?? null,
      role: data.user.role ?? "patient",
      pharmacyId: data.user.pharmacyId ?? null,
      token: data.token,
    };
    saveToStorage(authUser);
    setUser(authUser);
    return authUser;
  };

  const register = async (
    name: string,
    phone: string,
    password: string,
    role: UserRole
  ): Promise<AuthUser> => {
    const data = await apiPost<ApiAuthResponse>("/auth/register", { name, phone, password, role });
    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      phone: data.user.phone,
      avatar: data.user.avatar ?? null,
      role: data.user.role ?? role,
      pharmacyId: data.user.pharmacyId ?? null,
      token: data.token,
    };
    saveToStorage(authUser);
    setUser(authUser);
    return authUser;
  };

  const logout = () => {
    clearStorage();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isPharmacy: user?.role === "pharmacy",
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
