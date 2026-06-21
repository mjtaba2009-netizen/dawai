import { supabase } from "./supabaseClient";
import { DEFAULT_GOVERNORATE, generateTrackingCode } from "./constants";
import type {
  Pharmacy,
  Medication,
  CatalogItem,
  PharmacyOffer,
  SearchResult,
  InventoryItem,
  Order,
  KanbanOrder,
  AppNotification,
  Profile,
  OrderStatus,
  VendorType,
} from "./types";

// أي صف خام قادم من Supabase (عميل غير مُنمّط) — التحويل يتم عبر المُحوّلات أدناه.
type Row = Record<string, any>;

// ===================== مُحوّلات (snake_case → camelCase) =====================

const num = (v: unknown, d = 0): number =>
  v === null || v === undefined || Number.isNaN(Number(v)) ? d : Number(v);

const vendorType = (t: unknown): VendorType =>
  t === "cosmetic" ? "cosmetic" : "pharmacy";

function mapPharmacy(r: Row): Pharmacy {
  return {
    id: r.id,
    name: r.name,
    type: vendorType(r.type),
    address: r.address ?? null,
    governorate: r.governorate ?? DEFAULT_GOVERNORATE,
    phone: r.phone ?? null,
    whatsapp: r.whatsapp ?? null,
    instagram: r.instagram ?? null,
    tiktok: r.tiktok ?? null,
    rating: num(r.rating),
    distance: num(r.distance),
    isOpen: r.is_open ?? true,
    imageUrl: r.image_url ?? null,
  };
}

function mapMedication(r: Row): Medication {
  return {
    id: r.id,
    name: r.name,
    genericName: r.generic_name ?? null,
    category: r.category ?? null,
    description: r.description ?? null,
    requiresPrescription: Boolean(r.requires_prescription),
    imageUrl: r.image_url ?? null,
  };
}

function mapInventoryItem(r: Row): InventoryItem {
  return {
    id: r.id,
    price: num(r.price),
    quantity: num(r.quantity),
    medication: mapMedication(r.medication),
  };
}

function mapOrder(r: Row): Order {
  return {
    id: r.id,
    status: r.status as OrderStatus,
    quantity: num(r.quantity, 1),
    totalPrice: num(r.total_price),
    trackingCode: r.tracking_code ?? null,
    createdAt: r.created_at,
    medication: r.medication
      ? {
          id: r.medication.id,
          name: r.medication.name,
          genericName: r.medication.generic_name ?? null,
          imageUrl: r.medication.image_url ?? null,
          requiresPrescription: Boolean(r.medication.requires_prescription),
        }
      : null,
    pharmacy: r.pharmacy
      ? {
          id: r.pharmacy.id,
          name: r.pharmacy.name,
          type: vendorType(r.pharmacy.type),
          phone: r.pharmacy.phone ?? null,
          whatsapp: r.pharmacy.whatsapp ?? null,
        }
      : null,
  };
}

function mapKanbanOrder(r: Row): KanbanOrder {
  return {
    id: r.id,
    status: r.status as OrderStatus,
    trackingCode: r.tracking_code ?? null,
    quantity: num(r.quantity, 1),
    totalPrice: num(r.total_price),
    createdAt: r.created_at,
    medication: r.medication
      ? {
          name: r.medication.name,
          genericName: r.medication.generic_name ?? null,
          requiresPrescription: Boolean(r.medication.requires_prescription),
        }
      : null,
  };
}

function mapNotification(r: Row): AppNotification {
  return {
    id: r.id,
    title: r.title ?? null,
    message: r.message ?? null,
    type: r.type ?? "system",
    isRead: Boolean(r.is_read),
    createdAt: r.created_at,
  };
}

// ===================== Profiles (ملفات المستخدمين) =====================

/** إنشاء/تحديث الملف الشخصي للمستخدم (الدور، الحالة، ربط المتجر) */
export async function upsertProfile(profile: Row): Promise<Row> {
  const { data, error } = await supabase
    .from("profiles")
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** جلب الملف الشخصي بمعرّف المستخدم */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name ?? null,
    phone: data.phone ?? null,
    role: data.role,
    status: data.status,
    pharmacyId: data.pharmacy_id ?? null,
    avatar: data.avatar ?? null,
  };
}

