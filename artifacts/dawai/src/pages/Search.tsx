import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, MapPin, MessageCircle, ShoppingBag, Star } from 'lucide-react';
import { useSearchMedications, useCreateOrder, getGetOrdersQueryKey, getSearchMedicationsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { PrescriptionModal } from '@/components/PrescriptionModal';

function PharmacyResultSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="flex gap-2 mt-2">
            <div className="h-6 bg-slate-200 rounded-lg w-20" />
            <div className="h-6 bg-slate-200 rounded-lg w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PharmacyResultCard({
  pharmacyId, medicationId, medicationName, requiresPrescription,
  pharmacyName, address, distance, isOpen, rating, whatsapp, price, quantity, index,
}: {
  pharmacyId: number; medicationId: number; medicationName: string;
  requiresPrescription: boolean; pharmacyName: string; address: string;
  distance: number; isOpen: boolean; rating: number | null;
  whatsapp: string | null; price: number; quantity: number; index: number;
}) {
  const { toast }      = useToast();
  const queryClient    = useQueryClient();
  const createOrder    = useCreateOrder();
  const [showPrescription, setShowPrescription] = useState(false);

  const doReserve = () => {
    createOrder.mutate(
      { data: { pharmacyId, medicationId, quantity: 1 } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
          toast({ title: 'تم الحجز بنجاح', description: `تم حجز الدواء من ${pharmacyName}` });
        },
        onError: () => {
          toast({ title: 'فشل الحجز', description: 'يرجى المحاولة مرة أخرى', variant: 'destructive' });
        },
      }
    );
  };

  const handleReserveClick = () => {
    requiresPrescription ? setShowPrescription(true) : doReserve();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
        data-testid={`card-pharmacy-result-${index}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center text-xl">🏪</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-slate-800 truncate">{pharmacyName}</p>
              <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${isOpen ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-500'}`}>
                {isOpen ? 'مفتوح' : 'مغلق'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-xs mb-2">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{address}</span>
              <span className="text-slate-300">•</span>
              <span className="flex-shrink-0">
                {distance < 1 ? `${Math.round(distance * 1000)} م` : `${distance.toFixed(1)} كم`}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-50 rounded-lg px-3 py-1">
                <span className="text-emerald-700 font-bold text-sm">{price.toFixed(2)}</span>
                <span className="text-emerald-600 text-xs mr-0.5">ر.س</span>
              </div>
              <span className="text-slate-500 text-xs">الكمية: {quantity}</span>
              {rating !== null && (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-slate-500">{rating.toFixed(1)}</span>
                </div>
              )}
              {requiresPrescription && (
                <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium flex-shrink-0">وصفة</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          {whatsapp && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => window.open(`https://wa.me/${whatsapp.replace(/\D/g, '')}`, '_blank')}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-green-500 text-white font-semibold text-sm"
            >
              <MessageCircle className="w-4 h-4" />واتساب
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleReserveClick}
            disabled={!isOpen || quantity === 0 || createOrder.isPending}
            className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-50"
            data-testid={`button-reserve-${index}`}
          >
            <ShoppingBag className="w-4 h-4" />
            {createOrder.isPending ? 'جاري الحجز...' : 'احجز الآن'}
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showPrescription && (
          <PrescriptionModal
            medicationName={medicationName}
            onConfirm={() => { setShowPrescription(false); doReserve(); }}
            onClose={() => setShowPrescription(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';

  const { data, isLoading } = useSearchMedications(
    { q },
    { query: { enabled: !!q, queryKey: getSearchMedicationsQueryKey({ q }) } }
  );

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-10 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </motion.button>
          <div>
            <p className="text-emerald-100 text-xs">نتائج البحث عن</p>
            <h1 className="text-white font-bold text-lg leading-tight truncate">"{q}"</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-5 pb-4 space-y-4 overflow-y-auto">
        {isLoading ? (
          <>
            <div className="animate-pulse h-20 bg-white rounded-2xl border border-slate-100" />
            {Array.from({ length: 3 }).map((_, i) => <PharmacyResultSkeleton key={i} />)}
          </>
        ) : !data?.medication ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-slate-700 font-bold text-lg mb-2">لم نجد نتائج</h3>
            <p className="text-slate-400 text-sm">لا يوجد دواء بهذا الاسم في قاعدة بياناتنا</p>
          </motion.div>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">💊</div>
                <div>
                  <p className="font-bold text-slate-800 text-base">{data.medication.name}</p>
                  <p className="text-slate-400 text-xs">{data.medication.genericName}</p>
                  <div className="flex gap-1.5 mt-1.5">
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-medium">
                      {data.medication.category}
                    </span>
                    {data.medication.requiresPrescription && (
                      <span className="text-[10px] px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">
                        يستلزم وصفة طبية
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {data.pharmacies.length > 0 ? (
              <>
                <p className="text-slate-500 text-sm font-medium">
                  متوفر في {data.pharmacies.length} صيدلية قريبة
                </p>
                {data.pharmacies.map((hit, i) => (
                  <PharmacyResultCard
                    key={hit.pharmacy.id}
                    pharmacyId={hit.pharmacy.id}
                    medicationId={data.medication!.id}
                    medicationName={data.medication!.name}
                    requiresPrescription={data.medication!.requiresPrescription ?? false}
                    pharmacyName={hit.pharmacy.name}
                    address={hit.pharmacy.address}
                    distance={hit.pharmacy.distance}
                    isOpen={hit.pharmacy.isOpen}
                    rating={hit.pharmacy.rating ?? null}
                    whatsapp={hit.pharmacy.whatsapp ?? null}
                    price={hit.price}
                    quantity={hit.quantity}
                    index={i}
                  />
                ))}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="text-4xl mb-3">😔</div>
                <h3 className="text-slate-700 font-bold mb-1">غير متوفر حالياً</h3>
                <p className="text-slate-400 text-sm">هذا الدواء غير متوفر في الصيدليات القريبة منك</p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
