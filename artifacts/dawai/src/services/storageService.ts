import { supabase } from "./supabaseClient";

// الدلاء (Buckets) القياسية في Supabase Storage
export const BUCKETS = {
  certificates: "certificates", // شهادات/تراخيص الصيدليات
  prescriptions: "prescriptions", // صور الوصفات الطبية
  medicines: "medicine-images", // صور المنتجات/الأدوية
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

/**
 * رفع ملف صورة إلى دلو محدد وإرجاع الرابط العام.
 */
export async function uploadImage(
  bucket: string,
  file: File | Blob,
  path?: string,
): Promise<string> {
  const name = file instanceof File ? file.name : "";
  const ext = (name.split(".").pop() || "png").toLowerCase();
  const key = path || `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(key, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(key);
  return data.publicUrl;
}

/** رفع شهادة/ترخيص صيدلية */
export const uploadCertificate = (file: File | Blob, path?: string) =>
  uploadImage(BUCKETS.certificates, file, path);

/** رفع صورة وصفة طبية */
export const uploadPrescription = (file: File | Blob, path?: string) =>
  uploadImage(BUCKETS.prescriptions, file, path);

/** رفع صورة منتج/دواء */
export const uploadMedicineImage = (file: File | Blob, path?: string) =>
  uploadImage(BUCKETS.medicines, file, path);

/** حذف ملف من دلو */
export async function deleteFile(bucket: string, key: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([key]);
  if (error) throw error;
}
