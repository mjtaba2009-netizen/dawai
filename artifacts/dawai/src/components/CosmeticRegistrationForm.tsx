/**
 * CosmeticRegistrationForm — تسجيل متجر كوزماتك (مستحضرات تجميل)
 * ─────────────────────────────────────────────────────────────────────────
 * نموذج مضمّن داخل صفحة الدخول. يشترط رابط إنستغرام (إلزامي) ويرفض روابط فيسبوك.
 * يجمع: اسم المتجر، اسم المالك، المحافظة (كشف تلقائي + افتراضي البصرة)،
 * العنوان، ساعات العمل، إنستغرام (إلزامي)، تيك توك (اختياري) + الهاتف وكلمة المرور.
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkles, Instagram, Music2, Store, User, Clock, MapPin } from "lucide-react";

// حدود المحافظات العراقية للكشف التلقائي
const IRAQ_GOV_BOUNDS = [
  { name: "بغداد", latMin: 33.05, latMax: 33.65, lngMin: 44.10, lngMax: 44.65 },
  { name: "البصرة", latMin: 29.50, latMax: 31.50, lngMin: 46.50, lngMax: 48.50 },
  { name: "نينوى", latMin: 35.50, latMax: 37.40, lngMin: 41.50, lngMax: 43.80 },
  { name: "أربيل", latMin: 35.70, latMax: 37.20, lngMin: 43.50, lngMax: 45.30 },
  { name: "السليمانية", latMin: 34.50, latMax: 36.50, lngMin: 44.50, lngMax: 46.30 },
  { name: "دهوك", latMin: 36.50, latMax: 37.40, lngMin: 42.50, lngMax: 44.00 },
  { name: "كركوك", latMin: 34.50, latMax: 35.80, lngMin: 43.50, lngMax: 45.10 },
  { name: "النجف", latMin: 29.50, latMax: 32.20, lngMin: 43.00, lngMax: 44.30 },
  { name: "كربلاء", latMin: 32.20, latMax: 33.10, lngMin: 43.00, lngMax: 44.50 },
  { name: "بابل", latMin: 32.00, latMax: 33.20, lngMin: 44.00, lngMax: 45.20 },
  { name: "ذي قار", latMin: 30.50, latMax: 32.00, lngMin: 45.50, lngMax: 47.00 },
  { name: "ميسان", latMin: 31.00, latMax: 32.50, lngMin: 46.50, lngMax: 48.00 },
  { name: "الأنبار", latMin: 32.00, latMax: 34.50, lngMin: 38.00, lngMax: 44.00 },
  { name: "ديالى", latMin: 33.50, latMax: 34.50, lngMin: 44.50, lngMax: 46.50 },
  { name: "صلاح الدين", latMin: 33.50, latMax: 35.50, lngMin: 43.00, lngMax: 45.00 },
  { name: "المثنى", latMin: 28.50, latMax: 31.50, lngMin: 43.50, lngMax: 47.00 },
  { name: "القادسية", latMin: 31.50, latMax: 32.50, lngMin: 44.00, lngMax: 46.00 },
  { name: "واسط", latMin: 32.00, latMax: 33.50, lngMin: 45.50, lngMax: 47.00 },
];

const GOVERNORATES = IRAQ_GOV_BOUNDS.map((g) => g.name);

function detectGovernorate(lat: number, lng: number): string {
  for (const g of IRAQ_GOV_BOUNDS) {
    if (lat >= g.latMin && lat <= g.latMax && lng >= g.lngMin && lng <= g.lngMax) return g.name;
  }
  return "";
}

const FB_RE = /(facebook\.com|fb\.com|fb\.me|fbcdn|messenger\.com)/i;

const inputCls =
  "w-full bg-slate-50 border border-transparent rounded-xl px-3 h-11 text-sm text-slate-800 " +
  "placeholder-slate-400 outline-none transition-all duration-200 " +
  "focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100";

function Field({ label, icon: Icon, children }: { label: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1" dir="rtl">
      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
        {label}
      </span>
      {children}
    </div>
  );
}

export interface CosmeticRegisterData {
  fullName: string;
  vendorName: string;
  governorate: string;
  address: string;
  workingHours: string;
  instagram: string;
  tiktok: string;
}

interface CosmeticRegistrationFormProps {
  phone: string;
  password: string;
  onPhoneChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  isLoading?: boolean;
  onRegister: (data: CosmeticRegisterData) => void;
}

export function CosmeticRegistrationForm({
  phone,
  password,
  onPhoneChange,
  onPasswordChange,
  isLoading = false,
  onRegister,
}: CosmeticRegistrationFormProps) {
  const [vendorName, setVendorName] = useState("");
  const [fullName, setFullName] = useState("");
  const [governorate, setGovernorate] = useState("البصرة");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [govLoading, setGovLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    setGovLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const gov = detectGovernorate(coords.latitude, coords.longitude);
        if (gov) setGovernorate(gov);
        setGovLoading(false);
      },
      () => setGovLoading(false),
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!instagram.trim()) {
      setError("رابط حساب إنستغرام مطلوب لتسجيل متجر الكوزماتك");
      return;
    }
    if (FB_RE.test(instagram) || FB_RE.test(tiktok)) {
      setError("روابط فيسبوك غير مدعومة — استخدم إنستغرام أو تيك توك");
      return;
    }

    onRegister({
      fullName: fullName.trim(),
      vendorName: vendorName.trim(),
      governorate,
      address: address.trim(),
      workingHours: workingHours.trim(),
      instagram: instagram.trim(),
      tiktok: tiktok.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" data-testid="cosmetic-registration-form">
      <Field label="اسم المتجر" icon={Store}>
        <input className={inputCls} placeholder="مثال: متجر لمسة جمال" dir="rtl"
          value={vendorName} onChange={(e) => setVendorName(e.target.value)}
          required data-testid="input-vendor-name" />
      </Field>

      <Field label="اسم المالك" icon={User}>
        <input className={inputCls} placeholder="الاسم الكامل" dir="rtl"
          value={fullName} onChange={(e) => setFullName(e.target.value)}
          required data-testid="input-owner-name" />
      </Field>

      {/* المحافظة */}
      <div className="flex flex-col gap-1" dir="rtl">
        <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          المحافظة
          <AnimatePresence>
            {govLoading && (
              <motion.span
                key="cos-gov-spinner"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{
                  rotate: { duration: 0.9, repeat: Infinity, ease: "linear" },
                  opacity: { duration: 0.2 },
                }}
                className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent inline-block"
              />
            )}
          </AnimatePresence>
        </span>
        <select
          className={inputCls + " cursor-pointer"}
          value={governorate}
          onChange={(e) => setGovernorate(e.target.value)}
          disabled={govLoading}
          data-testid="select-governorate"
        >
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      <Field label="العنوان التفصيلي" icon={MapPin}>
        <input className={inputCls} placeholder="الشارع، الحي، المنطقة..." dir="rtl"
          value={address} onChange={(e) => setAddress(e.target.value)}
          data-testid="input-address" />
      </Field>

      <Field label="ساعات العمل" icon={Clock}>
        <input className={inputCls} placeholder="مثال: ١٠ صباحاً – ١٠ مساءً" dir="rtl"
          value={workingHours} onChange={(e) => setWorkingHours(e.target.value)}
          data-testid="input-working-hours" />
      </Field>

      <Field label="رابط إنستغرام (إلزامي)" icon={Instagram}>
        <input className={inputCls} type="url" dir="ltr" placeholder="https://instagram.com/yourshop"
          value={instagram} onChange={(e) => setInstagram(e.target.value)}
          required data-testid="input-instagram" />
      </Field>

      <Field label="رابط تيك توك (اختياري)" icon={Music2}>
        <input className={inputCls} type="url" dir="ltr" placeholder="https://tiktok.com/@yourshop"
          value={tiktok} onChange={(e) => setTiktok(e.target.value)}
          data-testid="input-tiktok" />
      </Field>

      <Field label="رقم الجوال" icon={User}>
        <input className={inputCls} type="tel" dir="ltr" placeholder="07XXXXXXXXX"
          value={phone} onChange={(e) => onPhoneChange(e.target.value)}
          required autoComplete="tel" data-testid="input-phone" />
      </Field>

      <Field label="كلمة المرور">
        <input className={inputCls} type="password" dir="ltr" placeholder="••••••••"
          value={password} onChange={(e) => onPasswordChange(e.target.value)}
          required autoComplete="new-password" data-testid="input-password" />
      </Field>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-red-600 leading-snug text-right"
            data-testid="cosmetic-register-error"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} className="pt-1">
        <Button type="submit"
          className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          disabled={isLoading} data-testid="button-submit">
          <Sparkles className="w-4 h-4" />
          {isLoading ? "..." : "إنشاء حساب المتجر"}
        </Button>
      </motion.div>
    </form>
  );
}
