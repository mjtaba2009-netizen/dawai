import { supabase } from "./supabaseClient";
import { DEFAULT_GOVERNORATE, phoneToEmail } from "./constants";
import { upsertProfile, createVendor } from "./dbService";

const DEFAULT_ROLE = "patient";

export { DEFAULT_GOVERNORATE, phoneToEmail };

/**
 * تسجيل الدخول بالهاتف + كلمة المرور.
 * يُحوَّل الهاتف داخلياً إلى بريد اصطناعي ثابت للمصادقة عبر Supabase.
 * @param {string} phone
 * @param {string} password
 */
export async function login(phone, password) {
  const email = phoneToEmail(phone);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

/**
 * إنشاء حساب جديد مع دعم الأدوار (مريض / صيدلية / كوزماتك).
 * للبائعين يُنشأ سجل المتجر أولاً ثم يُربَط بالملف الشخصي.
 * يتطلب إيقاف "تأكيد البريد" في إعدادات Supabase Auth حتى تُنشأ الجلسة فوراً.
 * @param {object} params
 */
export async function register({
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
}) {
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
  let pharmacyId = null;

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
    pharmacyId = vendor?.id ?? null;
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
export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * التحقق من رمز OTP — غير مستخدم في وضع (هاتف + كلمة مرور).
 * محفوظ للاكتمال المعماري وللتوسعة المستقبلية إن فُعّل مزوّد SMS.
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
