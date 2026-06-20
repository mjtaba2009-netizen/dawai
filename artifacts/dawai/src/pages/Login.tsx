import { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthContext, UserRole } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Store } from 'lucide-react';
import { PharmacyRegistrationForm } from '@/components/PharmacyRegistrationForm';

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

// ── حقل موحّد مع label ────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1" dir="rtl">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
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
  const [mode, setMode]           = useState<'login' | 'register'>('login');
  const [role, setRole]           = useState<UserRole>('patient');
  const [isLoading, setIsLoading] = useState(false);
  const [govLoading, setGovLoading] = useState(false);

  // ── الحقول المشتركة (تسجيل دخول + مريض جديد) ────────────
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');

  // ── حقول المريض ──────────────────────────────────────────
  const [patientName, setPatientName]       = useState('');
  const [patientGov, setPatientGov]         = useState('');
  const [patientAddress, setPatientAddress] = useState('');

  const isPharmacyRegister = mode === 'register' && role === 'pharmacy';

  // ── Geolocation: يُفعَّل عند تسجيل مريض جديد فقط ──────────
  // (الصيدلية تكتشف موقعها داخل PharmacyRegistrationForm)
  useEffect(() => {
    if (mode !== 'register' || role !== 'patient') return;
    if (!navigator.geolocation) return;
    setGovLoading(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPatientGov(detectGovernorate(coords.latitude, coords.longitude));
        setGovLoading(false);
      },
      () => { setGovLoading(false); },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, [mode, role]);

  // ── Submit (تسجيل دخول + مريض جديد) ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const authUser =
        mode === 'login'
          ? await apiLogin(phone, password)
          : await apiRegister(patientName, phone, password, 'patient');

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

  // ── Submit الصيدلية (من PharmacyRegistrationForm المضمّن) ──
  const handlePharmacyRegister = async ({
    fullName, pharmacyName,
  }: { fullName: string; pharmacyName: string }) => {
    setIsLoading(true);
    try {
      const displayName = pharmacyName || fullName || 'صيدلية';
      const authUser = await apiRegister(displayName, phone, password, 'pharmacy');
      navigate(authUser.role === 'pharmacy' ? '/dashboard' : '/home', { replace: true });
    } catch (err) {
      toast({
        title: 'خطأ في التسجيل',
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
        className={`relative z-10 w-full mx-auto ${isPharmacyRegister ? 'max-w-md' : 'max-w-sm'}`}
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
              صيدلية جديدة → النموذج الكامل (KYC) | غير ذلك → نموذج بسيط
          ════════════════════════════════════════════════════════ */}
          {isPharmacyRegister ? (
            <PharmacyRegistrationForm
              embedded
              phone={phone}
              password={password}
              onPhoneChange={setPhone}
              onPasswordChange={setPassword}
              isLoading={isLoading}
              onRegister={handlePharmacyRegister}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* الاسم + المحافظة + العنوان — عند تسجيل مريض فقط */}
              {mode === 'register' && (
                <>
                  <Field label="الاسم الكامل">
                    <input className={inputCls} placeholder="أدخل اسمك الكامل"
                      value={patientName} onChange={e => setPatientName(e.target.value)}
                      required data-testid="input-name" dir="rtl" />
                  </Field>

                  {/* المحافظة + Geolocation spinner */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        المحافظة
                      </label>
                      <AnimatePresence>
                        {govLoading && (
                          <motion.span
                            key="pat-gov-spinner"
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
                      {!govLoading && patientGov && (
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
                      value={patientGov}
                      onChange={e => setPatientGov(e.target.value)}
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

                  <Field label="العنوان التفصيلي">
                    <input className={inputCls} placeholder="الشارع، الحي، المنطقة..." dir="rtl"
                      value={patientAddress} onChange={e => setPatientAddress(e.target.value)} />
                  </Field>
                </>
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

              {/* ── زر الإرسال ── */}
              <motion.div whileTap={{ scale: 0.98 }} whileHover={{ scale: 1.01 }} className="pt-1">
                <Button type="submit"
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base shadow-lg shadow-emerald-500/25"
                  disabled={isLoading} data-testid="button-submit">
                  {isLoading ? '...' : mode === 'login' ? 'دخول' : 'إنشاء حساب'}
                </Button>
              </motion.div>
            </form>
          )}

          {/* بيانات تجريبية */}
          <div className="pt-3 space-y-0.5 text-center">
            <p className="text-slate-400 text-[10px]">بيانات تجريبية:</p>
            <p className="text-slate-500 text-[10px]">مريض: 0501234567 / 123456</p>
            <p className="text-slate-500 text-[10px]">صيدلية: 0509999999 / 123456</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
