import { useContext, useState } from "react";
import { motion } from "framer-motion";
import { Package, CheckCircle2 } from "lucide-react";
import { useGetOrders } from "@workspace/api-client-react";
import { OrderTracker } from "@/components/OrderTracker";
import { AuthContext } from "@/contexts/AuthContext";
import { API_PREFIX } from "@/lib/api-base";
import { useToast } from "@/hooks/use-toast";

const ACTIVE_STATUSES = new Set(["pending", "confirmed", "ready"]);

function formatDate(isoString: string) {
  return new Date(isoString).toLocaleDateString("ar-SA", {
    year: "numeric", month: "long", day: "numeric",
  });
}

const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending:   { label: "قيد المراجعة",    classes: "bg-amber-50 text-amber-700"   },
  confirmed: { label: "تم التأكيد",      classes: "bg-blue-50 text-blue-700"     },
  ready:     { label: "جاهز للاستلام",  classes: "bg-emerald-50 text-emerald-700" },
  delivered: { label: "تم الاستلام",     classes: "bg-emerald-50 text-emerald-700" },
  completed: { label: "مكتمل",           classes: "bg-slate-100 text-slate-600"  },
  cancelled: { label: "ملغي",            classes: "bg-red-50 text-red-600"       },
  rejected:  { label: "مرفوض",           classes: "bg-red-50 text-red-600"       },
  timeout:   { label: "انتهى الوقت",     classes: "bg-orange-50 text-orange-600" },
};

function OrderSkeleton() {
  return (
    <div className="animate-pulse bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/60 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="h-14 bg-slate-100 rounded-xl w-full mt-3" />
        </div>
      </div>
    </div>
  );
}

export function Orders() {
  const { data: orders, isLoading, refetch } = useGetOrders();
  const auth = useContext(AuthContext);
  const { toast } = useToast();
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const handleReceived = async (orderId: number) => {
    const token = auth?.user?.token;
    if (!token) {
      toast({ title: "يجب تسجيل الدخول", variant: "destructive" });
      return;
    }
    setConfirmingId(orderId);
    try {
      const res = await fetch(`${API_PREFIX}/api/orders/${orderId}/received`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      await refetch();
      toast({ title: "✅ تم تأكيد استلام الطلب", duration: 2000 });
    } catch {
      toast({ title: "تعذّر تأكيد الاستلام", variant: "destructive" });
    } finally {
      setConfirmingId(null);
    }
  };

  const active    = orders?.filter((o) => ACTIVE_STATUSES.has(o.status)) ?? [];
  const completed = orders?.filter((o) => !ACTIVE_STATUSES.has(o.status)) ?? [];

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-6">
        <h1 className="text-white text-xl font-bold">طلباتي</h1>
        <p className="text-emerald-100 text-sm mt-1">
          {isLoading ? "جاري التحميل..." : `${orders?.length ?? 0} طلب`}
        </p>
      </div>

      <div className="flex-1 px-4 pt-5 pb-4 space-y-3 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : orders?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-emerald-300" />
            </div>
            <h3 className="text-slate-700 font-bold text-lg mb-2">لا توجد طلبات</h3>
            <p className="text-slate-400 text-sm">ابدأ بالبحث عن دوائك واحجزه</p>
          </motion.div>
        ) : (
          <>
            {/* الطلبات النشطة */}
            {active.length > 0 && (
              <div className="space-y-3">
                <p className="text-slate-500 text-xs font-semibold px-1">الطلبات الجارية</p>
                {active.map((order, i) => {
                  const status = STATUS_MAP[order.status] ?? { label: order.status, classes: "bg-slate-100 text-slate-600" };
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, type: "spring", damping: 22, stiffness: 280 }}
                      className="bg-white/75 backdrop-blur-2xl rounded-2xl p-4
                        border border-white/60
                        shadow-[0_4px_20px_rgb(0,0,0,0.06)]"
                      data-testid={`card-order-${order.id}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center text-xl">💊</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-800 text-sm leading-tight">{order.medication.name}</p>
                            <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${status.classes}`}>{status.label}</span>
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5 truncate">{order.pharmacy.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-emerald-700 font-bold text-sm">{order.totalPrice.toFixed(2)} IQD</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-400 text-xs">{formatDate(order.createdAt)}</span>
                          </div>
                          {/* رمز التتبّع — مشترك بين المريض والبائع */}
                          {order.trackingCode && (
                            <span
                              className="inline-block mt-1.5 text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-mono"
                              data-testid={`text-tracking-${order.id}`}
                            >
                              {order.trackingCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* شريط تتبع الطلب */}
                      <OrderTracker status={order.status} />

                      {/* تأكيد الاستلام — يظهر عندما يصبح الطلب جاهزاً */}
                      {order.status === "ready" && (
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleReceived(order.id)}
                          disabled={confirmingId === order.id}
                          className="mt-3 w-full h-10 rounded-xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-[0_3px_10px_rgba(16,185,129,0.35)] disabled:opacity-60"
                          data-testid={`button-received-${order.id}`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          تم استلام الطلب
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* السجل السابق */}
            {completed.length > 0 && (
              <div className="space-y-3">
                <p className="text-slate-400 text-xs font-semibold px-1 pt-2">السابقة</p>
                {completed.map((order, i) => {
                  const status = STATUS_MAP[order.status] ?? { label: order.status, classes: "bg-slate-100 text-slate-600" };
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06, type: "spring", damping: 25, stiffness: 280 }}
                      className="bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-white/50 opacity-70"
                      data-testid={`card-order-past-${order.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center text-lg">💊</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-600 text-sm truncate">{order.medication.name}</p>
                            <span className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${status.classes}`}>{status.label}</span>
                          </div>
                          <p className="text-slate-400 text-xs mt-0.5">{order.pharmacy.name} · {formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
