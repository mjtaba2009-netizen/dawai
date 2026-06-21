import { supabase } from "./supabaseClient";

// الدلاء (Buckets) القياسية في Supabase Storage
export const BUCKETS = {
  certificates: "certificates", // شهادات/تراخيص الصيدليات
  prescriptions: "prescriptions", // صور الوصفات الطبية
  medicines: "medicine-images", // صور المنتجات/الأدوية
};

/**
 * رفع ملف صورة إلى دلو محدد وإرجاع الرابط العام.
 * @param {string} bucket اسم الدلو (استخدم ثوابت BUCKETS)
 * @param {File|Blob} file الملف المراد رفعه
 * @param {string} [path] مسار/اسم اختياري داخل الدلو
 * @returns {Promise<string>} الرابط العام للملف
 */
export async function uploadImage(bucket, file, path) {
  const ext = (file?.name?.split(".").pop() || "png").toLowerCase();
  const key = path || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

/** رفع شهادة/ترخيص صيدلية */
export const uploadCertificate = (file, path) =>
  uploadImage(BUCKETS.certificates, file, path);

/** رفع صورة وصفة طبية */
export const uploadPrescription = (file, path) =>
  uploadImage(BUCKETS.prescriptions, file, path);

/** رفع صورة منتج/دواء */
export const uploadMedicineImage = (file, path) =>
  uploadImage(BUCKETS.medicines, file, path);

/** حذف ملف من دلو */
export async function deleteFile(bucket, key) {
  const { error } = await supabase.storage.from(bucket).remove([key]);
  if (error) throw error;
}
