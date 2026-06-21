import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  login as svcLogin,
  register as svcRegister,
  logout as svcLogout,
  getSession,
  onAuthStateChange,
} from '@/services/authService';
import { getProfile, updateProfileStatus } from '@/services/dbService';
import { DEFAULT_GOVERNORATE } from '@/services/constants';

export type UserRole = 'patient' | 'pharmacy' | 'cosmetic';

// بيانات إضافية تُرسل عند تسجيل البائعين (صيدلية / كوزماتك)
export interface VendorRegistrationData {
  vendorName?: string;
  address?: string;
  governorate?: string;
  workingHours?: string;
  instagram?: string;
  tiktok?: string;
}

// حالة الحساب — 'approved_pending_signature' تعني أن مستندات الصيدلية اعتُمدت
// وتنتظر التوقيع الرقمي على اتفاقية الانضمام لتفعيلها.
export type AccountStatus = 'active' | 'approved_pending_signature';

export interface AuthUser {
  id: string;
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
  apiRegister: (
    name: string,
    phone: string,
    password: string,
    role: UserRole,
    vendorData?: VendorRegistrationData
  ) => Promise<AuthUser>;
  activateAccount: () => Promise<void>;
  clearJustActivated: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// نطبّع قيمة الحالة — أي قيمة قديمة/مفقودة تُعامل كـ 'active'.
const normalizeStatus = (status?: string | null): AccountStatus =>
  status === 'approved_pending_signature' ? 'approved_pending_signature' : 'active';

// نبني مستخدم الواجهة من الملف الشخصي المخزّن في Supabase.
async function buildUser(userId: string, token = ''): Promise<AuthUser | null> {
  const profile = await getProfile(userId);
  if (!profile) return null;
  return {
    id: profile.id,
    name: profile.name ?? '',
    phone: profile.phone ?? '',
    avatar: profile.avatar,
    role: profile.role,
    status: normalizeStatus(profile.status),
    pharmacyId: profile.pharmacyId,
    token,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  // علامة مؤقتة — تُطلق الاحتفال (Confetti + الترحيب) مرة واحدة بعد التفعيل.
  const [justActivated, setJustActivated] = useState(false);

  // عند الإقلاع: نستعيد الجلسة من Supabase ونبني المستخدم من ملفه الشخصي.
  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const session = await getSession();
        if (session?.user) {
          const authUser = await buildUser(session.user.id, session.access_token);
          if (active && authUser) setUser(authUser);
        }
      } catch {
        /* تجاهل أخطاء الاستعادة */
      } finally {
        if (active) setLoading(false);
      }
    })();

    const { data: sub } = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
      } else if (event === 'TOKEN_REFRESHED') {
        setUser((u) => (u ? { ...u, token: session.access_token } : u));
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // تسجيل دخول مباشر (يأخذ بيانات المستخدم مباشرةً)
  const login = (userData: AuthUser) => setUser(userData);

  // تسجيل الخروج — ينهي جلسة Supabase وينظّف الحالة المحلية.
  const logout = () => {
    setJustActivated(false);
    setUser(null);
    void svcLogout().catch(() => undefined);
    localStorage.removeItem('dawai_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // تسجيل الدخول: هاتف + كلمة مرور عبر Supabase.
  const apiLogin = async (phone: string, password: string): Promise<AuthUser> => {
    const data = await svcLogin(phone, password);
    const userId = data.user?.id;
    if (!userId) throw new Error('فشل تسجيل الدخول');
    const authUser = await buildUser(userId, data.session?.access_token ?? '');
    if (!authUser) throw new Error('تعذّر تحميل الملف الشخصي');
    login(authUser);
    return authUser;
  };

  // إنشاء حساب جديد (مريض/صيدلية/كوزماتك) عبر Supabase.
  const apiRegister = async (
    name: string,
    phone: string,
    password: string,
    role: UserRole,
    vendorData?: VendorRegistrationData
  ): Promise<AuthUser> => {
    const result = await svcRegister({
      name,
      phone,
      password,
      role,
      vendorName: vendorData?.vendorName ?? null,
      governorate: vendorData?.governorate || DEFAULT_GOVERNORATE,
      address: vendorData?.address ?? null,
      instagram: vendorData?.instagram ?? null,
      tiktok: vendorData?.tiktok ?? null,
    });
    const session = await getSession();
    const authUser = await buildUser(result.user.id, session?.access_token ?? '');
    if (!authUser) throw new Error('تعذّر تحميل الملف الشخصي');
    login(authUser);
    return authUser;
  };

  // تفعيل الحساب بعد التوقيع الرقمي — يحدّث الحالة إلى 'active' ويُطلق الاحتفال.
  const activateAccount = async (): Promise<void> => {
    if (!user) throw new Error('لا يوجد مستخدم مسجّل');
    await updateProfileStatus(user.id, 'active');
    login({ ...user, status: 'active' });
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

// البائعون = صيدلية أو كوزماتك (يشتركان في لوحة التحكم وبوابة التوقيع)
export const isVendorRole = (role?: UserRole | null): boolean =>
  role === 'pharmacy' || role === 'cosmetic';
export const isVendor = (user: AuthUser | null): boolean => isVendorRole(user?.role);
