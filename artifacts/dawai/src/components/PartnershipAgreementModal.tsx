/**
 * PartnershipAgreementModal — اتفاقية الانضمام لمنصة دوائي (المرحلة 1)
 * ─────────────────────────────────────────────────────────────────────────
 * تُعرض للصيدليات بحالة 'approved_pending_signature' بعد اعتماد مستنداتها.
 * تجربة تفعيل احترافية (بأسلوب Apple/Stripe): عقد رقمي قابل للتمرير،
 * إقرار قانوني، وزر "توقيع رقمي وتفعيل الحساب" لا يُفعّل إلا بعد الموافقة.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, FileText, Check, PenLine } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const TERMS: { title: string; body: string }[] = [
  {
    title: "١. معايير الجودة والترخيص",
    body: "تتعهد الصيدلية بامتلاك ترخيص ساري المفعول من نقابة الصيادلة العراقية، وبأن جميع الأدوية المعروضة أصلية ومخزّنة وفق الشروط الصحية المعتمدة، وغير منتهية الصلاحية.",
  },
  {
    title: "٢. اتفاقية مستوى الخدمة",
    body: "تلتزم الصيدلية بالرد على الطلبات الواردة خلال المدة الزمنية المحددة في المنصة، وبتحديث المخزون والأسعار بشكل دقيق ومستمر لضمان تجربة موثوقة للمرضى.",
  },
  {
    title: "٣. التسعير والشفافية",
    body: "تُعرض الأسعار بالدينار العراقي شاملةً، ويُمنع فرض أي رسوم خفية على المريض. تحتفظ منصة دوائي بحق مراجعة الأسعار لضمان عدالتها.",
  },
  {
    title: "٤. خصوصية بيانات المرضى",
    body: "تتعهد الصيدلية بالحفاظ على سرية بيانات المرضى ووصفاتهم الطبية، وعدم استخدامها لأي غرض خارج نطاق تجهيز الطلب عبر المنصة.",
  },
  {
    title: "٥. حقوق إنهاء الشراكة",
    body: "يحق لمنصة دوائي تعليق أو إنهاء حساب الصيدلية في حال الإخلال بأي من هذه الشروط، مع إشعار مسبق وفق السياسات المعتمدة.",
  },
];

export function PartnershipAgreementModal() {
  const { user, activateAccount } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  const handleActivate = async () => {
    if (!agreed || signing) return;
    setSigning(true);
    try {
      await activateAccount();
      // عند النجاح يتغيّر status إلى 'active' فتنغلق هذه البوابة، ونوجّه المستخدم
      // صراحةً إلى لوحة التحكم لضمان ظهور احتفال الترحيب (المرحلة 2) دائماً.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast({
        title: "تعذّر تفعيل الحساب",
        description: String(err instanceof Error ? err.message : err),
        variant: "destructive",
      });
      setSigning(false);
    }
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-hidden
        bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900"
    >
      {/* هالة ضوئية خلفية */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.35, scale: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="pointer-events-none absolute -top-1/4 left-1/2 -translate-x-1/2 w-[480px] h-[480px]
          rounded-full bg-emerald-500 blur-[120px]"
      />

      {/* بطاقة الاتفاقية */}
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 280, mass: 0.9 }}
        className="relative w-full max-w-[440px] max-h-[92vh] flex flex-col
          rounded-t-[32px] sm:rounded-[32px] overflow-hidden
          bg-white/90 backdrop-blur-2xl border border-white/60
          shadow-[0_-20px_60px_rgba(0,0,0,0.45)]"
      >
        {/* الرأس */}
        <div className="px-6 pt-7 pb-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 14, stiffness: 200, delay: 0.25 }}
            className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30
              flex items-center justify-center mb-3"
          >
            <ShieldCheck className="w-7 h-7" />
          </motion.div>
          <h1 className="text-xl font-extrabold leading-tight" style={{ fontWeight: 800 }}>
            اتفاقية الانضمام لمنصة دوائي
          </h1>
          <p className="text-emerald-50/90 text-xs mt-1.5 leading-relaxed">
            تم اعتماد مستندات صيدليتك بنجاح ✦ يُرجى مراجعة الشروط والتوقيع رقمياً لتفعيل حسابك
          </p>
        </div>

        {/* العقد القابل للتمرير */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <FileText className="w-4 h-4" />
            <span className="text-xs font-semibold">بنود الشراكة</span>
          </div>

          <div className="space-y-4">
            {TERMS.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4"
              >
                <h3 className="text-slate-800 font-bold text-sm mb-1">{t.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{t.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* التذييل — الإقرار + زر التفعيل */}
        <div className="px-6 pt-4 pb-7 border-t border-slate-100 bg-white/70 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setAgreed((v) => !v)}
            className="w-full flex items-start gap-3 text-right mb-4 group"
            data-testid="checkbox-agree"
            aria-pressed={agreed}
          >
            <span
              className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all
                ${agreed
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500 border-emerald-500"
                  : "border-slate-300 bg-white group-hover:border-emerald-400"}`}
            >
              <motion.span
                initial={false}
                animate={{ scale: agreed ? 1 : 0, opacity: agreed ? 1 : 0 }}
                transition={{ type: "spring", damping: 18, stiffness: 320 }}
              >
                <Check className="w-4 h-4 text-white" strokeWidth={3} />
              </motion.span>
            </span>
            <span className="text-slate-600 text-xs leading-relaxed">
              أقر بأنني اطلعت على الشروط وأوافق عليها كطرف ملزم قانونياً
            </span>
          </button>

          <motion.button
            type="button"
            whileTap={{ scale: agreed ? 0.98 : 1 }}
            onClick={handleActivate}
            disabled={!agreed || signing}
            className={`w-full h-14 rounded-2xl flex items-center justify-center gap-2 font-extrabold text-base
              transition-all duration-300
              ${agreed && !signing
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_28px_rgba(16,185,129,0.45)]"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
            style={{ fontWeight: 800 }}
            data-testid="button-activate-account"
          >
            {signing ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full"
                />
                جارٍ التفعيل...
              </>
            ) : (
              <>
                <PenLine className="w-5 h-5" />
                توقيع رقمي وتفعيل الحساب
              </>
            )}
          </motion.button>

          <p className="text-center text-slate-400 text-[10px] mt-3">
            {user?.name ? `موقّع باسم: ${user.name}` : "توقيع إلكتروني موثّق"}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