/** تحديث حالة الملف الشخصي (مثلاً التفعيل بعد التوقيع) */
export async function updateProfileStatus(
  userId: string,
  status: string,
): Promise<Profile | null> {
  const { error } = await supabase
    .from("profiles")
    .update({ status })
    .eq("id", userId);
  if (error) throw error;
  return getProfile(userId);
}

// ===================== Pharmacies (الصيدليات/المتاجر) =====================

interface CreateVendorInput {
  ownerId: string;
  name: string;
  type?: VendorType;
  governorate?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  imageUrl?: string | null;
}

/** إنشاء متجر جديد (صيدلية/كوزماتك) عند تسجيل بائع */
export async function createVendor(input: CreateVendorInput): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from("pharmacies")
    .insert({
      owner_id: input.ownerId,
      name: input.name,
      type: input.type ?? "pharmacy",
      governorate: input.governorate || DEFAULT_GOVERNORATE,
      address: input.address ?? null,
      phone: input.phone ?? null,
      whatsapp: input.whatsapp ?? null,
      instagram: input.instagram ?? null,
      tiktok: input.tiktok ?? null,
      image_url: input.imageUrl ?? null,
      status: "approved",
    })
    .select()
    .single();
  if (error) throw error;
  return { id: data.id };
}

/** تحديث ملف المتجر — مع إبقاء "البصرة" كقيمة احتياطية للمحافظة */
export async function updatePharmacyProfile(
  pharmacyId: number,
  updates: Row,
): Promise<Pharmacy> {
  const payload: Row = { ...updates };
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
  return mapPharmacy(data);
}

/** ملف متجر عام بالمعرّف */
export async function getPharmacy(pharmacyId: number): Promise<Pharmacy | null> {
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .eq("id", pharmacyId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPharmacy(data) : null;
}

/** المتاجر القريبة/المتاحة */
export async function getNearbyPharmacies(): Promise<Pharmacy[]> {
  const { data, error } = await supabase
    .from("pharmacies")
    .select("*")
    .order("distance", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapPharmacy);
}

// ===================== Medicines (الأدوية/المنتجات) =====================

/** إنشاء دواء/منتج جديد في الكتالوج */
export async function createMedication(med: Row): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from("medications")
    .insert(med)
    .select()
    .single();
  if (error) throw error;
  return { id: data.id };
}

/** الأدوية المتوفّرة (كتالوج مسطّح: دواء × متجر مع سعر وكمية) */
export async function getAvailableMedications(): Promise<CatalogItem[]> {
  const { data, error } = await supabase
    .from("pharmacy_medications")
    .select(
      "id, price, quantity, medication:medications(*), pharmacy:pharmacies(id,name,type)",
    )
    .gt("quantity", 0);
  if (error) throw error;
  return (data ?? [])
    .filter((r: Row) => r.medication && r.pharmacy)
    .map(
      (r: Row): CatalogItem => ({
        id: r.id,
        medicationId: r.medication.id,
        name: r.medication.name,
        genericName: r.medication.generic_name ?? null,
        category: r.medication.category ?? null,
        requiresPrescription: Boolean(r.medication.requires_prescription),
        imageUrl: r.medication.image_url ?? null,
        price: num(r.price),
        quantity: num(r.quantity),
        pharmacyId: r.pharmacy.id,
        pharmacyName: r.pharmacy.name,
        pharmacyType: vendorType(r.pharmacy.type),
      }),
    );
}

/** بحث في الكتالوج بالاسم/الاسم العلمي مع عروض المتاجر */
export async function searchMedications(query: string): Promise<SearchResult[]> {
  const q = `%${query}%`;
  const { data, error } = await supabase
    .from("medications")
    .select("*, pharmacy_medications(price, quantity, pharmacy:pharmacies(*))")
    .or(`name.ilike.${q},generic_name.ilike.${q}`);
  if (error) throw error;
  return (data ?? []).map(
    (m: Row): SearchResult => ({
      ...mapMedication(m),
      pharmacies: (m.pharmacy_medications ?? [])
        .filter((pm: Row) => pm.pharmacy)
        .map(
          (pm: Row): PharmacyOffer => ({
            pharmacyId: pm.pharmacy.id,
            pharmacyName: pm.pharmacy.name,
            type: vendorType(pm.pharmacy.type),
            address: pm.pharmacy.address ?? null,
            price: num(pm.price),
            quantity: num(pm.quantity),
            distance: num(pm.pharmacy.distance),
            rating: num(pm.pharmacy.rating),
            whatsapp: pm.pharmacy.whatsapp ?? null,
            isOpen: pm.pharmacy.is_open ?? true,
          }),
        ),
    }),
  );
}

