import { useState, useContext, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, MapPin, ChevronLeft, Pill, Store, ShoppingCart, X, Upload } from 'lucide-react';
import { useGetNearbyPharmacies, useGetAvailableMedications, type CatalogItem } from '@workspace/api-client-react';
import { AuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

// ── Geolocation: حدود المحافظات العراقية ─────────────────────
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
    if (lat >= g.latMin && lat <= g.latMax && lng >= g.lngMin && lng <= g.lngMax)
      return g.name;
  }
  return '';
}

// ── Skeleton ─────────────────────────────────────────────────
function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />;
}

// ── الحالة الفارغة ────────────────────────────────────────────
function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl mb-3 shadow-sm">
        {emoji}
      </div>
      <p className="text-slate-700 font-bold text-sm mb-1">{title}</p>
      <p className="text-slate-400 text-xs max-w-[200px] leading-relaxed">{sub}</p>
    </motion.div>
  );
}

// ── بطاقة الدواء ──────────────────────────────────────────────
function MedicationCard({
  name, genericName, category, requiresPrescription, price, index, onOrder,
}: {
  name: string; genericName: string; category: string;
  requiresPrescription: boolean; price: number; index: number;
  onOrder: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="flex-shrink-0 w-36 bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex flex-col"
    >
      <div className="w-full h-20 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl mb-3 flex items-center justify-center">
        <Pill className="w-8 h-8 text-emerald-500" />
      </div>
      <p className="text-slate-800 font-semibold text-sm leading-tight mb-1 truncate">{name}</p>
      <p className="text-slate-400 text-xs truncate mb-2">{genericName}</p>
      <div className="flex items-center gap-1 mb-3">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
          {category}
        </span>
        {requiresPrescription && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
            وصفة
          </span>
        )}
      </div>

      {/* السعر */}
      <p className="text-emerald-700 font-bold text-sm mb-2">{price.toFixed(2)} IQD</p>

      {/* زر الإضافة للسلة */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={onOrder}
        className="mt-auto w-full h-8 rounded-xl text-xs font-bold flex items-center justify-center gap-1
          bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.35)]"
        data-testid={`button-order-${name}`}
      >
        <ShoppingCart className="w-3 h-3" />
        أضف للسلة
      </motion.button>
    </motion.div>
  );
}

// ── بطاقة الصيدلية ────────────────────────────────────────────
function PharmacyCard({
  name, address, distance, isOpen, rating, index,
}: {
  name: string; address: string; distance: number;
  isOpen: boolean; rating: number | null; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-3"
    >
      <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center">
        <Store className="w-6 h-6 text-emerald-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 truncate">{name}</p>
        <p className="text-xs text-slate-400 truncate mt-0.5">{address}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {isOpen ? 'مفتوح' : 'مغلق'}
          </span>
          <span className="text-[10px] text-slate-400">
            {distance < 1 ? `${Math.round(distance * 1000)} م` : `${distance.toFixed(1)} كم`}
          </span>
          {rating !== null && (
            <span className="text-[10px] text-amber-500">★ {rating.toFixed(1)}</span>
          )}
        </div>
      </div>
      <ChevronLeft className="w-4 h-4 text-slate-300 flex-shrink-0" />
    </motion.div>
  );
}

