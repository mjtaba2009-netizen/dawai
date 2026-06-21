import { createClient } from "@supabase/supabase-js";

// متغيرات البيئة الخاصة بـ Supabase — تُحقن وقت البناء عبر Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// هل ضُبطت بيانات Supabase؟ تُستخدم للحماية قبل اكتمال الربط
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn(
    "[supabase] لم تُضبط VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY بعد — " +
      "اربط مشروع Supabase لتفعيل خدمات المصادقة وقاعدة البيانات والتخزين.",
  );
}

// نمرّر قيماً احتياطية صالحة الشكل لتفادي تعطّل الإقلاع قبل ضبط المتغيرات
export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export default supabase;
