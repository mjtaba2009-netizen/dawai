/**
 * OrderAutomationManager — لوحة أنبوب الأتمتة العائمة
 * ─────────────────────────────────────────────────────────────────────────
 * تُعرض تلقائياً عند وجود طلبات جارية المعالجة.
 * تدعم حالات: Loading، Error، Success، SmartRouting
 */
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertCircle, Wifi, ExternalLink, X } from "lucide-react";
import { useOrderAutomation, type AutomationStep } from "@/contexts/OrderAutomationContext";

// ═══════════════════════════════════════════════════════════════
// Pipeline steps
// ═══════════════════════════════════════════════════════════════
interface PipelineStep {
  id:       AutomationStep;
  label:    string;
  sublabel: string;
  emoji:    string;
  apiPath?: string;
}

const PIPELINE: PipelineStep[] = [
  {
    id:       "idle",
    label:    "استلام الطلب",
    sublabel: "وصل الطلب للصيدلية",
    emoji:    "📋",
  },
  {
    id:       "inventory-sync",
    label:    "تحديث المخزون",
    sublabel: "جاري الخصم من المخزون...",
    emoji:    "📦",
    apiPath:  "POST /api/inventory/sync",
  },
  {
    id:       "whatsapp-alert",
    label:    "إشعار واتساب",
    sublabel: "جاري إرسال رسالة للمريض...",
    emoji:    "📱",
    apiPath:  "POST /api/notifications/whatsapp",
  },
  {
    id:       "done",
    label:    "اكتمل",
    sublabel: "تم تجهيز الدواء وإشعار المريض",
    emoji:    "✅",
  },
];

const ROUTING_STEPS: PipelineStep[] = [
  {
    id:       "routing",
    label:    "انتهت مهلة الاستجابة",
    sublabel: "جاري البحث في صيدلية بديلة...",
    emoji:    "⏱",
    apiPath:  "POST /api/orders/timeout",
  },
  {
    id:       "routed",
    label:    "تم التوجيه",
    sublabel: "تم إرسال الطلب لصيدلية أخرى",
    emoji:    "🔁",
  },
];

// ═══════════════════════════════════════════════════════════════
// نقطة الحالة
// ═══════════════════════════════════════════════════════════════
function StepDot({
  isActive, isDone, isError,
}: { isActive: boolean; isDone: boolean; isError?: boolean }) {
  if (isError) return (
    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
    </div>
  );
  if (isDone) return (
    <motion.div
      initial={{ scale: 0 }} animate={{ scale: 1 }}
      transition={{ type: "spring", damping: 15, stiffness: 400 }}
      className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"
    >
      <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
    </motion.div>
  );
  if (isActive) return (
    <div className="w-6 h-6 rounded-full border-2 border-emerald-400 bg-white flex items-center justify-center flex-shrink-0">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}>
        <Loader2 className="w-3.5 h-3.5 text-emerald-500" />
      </motion.div>
    </div>
  );
  return <div className="w-6 h-6 rounded-full border-2 border-slate-200 bg-white flex-shrink-0" />;
}