// ── نافذة البحث البصري (كاميرا / معرض) ───────────────────────
function VisualSearchModal({
  onClose, onPick,
}: { onClose: () => void; onPick: (file: File) => void }) {
  const camRef = useRef<HTMLInputElement>(null);
  const galRef = useRef<HTMLInputElement>(null);

  // إغلاق بزر Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      data-testid="visual-search-modal"
    >
      {/* الخلفية الداكنة */}
      <motion.div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* البطاقة */}
      <motion.div
        className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="البحث البصري"
        initial={{ y: 40, scale: 0.94, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.94, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          data-testid="button-close-visual-search"
          aria-label="إغلاق"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex justify-center mb-4 mt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>

        <h3 className="text-center text-lg font-bold text-slate-800 mb-1">البحث البصري</h3>
        <p className="text-center text-sm text-slate-500 mb-6 leading-relaxed">
          التقط صورة للدواء أو العبوة للعثور على أدوية مشابهة في الصيدليات القريبة
        </p>

        {/* مدخلات مخفية */}
        <input
          ref={camRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />
        <input
          ref={galRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) onPick(f); }}
        />

        <div className="space-y-2.5">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => camRef.current?.click()}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            data-testid="button-capture-photo"
          >
            <Camera className="w-4 h-4" /> التقاط صورة
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => galRef.current?.click()}
            className="w-full h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
            data-testid="button-upload-photo"
          >
            <Upload className="w-4 h-4" /> رفع من المعرض
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
export function Home() {
  const [searchQuery,      setSearchQuery]      = useState('');
  const [locationLabel,    setLocationLabel]    = useState('البصرة');
  const [locLoading,       setLocLoading]       = useState(true);
  // نافذة البحث البصري
  const [showVisualSearch, setShowVisualSearch] = useState(false);

  const navigate = useNavigate();
  const auth     = useContext(AuthContext);
  const cart     = useCart();
  const { toast } = useToast();

  // الأدوية المتاحة للطلب — من مخزون الصيدليات (الكمية > 0)
  const { data: catalog, isLoading: loadingMeds } = useGetAvailableMedications();
  const popularMeds = catalog ?? [];

  const { data: nearbyPharmacies, isLoading: loadingPharmacies } = useGetNearbyPharmacies();

  // ── كشف الموقع الجغرافي ──────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setLocLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const gov = detectGovernorate(coords.latitude, coords.longitude);
        setLocationLabel(gov || 'البصرة');
        setLocLoading(false);
      },
      () => setLocLoading(false),
      { timeout: 6000, maximumAge: 300000 }
    );
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim())
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  // ── البحث البصري (كاميرا شريط البحث) → فتح النافذة المنبثقة ──
  const handleVisualSearch = () => setShowVisualSearch(true);

  const handleVisualPick = (file: File) => {
    setShowVisualSearch(false);
    toast({
      title: '📷 تم اختيار الصورة',
      description: `${file.name} — جاري البحث عن أدوية مشابهة...`,
      duration: 3000,
    });
  };

  // ── إضافة الدواء إلى السلة (بوابة الوصفة تُطبَّق عند إتمام الطلب) ──
  const handleAddToCart = (item: CatalogItem) => {
    cart.addItem({
      id: item.id,
      medicationId: item.medicationId,
      pharmacyId: item.pharmacyId,
      pharmacyName: item.pharmacyName,
      name: item.name,
      price: item.price,
      requiresPrescription: item.requiresPrescription,
      imageUrl: item.imageUrl ?? null,
    });
    toast({ title: '✅ أُضيف إلى السلة', description: item.name, duration: 2000 });
  };

  const categories = ['مسكنات', 'مضادات حيوية', 'فيتامينات', 'أمراض مزمنة'];

  return (
    <>
      <div className="flex-1 flex flex-col bg-muted/20">
        {/* ── رأس الصفحة ── */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-5 pt-10 pb-8">
          {/* الموقع الديناميكي */}
          <div className="flex items-center gap-1.5 mb-4">
            <MapPin className="w-3.5 h-3.5 text-emerald-200" />
            <AnimatePresence mode="wait">
              {locLoading ? (
                <motion.span
                  key="loading-loc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="text-emerald-100 text-xs"
                >
                  جاري تحديد الموقع...
                </motion.span>
              ) : (
                <motion.span
                  key="location-label"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-emerald-100 text-xs font-medium"
                >
                  {locationLabel}
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-6">
            <h2 className="text-white text-2xl font-bold">
              مرحباً{auth?.user?.name ? `، ${auth.user.name.split(' ')[0]}` : ''} 👋
            </h2>
            <p className="text-emerald-100 text-sm mt-1">ابحث عن دوائك في أقرب صيدلية</p>
          </div>

          {/* ── شريط البحث ── */}
          <form onSubmit={handleSearch}>
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl overflow-hidden shadow-lg">
              <div className="flex items-center px-4 h-14">
                <Search className="w-5 h-5 text-white/70 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن دواء..."
                  className="flex-1 bg-transparent text-white placeholder-white/60 font-medium text-base outline-none px-3 text-right"
                  data-testid="input-search"
                />
                {/* زر الكاميرا — بحث بصري فقط، منفصل تماماً عن الوصفة */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  onClick={handleVisualSearch}
                  className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
                  data-testid="button-camera"
                  title="البحث البصري"
                >
                  <Camera className="w-4 h-4 text-white" />
                </motion.button>
              </div>
            </div>
          </form>
        </div>

        <div className="flex-1 px-4 pt-5 pb-4 space-y-6 overflow-y-auto">
          {/* ── فئات الأدوية ── */}
          <div>
            <h3 className="text-slate-700 font-bold text-base mb-3">تصفح حسب الفئة</h3>
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((cat, i) => (
                <motion.button
                  key={cat}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => navigate(`/search?q=${encodeURIComponent(cat)}`)}
                  className="flex-shrink-0 px-4 py-2.5 rounded-xl bg-white border border-slate-100 text-slate-700 font-medium text-sm shadow-sm whitespace-nowrap"
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>

          {/* ── الأدوية الشائعة ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-700 font-bold text-base">الأدوية الشائعة</h3>
              <button
                className="text-emerald-600 text-sm font-medium"
                onClick={() => navigate('/search')}
              >
                عرض الكل
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {loadingMeds
                ? Array.from({ length: 4 }).map((_, i) => (
                    <SkeletonCard key={i} className="w-36 h-40 flex-shrink-0" />
                  ))
                : popularMeds && popularMeds.length > 0
                  ? popularMeds.map((med, i) => (
                      <MedicationCard
                        key={med.id}
                        name={med.name}
                        genericName={med.genericName}
                        category={med.category}
                        requiresPrescription={med.requiresPrescription}
                        price={med.price}
                        index={i}
                        onOrder={() => handleAddToCart(med)}
                      />
                    ))
                  : (
                      <div className="w-full">
                        <EmptyState
                          emoji="💊"
                          title="لا توجد أدوية لعرضها حالياً"
                          sub="سيتم إضافة الأدوية الشائعة قريباً"
                        />
                      </div>
                    )
              }
            </div>
          </div>

          {/* ── الصيدليات القريبة ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-slate-700 font-bold text-base">الصيدليات القريبة</h3>
              {locationLabel && (
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span>{locationLabel}</span>
                </div>
              )}
            </div>
            <div className="space-y-3">
              {loadingPharmacies
                ? Array.from({ length: 3 }).map((_, i) => (
                    <SkeletonCard key={i} className="h-20 w-full" />
                  ))
                : nearbyPharmacies && nearbyPharmacies.length > 0
                  ? nearbyPharmacies.map((pharmacy, i) => (
                      <PharmacyCard
                        key={pharmacy.id}
                        name={pharmacy.name}
                        address={pharmacy.address}
                        distance={pharmacy.distance}
                        isOpen={pharmacy.isOpen}
                        rating={pharmacy.rating ?? null}
                        index={i}
                      />
                    ))
                  : (
                      <EmptyState
                        emoji="🏪"
                        title="لا توجد صيدليات لعرضها حالياً"
                        sub="لم يتم تسجيل صيدليات في منطقتك بعد"
                      />
                    )
              }
            </div>
          </div>
        </div>
      </div>

      {/* ── نافذة البحث البصري — كاميرا/معرض ── */}
      <AnimatePresence>
        {showVisualSearch && (
          <VisualSearchModal
            onClose={() => setShowVisualSearch(false)}
            onPick={handleVisualPick}
          />
        )}
      </AnimatePresence>
    </>
  );
}
