import { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User, Bell, Lock, HelpCircle, Star, LogOut,
  ChevronLeft, Shield, Phone, MapPin, X,
  Eye, EyeOff, ChevronDown, MessageCircle,
} from 'lucide-react';
import { AuthContext } from '@/contexts/AuthContext';

// ══════════════════════════════════════════════════════════════
// Shared: Bottom Sheet wrapper
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
      <motion.div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-[430px] rounded-t-3xl bg-white/90 backdrop-blur-2xl border-t border-white/60 shadow-2xl overflow-hidden"
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
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"
      >
        <X className="w-4 h-4 text-slate-500" />
      </button>
      <div className="flex items-center gap-2">
        <span className="font-bold text-slate-800">{title}</span>
        {icon}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// Toggle Switch
// ══════════════════════════════════════════════════════════════
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-12 h-6 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
        animate={{ right: value ? 4 : 'auto', left: value ? 'auto' : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      />
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. Notifications Modal
// ══════════════════════════════════════════════════════════════
function NotificationsModal({ onClose }: { onClose: () => void }) {
  const [appNotifs, setAppNotifs]   = useState(true);
  const [whatsapp,  setWhatsapp]    = useState(true);
  const [promos,    setPromos]      = useState(false);
  const [saved,     setSaved]       = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(onClose, 1000);
  };

  const rows = [
    { label: 'إشعارات التطبيق',            sub: 'تنبيهات فورية داخل التطبيق', value: appNotifs, set: setAppNotifs },
    { label: 'تنبيهات الطلبات عبر واتساب', sub: 'رسائل واتساب عند تحديث الطلب', value: whatsapp,  set: setWhatsapp  },
    { label: 'العروض الترويجية',            sub: 'أحدث العروض والخصومات',        value: promos,    set: setPromos    },
  ];

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="إعدادات الإشعارات" icon={<Bell className="w-5 h-5 text-amber-500" />} onClose={onClose} />
      <div className="px-5 py-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
            <Toggle value={r.value} onChange={r.set} />
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">{r.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{r.sub}</p>
            </div>
          </div>
        ))}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          className="w-full h-12 mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md"
        >
          {saved ? '✓ تم الحفظ' : 'حفظ الإعدادات'}
        </motion.button>
      </div>
      <div className="pb-safe" />
    </Sheet>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. Privacy & Security Modal