// ═══════════════════════════════════════════════════════════════
// بطاقة طلب واحد
// ═══════════════════════════════════════════════════════════════
function AutomationCard({ orderId, onDismiss }: { orderId: number; onDismiss: () => void }) {
  const { state } = useOrderAutomation();
  const entry = state.entries[orderId];
  if (!entry) return null;

  const { step, payload, fallbackPharmacy, fallbackData, error, failedStep } = entry;
  const isRouting = step === "routing" || step === "routed";
  const isError   = step === "error";
  const isDone    = step === "done";

  const stepIndex = PIPELINE.findIndex((s) => s.id === step);
  const currentIdx = stepIndex === -1 ? 0 : stepIndex;

  const progressPct = isDone
    ? 100
    : Math.round((currentIdx / (PIPELINE.length - 1)) * 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95, transition: { duration: 0.18 } }}
      transition={{ type: "spring", damping: 22, stiffness: 280 }}
      className="rounded-2xl overflow-hidden
        bg-white/85 backdrop-blur-2xl
        border border-white/60
        shadow-[0_8px_28px_rgb(0,0,0,0.12)]"
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

        {/* شارة الحالة */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[10px] font-semibold ${
          isError   ? "bg-red-50 text-red-600"      :
          isDone    ? "bg-emerald-50 text-emerald-700" :
          isRouting ? "bg-amber-50 text-amber-600"  :
                      "bg-emerald-50 text-emerald-700"
        }`}>
          {isError ? (
            <AlertCircle className="w-3 h-3" />
          ) : isDone ? (
            <Check className="w-3 h-3" />
          ) : (
            <motion.div
              className={`w-1.5 h-1.5 rounded-full ${isRouting ? "bg-amber-500" : "bg-emerald-500"}`}
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          )}
          {isError ? "خطأ" : isDone ? "اكتمل" : isRouting ? "توجيه..." : "نشط"}
        </div>

        {/* زر إغلاق — عند الانتهاء أو الخطأ */}
        {(isDone || isError || step === "routed") && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onDismiss}
            className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </motion.button>
        )}
      </div>

      {/* ── حالة الخطأ ── */}
      {isError && (
        <div className="px-4 py-3">
          <div className="p-3 rounded-xl bg-red-50 border border-red-100">
            <p className="text-red-700 text-xs font-semibold mb-0.5">
              ❌ فشلت خطوة: {failedStep ?? "غير محددة"}
            </p>
            <p className="text-red-500 text-[11px]">{error ?? "خطأ غير معروف في الخادم"}</p>
          </div>
          <p className="text-slate-400 text-[10px] mt-2 text-center">
            تحقق من سجلات الخادم أو أعد المحاولة
          </p>
        </div>
      )}

      {/* ── خط الأنبوب العادي ── */}
      {!isRouting && !isError && (
        <div className="px-4 py-3 space-y-2">
          {PIPELINE.map((pStep, i) => {
            const isStepDone   = i < currentIdx || isDone;
            const isStepActive = i === currentIdx && !isDone;
            const isPending    = i > currentIdx && !isDone;

            return (
              <motion.div
                key={pStep.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: isPending ? 0.35 : 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", damping: 22 }}
                className="flex items-center gap-2.5"
              >
                <StepDot isActive={isStepActive} isDone={isStepDone} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold leading-tight ${
                    isStepDone   ? "text-emerald-700" :
                    isStepActive ? "text-slate-800"   : "text-slate-300"
                  }`}>
                    {pStep.emoji} {pStep.label}
                  </p>
                  {isStepActive && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-[10px] text-emerald-500 mt-0.5"
                    >
                      {pStep.sublabel}
                    </motion.p>
                  )}
                </div>

                {/* وسم API Path */}
                {pStep.apiPath && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono font-medium flex items-center gap-0.5 flex-shrink-0 ${
                    isStepDone   ? "bg-emerald-50 text-emerald-600" :
                    isStepActive ? "bg-amber-50 text-amber-600"     :
                                   "bg-slate-50 text-slate-300"
                  }`}>
                    <Wifi className="w-2.5 h-2.5" />
                    {pStep.apiPath.split(" ")[1]?.split("/").slice(-1)[0]}
                  </span>
                )}
              </motion.div>
            );
          })}

          {/* شريط التقدم */}
          <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", damping: 22, stiffness: 150 }}
            />
          </div>
        </div>
      )}

      {/* ── حالة التوجيه الذكي ── */}
      {isRouting && (
        <div className="px-4 py-3 space-y-2">
          {ROUTING_STEPS.map((rStep, i) => {
            const isStepDone   = step === "routed" && rStep.id === "routed";
            const isStepActive = step === rStep.id;

            return (
              <motion.div key={rStep.id}
                initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, type: "spring", damping: 22 }}
                className="flex items-center gap-2.5"
              >
                <StepDot isActive={isStepActive && !isStepDone} isDone={isStepDone} />
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${
                    isStepDone   ? "text-amber-700" :
                    isStepActive ? "text-slate-800" : "text-slate-300"
                  }`}>
                    {rStep.emoji} {rStep.label}
                  </p>
                  {isStepActive && (
                    <p className="text-[10px] text-amber-500 mt-0.5">{rStep.sublabel}</p>
                  )}
                  {rStep.apiPath && isStepActive && (
                    <span className="text-[9px] text-amber-400 font-mono">{rStep.apiPath}</span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* بيانات الصيدلية البديلة من الخادم */}
          {step === "routed" && fallbackData && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 22 }}
              className="mt-1 p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-1.5"
            >
              <p className="text-amber-800 text-xs font-bold">🏪 {fallbackData.name}</p>
              {fallbackData.address && (
                <p className="text-amber-600 text-[11px]">📍 {fallbackData.address}</p>
              )}
              {/* روابط TikTok & Instagram — لا Facebook */}
              <div className="flex items-center gap-2 pt-0.5">
                <a
                  href={fallbackData.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-slate-600 font-medium hover:text-black transition-colors"
                >
                  <span className="text-sm">🎵</span> TikTok
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                <span className="text-slate-200">·</span>
                <a
                  href={fallbackData.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[11px] text-pink-600 font-medium hover:text-pink-700 transition-colors"
                >
                  <span className="text-sm">📸</span> Instagram
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </motion.div>
          )}

          {/* متحرك بحث */}
          {step === "routing" && (
            <div className="flex gap-1 pt-1">
              {[0, 1, 2].map((i) => (
                <motion.div key={i} className="flex-1 h-1 rounded-full bg-amber-200"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// اللوحة العائمة الرئيسية
// ═══════════════════════════════════════════════════════════════
export function OrderAutomationManager() {
  const { state, completeOrder } = useOrderAutomation();
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
          {/* عنوان */}
          <div className="flex items-center justify-between px-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500"
                animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-slate-600 text-[11px] font-semibold">
                نظام الأتمتة الشاملة — {orderIds.length} {orderIds.length === 1 ? "طلب" : "طلبات"} جارية
              </span>
            </div>
            <span className="text-slate-400 text-[10px] font-mono">Full-Stack API</span>
          </div>

          {/* البطاقات */}
          <AnimatePresence mode="popLayout">
            {orderIds.map((id) => (
              <AutomationCard
                key={id}
                orderId={id}
                onDismiss={() => completeOrder(id)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
