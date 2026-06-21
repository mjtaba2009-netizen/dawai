import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldCheck, ChevronLeft, CheckCircle2, XCircle, Inbox } from 'lucide-react';
import { usePharmacyOrders, useUpdateOrderStatus } from '@/services/hooks';
import type { KanbanOrder } from '@/services/types';

type ColumnKey = 'pending' | 'confirmed' | 'ready';

const COLUMNS: Array<{
  key: ColumnKey;
  title: string;
  dot: string;
  chip: string;
  next?: { status: 'confirmed' | 'ready'; label: string; btn: string };
}> = [
  {
    key: 'pending',
    title: 'جديدة',
    dot: 'bg-amber-400',
    chip: 'bg-amber-50 text-amber-700',
    next: { status: 'confirmed', label: 'بدء التجهيز', btn: 'bg-blue-500 shadow-[0_3px_10px_rgba(59,130,246,0.35)]' },
  },
  {
    key: 'confirmed',
    title: 'قيد التجهيز',
    dot: 'bg-blue-400',
    chip: 'bg-blue-50 text-blue-700',
    next: { status: 'ready', label: 'جاهز للاستلام', btn: 'bg-emerald-500 shadow-[0_3px_10px_rgba(16,185,129,0.35)]' },
  },
  {
    key: 'ready',
    title: 'جاهزة',
    dot: 'bg-emerald-400',
    chip: 'bg-emerald-50 text-emerald-700',
  },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `منذ ${m} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${h} س`;
  return `منذ ${Math.floor(h / 24)} ي`;
}

export function OrdersBoard({ pharmacyId }: { pharmacyId: number | null }) {
  const { data, isLoading: loading } = usePharmacyOrders(pharmacyId ?? undefined, {
    refetchInterval: 5000,
  });
  const orders = data ?? [];
  const updateStatus = useUpdateOrderStatus();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const advance = async (id: number, status: 'confirmed' | 'ready' | 'rejected') => {
    setUpdatingId(id);
    try {
      await updateStatus.mutateAsync({ id, status });
    } finally {
      setUpdatingId(null);
    }
  };

  const grouped: Record<ColumnKey, KanbanOrder[]> = {
    pending: orders.filter((o) => o.status === 'pending'),
    confirmed: orders.filter((o) => o.status === 'confirmed'),
    ready: orders.filter((o) => o.status === 'ready'),
  };

  if (loading) {
    return (
      <div className="flex gap-3 px-4 pt-4 overflow-x-auto no-scrollbar">
        {COLUMNS.map((c) => (
          <div key={c.key} className="flex-shrink-0 w-[78vw] max-w-[300px] space-y-3">
            <div className="h-7 bg-slate-100 rounded-xl animate-pulse" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-28 bg-white/70 rounded-2xl border border-white/60 animate-pulse" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 px-4 pt-4 pb-6 overflow-x-auto no-scrollbar snap-x snap-mandatory">
      {COLUMNS.map((col) => {
        const colOrders = grouped[col.key];
        return (
          <div key={col.key} className="flex-shrink-0 w-[80vw] max-w-[300px] snap-start">
            {/* رأس العمود */}
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
              <h3 className="font-bold text-slate-700 text-sm">{col.title}</h3>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${col.chip}`}>
                {colOrders.length}
              </span>
            </div>

            {/* بطاقات العمود */}
            <div className="space-y-3 min-h-[120px]">
              {colOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-white/40">
                  <Inbox className="w-6 h-6 text-slate-300 mb-1.5" />
                  <p className="text-slate-400 text-xs">لا توجد طلبات</p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {colOrders.map((o) => (
                    <motion.div
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 14, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.18 } }}
                      transition={{ type: 'spring', damping: 24, stiffness: 280 }}
                      className="rounded-2xl p-3.5 bg-white/80 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_rgb(0,0,0,0.06)]"
                      data-testid={`card-order-${o.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-bold text-slate-800 text-sm leading-tight">{o.medication?.name}</p>
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 flex-shrink-0 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {timeAgo(o.createdAt)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs truncate">{o.medication?.genericName}</p>

                      {/* رمز التتبّع — مشترك بين البائع والمريض */}
                      {o.trackingCode && (
                        <span
                          className="inline-block mt-1.5 text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono"
                          data-testid={`text-tracking-${o.id}`}
                        >
                          {o.trackingCode}
                        </span>
                      )}

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-emerald-700 font-bold text-sm">{o.totalPrice.toFixed(2)} IQD</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500 text-xs">الكمية: {o.quantity}</span>
                        {o.medication?.requiresPrescription && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            وصفة
                          </span>
                        )}
                      </div>

                      {/* إجراء التقدّم */}
                      {col.key === 'pending' ? (
                        /* الطلبات الجديدة → قبول (أخضر) أو رفض (أحمر) */
                        <div className="mt-3 flex gap-2">
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => advance(o.id, 'confirmed')}
                            disabled={updatingId === o.id}
                            className="flex-1 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-60 bg-emerald-500 shadow-[0_3px_10px_rgba(16,185,129,0.35)]"
                            data-testid={`button-accept-${o.id}`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            قبول
                          </motion.button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => advance(o.id, 'rejected')}
                            disabled={updatingId === o.id}
                            className="flex-1 h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-60 bg-red-500 shadow-[0_3px_10px_rgba(239,68,68,0.35)]"
                            data-testid={`button-reject-${o.id}`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            رفض
                          </motion.button>
                        </div>
                      ) : col.next ? (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => advance(o.id, col.next!.status)}
                          disabled={updatingId === o.id}
                          className={`mt-3 w-full h-9 rounded-xl text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60 ${col.next.btn}`}
                          data-testid={`button-advance-${o.id}`}
                        >
                          {col.next.label}
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </motion.button>
                      ) : (
                        <div className="mt-3 w-full h-9 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          بانتظار الاستلام
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
