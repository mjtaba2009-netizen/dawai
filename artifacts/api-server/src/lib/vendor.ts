// أنواع البائعين والفئات المسموح بها لكل نوع — مصدر الحقيقة على الخادم
// Pharmacy = صيدلية، Cosmetic = كوزماتك (متجر مستحضرات تجميل)

export const VENDOR_CATEGORIES = {
  pharmacy: ["مسكنات", "مضادات حيوية", "فيتامينات", "أمراض مزمنة", "أجهزة طبية"],
  cosmetic: ["فيتامينات", "سكن كير", "مكياج"],
} as const;

export type VendorType = keyof typeof VENDOR_CATEGORIES;

export const VENDOR_TYPES: VendorType[] = ["pharmacy", "cosmetic"];

export function isVendorRole(role: string | null | undefined): role is VendorType {
  return role === "pharmacy" || role === "cosmetic";
}

/** نرفض روابط فيسبوك — المنصة تعتمد إنستغرام/تيك توك فقط للبائعين */
export function isFacebookUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return /(facebook\.com|fb\.com|fb\.me|fbcdn|messenger\.com)/i.test(url);
}

/** هل الفئة مسموح بها لنوع البائع المحدد؟ */
export function isCategoryAllowed(type: VendorType, category: string): boolean {
  return (VENDOR_CATEGORIES[type] as readonly string[]).includes(category);
}
