/**
 * PharmacyRegistrationForm — نموذج تسجيل الصيدليات الجديدة
 * ──────────────────────────────────────────────────────────────
 * Stack: React + Tailwind CSS + Framer Motion
 * Design: Dawai Emerald Glassmorphism — Mobile-first RTL
 */
import { useState, useRef, useCallback, useEffect, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// Geolocation — بطاقات الحدود الجغرافية للمحافظات العراقية
// ═══════════════════════════════════════════════════════════════
const IRAQ_GOV_BOUNDS = [
  { name: 'بغداد',       latMin: 33.05, latMax: 33.65, lngMin: 44.10, lngMax: 44.65 },
  { name: 'البصرة',      latMin: 29.50, latMax: 31.50, lngMin: 46.50, lngMax: 48.50 },
  { name: 'نينوى',       latMin: 35.50, latMax: 37.40, lngMin: 41.50, lngMax: 43.80 },
  { name: 'أربيل',       latMin: 35.70, latMax: 37.20, lngMin: 43.50, lngMax: 45.30 },
  { name: 'السليمانية',  latMin: 34.50, latMax: 36.50, lngMin: 44.50, lngMax: 46.30 },
  { name: 'دهوك',        latMin: 36.50, latMax: 37.40, lngMin: 42.50, lngMax: 44.00 },
  { name: 'كركوك',       latMin: 34.50, latMax: 35.80, lngMin: 43.50, lngMax: 45.10 },
  { name: 'النجف',       latMin: 29.50, latMax: 32.20, lngMin: 43.00, lngMax: 44.30 },
  { name: 'كربلاء',      latMin: 32.20, latMax: 33.10, lngMin: 43.00, lngMax: 44.50 },
  { name: 'بابل',        latMin: 32.00, latMax: 33.20, lngMin: 44.00, lngMax: 45.20 },
  { name: 'ذي قار',      latMin: 30.50, latMax: 32.00, lngMin: 45.50, lngMax: 47.00 },
  { name: 'ميسان',       latMin: 31.00, latMax: 32.50, lngMin: 46.50, lngMax: 48.00 },
  { name: 'الأنبار',     latMin: 32.00, latMax: 34.50, lngMin: 38.00, lngMax: 44.00 },
  { name: 'ديالى',       latMin: 33.50, latMax: 34.50, lngMin: 44.50, lngMax: 46.50 },
  { name: 'صلاح الدين',  latMin: 33.50, latMax: 35.50, lngMin: 43.00, lngMax: 45.00 },
  { name: 'المثنى',      latMin: 28.50, latMax: 31.50, lngMin: 43.50, lngMax: 47.00 },
  { name: 'القادسية',    latMin: 31.50, latMax: 32.50, lngMin: 44.00, lngMax: 46.00 },
  { name: 'واسط',        latMin: 32.00, latMax: 33.50, lngMin: 45.50, lngMax: 47.00 },
];

function detectGovernorate(lat: number, lng: number): string {
  for (const g of IRAQ_GOV_BOUNDS) {
    if (lat >= g.latMin && lat <= g.latMax && lng >= g.lngMin && lng <= g.lngMax) return g.name;
  }
  return '';
}

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
interface FormData {
  fullName: string;
  pharmacyName: string;
  workingHours: string;
  address: string;
  governorate: string;
  hasCode: boolean;
  registrationCode: string;
  certificateFile: File | null;
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════

/** حقل إدخال موحد — emerald focus ring */
function Field({
  label, icon, children,
}: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
        <span className="text-base">{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full bg-slate-50 text-slate-800 placeholder-slate-400 text-sm rounded-xl px-4 py-3 " +
  "border border-transparent outline-none transition-all duration-200 " +
  "focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 " +
  "hover:bg-slate-100/70";

/** رأس القسم */
function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="h-5 w-1 bg-gradient-to-b from-emerald-400 to-teal-600 rounded-full" />
      <div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

/** بطاقة قسم زجاجية */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GPS Modal
// ═══════════════════════════════════════════════════════════════
function GpsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* modal card */}
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm mx-auto z-10"
        initial={{ y: 60, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 60, scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
      >
        {/* pulse icon */}
        <div className="flex justify-center mb-5">
          <div className="relative">
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400/30"
              animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-emerald-400/20"
              animate={{ scale: [1, 2.4], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            />
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
          </div>
        </div>

        <h4 className="text-center text-base font-bold text-slate-800 mb-1.5" dir="rtl">
          جاري تحديد الموقع
        </h4>
        <p className="text-center text-sm text-slate-500 mb-6" dir="rtl">
          جاري تحديد الموقع عبر GPS...
        </p>

        {/* animated progress */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-6">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
          />
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          إلغاء
        </button>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Map Section
// ═══════════════════════════════════════════════════════════════
function MapSection({ onLocate }: { onLocate: () => void }) {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{ height: 200 }}
    >
      {/* خلفية الخريطة المبسطة */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200">
        {/* شبكة الخريطة */}
        <svg className="absolute inset-0 w-full h-full opacity-30" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="mapgrid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)" />
        </svg>

        {/* طرق مبسطة */}
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <line x1="0" y1="80"  x2="100%" y2="80"  stroke="#cbd5e1" strokeWidth="6" />
          <line x1="0" y1="140" x2="100%" y2="140" stroke="#cbd5e1" strokeWidth="3" />
          <line x1="120" y1="0" x2="120" y2="100%" stroke="#cbd5e1" strokeWidth="4" />
          <line x1="240" y1="0" x2="240" y2="100%" stroke="#cbd5e1" strokeWidth="3" />
          <rect x="130" y="90" width="100" height="40" rx="4" fill="#e2e8f0" />
          <rect x="250" y="50" width="70"  height="55" rx="4" fill="#e2e8f0" />
          <rect x="30"  y="90" width="80"  height="40" rx="4" fill="#e2e8f0" />
        </svg>

        {/* Pin الموقع في المركز */}
        <motion.div
          className="absolute"
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -100%)" }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg flex items-center justify-center border-2 border-white">
              <div className="w-2.5 h-2.5 rounded-full bg-white" />
            </div>
            <div
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
              style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "10px solid #059669" }}
            />
            {/* حلقة النبض */}
            <motion.div
              className="absolute -inset-2 rounded-full border-2 border-emerald-400/60"
              animate={{ scale: [1, 1.8], opacity: [0.8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* تعتيم خفيف من الأطراف */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 via-transparent to-slate-50/50 pointer-events-none" />
      </div>

      {/* زر تحديد الموقع الزجاجي */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLocate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-emerald-800 shadow-lg"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(52,211,153,0.3)",
            boxShadow: "0 4px 20px rgba(52,211,153,0.2), 0 2px 8px rgba(0,0,0,0.1)",
          }}
          dir="rtl"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
          تحديد الموقع على الخريطة
        </motion.button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Logo Upload — دائرة رفع شعار الصيدلية
// ═══════════════════════════════════════════════════════════════
function LogoUpload({
  preview, onChange,
}: { preview: string | null; onChange: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onChange(file);
  };

  return (
    <div className="flex flex-col items-center gap-2 mb-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
      <motion.button
        type="button"
        whileTap={{ scale: 0.93 }}
        whileHover={{ scale: 1.04 }}
        onClick={() => inputRef.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg focus:outline-none"
        style={{
          background: preview
            ? undefined
            : "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="شعار الصيدلية"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full gap-1">
            <svg
              viewBox="0 0 24 24"
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}

        {/* زر تعديل صغير */}
        <motion.div
          className="absolute bottom-0 right-0 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow"
          animate={{ scale: preview ? 1 : [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: preview ? 0 : Infinity }}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </motion.div>
      </motion.button>

      <div className="text-center" dir="rtl">
        <p className="text-xs font-semibold text-slate-600">
          {preview ? "اضغط لتغيير الشعار" : "رفع شعار الصيدلية"}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">PNG أو JPG — اختياري</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// File Dropzone
// ═══════════════════════════════════════════════════════════════
function FileDropzone({
  file, onChange,
}: { file: File | null; onChange: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) onChange(dropped);
  }, [onChange]);

  return (
    <>
      <input
        ref={inputRef} type="file" accept="image/*,.pdf" className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) onChange(e.target.files[0]); }}
      />
      <motion.div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        animate={{
          borderColor: dragging ? "#34d399" : file ? "#10b981" : "#cbd5e1",
          backgroundColor: dragging ? "rgba(52,211,153,0.06)" : file ? "rgba(16,185,129,0.04)" : "rgba(248,250,252,1)",
        }}
        className="relative w-full cursor-pointer rounded-2xl transition-colors p-6 flex flex-col items-center gap-3"
        style={{ border: "2px dashed #cbd5e1" }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {file ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <polyline points="9,15 12,18 15,15" />
                <line x1="12" y1="18" x2="12" y2="11" />
              </svg>
            </div>
            <div className="text-center" dir="rtl">
              <p className="text-sm font-semibold text-emerald-700">{file.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {(file.size / 1024).toFixed(1)} KB — اضغط للتغيير
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="text-center" dir="rtl">
              <p className="text-sm font-semibold text-slate-600">إضافة صورة جديدة</p>
              <p className="text-xs text-slate-400 mt-0.5">ارفع رخصة الصيدلية (صورة أو PDF)</p>
            </div>
          </>
        )}
      </motion.div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Form Component
// ═══════════════════════════════════════════════════════════════
interface PharmacyRegistrationFormProps {
  /** عند التضمين داخل صفحة الدخول: لا header كامل، يظهر حقول الحساب وزر إنشاء مدمج */
  embedded?: boolean;
  phone?: string;
  password?: string;
  onPhoneChange?: (v: string) => void;
  onPasswordChange?: (v: string) => void;
  /** يُستدعى عند الإرسال في وضع التضمين مع بيانات العرض */
  onRegister?: (data: {
    fullName: string;
    pharmacyName: string;
    governorate: string;
    address: string;
    workingHours: string;
  }) => void;
  isLoading?: boolean;
}

export function PharmacyRegistrationForm({
  embedded = false,
  phone = "",
  password = "",
  onPhoneChange,
  onPasswordChange,
  onRegister,
  isLoading = false,
}: PharmacyRegistrationFormProps = {}) {
  const [form, setForm] = useState<FormData>({
    fullName: "", pharmacyName: "", workingHours: "", address: "",
    governorate: "البصرة", hasCode: false, registrationCode: "", certificateFile: null,
  });
  const [showGps,      setShowGps]      = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [govLoading,   setGovLoading]   = useState(false);
  const [logoFile,     setLogoFile]     = useState<File | null>(null);
  const [logoPreview,  setLogoPreview]  = useState<string | null>(null);

  const handleLogoChange = (file: File) => {
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const set = (key: keyof FormData, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Geolocation — يُشغَّل عند تحميل الصفحة. يُبقي "البصرة" كافتراضي ما لم تُكتشف محافظة عراقية فعلية.
  useEffect(() => {
    if (!navigator.geolocation) return;
    setGovLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const gov = detectGovernorate(coords.latitude, coords.longitude);
        if (gov) setForm(f => ({ ...f, governorate: gov }));
        setGovLoading(false);
      },
      () => { setGovLoading(false); },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (embedded) {
      onRegister?.({
        fullName: form.fullName,
        pharmacyName: form.pharmacyName,
        governorate: form.governorate,
        address: form.address,
        workingHours: form.workingHours,
      });
      return;
    }
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const governorates = [
    "بغداد","البصرة","نينوى","أربيل","السليمانية","دهوك","كركوك",
    "النجف","كربلاء","بابل","ذي قار","ميسان","الأنبار","ديالى",
    "صلاح الدين","المثنى","القادسية","واسط",
  ];

  return (
    <div
      className={embedded ? "" : "min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50"}
      dir="rtl"
      data-testid="pharmacy-registration-form"
    >

      {/* Header — صفحة مستقلة فقط */}
      {!embedded && (
        <div
          className="sticky top-0 z-30 px-4 pt-safe-top pb-4 pt-4"
          style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
        >
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3" />
                <path d="M9 7h6M9 11h6M9 15h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800">تسجيل صيدلية جديدة</h1>
              <p className="text-xs text-slate-400">أدخل بيانات صيدليتك بدقة</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Body */}
      <form
        id="pharmacy-form"
        onSubmit={handleSubmit}
        className={embedded ? "space-y-4" : "max-w-lg mx-auto px-4 py-5 space-y-4 pb-32"}
      >

        {/* ── القسم الأول: البيانات الشخصية ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card>
            <SectionHeader title="البيانات الشخصية" subtitle="معلومات المسؤول عن الصيدلية" />
            <div className="space-y-3">
              <Field label="الاسم الثلاثي" icon="👤">
                <input
                  className={inputClass} type="text" placeholder="مثال: أحمد محمد علي"
                  value={form.fullName} onChange={(e) => set("fullName", e.target.value)}
                />
              </Field>
            </div>
          </Card>
        </motion.div>

        {/* ── القسم الثاني: بيانات الصيدلية ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <SectionHeader title="بيانات الصيدلية" subtitle="المعلومات الرئيسية للصيدلية" />

            {/* ── رفع شعار الصيدلية ── */}
            <LogoUpload preview={logoPreview} onChange={handleLogoChange} />

            <div className="space-y-3">
              <Field label="اسم الصيدلية" icon="🏥">
                <input
                  className={inputClass} type="text" placeholder="مثال: صيدلية دوائي"
                  value={form.pharmacyName} onChange={(e) => set("pharmacyName", e.target.value)}
                />
              </Field>

              <Field label="أوقات العمل" icon="🕐">
                <input
                  className={inputClass} type="text" placeholder="مثال: 8 صباحاً – 11 مساءً"
                  value={form.workingHours} onChange={(e) => set("workingHours", e.target.value)}
                />
              </Field>

              <Field label="عنوان الصيدلية" icon="📍">
                <input
                  className={inputClass} type="text" placeholder="الشارع، الحي، رقم البناية..."
                  value={form.address} onChange={(e) => set("address", e.target.value)}
                />
              </Field>

              {/* محافظة الصيدلية + Geolocation spinner */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">🗺️</span>
                  <span className="text-sm font-semibold text-slate-700">محافظة الصيدلية</span>
                  <AnimatePresence>
                    {govLoading && (
                      <motion.span
                        key="gov-spinner-reg"
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1, rotate: 360 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{
                          rotate: { duration: 0.9, repeat: Infinity, ease: "linear" },
                          opacity: { duration: 0.2 },
                        }}
                        className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent inline-block"
                        style={{ display: "inline-block" }}
                      />
                    )}
                  </AnimatePresence>
                  {!govLoading && form.governorate && (
                    <motion.span
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded-full"
                    >
                      تم الكشف تلقائياً
                    </motion.span>
                  )}
                </div>
                <select
                  className={inputClass + " appearance-none cursor-pointer"}
                  value={form.governorate}
                  onChange={(e) => set("governorate", e.target.value)}
                  disabled={govLoading}
                  style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "left 12px center", backgroundSize: "16px", paddingLeft: "36px" }}
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── بيانات الحساب — وضع التضمين فقط ── */}
        {embedded && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            <Card>
              <SectionHeader title="بيانات الحساب" subtitle="للدخول إلى حسابك لاحقاً" />
              <div className="space-y-3">
                <Field label="رقم الجوال" icon="📱">
                  <input
                    className={inputClass} type="tel" dir="ltr" placeholder="05XXXXXXXX"
                    value={phone} onChange={(e) => onPhoneChange?.(e.target.value)}
                    required autoComplete="tel" data-testid="input-phone"
                  />
                </Field>
                <Field label="كلمة المرور" icon="🔒">
                  <input
                    className={inputClass} type="password" dir="ltr" placeholder="••••••••"
                    value={password} onChange={(e) => onPasswordChange?.(e.target.value)}
                    required autoComplete="new-password" data-testid="input-password"
                  />
                </Field>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── القسم الثالث: كود التسجيل ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <SectionHeader title="كود التسجيل" subtitle="اختياري — إذا حصلت على كود خاص" />

            {/* Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div
                className="relative w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
                style={{
                  borderColor: form.hasCode ? "#10b981" : "#cbd5e1",
                  background: form.hasCode ? "#10b981" : "white",
                }}
              >
                <input
                  type="checkbox" className="sr-only"
                  checked={form.hasCode}
                  onChange={(e) => set("hasCode", e.target.checked)}
                />
                <AnimatePresence>
                  {form.hasCode && (
                    <motion.svg
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      viewBox="0 0 24 24" className="w-3 h-3 text-white"
                      fill="none" stroke="currentColor" strokeWidth="3"
                    >
                      <polyline points="20,6 9,17 4,12" />
                    </motion.svg>
                  )}
                </AnimatePresence>
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                هل يوجد لديك كود تسجيل؟
              </span>
            </label>

            {/* Animated code input */}
            <AnimatePresence>
              {form.hasCode && (
                <motion.div
                  initial={{ height: 0, opacity: 0, y: -8 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -8 }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <Field label="كود التسجيل" icon="🔑">
                      <input
                        className={inputClass} type="text"
                        placeholder="أدخل كود التسجيل هنا..."
                        value={form.registrationCode}
                        onChange={(e) => set("registrationCode", e.target.value)}
                        autoFocus
                      />
                    </Field>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* ── القسم الرابع: شهادة الصيدلية ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <SectionHeader title="شهادة الصيدلية" subtitle="رفع رخصة مزاولة المهنة" />
            <FileDropzone
              file={form.certificateFile}
              onChange={(f) => set("certificateFile", f)}
            />
          </Card>
        </motion.div>

        {/* ── القسم الخامس: موقع الصيدلية ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="!p-4">
            <SectionHeader title="موقع الصيدلية" subtitle="حدد الموقع الجغرافي للصيدلية" />
            <MapSection onLocate={() => setShowGps(true)} />
          </Card>
        </motion.div>

        {/* ── زر الإنشاء المدمج — وضع التضمين فقط ── */}
        {embedded && (
          <motion.button
            type="submit"
            disabled={isLoading}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            data-testid="button-submit"
            className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg disabled:opacity-70"
            style={{
              background: "linear-gradient(135deg, #34d399, #0d9488)",
              boxShadow: "0 4px 24px rgba(52,211,153,0.4), 0 2px 8px rgba(0,0,0,0.1)",
            }}
            dir="rtl"
          >
            {isLoading ? "..." : "إنشاء حساب صيدلية"}
          </motion.button>
        )}

      </form>

      {/* ── زر الحفظ الثابت أسفل الشاشة — صفحة مستقلة فقط ── */}
      {!embedded && (
      <div
        className="fixed bottom-0 left-0 right-0 z-20 px-4 pb-safe-bottom pb-6 pt-4"
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(16px)", borderTop: "1px solid rgba(0,0,0,0.06)" }}
      >
        <div className="max-w-lg mx-auto">
          <motion.button
            type="submit"
            form="pharmacy-form"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            className="w-full py-4 rounded-2xl text-white font-bold text-base shadow-lg relative overflow-hidden"
            style={{
              background: submitted
                ? "linear-gradient(135deg, #10b981, #059669)"
                : "linear-gradient(135deg, #34d399, #0d9488)",
              boxShadow: "0 4px 24px rgba(52,211,153,0.4), 0 2px 8px rgba(0,0,0,0.1)",
            }}
            dir="rtl"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.span
                  key="done"
                  className="flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                  تم الحفظ بنجاح!
                </motion.span>
              ) : (
                <motion.span
                  key="save"
                  className="flex items-center justify-center gap-2"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17,21 17,13 7,13 7,21" />
                    <polyline points="7,3 7,8 15,8" />
                  </svg>
                  حفظ المعلومات
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
      )}

      {/* ── GPS Modal ── */}
      <AnimatePresence>
        {showGps && <GpsModal onClose={() => setShowGps(false)} />}
      </AnimatePresence>

    </div>
  );
}
