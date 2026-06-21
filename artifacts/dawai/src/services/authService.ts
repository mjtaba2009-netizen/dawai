import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { DEFAULT_GOVERNORATE, phoneToEmail } from "./constants";
import { upsertProfile, createVendor } from "./dbService";
import type { UserRole } from "./types";

const DEFAULT_ROLE: UserRole = "patient";

export { DEFAULT_GOVERNORATE, phoneToEmail };

/**
 * تسجيل الدخول بالهاتف + كلمة المرور.
 * يُحوَّل الهاتف داخلياً إلى بريد اصطناعي ثابت للمصادقة عبر Supabase.
 */
export async function login(phone: string, password: string) {
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

interface RegisterParams {
  phone: string;
  password: string;
  name: string;
  role?: UserRole;
  vendorName?: string | null;
  governorate?: string | null;
  address?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  imageUrl?: string | null;
}

/**
 * إنشاء حساب جديد مع دعم الأدوار (مريض / صيدلية / كوزماتك).
 * للبائعين يُنشأ سجل المتجر أولاً ثم يُربَط بالملف الشخصي.
 * يتطلب إيقاف "تأكيد البريد" في إعدادات Supabase Auth حتى تُنشأ الجلسة فوراً.
 */
export async function register(
  params: RegisterParams,
): Promise<{ user: User; pharmacyId: number | null; role: UserRole }> {
  const {
    phone,
    password,
    name,
    role = DEFAULT_ROLE,
    vendorName = null,
    governorate = DEFAULT_GOVERNORATE,
    address = null,
    whatsapp = null,
    instagram = null,
    tiktok = null,
    imageUrl = null,
  } = params;

  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, phone, role } },
  });
  if (error) throw error;

  const user = data.user;
  if (!user) throw new Error("تعذّر إنشاء الحساب.");
  if (!data.session) {
    // لم تُنشأ جلسة → غالباً "تأكيد البريد" ما زال مفعّلاً في إعدادات Supabase
    throw new Error(
      "تعذّر إكمال التسجيل: يجب إيقاف تأكيد البريد في إعدادات Supabase Auth.",
    );
  }

  const isVendor = role === "pharmacy" || role === "cosmetic";
  let pharmacyId: number | null = null;

  if (isVendor) {
    const vendor = await createVendor({
      ownerId: user.id,
      name: vendorName || name,
      type: role === "cosmetic" ? "cosmetic" : "pharmacy",
      governorate: governorate || DEFAULT_GOVERNORATE,
      address,
      phone,
      whatsapp,
      instagram,
      tiktok,
      imageUrl,
    });
    pharmacyId = vendor.id;
  }

  await upsertProfile({
    id: user.id,
    name,
    phone,
    role,
    status: isVendor ? "approved_pending_signature" : "active",
    pharmacy_id: pharmacyId,
  });

  return { user, pharmacyId, role };
}

/** تسجيل الخروج وإنهاء الجلسة */
export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * التحقق من رمز OTP — غير مستخدم في وضع (هاتف + كلمة مرور).
 * محفوظ للاكتمال المعماري وللتوسعة المستقبلية إن فُعّل مزوّد SMS.
 */
export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) throw error;
  return data;
}

/** المستخدم الحالي (أو null) */
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

/** الجلسة الحالية (أو null) */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** الاشتراك في تغيّرات حالة المصادقة */
export function onAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void,
) {
  return supabase.auth.onAuthStateChange((event, session) =>
    callback(event, session),
  );
}
