import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

export type UserRole = 'patient' | 'pharmacy';

// حالة الحساب — 'approved_pending_signature' تعني أن مستندات الصيدلية اعتُمدت
// من فريق الدعم وتنتظر التوقيع الرقمي على اتفاقية الانضمام لتفعيلها.
export type AccountStatus = 'active' | 'approved_pending_signature';

export interface AuthUser {
  id: number;
  name: string;
  phone: string;
  avatar: string | null;
  role: UserRole;
  status: AccountStatus;
  pharmacyId: number | null;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  justActivated: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  apiLogin: (phone: string, password: string) => Promise<AuthUser>;
  apiRegister: (name: string, phone: string, password: string, role: UserRole) => Promise<AuthUser>;
  activateAccount: () => Promise<void>;
  clearJustActivated: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

async function apiPost<T>(path: string, body: object, token?: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error ?? 'حدث خطأ');
  return data as T;
}

interface ApiUser {
  id: number;
  name: string;
  phone: string;
  avatar?: string | null;
  role: UserRole;
  status?: AccountStatus | null;
  pharmacyId?: number | null;
}

interface ApiAuthResponse {
  token: string;
  user: ApiUser;
}

// نطبّع قيمة الحالة — أي قيمة قديمة/مفقودة تُعامل كـ 'active' حتى لا نحجب المستخدمين الحاليين.
const normalizeStatus = (status?: AccountStatus | null): AccountStatus =>
  status === 'approved_pending_signature' ? 'approved_pending_signature' : 'active';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // علامة مؤقتة (لا تُحفظ) — تُستخدم لإطلاق الاحتفال (Confetti + شاشة الترحيب) مرة واحدة بعد التفعيل.
  const [justActivated, setJustActivated] = useState(false);

  // عند فتح التطبيق، نتحقق هل هناك مستخدم مسجل مسبقاً في الذاكرة؟
  useEffect(() => {
    const savedUser = localStorage.getItem('dawai_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser) as AuthUser;
        // تطبيع الحالة للمستخدمين المحفوظين قبل إضافة حقل status
        setUser({ ...parsed, status: normalizeStatus(parsed.status) });
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
    setJustActivated(false);
    localStorage.removeItem('dawai_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const toAuthUser = (data: ApiAuthResponse, fallbackRole: UserRole): AuthUser => ({
    id: data.user.id,
    name: data.user.name,
    phone: data.user.phone,
    avatar: data.user.avatar ?? null,
    role: data.user.role ?? fallbackRole,
    status: normalizeStatus(data.user.status),
    pharmacyId: data.user.pharmacyId ?? null,
    token: data.token,
  });

  // تسجيل الدخول عبر API
  const apiLogin = async (phone: string, password: string): Promise<AuthUser> => {
    const data = await apiPost<ApiAuthResponse>('/auth/login', { phone, password });
    const authUser = toAuthUser(data, 'patient');
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
    const authUser = toAuthUser(data, role);
    login(authUser);
    return authUser;
  };

  // تفعيل الحساب بعد التوقيع الرقمي — يحدّث الحالة إلى 'active' ويُطلق الاحتفال.
  const activateAccount = async (): Promise<void> => {
    if (!user) throw new Error('لا يوجد مستخدم مسجّل');
    const data = await apiPost<{ user: ApiUser }>('/pharmacy/activate', {}, user.token);
    const updated: AuthUser = {
      ...user,
      name: data.user.name ?? user.name,
      role: data.user.role ?? user.role,
      status: normalizeStatus(data.user.status),
      pharmacyId: data.user.pharmacyId ?? user.pharmacyId,
    };
    login(updated);
    setJustActivated(true);
  };

  const clearJustActivated = () => setJustActivated(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        justActivated,
        login,
        logout,
        apiLogin,
        apiRegister,
        activateAccount,
        clearJustActivated,
      }}
    >
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
