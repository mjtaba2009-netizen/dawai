/**
 * OrderAutomationManager
 * ─────────────────────────────────────────────────────────────────────────
 * مكوّن مرئي يعرض خط أنابيب الأتمتة (Automation Pipeline) كلوحة عائمة.
 * يظهر تلقائياً عند وجود أي طلب جارية معالجته ويختفي عند الانتهاء.
 *
 * الخطوات المعروضة:
 *   ✓ قبول الطلب
 *   ⟳ تحديث المخزون  (inventory-sync webhook)
 *   ⟳ إشعار واتساب  (whatsapp-alert webhook)
 *   ✓ اكتمل
 *
 * حالات خاصة:
 *   🔁 التوجيه الذكي (routing / routed) — انتهت مهلة الصيدلية
 */
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Wifi } from "lucide-react";
import { useOrderAutomation, type AutomationStep } from "@/contexts/OrderAutomationContext";

// ═══════════════════════════════════════════════════════
// تعريف خطوات الأنبوب
// ═══════════════════════════════════════════════════════
interface PipelineStep {
  id: AutomationStep;
  label: string;
  sublabel: string;
  emoji: string;
}

const PIPELINE: PipelineStep[] = [
  { id: "idle",           label: "استلام الطلب",       sublabel: "وصل الطلب للصيدلية",             emoji: "📋" },
  { id: "inventory-sync", label: "تحديث المخزون",      sublabel: "جاري الخصم من المخزون...",        emoji: "📦" },
  { id: "whatsapp-alert", label: "إشعار واتساب",       sublabel: "جاري إرسال رسالة للمريض...",      emoji: "📱" },
  { id: "done",           label: "اكتمل",               sublabel: "تم تجهيز الدواء وإشعار المريض",  emoji: "✅" },
];

const ROUTING_STEPS: PipelineStep[] = [
  { id: "routing", label: "انتهت مهلة الاستجابة", sublabel: "جاري البحث عن صيدلية بديلة...", emoji: "⏱" },
  { id: "routed",  label: "تم التوجيه",            sublabel: "تم إرسال الطلب لصيدلية أخرى",  emoji: "🔁" },
];

// ═══════════════════════════════════════════════════════
// مكوّن نقطة الحالة
// ═══════════════════════════════════════════════════════
function StepDot({ isActive, isDone, isError }: { isActive: boolean; isDone: boolean; isError?: boolean }) {
  if (isError) return (
    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    </div>
  );

  if (isDone) return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 400 }}
      className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
    >
      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
    </motion.div>
  );

  if (isActive) return (
    <div className="w-6 h-6 rounded-full border-2 border-emerald-400 bg-white flex items-center justify-center flex-shrink-0">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="w-3.5 h-3.5 text-emerald-500" />
      </motion.div>
    </div>
  );

  return (
    <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white flex-shrink-0" />
  );
}

