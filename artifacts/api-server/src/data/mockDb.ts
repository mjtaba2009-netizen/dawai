/**
 * Mock Database — دوائي Automation System
 * ──────────────────────────────────────────────────────────────
 * قاعدة بيانات وهمية في الذاكرة (In-Memory) للمحاكاة والتطوير.
 * الفرع الافتراضي الأول: Gmunden
 *
 * ملاحظات:
 *  - لا يوجد أي ارتباط بـ Facebook — التواصل عبر TikTok و Instagram فقط
 *  - يُعاد تهيئتها عند إعادة تشغيل الخادم (غير دائمة)
 *  - للإنتاج: استبدل بـ PostgreSQL عبر Drizzle ORM الموجود مسبقاً
 */

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
export interface MockPharmacy {
  id: number;
  name: string;
  branch: string;
  address: string;
  phone: string;
  /** رابط TikTok — بديل Facebook */
  tiktok: string;
  /** رابط Instagram */
  instagram: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface MockMedication {
  id: number;
  name: string;
  nameAr: string;
  category: string;
  requiresPrescription: boolean;
}

export interface MockInventoryItem {
  id: number;
  pharmacyId: number;
  medicationId: number;
  price: number;
  quantity: number;
}

export interface MockOrder {
  id: number;
  pharmacyId: number;
  medicationId: number;
  quantity: number;
  totalPrice: number;
  patientPhone: string;
  status: "pending" | "confirmed" | "rejected" | "timeout" | "routed" | "completed";
  createdAt: string;
  updatedAt: string;
  routedToPharmacyId?: number;
}

export interface MockWhatsAppLog {
  id: number;
  phone: string;
  message: string;
  orderId: number;
  sentAt: string;
  status: "sent" | "failed";
}

// ═══════════════════════════════════════════════════════════════
// الصيدليات — Gmunden كفرع افتراضي
// ═══════════════════════════════════════════════════════════════
export const pharmacies: MockPharmacy[] = [
  {
    id: 1,
    name: "صيدلية دوائي — فرع غموندن",
    branch: "Gmunden",
    address: "Rathausplatz 1, 4810 Gmunden, Austria",
    phone: "+43 7612 12345",
    tiktok: "https://www.tiktok.com/@dawai.gmunden",
    instagram: "https://www.instagram.com/dawai.gmunden",
    isDefault: true,
    isActive: true,
  },
  {
    id: 2,
    name: "صيدلية دوائي — فرع لينز",
    branch: "Linz",
    address: "Hauptplatz 10, 4020 Linz, Austria",
    phone: "+43 732 98765",
    tiktok: "https://www.tiktok.com/@dawai.linz",
    instagram: "https://www.instagram.com/dawai.linz",
    isDefault: false,
    isActive: true,
  },
  {
    id: 3,
    name: "صيدلية دوائي — فرع فيينا",
    branch: "Vienna",
    address: "Mariahilfer Str. 50, 1060 Wien, Austria",
    phone: "+43 1 5678901",
    tiktok: "https://www.tiktok.com/@dawai.vienna",
    instagram: "https://www.instagram.com/dawai.vienna",
    isDefault: false,
    isActive: true,
  },
  {
    id: 4,
    name: "صيدلية دوائي — فرع زالتسبورغ",
    branch: "Salzburg",
    address: "Getreidegasse 9, 5020 Salzburg, Austria",
    phone: "+43 662 44556",
    tiktok: "https://www.tiktok.com/@dawai.salzburg",
    instagram: "https://www.instagram.com/dawai.salzburg",
    isDefault: false,
    isActive: true,
  },
];

// ═══════════════════════════════════════════════════════════════
// الأدوية
// ═══════════════════════════════════════════════════════════════
export const medications: MockMedication[] = [
  { id: 1,  name: "Paracetamol",   nameAr: "باراسيتامول",   category: "مسكن",       requiresPrescription: false },
  { id: 2,  name: "Amoxicillin",   nameAr: "أموكسيسيلين",   category: "مضاد حيوي", requiresPrescription: true  },
  { id: 3,  name: "Ibuprofen",     nameAr: "إيبوبروفين",    category: "مسكن",       requiresPrescription: false },
  { id: 4,  name: "Metformin",     nameAr: "ميتفورمين",      category: "سكري",       requiresPrescription: true  },
  { id: 5,  name: "Omeprazole",    nameAr: "أوميبرازول",    category: "معدة",       requiresPrescription: false },
  { id: 6,  name: "Atorvastatin",  nameAr: "أتورفاستاتين",  category: "ضغط",        requiresPrescription: true  },
  { id: 7,  name: "Cetirizine",    nameAr: "سيتيريزين",     category: "حساسية",     requiresPrescription: false },
  { id: 8,  name: "Azithromycin",  nameAr: "أزيثرومايسين",  category: "مضاد حيوي", requiresPrescription: true  },
];

// ═══════════════════════════════════════════════════════════════
// المخزون الافتراضي — فرع Gmunden (pharmacyId: 1)
// ═══════════════════════════════════════════════════════════════
export const inventory: MockInventoryItem[] = [
  { id: 1,  pharmacyId: 1, medicationId: 1, price: 5.50,  quantity: 120 },
  { id: 2,  pharmacyId: 1, medicationId: 2, price: 18.00, quantity: 45  },
  { id: 3,  pharmacyId: 1, medicationId: 3, price: 7.25,  quantity: 80  },
  { id: 4,  pharmacyId: 1, medicationId: 4, price: 12.00, quantity: 60  },
  { id: 5,  pharmacyId: 1, medicationId: 5, price: 9.75,  quantity: 95  },
  { id: 6,  pharmacyId: 2, medicationId: 1, price: 5.75,  quantity: 200 },
  { id: 7,  pharmacyId: 2, medicationId: 3, price: 7.00,  quantity: 150 },
  { id: 8,  pharmacyId: 2, medicationId: 5, price: 10.00, quantity: 110 },
  { id: 9,  pharmacyId: 3, medicationId: 2, price: 19.00, quantity: 35  },
  { id: 10, pharmacyId: 3, medicationId: 6, price: 22.50, quantity: 25  },
  { id: 11, pharmacyId: 4, medicationId: 7, price: 8.50,  quantity: 75  },
  { id: 12, pharmacyId: 4, medicationId: 8, price: 16.00, quantity: 40  },
];

// ═══════════════════════════════════════════════════════════════
// الطلبات (تبدأ فارغة — تُملأ عند وقت التشغيل)
// ═══════════════════════════════════════════════════════════════
export const orders: MockOrder[] = [];

// ═══════════════════════════════════════════════════════════════
// سجل رسائل واتساب المحاكاة
// ═══════════════════════════════════════════════════════════════
export const whatsappLog: MockWhatsAppLog[] = [];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

/** جلب صيدلية بمعرّفها */
export function getPharmacy(id: number): MockPharmacy | undefined {
  return pharmacies.find((p) => p.id === id);
}

/** جلب أقرب صيدلية بديلة نشطة (تختلف عن الأصلية) */
export function getFallbackPharmacy(excludeId: number): MockPharmacy | undefined {
  return pharmacies.find((p) => p.id !== excludeId && p.isActive);
}

/** جلب مخزون دواء في صيدلية محددة */
export function getInventoryItem(
  pharmacyId: number,
  medicationId: number,
): MockInventoryItem | undefined {
  return inventory.find(
    (i) => i.pharmacyId === pharmacyId && i.medicationId === medicationId,
  );
}

/** خصم كمية من المخزون — يُعيد false إذا كانت الكمية غير كافية */
export function deductInventory(
  pharmacyId: number,
  medicationId: number,
  qty: number,
): { success: boolean; remaining: number; message: string } {
  const item = getInventoryItem(pharmacyId, medicationId);

  if (!item) {
    return {
      success: false,
      remaining: 0,
      message: `الدواء ${medicationId} غير موجود في مخزون الصيدلية ${pharmacyId}`,
    };
  }

  if (item.quantity < qty) {
    return {
      success: false,
      remaining: item.quantity,
      message: `الكمية المطلوبة (${qty}) تتجاوز المخزون المتاح (${item.quantity})`,
    };
  }

  item.quantity -= qty;

  return {
    success: true,
    remaining: item.quantity,
    message: `✅ تم خصم ${qty} وحدة. المتبقي: ${item.quantity}`,
  };
}

/** توجيه طلب لصيدلية بديلة — يُحدّث الطلب في المصفوفة */
export function routeOrderToFallback(
  orderId: number,
  fromPharmacyId: number,
): { success: boolean; fallbackPharmacy?: MockPharmacy; message: string } {
  const order = orders.find((o) => o.id === orderId);
  const fallback = getFallbackPharmacy(fromPharmacyId);

  if (!fallback) {
    return { success: false, message: "لا توجد صيدليات بديلة متاحة" };
  }

  if (order) {
    order.pharmacyId = fallback.id;
    order.status = "routed";
    order.routedToPharmacyId = fallback.id;
    order.updatedAt = new Date().toISOString();
  }

  return {
    success: true,
    fallbackPharmacy: fallback,
    message: `🔁 تم توجيه الطلب من "${getPharmacy(fromPharmacyId)?.branch}" إلى "${fallback.branch}"`,
  };
}

/** إضافة طلب جديد */
export function addOrder(order: Omit<MockOrder, "createdAt" | "updatedAt">): MockOrder {
  const now = new Date().toISOString();
  const newOrder: MockOrder = { ...order, createdAt: now, updatedAt: now };
  orders.push(newOrder);
  return newOrder;
}

/** تسجيل رسالة واتساب */
export function logWhatsApp(entry: Omit<MockWhatsAppLog, "id" | "sentAt">): MockWhatsAppLog {
  const log: MockWhatsAppLog = {
    ...entry,
    id: whatsappLog.length + 1,
    sentAt: new Date().toISOString(),
  };
  whatsappLog.push(log);
  return log;
}
