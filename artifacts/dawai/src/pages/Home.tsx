import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Camera, MapPin, ChevronLeft } from 'lucide-react';
import {
  useGetPopularMedications,
  useGetNearbyPharmacies,
} from '@workspace/api-client-react';

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />;
}

function MedicationCard({
  name, genericName, category, requiresPrescription, index,
}: {
  name: string; genericName: string; category: string;
  requiresPrescription: boolean; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="flex-shrink-0 w-36 bg-white rounded-2xl p-3 shadow-sm border border-slate-100"
    >
      <div className="w-full h-20 bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl mb-3 flex items-center justify-center">
        <span className="text-3xl">💊</span>
      </div>
      <p className="text-slate-800 font-semibold text-sm leading-tight mb-1 truncate">{name}</p>
      <p className="text-slate-400 text-xs truncate">{genericName}</p>
      <div className="flex items-center gap-1 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
          {category}
        </span>
        {requiresPrescription && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium">
            وصفة
          </span>
        )}
      </div>
    </motion.div>
  );
}

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
        <span className="text-xl">🏪</span>
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

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const { data: popularMeds,     isLoading: loadingMeds }      = useGetPopularMedications();
  const { data: nearbyPharmacies, isLoading: loadingPharmacies } = useGetNearbyPharmacies();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const categories = ['مسكنات', 'مضادات حيوية', 'فيتامينات', 'أمراض مزمنة'];

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* رأس الصفحة */}
      <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-5 pt-10 pb-8">
        <div className="flex items-center gap-1.5 mb-4">
          <MapPin className="w-3.5 h-3.5 text-emerald-200" />
          <span className="text-emerald-100 text-xs">الرياض، حي العليا</span>
        </div>
        <div className="mb-6">
          <h2 className="text-white text-2xl font-bold">مرحباً بك 👋</h2>
          <p className="text-emerald-100 text-sm mt-1">ابحث عن دوائك في أقرب صيدلية</p>
        </div>

        {/* شريط البحث */}
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
              <button
                type="button"
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
              >
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="flex-1 px-4 pt-5 pb-4 space-y-6 overflow-y-auto">
        {/* فئات الأدوية */}
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

        {/* الأدوية الشائعة */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-700 font-bold text-base">الأدوية الشائعة</h3>
            <button className="text-emerald-600 text-sm font-medium">عرض الكل</button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {loadingMeds
              ? Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} className="w-36 h-36 flex-shrink-0" />
                ))
              : popularMeds?.map((med, i) => (
                  <MedicationCard
                    key={med.id}
                    name={med.name}
                    genericName={med.genericName}
                    category={med.category}
                    requiresPrescription={med.requiresPrescription ?? false}
                    index={i}
                  />
                ))}
          </div>
        </div>

        {/* الصيدليات القريبة */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-slate-700 font-bold text-base">الصيدليات القريبة</h3>
            <div className="flex items-center gap-1 text-slate-400 text-xs">
              <MapPin className="w-3 h-3" />
              <span>العليا</span>
            </div>
          </div>
          <div className="space-y-3">
            {loadingPharmacies
              ? Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={i} className="h-20 w-full" />
                ))
              : nearbyPharmacies?.map((pharmacy, i) => (
                  <PharmacyCard
                    key={pharmacy.id}
                    name={pharmacy.name}
                    address={pharmacy.address}
                    distance={pharmacy.distance}
                    isOpen={pharmacy.isOpen}
                    rating={pharmacy.rating}
                    index={i}
                  />
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
