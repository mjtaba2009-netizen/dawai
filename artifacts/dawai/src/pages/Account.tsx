import { useState, useContext, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Lock, HelpCircle, Star, LogOut,
  ChevronLeft, Shield, Phone, MapPin, X,
  Eye, EyeOff, ChevronDown, MessageCircle,
  Smartphone, Wifi, WifiOff, Check,
} from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';

// ══════════════════════════════════════════════════════════════
// Shared helpers
// ══════════════════════════════════════════════════════════════
function Sheet({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-[430px] rounded-t-3xl bg-white/92 backdrop-blur-2xl border-t border-white/60 shadow-2xl overflow-hidden"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function SheetHeader({ title, icon, onClose }: { title: string; icon: React.ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
      <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
        <X className="w-4 h-4 text-slate-500" />
      </button>
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800">{title}</span>
        {icon}
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder = '', type = 'text', disabled = false,
}: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none text-right
          focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 transition-all
          ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-100' : ''}`}
        dir="rtl"
      />
    </div>
  );
}

function Toggle({ value, onChange, label, sub }: {
  value: boolean; onChange: (v: boolean) => void; label: string; sub?: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
      <motion.button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}
      >
        <motion.div
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
          animate={{ right: value ? 4 : 'auto', left: value ? 'auto' : 4 }}
          transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        />
      </motion.button>
      <div className="text-right">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SaveButton({ onClick, saved, disabled = false, label = 'حفظ التغييرات' }: {
  onClick: () => void; saved: boolean; disabled?: boolean; label?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled || saved}
      className={`w-full h-12 rounded-2xl font-bold text-sm transition-all
        ${saved
          ? 'bg-emerald-500 text-white shadow-[0_4px_14px_rgba(16,185,129,0.45)]'
          : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md disabled:opacity-40'}`}
    >
      {saved ? '✓ تم الحفظ' : label}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. Profile Info Modal
// ══════════════════════════════════════════════════════════════
function ProfileInfoModal({ user, onClose }: { user: { name: string; role: string } | null; onClose: () => void }) {
  const [name,         setName]         = useState(user?.name ?? '');
  const [pharmacyName, setPharmacyName] = useState(user?.role === 'pharmacy' ? user.name : '');
  const [saved,        setSaved]        = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="معلومات الملف الشخصي" icon={<User className="w-5 h-5 text-emerald-500" />} onClose={onClose} />
      <div className="px-5 py-5 space-y-4">
        <InputField label="الاسم الكامل" value={name} onChange={setName} placeholder="أدخل اسمك الكامل" />
        {user?.role === 'pharmacy' && (
          <InputField label="اسم الصيدلية" value={pharmacyName} onChange={setPharmacyName} placeholder="اسم الصيدلية" />
        )}
        <SaveButton onClick={handleSave} saved={saved} disabled={!name.trim()} />
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. Phone Modal — OTP simulation
// ══════════════════════════════════════════════════════════════
function PhoneModal({ currentPhone, onClose }: { currentPhone?: string; onClose: () => void }) {
  const [step,    setStep]    = useState<'view' | 'edit' | 'otp'>('view');
  const [newPhone, setNewPhone] = useState('');
  const [otp,     setOtp]     = useState('');
  const [sending, setSending] = useState(false);
  const [done,    setDone]    = useState(false);

  const handleSendOtp = () => {
    if (!newPhone.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setStep('otp'); }, 1000);
  };

  const handleVerify = () => {
    if (otp.length < 4) return;
    setDone(true);
    setTimeout(onClose, 1200);
  };

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="رقم الجوال" icon={<Phone className="w-5 h-5 text-blue-500" />} onClose={onClose} />
      <div className="px-5 py-5 space-y-4">
        <AnimatePresence mode="wait">
          {step === 'view' && (
            <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <InputField label="رقم الجوال الحالي" value={currentPhone ?? ''} disabled />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep('edit')}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-md"
              >
                تعديل الرقم
              </motion.button>
            </motion.div>
          )}

          {step === 'edit' && (
            <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <InputField label="رقم الجوال الجديد" value={newPhone} onChange={setNewPhone} placeholder="+964 7XX XXX XXXX" type="tel" />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSendOtp}
                disabled={!newPhone.trim() || sending}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold text-sm shadow-md disabled:opacity-40"
              >
                {sending ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
              </motion.button>
            </motion.div>
          )}

          {step === 'otp' && (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-2xl text-center">
                <p className="text-blue-700 text-sm font-semibold mb-0.5">تم إرسال الكود إلى</p>
                <p className="text-blue-600 text-xs" dir="ltr">{newPhone}</p>
              </div>
              <InputField label="كود التحقق (OTP)" value={otp} onChange={setOtp} placeholder="أدخل الكود المكون من 4 أرقام" type="number" />
              <SaveButton onClick={handleVerify} saved={done} disabled={otp.length < 4} label="تأكيد وحفظ الرقم الجديد" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. Address Modal — Governorate + detail
// ══════════════════════════════════════════════════════════════
const IRAQ_GOV_BOUNDS = [
  { name: 'بغداد',      latMin: 33.05, latMax: 33.65, lngMin: 44.10, lngMax: 44.65 },
  { name: 'البصرة',     latMin: 29.50, latMax: 31.50, lngMin: 46.50, lngMax: 48.50 },
  { name: 'نينوى',      latMin: 35.50, latMax: 37.40, lngMin: 41.50, lngMax: 43.80 },
  { name: 'أربيل',      latMin: 35.70, latMax: 37.20, lngMin: 43.50, lngMax: 45.30 },
  { name: 'السليمانية', latMin: 34.50, latMax: 36.50, lngMin: 44.50, lngMax: 46.30 },
  { name: 'دهوك',       latMin: 36.50, latMax: 37.40, lngMin: 42.50, lngMax: 44.00 },
  { name: 'كركوك',      latMin: 34.50, latMax: 35.80, lngMin: 43.50, lngMax: 45.10 },
  { name: 'النجف',      latMin: 29.50, latMax: 32.20, lngMin: 43.00, lngMax: 44.30 },
  { name: 'كربلاء',     latMin: 32.20, latMax: 33.10, lngMin: 43.00, lngMax: 44.50 },
  { name: 'بابل',       latMin: 32.00, latMax: 33.20, lngMin: 44.00, lngMax: 45.20 },
  { name: 'ذي قار',     latMin: 30.50, latMax: 32.00, lngMin: 45.50, lngMax: 47.00 },
  { name: 'ميسان',      latMin: 31.00, latMax: 32.50, lngMin: 46.50, lngMax: 48.00 },
  { name: 'الأنبار',    latMin: 32.00, latMax: 34.50, lngMin: 38.00, lngMax: 44.00 },
  { name: 'ديالى',      latMin: 33.50, latMax: 34.50, lngMin: 44.50, lngMax: 46.50 },
  { name: 'صلاح الدين', latMin: 33.50, latMax: 35.50, lngMin: 43.00, lngMax: 45.00 },
  { name: 'المثنى',     latMin: 28.50, latMax: 31.50, lngMin: 43.50, lngMax: 47.00 },
  { name: 'القادسية',   latMin: 31.50, latMax: 32.50, lngMin: 44.00, lngMax: 46.00 },
  { name: 'واسط',       latMin: 32.00, latMax: 33.50, lngMin: 45.50, lngMax: 47.00 },
];
function detectGov(lat: number, lng: number): string {
  for (const g of IRAQ_GOV_BOUNDS)
    if (lat >= g.latMin && lat <= g.latMax && lng >= g.lngMin && lng <= g.lngMax) return g.name;
  return '';
}

function AddressModal({ onClose }: { onClose: () => void }) {
  const [gov,      setGov]      = useState('');
  const [govLoad,  setGovLoad]  = useState(true);
  const [address,  setAddress]  = useState('');
  const [saved,    setSaved]    = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setGovLoad(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setGov(detectGov(coords.latitude, coords.longitude)); setGovLoad(false); },
      () => setGovLoad(false),
      { timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="العنوان والمحافظة" icon={<MapPin className="w-5 h-5 text-teal-500" />} onClose={onClose} />
      <div className="px-5 py-5 space-y-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
            المحافظة
            {govLoad && (
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-[10px] text-emerald-500 font-medium"
              >
                جاري الكشف...
              </motion.span>
            )}
            {!govLoad && gov && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                تم الكشف تلقائياً ✓
              </motion.span>
            )}
          </label>
          <select
            value={gov}
            onChange={(e) => setGov(e.target.value)}
            disabled={govLoad}
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 text-right appearance-none"
          >
            <option value="">اختر المحافظة</option>
            {IRAQ_GOV_BOUNDS.map((g) => <option key={g.name} value={g.name}>{g.name}</option>)}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-500">العنوان التفصيلي والحي السكني</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="مثال: حي الكرادة، شارع فلسطين، بناية رقم 15"
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none resize-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 text-right"
            dir="rtl"
          />
        </div>

        <SaveButton onClick={() => { setSaved(true); setTimeout(onClose, 1200); }} saved={saved} disabled={!gov} />
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. Password Modal — standalone
// ══════════════════════════════════════════════════════════════
function PasswordModal({ onClose }: { onClose: () => void }) {
  const [cur,      setCur]      = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showCur,  setShowCur]  = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [saved,    setSaved]    = useState(false);

  const mismatch = next && confirm && next !== confirm;
  const valid    = cur && next && confirm && next === confirm;

  const pwField = (
    label: string, value: string, set: (v: string) => void, show: boolean, toggle: () => void,
  ) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => set(e.target.value)}
          className="w-full h-11 px-4 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 text-right"
          placeholder="••••••••"
          dir="ltr"
        />
        <button type="button" onClick={toggle} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="كلمة المرور" icon={<Lock className="w-5 h-5 text-purple-500" />} onClose={onClose} />
      <div className="px-5 py-5 space-y-3">
        {pwField('كلمة المرور الحالية',   cur,     setCur,     showCur,  () => setShowCur(v  => !v))}
        {pwField('كلمة المرور الجديدة',   next,    setNext,    showNext, () => setShowNext(v => !v))}
        {pwField('تأكيد كلمة المرور الجديدة', confirm, setConfirm, showConf, () => setShowConf(v => !v))}
        {mismatch && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-red-500 text-right">
            ⚠ كلمتا المرور غير متطابقتين
          </motion.p>
        )}
        <SaveButton onClick={() => { setSaved(true); setTimeout(onClose, 1200); }} saved={saved} disabled={!valid} label="تغيير كلمة المرور" />
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 5. Notifications Modal
// ══════════════════════════════════════════════════════════════
function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [appNotifs, setAppNotifs] = useState(true);
  const [whatsapp,  setWhatsapp]  = useState(true);
  const [promos,    setPromos]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="إعدادات الإشعارات" icon={<Bell className="w-5 h-5 text-amber-500" />} onClose={onClose} />
      <div className="px-5 py-4 space-y-3">
        <Toggle value={appNotifs} onChange={setAppNotifs} label="إشعارات التطبيق"            sub="تنبيهات فورية داخل التطبيق"      />
        <Toggle value={whatsapp}  onChange={setWhatsapp}  label="تنبيهات الطلبات عبر واتساب" sub="رسائل واتساب عند تحديث الطلب"   />
        <Toggle value={promos}    onChange={setPromos}    label="العروض الترويجية"            sub="أحدث العروض والخصومات"           />
        <SaveButton onClick={() => { setSaved(true); setTimeout(onClose, 1000); }} saved={saved} />
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 6. Privacy & Security Modal — re-architected (no password)
// ══════════════════════════════════════════════════════════════
const MOCK_SESSIONS = [
  { id: 1, device: 'iPhone 15 Pro',    location: 'بغداد، العراق',    time: 'نشط الآن',    current: true  },
  { id: 2, device: 'Samsung Galaxy S24', location: 'البصرة، العراق', time: 'منذ 3 ساعات', current: false },
  { id: 3, device: 'Chrome · Windows', location: 'أربيل، العراق',    time: 'منذ يومين',   current: false },
];

function PrivacyModal({ onClose }: { onClose: () => void }) {
  const [twoFA,      setTwoFA]      = useState(false);
  const [gpsAllowed, setGpsAllowed] = useState(true);
  const [sessions,   setSessions]   = useState(MOCK_SESSIONS);
  const [loggedOut,  setLoggedOut]  = useState(false);
  const [deleteConf, setDeleteConf] = useState(false);

  const logoutOthers = () => {
    setSessions((s) => s.filter((x) => x.current));
    setLoggedOut(true);
  };

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="الخصوصية والأمان" icon={<Shield className="w-5 h-5 text-teal-500" />} onClose={onClose} />
      <div className="px-5 py-4 space-y-5 max-h-[78vh] overflow-y-auto">

        {/* ── التحقق بخطوتين ── */}
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الأمان المتقدم</p>
          <Toggle
            value={twoFA}
            onChange={setTwoFA}
            label="التحقق بخطوتين (2FA)"
            sub={twoFA ? 'مُفعَّل — حسابك أكثر أماناً' : 'مُعطَّل — يُنصح بالتفعيل'}
          />
        </div>

        {/* ── إدارة الأجهزة النشطة ── */}
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الأجهزة النشطة</p>
          <div className="space-y-2">
            <AnimatePresence>
              {sessions.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl ${s.current ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-50 border border-slate-100'}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.current ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    <Smartphone className={`w-4 h-4 ${s.current ? 'text-emerald-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.device}</p>
                    <p className="text-xs text-slate-400 truncate">{s.location} · {s.time}</p>
                  </div>
                  {s.current && (
                    <span className="flex-shrink-0 flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3" />
                      هذا الجهاز
                    </span>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            {!loggedOut ? (
              <motion.button
                key="logout-others"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={logoutOthers}
                disabled={sessions.length <= 1}
                className="mt-3 w-full h-11 rounded-2xl bg-red-50 border border-red-100 text-red-600 font-semibold text-sm disabled:opacity-40"
              >
                تسجيل الخروج من الأجهزة الأخرى
              </motion.button>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-3 w-full h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-2 text-emerald-700 font-semibold text-sm"
              >
                <Check className="w-4 h-4" />
                تم تسجيل الخروج من الأجهزة الأخرى
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── صلاحيات GPS ── */}
        <div>
          <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الصلاحيات</p>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <motion.button
              type="button"
              onClick={() => setGpsAllowed((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${gpsAllowed ? 'bg-emerald-500' : 'bg-slate-200'}`}
            >
              <motion.div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                animate={{ right: gpsAllowed ? 4 : 'auto', left: gpsAllowed ? 'auto' : 4 }}
                transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              />
            </motion.button>
            <div className="flex items-center gap-2.5 text-right">
              <div>
                <p className="text-sm font-semibold text-slate-800">الوصول إلى الموقع الجغرافي</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {gpsAllowed ? 'مسموح — تحديث المحافظة تلقائياً' : 'محظور — لن يتم تحديد موقعك'}
                </p>
              </div>
              {gpsAllowed
                ? <Wifi className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                : <WifiOff className="w-4 h-4 text-slate-400 flex-shrink-0" />}
            </div>
          </div>
        </div>

        {/* ── حذف الحساب ── */}
        <div className="border-t border-slate-100 pt-2">
          <AnimatePresence mode="wait">
            {!deleteConf ? (
              <motion.button
                key="del-btn"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDeleteConf(true)}
                className="w-full h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm"
              >
                حذف الحساب نهائياً
              </motion.button>
            ) : (
              <motion.div
                key="del-confirm"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-3"
              >
                <p className="text-red-700 font-bold text-sm">هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-2">
                  <button onClick={() => setDeleteConf(false)} className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold">إلغاء</button>
                  <button className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold">نعم، احذف الحساب</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 7. Rating Modal
// ══════════════════════════════════════════════════════════════
function RatingModal({ onClose }: { onClose: () => void }) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
      >
        <button onClick={onClose} className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
          <X className="w-4 h-4 text-slate-500" />
        </button>
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="rating" className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-4xl mb-2">⭐</div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">قيّم تجربتك</h3>
              <p className="text-slate-400 text-sm mb-5">رأيك يساعدنا على التحسين</p>
              <div className="flex justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    whileTap={{ scale: 1.35 }}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    onMouseEnter={() => setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(star)}
                    className="text-3xl leading-none"
                  >
                    <motion.span animate={{ color: star <= (hovered || rating) ? '#f59e0b' : '#d1d5db' }} transition={{ duration: 0.15 }} style={{ display: 'inline-block' }}>★</motion.span>
                  </motion.button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setSubmitted(true)} disabled={!rating}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-sm shadow-md disabled:opacity-40">
                إرسال التقييم
              </motion.button>
            </motion.div>
          ) : (
            <motion.div key="thanks" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-4">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }} className="text-5xl mb-3">🎉</motion.div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">شكراً جزيلاً!</h3>
              <p className="text-slate-400 text-sm mb-4">تقييمك يعني لنا الكثير ويساعدنا على تحسين خدماتنا</p>
              <button onClick={onClose} className="px-8 h-10 rounded-2xl bg-emerald-50 text-emerald-700 font-semibold text-sm">إغلاق</button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// 8. Help & Support Modal
// ══════════════════════════════════════════════════════════════
const FAQ_ITEMS = [
  { q: 'كيف أبحث عن دواء معين؟',            a: 'اكتب اسم الدواء في شريط البحث الرئيسي، وسيظهر لك قائمة بالصيدليات المتوفر لديها هذا الدواء مع الأسعار.' },
  { q: 'كيف أتتبع طلبي؟',                    a: 'اذهب إلى قسم "طلباتي" من الشريط السفلي، وستجد تحديثات حية لحالة طلبك.' },
  { q: 'هل يمكنني إلغاء الطلب بعد الإرسال؟', a: 'يمكنك إلغاء الطلب خلال 5 دقائق من الإرسال. بعد ذلك، تواصل مع الصيدلية مباشرةً.' },
  { q: 'ما هي طرق الدفع المتاحة؟',           a: 'ندعم الدفع عند الاستلام (كاش)، وسنضيف الدفع الإلكتروني قريباً.' },
  { q: 'لماذا يتطلب بعض الأدوية وصفة طبية؟', a: 'وفقاً للقانون العراقي، بعض الأدوية لا يمكن صرفها إلا بوصفة طبية سارية المفعول، حفاظاً على سلامتك.' },
];

function HelpModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="المساعدة والدعم" icon={<HelpCircle className="w-5 h-5 text-indigo-500" />} onClose={onClose} />
      <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto">
        <div>
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">الأسئلة الشائعة</p>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-slate-50 rounded-2xl overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-4 py-3.5 text-right">
                  <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.22 }}><ChevronDown className="w-4 h-4 text-slate-400" /></motion.div>
                  <span className="text-sm font-semibold text-slate-700 flex-1 text-right pr-2">{item.q}</span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', damping: 28, stiffness: 300 }} className="overflow-hidden">
                      <p className="text-xs text-slate-500 leading-relaxed px-4 pb-4 text-right">{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">تواصل معنا</p>
          <div className="flex justify-center gap-5">
            {[
              { href: 'https://wa.me/9647700000000', label: 'واتساب', bg: 'rgba(37,211,102,0.12)', border: 'rgba(37,211,102,0.3)',
                icon: <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> },
              { href: 'https://www.instagram.com', label: 'إنستغرام', bg: 'rgba(214,41,118,0.08)', border: 'rgba(214,41,118,0.2)',
                icon: <svg viewBox="0 0 24 24" className="w-7 h-7" fill="url(#ig-g2)"><defs><linearGradient id="ig-g2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#f09433"/><stop offset="50%" stopColor="#dc2743"/><stop offset="100%" stopColor="#bc1888"/></linearGradient></defs><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg> },
              { href: 'https://www.tiktok.com', label: 'تيك توك', bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.1)',
                icon: <svg viewBox="0 0 24 24" className="w-7 h-7 fill-slate-900"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.78 1.53V7.01a4.85 4.85 0 01-1.01-.32z"/></svg> },
              { href: 'mailto:support@dawai.iq', label: 'راسلنا', bg: 'rgba(79,70,229,0.08)', border: 'rgba(79,70,229,0.2)',
                icon: <MessageCircle className="w-7 h-7 text-indigo-500" /> },
            ].map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5">
                <motion.div whileTap={{ scale: 0.9 }} className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ background: item.bg, backdropFilter: 'blur(12px)', border: `1px solid ${item.border}` }}>
                  {item.icon}
                </motion.div>
                <span className="text-[10px] font-semibold text-slate-500">{item.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// Setting Item Row
// ══════════════════════════════════════════════════════════════
function SettingItem({
  icon: Icon, label, iconBg = 'bg-slate-100', iconColor = 'text-slate-600',
  onClick, index, danger = false,
}: {
  icon: React.ElementType; label: string; iconBg?: string;
  iconColor?: string; onClick?: () => void; index: number; danger?: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 bg-white rounded-2xl border shadow-sm ${danger ? 'border-red-100' : 'border-slate-100'}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className={`flex-1 font-medium text-sm text-right ${danger ? 'text-red-600' : 'text-slate-700'}`}>{label}</span>
      {!danger && <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════
type ModalKey = 'profile' | 'phone' | 'address' | 'password' | 'notifications' | 'privacy' | 'rating' | 'help' | null;

export function Account() {
  const { user, logout } = useContext(AuthContext)!;
  const navigate         = useNavigate();
  const [modal, setModal] = useState<ModalKey>(null);

  const open  = (k: ModalKey) => () => setModal(k);
  const close = () => setModal(null);

  const handleLogout = () => { logout(); navigate('/'); };

  let idx = 0;
  const i = () => idx++;

  return (
    <>
      <div className="flex-1 flex flex-col bg-muted/20">
        {/* Header */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/40">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white text-xl font-bold">{user?.name ?? 'المستخدم'}</h2>
              {user?.phone && <p className="text-emerald-100 text-sm mt-0.5" dir="ltr">{user.phone}</p>}
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-4 space-y-5 overflow-y-auto">

          {/* الحساب */}
          <div>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">الحساب</h3>
            <div className="space-y-2">
              <SettingItem icon={User}   label="معلومات الملف الشخصي" iconBg="bg-emerald-50" iconColor="text-emerald-600" onClick={open('profile')}  index={i()} />
              <SettingItem icon={Phone}  label="رقم الجوال"            iconBg="bg-blue-50"    iconColor="text-blue-600"    onClick={open('phone')}    index={i()} />
              <SettingItem icon={Lock}   label="كلمة المرور"           iconBg="bg-purple-50"  iconColor="text-purple-600"  onClick={open('password')} index={i()} />
              <SettingItem icon={MapPin} label="العنوان والمحافظة"     iconBg="bg-teal-50"    iconColor="text-teal-600"    onClick={open('address')}  index={i()} />
            </div>
          </div>

          {/* التفضيلات */}
          <div>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">التفضيلات</h3>
            <div className="space-y-2">
              <SettingItem icon={Bell}   label="إعدادات الإشعارات" iconBg="bg-amber-50" iconColor="text-amber-600" onClick={open('notifications')} index={i()} />
              <SettingItem icon={Shield} label="الخصوصية والأمان"  iconBg="bg-teal-50"  iconColor="text-teal-600"  onClick={open('privacy')}       index={i()} />
            </div>
          </div>

          {/* الدعم */}
          <div>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">الدعم</h3>
            <div className="space-y-2">
              <SettingItem icon={Star}       label="قيّم التطبيق"   iconBg="bg-yellow-50" iconColor="text-yellow-600" onClick={open('rating')} index={i()} />
              <SettingItem icon={HelpCircle} label="المساعدة والدعم" iconBg="bg-indigo-50" iconColor="text-indigo-600" onClick={open('help')}   index={i()} />
            </div>
          </div>

          {/* تابعنا */}
          <div>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">تابعنا</h3>
            <motion.a
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.98 }}
              href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer"
              className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-900">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.78 1.53V7.01a4.85 4.85 0 01-1.01-.32z" />
                </svg>
              </div>
              <span className="flex-1 font-medium text-sm text-right text-slate-700">تابعنا على TikTok</span>
              <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </motion.a>
          </div>

          {/* تسجيل الخروج */}
          <SettingItem icon={LogOut} label="تسجيل الخروج" iconBg="bg-red-50" iconColor="text-red-500" onClick={handleLogout} index={i()} danger />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'profile'       && <ProfileInfoModal  key="prof"  user={user}                     onClose={close} />}
        {modal === 'phone'         && <PhoneModal        key="phone" currentPhone={user?.phone}       onClose={close} />}
        {modal === 'address'       && <AddressModal      key="addr"                                   onClose={close} />}
        {modal === 'password'      && <PasswordModal     key="pass"                                   onClose={close} />}
        {modal === 'notifications' && <NotificationsModal key="notif"                                 onClose={close} />}
        {modal === 'privacy'       && <PrivacyModal      key="priv"                                   onClose={close} />}
        {modal === 'rating'        && <RatingModal       key="rate"                                   onClose={close} />}
        {modal === 'help'          && <HelpModal         key="help"                                   onClose={close} />}
      </AnimatePresence>
    </>
  );
}
