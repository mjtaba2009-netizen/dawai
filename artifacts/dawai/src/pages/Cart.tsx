import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Trash2, Plus, Minus, ChevronRight, Pill, ShieldCheck, Store } from 'lucide-react';
import { createOrder, getGetOrdersQueryKey } from '@workspace/api-client-react';
import { useCart } from '@/contexts/CartContext';
import { PrescriptionModal } from '@/components/PrescriptionModal';
import { useToast } from '@/hooks/use-toast';

export function Cart() {
  const { items, removeItem, updateQty, clearCart, totalCount, totalPrice, hasPrescriptionItem } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showRxGate, setShowRxGate] = useState(false);

  const rxItemName = items.find((i) => i.requiresPrescription)?.name ?? 'طلبك';

  // إرسال طلب لكل سطر في السلة — نجاح كامل يُفرّغ السلة، فشل جزئي يحفظها
  const submitOrders = async () => {
    setSubmitting(true);
    const succeeded: number[] = [];
    let failures = 0;

    try {
      for (const item of items) {
        try {
          await createOrder({
            pharmacyId: item.pharmacyId,
            medicationId: item.medicationId,
            quantity: item.quantity,
          });
          succeeded.push(item.id);
        } catch {
          failures++;
        }
      }

      // تحديث طلبات المريض (react-query) — طلبات الصيدلية تُحدَّث عبر الاستطلاع الدوري
      // فشل التحديث لا يجب أن يمنع تغذية المستخدم الراجعة
      try {
        await queryClient.invalidateQueries({ queryKey: getGetOrdersQueryKey() });
      } catch {
        /* تجاهل: الاستعلام سيُعاد جلبه عند فتح صفحة الطلبات */
      }

      if (failures === 0) {
        clearCart();
        toast({ title: 'تم إرسال الطلب للصيدلية بنجاح', duration: 4000 });
        navigate('/orders');
      } else {
        // نُبقي السطور الفاشلة في السلة لإعادة المحاولة
        succeeded.forEach((id) => removeItem(id));
        toast({
          title: 'تعذّر إرسال بعض الطلبات',
          description: 'يرجى المحاولة مرة أخرى للطلبات المتبقية',
          variant: 'destructive',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0 || submitting) return;
    if (hasPrescriptionItem) {
      setShowRxGate(true);
      return;
    }
    submitOrders();
  };

  return (
    <>
      <div className="flex-1 flex flex-col bg-muted/20">
        {/* رأس الصفحة */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-5 pt-10 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white text-2xl font-bold">سلة المشتريات</h2>
              <p className="text-emerald-100 text-sm mt-1">
                {totalCount > 0 ? `${totalCount} عنصر في سلتك` : 'سلتك فارغة حالياً'}
              </p>
            </div>
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* قائمة العناصر */}
        <div className="flex-1 px-4 pt-5 pb-40 overflow-y-auto">
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-4">
                <ShoppingCart className="w-9 h-9 text-emerald-300" />
              </div>
              <p className="text-slate-700 font-bold mb-1">سلتك فارغة</p>
              <p className="text-slate-400 text-sm max-w-[220px] leading-relaxed mb-5">
                تصفّح الأدوية المتاحة وأضفها إلى سلتك لإتمام الطلب
              </p>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate('/home')}
                className="h-11 px-6 rounded-xl bg-emerald-500 text-white font-bold text-sm shadow-[0_4px_16px_rgba(16,185,129,0.3)] flex items-center gap-2"
                data-testid="button-browse-medicines"
              >
                تصفّح الأدوية
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
                    transition={{ delay: i * 0.04, type: 'spring', damping: 24, stiffness: 280 }}
                    className="rounded-2xl p-3.5 bg-white/75 backdrop-blur-2xl border border-white/60 shadow-[0_4px_16px_rgb(0,0,0,0.05)]"
                    data-testid={`card-cart-item-${item.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Pill className="w-6 h-6 text-emerald-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-tight truncate">{item.name}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-slate-400 text-xs">
                          <Store className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.pharmacyName}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-emerald-700 font-bold text-sm">{item.price.toFixed(2)} IQD</span>
                          {item.requiresPrescription && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-medium flex items-center gap-0.5">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              وصفة
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0"
                        data-testid={`button-remove-cart-${item.id}`}
                        aria-label="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </button>
                    </div>

                    {/* عدّاد الكمية */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400">الكمية</span>
                      <div className="flex items-center gap-3">
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 disabled:opacity-40"
                          data-testid={`button-decrease-${item.id}`}
                          aria-label="إنقاص"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>
                        <span className="w-6 text-center font-bold text-slate-800 text-sm tabular-nums" data-testid={`text-qty-${item.id}`}>
                          {item.quantity}
                        </span>
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]"
                          data-testid={`button-increase-${item.id}`}
                          aria-label="زيادة"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              <button
                onClick={clearCart}
                className="w-full text-center text-xs text-slate-400 hover:text-red-500 transition-colors py-2"
                data-testid="button-clear-cart"
              >
                تفريغ السلة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* شريط الإجمالي + إتمام الطلب — ثابت أعلى شريط التنقل */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 90, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="fixed bottom-16 left-0 right-0 z-40 flex justify-center pointer-events-none"
          >
            <div className="w-full max-w-[430px] px-4 pb-3 pointer-events-auto">
              <div className="rounded-2xl bg-white/85 backdrop-blur-2xl border border-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-500 text-sm">الإجمالي</span>
                  <span className="text-slate-900 font-extrabold text-lg" data-testid="text-cart-total">
                    {totalPrice.toFixed(2)} IQD
                  </span>
                </div>
                {hasPrescriptionItem && (
                  <p className="text-[11px] text-amber-600 mb-2 flex items-center gap-1 justify-center">
                    <ShieldCheck className="w-3 h-3" />
                    يحتوي طلبك على دواء يستلزم وصفة طبية
                  </p>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  disabled={submitting}
                  className="w-full h-12 rounded-xl text-white font-bold text-sm
                    bg-gradient-to-r from-emerald-500 to-teal-500
                    shadow-[0_4px_16px_rgba(16,185,129,0.35)]
                    disabled:opacity-60 flex items-center justify-center gap-2"
                  data-testid="button-checkout"
                >
                  {submitting ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4" />
                      إتمام الطلب
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* بوابة الوصفة الطبية عند إتمام الطلب */}
      <AnimatePresence>
        {showRxGate && (
          <PrescriptionModal
            medicationName={rxItemName}
            onConfirm={() => {
              setShowRxGate(false);
              submitOrders();
            }}
            onClose={() => setShowRxGate(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
