// الأشكال (Shapes) التي تستهلكها واجهة المستخدم — بصيغة camelCase.
// تتولّى دوال dbService تحويل صفوف Supabase (snake_case) إلى هذه الأنواع.

export type UserRole = "patient" | "pharmacy" | "cosmetic";
export type VendorType = "pharmacy" | "cosmetic";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "ready"
  | "rejected"
  | "delivered"
  | "received";

export interface Profile {
  id: string;
  name: string | null;
  phone: string | null;
  role: UserRole;
  status: string;
  pharmacyId: number | null;
  avatar: string | null;
}

export interface Pharmacy {
  id: number;
  name: string;
  type: VendorType;
  address: string | null;
  governorate: string;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  tiktok: string | null;
  rating: number;
  distance: number;
  isOpen: boolean;
  imageUrl: string | null;
}

export interface Medication {
  id: number;
  name: string;
  genericName: string | null;
  category: string | null;
  description: string | null;
  requiresPrescription: boolean;
  imageUrl: string | null;
}

/** عنصر كتالوج مسطّح: دواء متوفّر لدى متجر معيّن (الصفحة الرئيسية) */
export interface CatalogItem {
  id: number; // pharmacy_medications.id
  medicationId: number;
  name: string;
  genericName: string | null;
  category: string | null;
  requiresPrescription: boolean;
  imageUrl: string | null;
  price: number;
  quantity: number;
  pharmacyId: number;
  pharmacyName: string;
  pharmacyType: VendorType;
}

/** عرض متجر لدواء معيّن (نتائج البحث) */
export interface PharmacyOffer {
  pharmacyId: number;
  pharmacyName: string;
  type: VendorType;
  address: string | null;
  price: number;
  quantity: number;
  distance: number;
  rating: number;
  whatsapp: string | null;
  isOpen: boolean;
}

export interface SearchResult extends Medication {
  pharmacies: PharmacyOffer[];
}

/** صف مخزون مع تفاصيل الدواء (لوحة التحكم + ملف المتجر) */
export interface InventoryItem {
  id: number; // pharmacy_medications.id
  price: number;
  quantity: number;
  medication: Medication;
}

/** طلب المريض */
export interface Order {
  id: number;
  status: OrderStatus;
  quantity: number;
  totalPrice: number;
  trackingCode: string | null;
  createdAt: string;
  medication: {
    id: number;
    name: string;
    genericName: string | null;
    imageUrl: string | null;
    requiresPrescription: boolean;
  } | null;
  pharmacy: {
    id: number;
    name: string;
    type: VendorType;
    phone: string | null;
    whatsapp: string | null;
  } | null;
}

/** طلب وارد على لوحة كانبان للمتجر */
export interface KanbanOrder {
  id: number;
  status: OrderStatus;
  trackingCode: string | null;
  quantity: number;
  totalPrice: number;
  createdAt: string;
  medication: {
    name: string;
    genericName: string | null;
    requiresPrescription: boolean;
  } | null;
}

export interface AppNotification {
  id: number;
  title: string | null;
  message: string | null;
  type: string;
  isRead: boolean;
  createdAt: string;
}
