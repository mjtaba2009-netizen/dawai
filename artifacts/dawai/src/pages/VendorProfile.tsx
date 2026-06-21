/**
 * VendorProfile — الصفحة العامة للبائع (/vendor/:id)
 * ─────────────────────────────────────────────────────────────────────────
 * تعرض: الاسم + نوع النشاط (صيدلية/كوزماتك)، المحافظة + العنوان،
 * أزرار التواصل (اتصال + واتساب + إنستغرام/تيك توك)، وشبكة منتجات زجاجية.
 * تعيد استخدام GET /pharmacies/:id و GET /pharmacies/:id/medications.
 */
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Phone, MessageCircle, Instagram, Music2,
  MapPin, Store, Sparkles, Pill, ShoppingCart, Clock,
} from "lucide-react";
import { usePharmacy, usePharmacyInventory } from "@/services/hooks";
import type { Pharmacy } from "@/services/types";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

function digitsOnly(s: string) {
  return s.replace(/[^\d+]/g, "");
}

function VendorTypeBadge({ type }: { type: Pharmacy["type"] }) {
  const isCosmetic = type === "cosmetic";
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
        isCosmetic ? "bg-pink-50 text-pink-600" : "bg-emerald-50 text-emerald-700"
      }`}
      data-testid="badge-vendor-type"
    >
      {isCosmetic ? <Sparkles className="w-3 h-3" /> : <Store className="w-3 h-3" />}
      {isCosmetic ? "متجر كوزماتك" : "صيدلية"}
    </span>
  );
}

function ContactButton({
  href, icon: Icon, label, classes, testId,
}: {
  href: string; icon: React.ElementType; label: string; classes: string; testId: string;
}) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileTap={{ scale: 0.96 }}
      whileHover={{ scale: 1.02 }}
      className={`flex-1 min-w-[72px] h-11 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold ${classes}`}
      data-testid={testId}
    >
      <Icon className="w-4 h-4" />
      {label}
    </motion.a>
  );
}

export function VendorProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cart = useCart();
  const { toast } = useToast();

  const vendorId = Number(id);
  const validId = Number.isFinite(vendorId) && vendorId > 0;

  const { data: vendor, isLoading: loadingVendor, isError } = usePharmacy(vendorId);
  const { data: products, isLoading: loadingProducts } = usePharmacyInventory(vendorId);

  const isCosmetic = vendor?.type === "cosmetic";

  const handleAdd = (p: NonNullable<typeof products>[number]) => {
    if (!vendor) return;
    cart.addItem({
      id: p.id,
      medicationId: p.medication.id,
      pharmacyId: vendor.id,
      pharmacyName: vendor.name,
      name: p.medication.name,
      price: p.price,
      requiresPrescription: p.medication.requiresPrescription ?? false,
      imageUrl: p.medication.imageUrl ?? null,
    });
    toast({ title: "✅ أُضيف إلى السلة", description: p.medication.name, duration: 2000 });
  };

  if (!validId || isError || (!loadingVendor && !vendor)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-muted/20 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <Store className="w-10 h-10 text-red-300" />
        </div>
        <h3 className="text-slate-700 font-bold text-lg mb-2">البائع غير موجود</h3>
        <button
          onClick={() => navigate("/home")}
          className="mt-3 px-5 h-11 rounded-xl bg-emerald-500 text-white font-bold text-sm"
          data-testid="button-back-home"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-muted/20" dir="rtl">
      {/* ── الترويسة الزجاجية ── */}
      <div className={`relative px-5 pt-10 pb-6 bg-gradient-to-br ${
        isCosmetic ? "from-pink-500 via-rose-500 to-fuchsia-600" : "from-emerald-500 via-emerald-600 to-teal-600"
      }`}>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-10 right-5 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white"
          data-testid="button-back"
          aria-label="رجوع"
        >
          <ArrowRight className="w-5 h-5" />
        </button>

        {loadingVendor ? (
          <div className="space-y-3 pt-2">
            <div className="h-6 w-1/2 bg-white/30 rounded-lg animate-pulse" />
            <div className="h-4 w-2/3 bg-white/20 rounded-lg animate-pulse" />
          </div>
        ) : vendor ? (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-2"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0">
                {isCosmetic ? <Sparkles className="w-7 h-7 text-white" /> : <Store className="w-7 h-7 text-white" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-white text-xl font-bold leading-tight truncate" data-testid="text-vendor-name">
                  {vendor.name}
                </h1>
                <div className="mt-1.5">
                  <VendorTypeBadge type={vendor.type} />
                </div>
              </div>
            </div>

            <div className="flex items-start gap-1.5 text-white/90 text-sm mt-3">
              <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span data-testid="text-vendor-location">
                {vendor.governorate}
                {vendor.address ? ` — ${vendor.address}` : ""}
              </span>
            </div>
          </motion.div>
        ) : null}
      </div>

      {/* ── أزرار التواصل ── */}
      {vendor && (
        <div className="px-4 -mt-3 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 shadow-[0_6px_24px_rgb(0,0,0,0.08)] border border-white/60 flex gap-2 flex-wrap"
          >
            {vendor.phone && (
              <ContactButton
                href={`tel:${digitsOnly(vendor.phone)}`}
                icon={Phone}
                label="اتصال"
                classes="bg-emerald-500 text-white shadow-[0_3px_10px_rgba(16,185,129,0.35)]"
                testId="button-call"
              />
            )}
            {vendor.whatsapp && (
              <ContactButton
                href={`https://wa.me/${digitsOnly(vendor.whatsapp).replace(/^\+/, "")}`}
                icon={MessageCircle}
                label="واتساب"
                classes="bg-green-500 text-white shadow-[0_3px_10px_rgba(34,197,94,0.35)]"
                testId="button-whatsapp"
              />
            )}
            {vendor.instagram && (
              <ContactButton
                href={vendor.instagram}
                icon={Instagram}
                label="إنستغرام"
                classes="bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-[0_3px_10px_rgba(217,70,239,0.35)]"
                testId="button-instagram"
              />
            )}
            {vendor.tiktok && (
              <ContactButton
                href={vendor.tiktok}
                icon={Music2}
                label="تيك توك"
                classes="bg-slate-900 text-white shadow-[0_3px_10px_rgba(15,23,42,0.35)]"
                testId="button-tiktok"
              />
            )}
          </motion.div>
        </div>
      )}

      {/* ── شبكة المنتجات ── */}
      <div className="flex-1 px-4 pt-5 pb-6 overflow-y-auto">
        <h3 className="text-slate-700 font-bold text-base mb-3">
          {isCosmetic ? "المنتجات المتوفرة" : "الأدوية المتوفرة"}
        </h3>

        {loadingProducts ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 bg-white/70 rounded-2xl border border-white/60 animate-pulse" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 16, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.05, type: "spring", damping: 24, stiffness: 280 }}
                className="bg-white/75 backdrop-blur-2xl rounded-2xl p-3 border border-white/60 shadow-[0_4px_16px_rgb(0,0,0,0.06)] flex flex-col"
                data-testid={`card-product-${p.id}`}
              >
                <div className={`w-full h-20 rounded-xl mb-2.5 flex items-center justify-center overflow-hidden ${
                  isCosmetic ? "bg-gradient-to-br from-pink-50 to-rose-100" : "bg-gradient-to-br from-emerald-50 to-teal-100"
                }`}>
                  {p.medication.imageUrl ? (
                    <img src={p.medication.imageUrl} alt={p.medication.name} className="w-full h-full object-cover" />
                  ) : isCosmetic ? (
                    <Sparkles className="w-8 h-8 text-pink-400" />
                  ) : (
                    <Pill className="w-8 h-8 text-emerald-500" />
                  )}
                </div>

                <p className="text-slate-800 font-bold text-sm leading-tight truncate">{p.medication.name}</p>
                <p className="text-slate-400 text-xs truncate mb-1.5">{p.medication.genericName}</p>

                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                    {p.medication.category}
                  </span>
                  {p.medication.requiresPrescription && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
                      وصفة
                    </span>
                  )}
                </div>

                <p className="text-emerald-700 font-bold text-sm mb-2">{p.price.toFixed(2)} IQD</p>

                <motion.button
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleAdd(p)}
                  disabled={p.quantity <= 0}
                  className="mt-auto w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1
                    bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)] disabled:opacity-50 disabled:bg-slate-300 disabled:shadow-none"
                  data-testid={`button-add-${p.id}`}
                >
                  {p.quantity <= 0 ? (
                    <><Clock className="w-3 h-3" /> غير متوفر</>
                  ) : (
                    <><ShoppingCart className="w-3 h-3" /> أضف للسلة</>
                  )}
                </motion.button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl mb-3">
              {isCosmetic ? "💄" : "💊"}
            </div>
            <p className="text-slate-700 font-bold text-sm mb-1">لا توجد منتجات حالياً</p>
            <p className="text-slate-400 text-xs">لم يُضف هذا البائع أي منتجات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}
