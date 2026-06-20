import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export type UserRole = 'patient' | 'pharmacy';

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
  loading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  apiLogin: (phone: string, password: string) => Promise<AuthUser>;
  apiRegister: (name: string, phone: string, password: string, role: UserRole) => Promise<AuthUser>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'حدث خطأ');
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // عند فتح التطبيق، نتحقق هل هناك مستخدم مسجل مسبقاً في الذاكرة؟
  useEffect(() => {
    const savedUser = localStorage.getItem('dawai_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('dawai_user');
      }
    }
    setLoading(false);
  }, []);

  // دالة تسجيل الدخول المباشر (تأخذ بيانات المستخدم مباشرةً)
  const login = (userData: AuthUser) => {
    setUser(userData);
    localStorage.setItem('dawai_user', JSON.stringify(userData)); // حفظ في الذاكرة
  };

  // دالة تسجيل الخروج
  const logout = () => {
    setUser(null);
    localStorage.removeItem('dawai_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // تسجيل الدخول عبر API
  const apiLogin = async (phone: string, password: string): Promise<AuthUser> => {
    const data = await apiPost<ApiAuthResponse>('/auth/login', { phone, password });
    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      phone: data.user.phone,
      avatar: data.user.avatar ?? null,
      role: data.user.role ?? 'patient',
      pharmacyId: data.user.pharmacyId ?? null,
      token: data.token,
    };
    login(authUser);
    return authUser;
  };

  // إنشاء حساب جديد عبر API
  const apiRegister = async (
    name: string,
    phone: string,
    password: string,
    role: UserRole
  ): Promise<AuthUser> => {
    const data = await apiPost<ApiAuthResponse>('/auth/register', { name, phone, password, role });
    const authUser: AuthUser = {
      id: data.user.id,
      name: data.user.name,
      phone: data.user.phone,
      avatar: data.user.avatar ?? null,
      role: data.user.role ?? role,
      pharmacyId: data.user.pharmacyId ?? null,
      token: data.token,
    };
    login(authUser);
    return authUser;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, apiLogin, apiRegister }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook مساعد للوصول السريع
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

// للتوافق مع الكود القديم
export const isPharmacy = (user: AuthUser | null) => user?.role === 'pharmacy';
export const isPatient = (user: AuthUser | null) => user?.role === 'patient';
