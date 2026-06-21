// ثوابت مشتركة لطبقة خدمات Supabase

// المحافظة الافتراضية — تبقى "البصرة" دائماً كقيمة احتياطية
export const DEFAULT_GOVERNORATE = "البصرة";

// نطاق البريد الاصطناعي المستخدم لتحويل رقم الهاتف إلى هوية مصادقة في Supabase
// (يبقي تجربة الدخول كما هي: هاتف + كلمة مرور، دون الحاجة لرسائل SMS)
export const SYNTH_EMAIL_DOMAIN = "phone.dawai.app";

/** تحويل رقم الهاتف إلى بريد اصطناعي ثابت لاستخدامه مع مصادقة Supabase */
export function phoneToEmail(phone: string): string {
  const digits = String(phone ?? "").replace(/\D/g, "");
  return `${digits}@${SYNTH_EMAIL_DOMAIN}`;
}

/** توليد رمز تتبّع للطلب بالصيغة ‎#DW-XXXX */
export function generateTrackingCode(): string {
  return `#DW-${Math.floor(1000 + Math.random() * 9000)}`;
}