// ═══════════════════════════════════════════════════════
// بطاقة طلب واحد داخل الـ Manager
// ═══════════════════════════════════════════════════════
function AutomationCard({ orderId }: { orderId: number }) {
  const { state } = useOrderAutomation();
  const entry = state.entries[orderId];
  if (!entry) return null;

  const { step, payload, fallbackPharmacy } = entry;
  const isRouting = step === "routing" || step === "routed";

  // تحديد الخطوة الحالية في الأنبوب العادي
  const normalStepIndex = PIPELINE.findIndex((s) => s.id === step);
  const currentPipelineIndex = normalStepIndex === -1 ? 0 : normalStepIndex;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="rounded-2xl overflow-hidden
        bg-white/80 backdrop-blur-2xl
        border border-white/60
        shadow-[0_8px_28px_rgb(0,0,0,0.10)]"
    >
      {/* رأس البطاقة */}
      <div className="px-4 py-3 border-b border-slate-100/80 flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center text-base flex-shrink-0">
          💊
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-slate-800 font-bold text-sm truncate">{payload.medicationName}</p>
          <p className="text-slate-400 text-[11px]">{payload.pharmacyName} · {payload.totalPrice.toFixed(2)} IQD</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-emerald-50">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={{ opacity: step === "done" || step === "routed" ? 1 : [1, 0, 1] }}
            transition={{ duration: 1.2, repeat: step === "done" || step === "routed" ? 0 : Infinity }}
          />
          <span className="text-emerald-700 text-[10px] font-semibold">أتمتة نشطة</span>
        </div>
      </div>

      {/* خط الأنبوب */}
      {!isRouting ? (
        <div className="px-4 py-3 space-y-2">
          {PIPELINE.map((pStep, i) => {
            const isDone   = i < currentPipelineIndex || step === "done";
            const isActive = i === currentPipelineIndex && step !== "done";
            const isPending = i > currentPipelineIndex;

            return (
              <motion.div
                key={pStep.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", damping: 22 }}
                className="flex items-center gap-2.5"
              >
                <StepDot isActive={isActive} isDone={isDone} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${isDone ? "text-emerald-700" : isActive ? "text-slate-800" : "text-slate-300"}`}>
                    {pStep.emoji} {pStep.label}
                  </p>
                  {isActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-emerald-500 mt-0.5"
                    >
                      {pStep.sublabel}
                    </motion.p>
                  )}
                </div>
                {/* وسم webhook */}
                {(pStep.id === "inventory-sync" || pStep.id === "whatsapp-alert") && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-0.5
                    ${isDone ? "bg-emerald-50 text-emerald-600" : isActive ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-300"}`}>
                    <Wifi className="w-2.5 h-2.5" />
                    webhook
                  </span>
                )}
              </motion.div>
            );
          })}

          {/* شريط التقدم السفلي */}
          <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{
                width: step === "done"
                  ? "100%"
                  : `${(currentPipelineIndex / (PIPELINE.length - 1)) * 100}%`,
              }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
            />
          </div>
        </div>
      ) : (
        /* حالة التوجيه الذكي */
        <div className="px-4 py-3 space-y-2">
          {ROUTING_STEPS.map((rStep, i) => {
            const isDone = step === "routed" && rStep.id === "routed";
            const isActive = (step === "routing" && rStep.id === "routing") ||
                             (step === "routed"  && rStep.id === "routed");

            return (
              <motion.div
                key={rStep.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, type: "spring", damping: 22 }}
                className="flex items-center gap-2.5"
              >
                <StepDot isActive={isActive && !isDone} isDone={isDone} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${isDone ? "text-amber-700" : isActive ? "text-slate-800" : "text-slate-300"}`}>
                    {rStep.emoji} {rStep.label}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-amber-500 mt-0.5">{rStep.sublabel}</p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* اسم الصيدلية البديلة */}
          {step === "routed" && fallbackPharmacy && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 22 }}
              className="mt-1 p-2.5 rounded-xl bg-amber-50 border border-amber-100"
            >
              <p className="text-amber-700 text-xs font-semibold">تم التوجيه إلى: {fallbackPharmacy}</p>
              <div className="flex gap-1 mt-1.5">
                {[0, 1, 2].map((j) => (
                  <motion.div
                    key={j}
                    className="flex-1 h-1 rounded-full bg-amber-300"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: j * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
// المكوّن الرئيسي — اللوحة العائمة
// ═══════════════════════════════════════════════════════
export function OrderAutomationManager() {
  const { state } = useOrderAutomation();
  const orderIds = Object.keys(state.entries).map(Number);

  return (
    <AnimatePresence>
      {orderIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 25, stiffness: 280, mass: 0.8 }}
          className="fixed bottom-24 left-3 right-3 z-50 space-y-2 max-w-[430px] mx-auto"
        >
          {/* عنوان اللوحة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            <span className="text-slate-600 text-[11px] font-semibold">
              نظام الأتمتة — {orderIds.length} طلب جارٍ
            </span>
          </motion.div>

          {/* بطاقات الطلبات */}
          <AnimatePresence mode="popLayout">
            {orderIds.map((id) => (
              <AutomationCard key={id} orderId={id} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
