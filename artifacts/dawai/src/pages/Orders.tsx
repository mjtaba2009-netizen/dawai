import { motion } from "framer-motion";
import { Package } from "lucide-react";
import { useGetOrders } from "@workspace/api-client-react";

// حالات الطلب بالعربية وألوانها
const STATUS_MAP: Record<string, { label: string; classes: string }> = {
  pending: { label: "قيد الانتظار", classes: "bg-amber-50 text-amber-700" },
  confirmed: { label: "مؤكد", classes: "bg-blue-50 text-blue-700" },
  ready: { label: "جاهز للاستلام", classes: "bg-emerald-50 text-emerald-700" },
  completed: { label: "مكتمل", classes: "bg-slate-100 text-slate-600" },
  cancelled: { label: "ملغي", classes: "bg-red-50 text-red-600" },
};

// تنسيق التاريخ
function formatDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Skeleton loader
function OrderSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 bg-slate-200 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-200 rounded w-1/2" />
          <div className="flex gap-2">
            <div className="h-5 bg-slate-200 rounded-full w-20" />
            <div className="h-5 bg-slate-200 rounded-full w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Orders() {
  const { data: orders, isLoading } = useGetOrders();

  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      {/* الرأس */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-5 pt-10 pb-6">
        <h1 className="text-white text-xl font-bold">طلباتي</h1>
        <p className="text-emerald-100 text-sm mt-1">
          {orders ? `${orders.length} طلب` : "جاري التحميل..."}
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
          orders?.map((order, i) => {
            const status = STATUS_MAP[order.status] ?? {
              label: order.status,
              classes: "bg-slate-100 text-slate-600",
            };
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100"
                data-testid={`card-order-${order.id}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex-shrink-0 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center text-xl">
                    💊
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-slate-800 text-sm leading-tight">
                        {order.medication.name}
                      </p>
                      <span
                        className={`flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full font-semibold ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">
                      {order.pharmacy.name}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-emerald-700 font-bold text-sm">
                        {order.totalPrice.toFixed(2)} ر.س
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-xs">
                        الكمية: {order.quantity}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400 text-xs">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
