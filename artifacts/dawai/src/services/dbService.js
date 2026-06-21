import { supabase } from "./supabaseClient";
import { DEFAULT_GOVERNORATE } from "./constants";

// ===================== Profiles (ملفات المستخدمين) =====================

/** إنشاء/تحديث الملف الشخصي للمستخدم (الدور، الحالة، ربط المتجر) */
export async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** جلب الملف الشخصي بمعرّف المستخدم */
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ===================== Pharmacies (الصيدليات/المتاجر) =====================

/** إنشاء متجر جديد (صيدلية/كوزماتك) عند تسجيل بائع */
export async function createVendor({
  ownerId,
  name,
  type = "pharmacy",
  governorate = DEFAULT_GOVERNORATE,
  address = null,
  phone = null,
  whatsapp = null,
  instagram = null,
  tiktok = null,
  imageUrl = null,
}) {
  const { data, error } = await supabase
    .from("pharmacies")
    .insert({
      owner_id: ownerId,
      name,
      type,
      governorate: governorate || DEFAULT_GOVERNORATE,
      address,
      phone,
      whatsapp,
      instagram,
      tiktok,
      image_url: imageUrl,
      status: "approved",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** المتاجر المعلّقة بانتظار الموافقة */
export async function getPendingPharmacies() {
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** الموافقة على متجر */
export async function approvePharmacy(pharmacyId) {
  const { data, error } = await supabase
    .from("pharmacies")
    .update({ status: "approved" })
    .eq("id", pharmacyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** تحديث ملف المتجر — مع إبقاء "البصرة" كقيمة احتياطية للمحافظة */
export async function updatePharmacyProfile(pharmacyId, updates) {
  const payload = { ...updates };
  if (payload.governorate !== undefined && !payload.governorate) {
    payload.governorate = DEFAULT_GOVERNORATE;
  }
  const { data, error } = await supabase
    .from("pharmacies")
    .update(payload)
    .eq("id", pharmacyId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** ملف متجر عام بالمعرّف */
export async function getPharmacy(pharmacyId) {
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .eq("id", pharmacyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** المتاجر القريبة/المتاحة */
export async function getNearbyPharmacies() {
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .order("distance", { ascending: true });
  if (error) throw error;
  return data;
}

// ===================== Medicines (الأدوية/المنتجات) =====================

/** إضافة منتج إلى مخزون المتجر */
export async function addToInventory({ pharmacyId, medicationId, price, quantity }) {
  const { data, error } = await supabase
    .from("pharmacy_medications")
    .insert({
      pharmacy_id: pharmacyId,
      medication_id: medicationId,
      price,
      quantity,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** إنشاء دواء/منتج جديد في الكتالوج */
export async function createMedication(med) {
  const { data, error } = await supabase
    .from("medications")
    .insert(med)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** الكتالوج العام للأدوية/المنتجات */
export async function fetchCatalog() {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** بحث في الكتالوج بالاسم/الاسم العلمي */
export async function searchMedications(query) {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from("medications")
    .select("*, pharmacy_medications(*, pharmacy:pharmacies(*))")
    .or(`name.ilike.${q},generic_name.ilike.${q}`);
  if (error) throw error;
  return data;
}

/** مخزون متجر محدد (مع تفاصيل الدواء) */
export async function getPharmacyInventory(pharmacyId) {
  const { data, error } = await supabase
    .from("pharmacy_medications")
    .select("*, medication:medications(*)")
    .eq("pharmacy_id", pharmacyId);
  if (error) throw error;
  return data;
}

/** تحديث صف مخزون */
export async function updateInventoryItem(itemId, updates) {
  const { data, error } = await supabase
    .from("pharmacy_medications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", itemId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** حذف صف مخزون */
export async function deleteInventoryItem(itemId) {
  const { error } = await supabase
    .from("pharmacy_medications")
    .delete()
    .eq("id", itemId);
  if (error) throw error;
}

// ===================== Orders (الطلبات / لوحة كانبان) =====================

/** إنشاء طلب جديد */
export async function placeOrder({
  userId,
  pharmacyId,
  medicationId,
  quantity,
  totalPrice,
  trackingCode,
}) {
  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      pharmacy_id: pharmacyId,
      medication_id: medicationId,
      quantity,
      total_price: totalPrice,
      tracking_code: trackingCode,
      status: "pending",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** تحديث حالة الطلب (لوحة كانبان: pending/confirmed/ready/rejected/delivered/received) */
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** طلبات مستخدم (مريض) */
export async function getOrders(userId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, medication:medications(*), pharmacy:pharmacies(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** طلبات واردة لمتجر */
export async function getPharmacyOrders(pharmacyId) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, medication:medications(*)")
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

// ===================== Notifications (الإشعارات) =====================

/** إشعارات المستخدم */
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

/** تعليم إشعار كمقروء */
export async function markNotificationRead(notificationId) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