/** مخزون متجر محدد (مع تفاصيل الدواء) */
export async function getPharmacyInventory(
  pharmacyId: number,
): Promise<InventoryItem[]> {
  const { data, error } = await supabase
    .from("pharmacy_medications")
    .select("id, price, quantity, medication:medications(*)")
    .eq("pharmacy_id", pharmacyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).filter((r: Row) => r.medication).map(mapInventoryItem);
}

interface AddCustomInventoryInput {
  pharmacyId: number;
  name: string;
  genericName?: string | null;
  category?: string | null;
  requiresPrescription?: boolean;
  imageUrl?: string | null;
  price: number;
  quantity: number;
}

/** إضافة منتج مخصّص إلى مخزون المتجر (ينشئ الدواء ثم صف المخزون) */
export async function addCustomInventory(
  input: AddCustomInventoryInput,
): Promise<InventoryItem> {
  const med = await createMedication({
    name: input.name,
    generic_name: input.genericName ?? null,
    category: input.category ?? null,
    requires_prescription: Boolean(input.requiresPrescription),
    image_url: input.imageUrl ?? null,
  });
  const { data, error } = await supabase
    .from("pharmacy_medications")
    .insert({
      pharmacy_id: input.pharmacyId,
      medication_id: med.id,
      price: input.price,
      quantity: input.quantity,
    })
    .select("id, price, quantity, medication:medications(*)")
    .single();
  if (error) throw error;
  return mapInventoryItem(data);
}

/** تحديث صف مخزون (سعر/كمية) */
export async function updateInventoryItem(
  itemId: number,
  updates: { price?: number; quantity?: number },
): Promise<void> {
  const { error } = await supabase
    .from("pharmacy_medications")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", itemId);
  if (error) throw error;
}

/** حذف صف مخزون */
export async function deleteInventoryItem(itemId: number): Promise<void> {
  const { error } = await supabase
    .from("pharmacy_medications")
    .delete()
    .eq("id", itemId);
  if (error) throw error;
}

// ===================== Orders (الطلبات / لوحة كانبان) =====================

interface CreateOrderInput {
  pharmacyId: number;
  medicationId: number;
  quantity: number;
}

/** إنشاء طلب جديد — يحسب الإجمالي من سعر المخزون ويولّد رمز التتبّع */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("يجب تسجيل الدخول لإنشاء طلب");

  const { data: pm } = await supabase
    .from("pharmacy_medications")
    .select("price")
    .eq("pharmacy_id", input.pharmacyId)
    .eq("medication_id", input.medicationId)
    .maybeSingle();

  const unit = num(pm?.price);
  const quantity = Math.max(1, num(input.quantity, 1));

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      pharmacy_id: input.pharmacyId,
      medication_id: input.medicationId,
      quantity,
      total_price: unit * quantity,
      tracking_code: generateTrackingCode(),
      status: "pending",
    })
    .select("*, medication:medications(*), pharmacy:pharmacies(*)")
    .single();
  if (error) throw error;
  return mapOrder(data);
}

/** تحديث حالة الطلب (pending/confirmed/ready/rejected/delivered/received) */
export async function updateOrderStatus(
  orderId: number,
  status: OrderStatus,
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);
  if (error) throw error;
}

/** تأكيد استلام المريض للطلب */
export const markOrderReceived = (orderId: number): Promise<void> =>
  updateOrderStatus(orderId, "received");

/** طلبات مستخدم (مريض) */
export async function getOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, medication:medications(*), pharmacy:pharmacies(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

/** طلبات واردة لمتجر (لوحة كانبان) */
export async function getPharmacyOrders(
  pharmacyId: number,
): Promise<KanbanOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, medication:medications(*)")
    .eq("pharmacy_id", pharmacyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapKanbanOrder);
}

// ===================== Notifications (الإشعارات) =====================

/** إشعارات المستخدم */
export async function getNotifications(
  userId: string,
): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNotification);
}

/** تعليم إشعار كمقروء */
export async function markNotificationRead(
  notificationId: number,
): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);
  if (error) throw error;
}
