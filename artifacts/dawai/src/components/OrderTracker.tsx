import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock, Package, Bell } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "ready" | "completed" | "cancelled" | "rejected" | "timeout";

interface Step {
  key: OrderStatus;
  label: string;
  sub: string;
  icon: React.ElementType;
}

const STEPS: Step[] = [
  { key: "pending",   label: "قيد المراجعة",            sub: "الصيدلية تراجع طلبك الآن",       icon: Clock   },
  { key: "confirmed", label: "تم التأكيد وتجهيز الدواء", sub: "يتم تحضير طلبك في الصيدلية",      icon: Package },
  { key: "ready",     label: "جاهز للاستلام",            sub: "توجه الآن لاستلام دوائك",         icon: Bell    },
];

const ACTIVE_IDX: Partial<Record<OrderStatus, number>> = {
  pending:   0,
  confirmed: 1,
  ready:     2,
  completed: 2,
};

function isCancelled(status: OrderStatus) {
  return status === "cancelled" || status === "rejected" || status === "timeout";
}

function getActiveIndex(status: OrderStatus): number {
  return ACTIVE_IDX[status] ?? 0;
}

export function OrderTracker({ status }: { status: string }) {
  const s = status as OrderStatus;

  if (isCancelled(s)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 22, stiffness: 280 }}
        className="mt-4 p-4 rounded-2xl
          bg-red-50/80 backdrop-blur-sm
          border border-red-100
          shadow-[0_2px_12px_rgb(239,68,68,0.08)]"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">❌</span>
          </div>
          <div>
            <p className="text-red-700 font-bold text-sm">
              {s === "rejected" ? "تم رفض الطلب" : s === "timeout" ? "انتهت مهلة الاستجابة" : "تم إلغاء الطلب"}
            </p>
            <p className="text-red-400 text-xs mt-0.5">
              {s === "timeout" ? "تم توجيه طلبك إلى صيدلية قريبة أخرى" : "يمكنك البحث في صيدلية أخرى"}
            </p>
          </div>
        </div>

        {s === "timeout" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, type: "spring", damping: 22 }}
            className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-100"
          >
            <p className="text-amber-700 text-xs font-semibold">🔄 جاري البحث عن صيدلية بديلة...</p>
            <div className="flex gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="flex-1 h-1 rounded-full bg-amber-300"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  const activeIdx = getActiveIndex(s);
  const isDone = s === "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="mt-4"
    >
      <div className="relative flex items-start justify-between">
        {/* خط التقدم الخلفي */}
        <div className="absolute top-4 right-4 left-4 h-[2px] bg-slate-100 z-0" />

        {/* خط التقدم المتحرك */}
        <motion.div
          className="absolute top-4 right-4 h-[2px] bg-emerald-400 z-0 origin-right"
          style={{ left: "1rem" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isDone ? 1 : activeIdx / (STEPS.length - 1) }}
          transition={{ type: "spring", damping: 25, stiffness: 180, delay: 0.2 }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = isDone || idx < activeIdx;
          const isActive    = !isDone && idx === activeIdx;
          const Icon        = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center w-1/3">
              {/* الدائرة */}
              <div className="relative mb-2">
                {/* نبضة الحالة النشطة */}
                {isActive && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.9, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-emerald-300"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    />
                  </>
                )}
                <motion.div
                  className={`relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted
                      ? "bg-emerald-500 border-emerald-500"
                      : isActive
                      ? "bg-white border-emerald-500"
                      : "bg-white border-slate-200"
                  }`}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 20, stiffness: 320, delay: idx * 0.12 }}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  ) : (
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-emerald-500" : "text-slate-300"}`} />
                  )}
                </motion.div>
              </div>

              {/* النص */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${step.key}-${isActive}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", damping: 22 }}
                  className={`text-[10px] font-semibold text-center leading-tight px-1 ${
                    isCompleted ? "text-emerald-600" : isActive ? "text-slate-800" : "text-slate-300"
                  }`}
                >
                  {step.label}
                </motion.p>
              </AnimatePresence>

              {isActive && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[9px] text-emerald-500 text-center mt-0.5 px-1 leading-tight"
                >
                  {step.sub}
                </motion.p>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