// ══════════════════════════════════════════════════════════════
function PrivacyModal({ onClose }: { onClose: () => void }) {
  const [cur,        setCur]        = useState('');
  const [next,       setNext]       = useState('');
  const [confirm,    setConfirm]    = useState('');
  const [showCur,    setShowCur]    = useState(false);
  const [showNext,   setShowNext]   = useState(false);
  const [showConf,   setShowConf]   = useState(false);
  const [saved,      setSaved]      = useState(false);
  const [deleteConf, setDeleteConf] = useState(false);

  const handleSave = () => {
    if (!cur || !next || next !== confirm) return;
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  const pwField = (
    label: string,
    value: string,
    set: (v: string) => void,
    show: boolean,
    toggle: () => void,
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
        <button
          type="button"
          onClick={toggle}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="الخصوصية والأمان" icon={<Shield className="w-5 h-5 text-teal-500" />} onClose={onClose} />
      <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
        <p className="text-xs font-bold text-slate-500 mb-1">تغيير كلمة المرور</p>
        {pwField('كلمة المرور الحالية',   cur,     setCur,     showCur,  () => setShowCur(v  => !v))}
        {pwField('كلمة المرور الجديدة',   next,    setNext,    showNext, () => setShowNext(v => !v))}
        {pwField('تأكيد كلمة المرور',     confirm, setConfirm, showConf, () => setShowConf(v => !v))}

        {next && confirm && next !== confirm && (
          <p className="text-xs text-red-500">كلمتا المرور غير متطابقتين</p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSave}
          disabled={!cur || !next || next !== confirm}
          className="w-full h-12 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md disabled:opacity-40"
        >
          {saved ? '✓ تم تغيير كلمة المرور' : 'حفظ التغييرات'}
        </motion.button>

        <div className="border-t border-slate-100 pt-3 mt-1">
          <AnimatePresence mode="wait">
            {!deleteConf ? (
              <motion.button
                key="del-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDeleteConf(true)}
                className="w-full h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 font-bold text-sm"
              >
                حذف الحساب نهائياً
              </motion.button>
            ) : (
              <motion.div
                key="del-confirm"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center space-y-3"
              >
                <p className="text-red-700 font-bold text-sm">هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConf(false)}
                    className="flex-1 h-10 rounded-xl bg-white border border-slate-200 text-slate-600 text-sm font-semibold"
                  >
                    إلغاء
                  </button>
                  <button
                    className="flex-1 h-10 rounded-xl bg-red-500 text-white text-sm font-bold"
                  >
                    نعم، احذف الحساب
                  </button>
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
// 3. Rating Modal (Center)
// ══════════════════════════════════════════════════════════════
function RatingModal({ onClose }: { onClose: () => void }) {
  const [rating,    setRating]    = useState(0);
  const [hovered,   setHovered]   = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!rating) return;
    setSubmitted(true);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl border border-white/60"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"
        >
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
                    <motion.span
                      animate={{ color: star <= (hovered || rating) ? '#f59e0b' : '#d1d5db' }}
                      transition={{ duration: 0.15 }}
                      style={{ display: 'inline-block' }}
                    >
                      ★
                    </motion.span>
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSubmit}
                disabled={!rating}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-sm shadow-md disabled:opacity-40"
              >
                إرسال التقييم
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="thanks"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                className="text-5xl mb-3"
              >
                🎉
              </motion.div>
              <h3 className="font-bold text-slate-800 text-lg mb-1">شكراً جزيلاً!</h3>
              <p className="text-slate-400 text-sm mb-4">تقييمك يعني لنا الكثير ويساعدنا على تحسين خدماتنا</p>
              <button
                onClick={onClose}
                className="px-8 h-10 rounded-2xl bg-emerald-50 text-emerald-700 font-semibold text-sm"
              >
                إغلاق
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════
// 4. Help & Support Modal
// ══════════════════════════════════════════════════════════════
const FAQ_ITEMS = [
  { q: 'كيف أبحث عن دواء معين؟',          a: 'اكتب اسم الدواء في شريط البحث الرئيسي، وسيظهر لك قائمة بالصيدليات المتوفر لديها هذا الدواء مع الأسعار.' },
  { q: 'كيف أتتبع طلبي؟',                  a: 'اذهب إلى قسم "طلباتي" من الشريط السفلي، وستجد تحديثات حية لحالة طلبك.' },
  { q: 'هل يمكنني إلغاء الطلب بعد الإرسال؟', a: 'يمكنك إلغاء الطلب خلال 5 دقائق من الإرسال. بعد ذلك، تواصل مع الصيدلية مباشرةً.' },
  { q: 'ما هي طرق الدفع المتاحة؟',         a: 'ندعم الدفع عند الاستلام (كاش)، وسنضيف الدفع الإلكتروني قريباً.' },
  { q: 'لماذا يتطلب بعض الأدوية وصفة طبية؟', a: 'وفقاً للقانون العراقي، بعض الأدوية لا يمكن صرفها إلا بوصفة طبية سارية المفعول، حفاظاً على سلامتك.' },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="bg-slate-50 rounded-2xl overflow-hidden">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-right"
          >
            <motion.div
              animate={{ rotate: open === i ? 180 : 0 }}
              transition={{ duration: 0.22 }}
            >
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </motion.div>
            <span className="text-sm font-semibold text-slate-700 flex-1 text-right pr-2">{item.q}</span>
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="overflow-hidden"
              >
                <p className="text-xs text-slate-500 leading-relaxed px-4 pb-4 text-right">{item.a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <SheetHeader title="المساعدة والدعم" icon={<HelpCircle className="w-5 h-5 text-indigo-500" />} onClose={onClose} />
      <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto">
        {/* FAQ */}
        <div>
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">الأسئلة الشائعة</p>
          <FaqAccordion />
        </div>

        {/* Contact */}
        <div>
          <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">تواصل معنا</p>
          <div className="flex justify-center gap-5">
            {/* WhatsApp */}
            <a
              href="https://wa.me/9647700000000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(37,211,102,0.3)',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.18)',
                }}
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#25D366]">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </motion.div>
              <span className="text-[10px] font-semibold text-slate-500">واتساب</span>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(214,41,118,0.25)',
                  boxShadow: '0 4px 16px rgba(214,41,118,0.12)',
                }}
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="url(#ig-grad)">
                  <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433" />
                      <stop offset="25%" stopColor="#e6683c" />
                      <stop offset="50%" stopColor="#dc2743" />
                      <stop offset="75%" stopColor="#cc2366" />
                      <stop offset="100%" stopColor="#bc1888" />
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </motion.div>
              <span className="text-[10px] font-semibold text-slate-500">إنستغرام</span>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,0,0,0.12)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 fill-slate-900">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.78 1.53V7.01a4.85 4.85 0 01-1.01-.32z" />
                </svg>
              </motion.div>
              <span className="text-[10px] font-semibold text-slate-500">تيك توك</span>
            </a>

            {/* Direct message / email */}
            <a
              href="mailto:support@dawai.iq"
              className="flex flex-col items-center gap-1.5"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md"
                style={{
                  background: 'rgba(255,255,255,0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(79,70,229,0.2)',
                  boxShadow: '0 4px 16px rgba(79,70,229,0.1)',
                }}
              >
                <MessageCircle className="w-7 h-7 text-indigo-500" />
              </motion.div>
              <span className="text-[10px] font-semibold text-slate-500">راسلنا</span>
            </a>
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
      transition={{ delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 bg-white rounded-2xl border shadow-sm ${
        danger ? 'border-red-100' : 'border-slate-100'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <span className={`flex-1 font-medium text-sm text-right ${danger ? 'text-red-600' : 'text-slate-700'}`}>
        {label}
      </span>
      {!danger && <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />}
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════
type ModalKey = 'notifications' | 'privacy' | 'rating' | 'help' | null;

export function Account() {
  const { user, logout } = useContext(AuthContext)!;
  const navigate         = useNavigate();
  const [modal, setModal] = useState<ModalKey>(null);

  const open  = (k: ModalKey) => () => setModal(k);
  const close = () => setModal(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const settingsGroups = [
    {
      title: 'الحساب',
      items: [
        { icon: User,   label: 'معلومات الملف الشخصي', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', onClick: open(null) },
        { icon: Phone,  label: 'رقم الجوال',            iconBg: 'bg-blue-50',    iconColor: 'text-blue-600',    onClick: open(null) },
        { icon: Lock,   label: 'كلمة المرور',           iconBg: 'bg-purple-50',  iconColor: 'text-purple-600',  onClick: open('privacy') },
        { icon: MapPin, label: 'العنوان والمحافظة',     iconBg: 'bg-teal-50',    iconColor: 'text-teal-600',    onClick: open(null) },
      ],
    },
    {
      title: 'التفضيلات',
      items: [
        { icon: Bell,   label: 'إعدادات الإشعارات', iconBg: 'bg-amber-50', iconColor: 'text-amber-600', onClick: open('notifications') },
        { icon: Shield, label: 'الخصوصية والأمان',  iconBg: 'bg-teal-50',  iconColor: 'text-teal-600',  onClick: open('privacy')       },
      ],
    },
    {
      title: 'الدعم',
      items: [
        { icon: Star,       label: 'قيّم التطبيق',   iconBg: 'bg-yellow-50', iconColor: 'text-yellow-600', onClick: open('rating') },
        { icon: HelpCircle, label: 'المساعدة والدعم', iconBg: 'bg-indigo-50', iconColor: 'text-indigo-600', onClick: open('help')   },
      ],
    },
  ];

  let globalIndex = 0;

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
              {user?.phone && (
                <p className="text-emerald-100 text-sm mt-0.5" dir="ltr">{user.phone}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 pt-5 pb-4 space-y-5 overflow-y-auto">
          {settingsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.items.map((item) => {
                  const idx = globalIndex++;
                  return (
                    <SettingItem
                      key={item.label}
                      icon={item.icon}
                      label={item.label}
                      iconBg={item.iconBg}
                      iconColor={item.iconColor}
                      onClick={item.onClick}
                      index={idx}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Social */}
          <div>
            <h3 className="text-slate-400 text-xs font-semibold mb-2 px-1 uppercase tracking-wider">تابعنا</h3>
            <motion.a
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45 }}
              whileTap={{ scale: 0.98 }}
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
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

          {/* Logout */}
          <SettingItem
            icon={LogOut}
            label="تسجيل الخروج"
            iconBg="bg-red-50"
            iconColor="text-red-500"
            onClick={handleLogout}
            index={globalIndex++}
            danger
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal === 'notifications' && <NotificationsModal key="notif" onClose={close} />}
        {modal === 'privacy'        && <PrivacyModal       key="priv"  onClose={close} />}
        {modal === 'rating'         && <RatingModal        key="rate"  onClose={close} />}
        {modal === 'help'           && <HelpModal          key="help"  onClose={close} />}
      </AnimatePresence>
    </>
  );
}
