import { supabase } from "./supabaseClient";

// القيم الافتراضية — تبقى "البصرة" دائماً كقيمة احتياطية للمحافظة
const DEFAULT_ROLE = "patient";
export const DEFAULT_GOVERNORATE = "البصرة";

/**
 * تسجيل الدخول — يُرسل رمز تحقق (OTP) عبر SMS إلى رقم الهاتف.
 * يتطلب ضبط مزوّد SMS في إعدادات Supabase Auth.
 * @param {string} phone رقم الهاتف بصيغة دولية (E.164)
 */
export async function login(phone) {
  const { data, error } = await supabase.auth.signInWithOtp({ phone });
  if (error) throw error;
  return data;
}

/**
 * إنشاء حساب جديد مع دعم الأدوار (مريض / صيدلية / كوزماتك).
 * تُحفظ بيانات الملف الشخصي ضمن user_metadata ليُنشأ السجل بعد التحقق من OTP.
 * @param {object} params
 * @param {string} params.phone
 * @param {string} params.name
 * @param {"patient"|"pharmacy"|"cosmetic"} [params.role]
 */
export async function register({
  phone,
  name,
  role = DEFAULT_ROLE,
  vendorName = null,
  governorate = DEFAULT_GOVERNORATE,
  address = null,
  instagram = null,
  tiktok = null,
}) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: true,
      data: {
        name,
        role,
        vendor_name: vendorName,
        governorate: governorate || DEFAULT_GOVERNORATE,
        address,
        instagram,
        tiktok,
      },
    },
  });
  if (error) throw error;
  return data;
}

/**
 * التحقق من رمز OTP وإكمال تسجيل الدخول/التسجيل.
 * @param {string} phone
 * @param {string} token الرمز المُستلَم عبر SMS
 */
export async function verifyOTP(phone, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });
  if (error) throw error;
  return data;
}

/** تسجيل الخروج وإنهاء الجلسة */
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** المستخدم الحالي (أو null) */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

/** الجلسة الحالية (أو null) */
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** الاشتراك في تغيّرات حالة المصادقة */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
}
