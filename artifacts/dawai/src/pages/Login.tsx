import { useState, useRef, useContext, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Store } from 'lucide-react';

// ── حدود المحافظات العراقية (Geolocation Bounding Boxes) ──────
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
    if (lat >= g.latMin && lat <= g.latMax && lng >= g.lngMin && lng <= g.lngMax) {
      return g.name;
    }
  }
  return ''; // خارج العراق أو غير معروف → اختيار يدوي
}

// ── الخلفية المتحركة ──────────────────────────────────────────
const FloatingShape = ({ className, delay, duration }: {
  className: string; delay: number; duration: number;
}) => (
  <motion.div
    className={`absolute rounded-full opacity-20 blur-2xl pointer-events-none ${className}`}
    animate={{ y: [0, -30, 0], x: [0, 20, 0], scale: [1, 1.1, 1] }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
  />
);

// ── Shared CSS لحقول الإدخال ──────────────────────────────────
const inputCls =
  'w-full bg-slate-50 border border-transparent rounded-xl px-3 h-11 text-sm text-slate-800 ' +
  'placeholder-slate-400 outline-none transition-all duration-200 ' +
  'focus:bg-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100';

// ── GPS Modal ─────────────────────────────────────────────────
function GpsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl p-7 w-full max-w-xs mx-auto z-10"
        initial={{ y: 60, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 60, scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div className="flex justify-center mb-4">
          <div className="relative">
            {[1, 1.8, 2.4].map((s, i) => (
              <motion.div key={i}
                className="absolute inset-0 rounded-full bg-emerald-400/25"
                animate={{ scale: [1, s], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.35 }}
              />
            ))}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
          </div>
        </div>
        <h4 className="text-center text-sm font-bold text-slate-800 mb-1" dir="rtl">جاري تحديد الموقع</h4>
        <p className="text-center text-xs text-slate-500 mb-5" dir="rtl">
          جاري تحديد الموقع عبر GPS — Gmunden, Austria
        </p>
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden mb-5">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
            initial={{ x: '-100%' }} animate={{ x: '0%' }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
          />
        </div>
        <button onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 text-sm font-semibold hover:bg-slate-200 transition-colors">
          إلغاء
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── حقل موحّد مع label ────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1" dir="rtl">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </div>
  );
}

// ── رأس فاصل بين المجموعات ────────────────────────────────────
function GroupDivider({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1" dir="rtl">
      <div className="h-3.5 w-0.5 bg-emerald-400 rounded-full" />
      <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{title}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// الصفحة الرئيسية
// ═══════════════════════════════════════════════════════════════
export function Login() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { apiLogin, apiRegister } = useContext(AuthContext)!;

  // ── التبديل بين الأوضاع ──────────────────────────────────
  const [mode, setMode]       = useState<'login' | 'register'>('login');
  const [role, setRole]       = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [showGps, setShowGps]   = useState(false);
  const [govLoading, setGovLoading] = useState(false);

  // ── الحقول المشتركة (تسجيل دخول + مريض جديد) ────────────
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');

  // ── حقول المريض ──────────────────────────────────────────
  const [patientName, setPatientName] = useState('');

  // ── حقول الصيدلية (KYC) ──────────────────────────────────
  const [pharFullName, setPharFullName]   = useState('');
  const [pharName, setPharName]           = useState('');
  const [pharHours, setPharHours]         = useState('');
  const [pharAddress, setPharAddress]     = useState('');
  const [pharGov, setPharGov]             = useState('');

  // ── Geolocation: يُفعَّل عند ظهور نموذج الصيدلية ─────────
  useEffect(() => {
    if (mode !== 'register' || role !== 'pharmacy') return;
    if (!navigator.geolocation) return;
    setGovLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPharGov(detectGovernorate(coords.latitude, coords.longitude));
        setGovLoading(false);
      },
      () => { setPharGov(''); setGovLoading(false); },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [mode, role]);

  const [pharHasCode, setPharHasCode]     = useState(false);
  const [pharCode, setPharCode]           = useState('');
  const [pharCert, setPharCert]           = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isPharmacyRegister = mode === 'register' && role === 'pharmacy';

  // ── onDrop ────────────────────────────────────────────────
  const [dragging, setDragging] = useState(false);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setPharCert(f);
  }, []);

  // ── Submit ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const displayName =
        mode === 'register'
          ? role === 'pharmacy' ? pharFullName || pharName : patientName
          : '';

      const authUser =
        mode === 'login'
          ? await apiLogin(phone, password)
          : await apiRegister(displayName, phone, password, role);

      navigate(authUser.role === 'pharmacy' ? '/dashboard' : '/home', { replace: true });
    } catch (err) {
      toast({
        title: mode === 'login' ? 'خطأ في تسجيل الدخول' : 'خطأ في التسجيل',
        description: String(err).replace('Error: ', ''),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`relative flex-1 flex flex-col px-5 bg-white transition-all
        ${isPharmacyRegister ? 'overflow-y-auto justify-start pt-6 pb-8' : 'overflow-hidden justify-center'}`}
    >
      {/* خلفية متحركة */}
      <FloatingShape className="w-64 h-64 bg-emerald-400 -top-20 -right-20" delay={0}  duration={8}  />
      <FloatingShape className="w-48 h-48 bg-teal-400  top-40 -left-10"     delay={2}  duration={10} />
      <FloatingShape className="w-80 h-80 bg-emerald-300 -bottom-32 right-10" delay={1} duration={12} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-sm mx-auto"
      >
        {/* ── الشعار ── */}
        <div className={`text-center ${isPharmacyRegister ? 'mb-4' : 'mb-8'}`}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.1 }}
            className={`mx-auto mb-2 ${isPharmacyRegister ? 'w-16 h-16' : 'w-28 h-28'}`}
            style={{ transition: 'width 0.3s, height 0.3s' }}
          >
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="دوائي"
              className="w-full h-full object-contain drop-shadow-xl" />
          </motion.div>
          {!isPharmacyRegister && (
            <p className="text-slate-500 font-medium text-sm">رفيقك الموثوق لإيجاد دوائك</p>
          )}
        </div>

        {/* ── البطاقة ── */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-5 shadow-xl border border-white/50">

          {/* تبويبات */}
          <div className="flex p-1 bg-slate-100/80 rounded-2xl mb-4">
            {(['login', 'register'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${
                  mode === m ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'}`}
                data-testid={`tab-${m}`}>
                {m === 'login' ? 'تسجيل الدخول' : 'حساب جديد'}
              </button>
            ))}
          </div>

          {/* ── اختيار نوع الحساب ── */}
          <AnimatePresence mode="popLayout">
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <p className="text-slate-600 text-xs font-semibold mb-2 text-right">نوع الحساب</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: 'patient',  label: 'مستخدم عادي', icon: User,  sub: 'أبحث عن دواء' },
                    { value: 'pharmacy', label: 'صيدلية',       icon: Store, sub: 'أدير صيدلية'  },
                  ] as const).map(({ value, label, icon: Icon, sub }) => (
                    <button key={value} type="button" onClick={() => setRole(value)}
                      className={`p-3 rounded-2xl border-2 transition-all text-right ${
                        role === value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                      data-testid={`role-${value}`}>
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center mb-1.5 ${
                        role === value ? 'bg-emerald-500' : 'bg-slate-100'}`}>
                        <Icon className={`w-3.5 h-3.5 ${role === value ? 'text-white' : 'text-slate-500'}`} />
                      </div>
                      <p className={`text-xs font-bold ${role === value ? 'text-emerald-700' : 'text-slate-700'}`}>{label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ═══════════════════════════════════════════════════════
              FORM
          ════════════════════════════════════════════════════════ */}
          <form onSubmit={handleSubmit} className="space-y-3">

            {/* ────────────────────────────────────────────────
                تسجيل دخول أو مريض جديد — الحقول البسيطة
            ──────────────────────────────────────────────── */}
            <AnimatePresence mode="popLayout">
              {!(mode === 'register' && role === 'pharmacy') && (
                <motion.div key="simple"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {/* الاسم — عند تسجيل مريض فقط */}
                  {mode === 'register' && (
                    <Field label="الاسم الكامل">
                      <input className={inputCls} placeholder="أدخل اسمك الكامل"
                        value={patientName} onChange={e => setPatientName(e.target.value)}
                        required data-testid="input-name" dir="rtl" />
                    </Field>
                  )}

                  <Field label="رقم الجوال">
                    <input className={inputCls} type="tel" dir="ltr" placeholder="05XXXXXXXX"
                      value={phone} onChange={e => setPhone(e.target.value)}
                      required autoComplete="tel" data-testid="input-phone" />
                  </Field>

                  <Field label="كلمة المرور">
                    <input className={inputCls} type="password" dir="ltr" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      data-testid="input-password" />
                  </Field>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ────────────────────────────────────────────────
                صيدلية جديدة — حقول KYC الكاملة
            ──────────────────────────────────────────────── */}
            <AnimatePresence mode="popLayout">
              {mode === 'register' && role === 'pharmacy' && (
                <motion.div key="pharmacy-kyc"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                  className="space-y-3 overflow-hidden"
                >

                  {/* ── بيانات شخصية ── */}
                  <GroupDivider title="البيانات الشخصية" />

                  <Field label="الاسم الثلاثي">
                    <input className={inputCls} placeholder="أحمد محمد علي" dir="rtl"
                      value={pharFullName} onChange={e => setPharFullName(e.target.value)} required />
                  </Field>

                  {/* ── بيانات الصيدلية ── */}
                  <GroupDivider title="بيانات الصيدلية" />

                  <Field label="اسم الصيدلية">
                    <input className={inputCls} placeholder="صيدلية دوائي" dir="rtl"
                      value={pharName} onChange={e => setPharName(e.target.value)} required />
                  </Field>

                  <Field label="أوقات العمل">
                    <input className={inputCls} placeholder="8 صباحاً – 11 مساءً" dir="rtl"
                      value={pharHours} onChange={e => setPharHours(e.target.value)} />
                  </Field>

                  <Field label="العنوان التفصيلي">
                    <input className={inputCls} placeholder="الشارع، الحي، رقم البناية..." dir="rtl"
                      value={pharAddress} onChange={e => setPharAddress(e.target.value)} />
                  </Field>

                  {/* المحافظة + مؤشر Geolocation */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        المحافظة
                      </label>
                      <AnimatePresence>
                        {govLoading && (
                          <motion.span
                            key="gov-spinner"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1, rotate: 360 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{
                              rotate: { duration: 0.9, repeat: Infinity, ease: 'linear' },
                              opacity: { duration: 0.2 },
                            }}
                            className="w-3.5 h-3.5 rounded-full border-2 border-emerald-400 border-t-transparent inline-block"
                            style={{ display: 'inline-block' }}
                          />
                        )}
                      </AnimatePresence>
                      {!govLoading && pharGov && (
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
                      className={inputCls + ' cursor-pointer'}
                      value={pharGov} onChange={e => setPharGov(e.target.value)}
                      disabled={govLoading}
                      style={{
                        backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
                        backgroundRepeat: 'no-repeat', backgroundPosition: 'left 10px center', backgroundSize: '14px',
                        paddingLeft: '32px',
                      }}
                    >
                      <option value="">اختر المحافظة</option>
                      {[
                        'بغداد','البصرة','نينوى','أربيل','السليمانية','دهوك','كركوك',
                        'النجف','كربلاء','بابل','ذي قار','ميسان','الأنبار','ديالى',
                        'صلاح الدين','المثنى','القادسية','واسط',
                      ].map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── بيانات الحساب ── */}
                  <GroupDivider title="بيانات الحساب" />

                  <Field label="رقم الجوال">
                    <input className={inputCls} type="tel" dir="ltr" placeholder="05XXXXXXXX"
                      value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" />
                  </Field>

                  <Field label="كلمة المرور">
                    <input className={inputCls} type="password" dir="ltr" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      required autoComplete="new-password" />
                  </Field>

                  {/* ── كود التسجيل ── */}
                  <GroupDivider title="كود التسجيل" />

                  <label className="flex items-center gap-2.5 cursor-pointer select-none" dir="rtl">
                    <div
                      className="relative w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0"
                      style={{ borderColor: pharHasCode ? '#10b981' : '#cbd5e1', background: pharHasCode ? '#10b981' : 'white' }}
                    >
                      <input type="checkbox" className="sr-only"
                        checked={pharHasCode} onChange={e => setPharHasCode(e.target.checked)} />
                      <AnimatePresence>
                        {pharHasCode && (
                          <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            viewBox="0 0 24 24" className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20,6 9,17 4,12" />
                          </motion.svg>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-xs font-medium text-slate-700">هل يوجد لديك كود تسجيل؟</span>
                  </label>

                  <AnimatePresence>
                    {pharHasCode && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                        className="overflow-hidden"
                      >
                        <Field label="كود التسجيل">
                          <input className={inputCls} placeholder="أدخل الكود هنا..."
                            value={pharCode} onChange={e => setPharCode(e.target.value)} autoFocus dir="ltr" />
                        </Field>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── شهادة الصيدلية ── */}
                  <GroupDivider title="شهادة الصيدلية" />

                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) setPharCert(e.target.files[0]); }} />

                  <motion.div
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    animate={{ borderColor: dragging ? '#34d399' : pharCert ? '#10b981' : '#cbd5e1' }}
                    className="cursor-pointer rounded-2xl p-4 flex flex-col items-center gap-2"
                    style={{ border: '2px dashed #cbd5e1', background: pharCert ? 'rgba(16,185,129,0.04)' : 'rgba(248,250,252,1)' }}
                  >
                    {pharCert ? (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 text-center">{pharCert.name}</p>
                        <p className="text-[10px] text-slate-400">{(pharCert.size / 1024).toFixed(1)} KB — اضغط للتغيير</p>
                      </>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                        </div>
                        <p className="text-xs font-semibold text-slate-600">إضافة صورة جديدة</p>
                        <p className="text-[10px] text-slate-400">ارفع رخصة الصيدلية (صورة أو PDF)</p>
                      </>
                    )}
                  </motion.div>

                  {/* ── موقع الصيدلية ── */}
                  <GroupDivider title="موقع الصيدلية" />

                  {/* خريطة مبسطة */}
                  <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 140 }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200">
                      <svg className="absolute inset-0 w-full h-full opacity-25">
                        <defs>
                          <pattern id="lg" width="28" height="28" patternUnits="userSpaceOnUse">
                            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#lg)" />
                      </svg>
                      {/* طرق */}
                      <svg className="absolute inset-0 w-full h-full">
                        <line x1="0" y1="60" x2="100%" y2="60" stroke="#cbd5e1" strokeWidth="5" />
                        <line x1="0" y1="110" x2="100%" y2="110" stroke="#cbd5e1" strokeWidth="3" />
                        <line x1="100" y1="0" x2="100" y2="100%" stroke="#cbd5e1" strokeWidth="3" />
                        <line x1="220" y1="0" x2="220" y2="100%" stroke="#cbd5e1" strokeWidth="2.5" />
                        <rect x="110" y="65" width="100" height="35" rx="3" fill="#e2e8f0" />
                        <rect x="230" y="30" width="60"  height="50" rx="3" fill="#e2e8f0" />
                      </svg>
                      {/* Pin */}
                      <motion.div className="absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%,-100%)' }}
                        animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 shadow-md flex items-center justify-center border-2 border-white">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0"
                            style={{ borderLeft: '5px solid transparent', borderRight: '5px solid transparent', borderTop: '9px solid #059669' }} />
                          <motion.div className="absolute -inset-2 rounded-full border-2 border-emerald-400/60"
                            animate={{ scale: [1, 1.8], opacity: [0.8, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                        </div>
                      </motion.div>
                      <div className="absolute bottom-1.5 left-2 text-[9px] font-bold text-slate-500">Gmunden, Austria</div>
                    </div>
                    {/* زر تحديد الموقع */}
                    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2">
                      <motion.button type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setShowGps(true)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-800"
                        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(52,211,153,0.3)', boxShadow: '0 2px 12px rgba(52,211,153,0.2)' }}
                        dir="rtl"
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        </svg>
                        تحديد الموقع على الخريطة
                      </motion.button>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

            {/* ── زر الإرسال ── */}
            <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} className="pt-1">
              <Button type="submit"
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25"
                disabled={isLoading} data-testid="button-submit">
                {isLoading ? '...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
              </Button>
            </motion.div>

            {/* بيانات تجريبية */}
            <div className="pt-1 space-y-0.5 text-center">
              <p className="text-slate-400 text-[10px]">بيانات تجريبية:</p>
              <p className="text-slate-500 text-[10px]">مريض: 0501234567 / 123456</p>
              <p className="text-slate-500 text-[10px]">صيدلية: 0509999999 / 123456</p>
            </div>
          </form>
        </div>
      </motion.div>

      {/* ── GPS Modal ── */}
      <AnimatePresence>
        {showGps && <GpsModal onClose={() => setShowGps(false)} />}
      </AnimatePresence>
    </div>
  );
}
