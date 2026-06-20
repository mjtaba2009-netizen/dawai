/**
 * SplashIntro — شاشة الترحيب الاحترافية لتطبيق دوائي
 * ─────────────────────────────────────────────────────────────
 * تسلسل الحركة:
 *   0.0s → 1.0s  : رسم مسارات SVG (pathLength 0 → 1)
 *   1.0s → 1.6s  : تعبئة الشعار بالتدرج الزمردي + ظهور النصوص
 *   1.6s → 2.2s  : استقرار فيزيائي (Spring) + نبضة خفيفة
 *   3.5s         : اختفاء زجاجي (scale ↑ + opacity → 0)
 */
import { motion } from "framer-motion";

// ═══════════════════════════════════════════════════════════════
// Variants
// ═══════════════════════════════════════════════════════════════

/** الحاوية الرئيسية — exit: تكبير + تلاشٍ */
const containerVariants = {
  initial: { opacity: 1, scale: 1 },
  animate: { opacity: 1, scale: 1 },
  exit: {
    opacity: 0,
    scale: 1.12,
    filter: "blur(8px)",
    transition: {
      duration: 0.65,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

/** مجموعة مسارات SVG — رسم ثم تعبئة */
const svgGroupVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** كل مسار SVG — رسم بـ pathLength */
const pathVariants = {
  initial: {
    pathLength: 0,
    opacity: 0,
    fill: "rgba(52, 211, 153, 0)",
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    fill: "rgba(52, 211, 153, 0)",
    transition: {
      pathLength: { duration: 0.9, ease: "easeInOut" },
      opacity:    { duration: 0.01 },
    },
  },
};

/** مسار يُملأ بعد رسمه */
const filledPathVariants = {
  initial: {
    pathLength: 0,
    opacity: 0,
    fill: "rgba(52, 211, 153, 0)",
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    fill: "rgba(52, 211, 153, 0.15)",
    transition: {
      pathLength: { duration: 0.9, ease: "easeInOut" },
      opacity:    { duration: 0.3 },
      fill:       { duration: 0.5, delay: 0.9 },
    },
  },
};

/** المسار الرئيسي — يمتلئ بتدرج أخضر */
const mainPathVariants = {
  initial: {
    pathLength: 0,
    opacity:    0,
  },
  animate: {
    pathLength: 1,
    opacity:    1,
    transition: {
      pathLength: { duration: 1.0, ease: [0.4, 0, 0.2, 1] },
      opacity:    { duration: 0.05 },
    },
  },
};

/** الحاوية النصية — stagger */
const textContainerVariants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 1.1,
    },
  },
};

/** كل كلمة نصية — fade up */
const textItemVariants = {
  initial: { opacity: 0, y: 18, filter: "blur(4px)" },
  animate: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
  },
};

/** النبضة الدائمة للشعار */
const pulseVariants = {
  animate: {
    scale: [1, 1.04, 1],
    transition: {
      duration: 2.4,
      repeat: Infinity,
      ease: "easeInOut",
      delay: 1.8,
    },
  },
};

// ═══════════════════════════════════════════════════════════════
// SVG شعار دوائي — رسم بـ pathLength
// ═══════════════════════════════════════════════════════════════
function DawaiLogo() {
  return (
    <motion.div
      variants={pulseVariants}
      animate="animate"
      className="relative"
    >
      {/* هالة توهج خلف الشعار */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
        className="absolute inset-0 -m-8"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.25) 0%, transparent 70%)",
          filter: "blur(12px)",
        }}
      />

      <motion.svg
        viewBox="0 0 120 150"
        className="w-36 h-36 relative z-10"
        variants={svgGroupVariants}
        initial="initial"
        animate="animate"
      >
        <defs>
          <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#34d399" />
            <stop offset="100%" stopColor="#0d9488" />
          </linearGradient>
          <linearGradient id="capsuleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#f8fafc" stopOpacity="0.95" />
            <stop offset="50%"  stopColor="#e2e8f0" stopOpacity="0.95" />
            <stop offset="51%"  stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0d9488" stopOpacity="0.9" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── حلقة خارجية ── */}
        <motion.circle
          cx="60" cy="52" r="38"
          fill="none"
          stroke="url(#emeraldGrad)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#glow)"
          variants={pathVariants}
        />

        {/* ── جسم pin الموقع (الشكل الرئيسي) ── */}
        <motion.path
          d="M60 8
             C38 8, 20 26, 20 52
             C20 70, 60 140, 60 140
             C60 140, 100 70, 100 52
             C100 26, 82 8, 60 8 Z"
          stroke="url(#emeraldGrad)"
          strokeWidth="2.8"
          strokeLinejoin="round"
          fill="rgba(52,211,153,0)"
          variants={filledPathVariants}
          style={{ filter: "url(#glow)" }}
        />

        {/* ── دائرة داخلية ── */}
        <motion.circle
          cx="60" cy="50" r="23"
          fill="rgba(15,23,42,0.7)"
          stroke="url(#emeraldGrad)"
          strokeWidth="2"
          variants={mainPathVariants}
        />

        {/* ── كبسولة الدواء (اليسار — أبيض) ── */}
        <motion.path
          d="M45 44 A10 10 0 0 0 45 56 L60 56 L60 44 Z"
          fill="rgba(248,250,252,0)"
          stroke="#f1f5f9"
          strokeWidth="1.5"
          strokeLinejoin="round"
          variants={{
            initial: { pathLength: 0, opacity: 0, fill: "rgba(248,250,252,0)" },
            animate: {
              pathLength: 1,
              opacity: 1,
              fill: "rgba(248,250,252,0.9)",
              transition: {
                pathLength: { duration: 0.6, delay: 0.7, ease: "easeInOut" },
                opacity:    { duration: 0.1, delay: 0.7 },
                fill:       { duration: 0.4, delay: 1.2 },
              },
            },
          }}
        />

        {/* ── كبسولة الدواء (اليمين — زمردي) ── */}
        <motion.path
          d="M60 44 L75 44 A10 10 0 0 1 75 56 L60 56 Z"
          fill="rgba(52,211,153,0)"
          stroke="#34d399"
          strokeWidth="1.5"
          strokeLinejoin="round"
          variants={{
            initial: { pathLength: 0, opacity: 0, fill: "rgba(52,211,153,0)" },
            animate: {
              pathLength: 1,
              opacity: 1,
              fill: "rgba(52,211,153,0.85)",
              transition: {
                pathLength: { duration: 0.6, delay: 0.8, ease: "easeInOut" },
                opacity:    { duration: 0.1, delay: 0.8 },
                fill:       { duration: 0.4, delay: 1.3 },
              },
            },
          }}
        />

        {/* ── بريق الكبسولة ── */}
        <motion.ellipse
          cx="51" cy="46" rx="4" ry="2"
          fill="white"
          variants={{
            initial: { opacity: 0, scale: 0 },
            animate: {
              opacity: 0.6,
              scale: 1,
              transition: { delay: 1.4, duration: 0.4 },
            },
          }}
          style={{ transformOrigin: "51px 46px" }}
        />

        {/* ── ورقة صغيرة أسفل الـ pin ── */}
        <motion.path
          d="M60 112 C54 100, 46 96, 50 86 C52 80, 58 82, 60 95 C62 82, 68 80, 70 86 C74 96, 66 100, 60 112 Z"
          fill="rgba(52,211,153,0)"
          stroke="#34d399"
          strokeWidth="1.2"
          strokeLinejoin="round"
          variants={{
            initial: { pathLength: 0, opacity: 0, fill: "rgba(52,211,153,0)" },
            animate: {
              pathLength: 1,
              opacity: 0.8,
              fill: "rgba(52,211,153,0.4)",
              transition: {
                pathLength: { duration: 0.5, delay: 0.9, ease: "easeOut" },
                opacity:    { duration: 0.2, delay: 0.9 },
                fill:       { duration: 0.4, delay: 1.3 },
              },
            },
          }}
        />

        {/* ── نقاط الزخرفة ── */}
        {[
          { cx: 25, cy: 30, delay: 1.0 },
          { cx: 95, cy: 30, delay: 1.1 },
          { cx: 18, cy: 60, delay: 1.2 },
          { cx: 102, cy: 60, delay: 1.15 },
        ].map((dot, i) => (
          <motion.circle
            key={i}
            cx={dot.cx} cy={dot.cy} r="2.5"
            fill="#34d399"
            variants={{
              initial: { opacity: 0, scale: 0 },
              animate: {
                opacity: 0.6,
                scale: 1,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 15,
                  delay: dot.delay,
                },
              },
            }}
            style={{ transformOrigin: `${dot.cx}px ${dot.cy}px` }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// المكوّن الرئيسي
// ═══════════════════════════════════════════════════════════════
export function SplashIntro() {
  return (
    <motion.div
      key="splash"
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(16,56,48,0.95) 0%, #0a0f1a 65%)",
      }}
    >
      {/* ── جزيئات خلفية متحركة ── */}
      {[
        { size: 180, top: "8%",  left: "5%",  delay: 0,   dur: 9  },
        { size: 120, top: "60%", left: "75%", delay: 1,   dur: 11 },
        { size: 90,  top: "80%", left: "15%", delay: 0.5, dur: 8  },
        { size: 60,  top: "20%", left: "80%", delay: 1.5, dur: 10 },
      ].map((p, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size,
            top: p.top, left: p.left,
            background: "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
          }}
          animate={{
            y:       [0, -24, 0],
            x:       [0, 16, 0],
            opacity: [0.4, 0.9, 0.4],
            scale:   [1, 1.1, 1],
          }}
          transition={{
            duration: p.dur,
            repeat:   Infinity,
            ease:     "easeInOut",
            delay:    p.delay,
          }}
        />
      ))}

      {/* ── شبكة خلفية خفيفة ── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(52,211,153,1) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── المحتوى الرئيسي ── */}
      <div className="relative z-10 flex flex-col items-center gap-8" dir="rtl">

        {/* الشعار المتحرك */}
        <DawaiLogo />

        {/* النصوص بتسلسل stagger */}
        <motion.div
          variants={textContainerVariants}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-2 text-center"
        >
          {/* اسم التطبيق */}
          <motion.h1
            variants={textItemVariants}
            className="text-5xl font-black tracking-tight"
            style={{
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
              background: "linear-gradient(135deg, #ffffff 30%, #34d399 70%, #0d9488 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
            }}
          >
            دوائي
          </motion.h1>

          {/* النص الفرعي */}
          <motion.p
            variants={textItemVariants}
            className="text-base font-medium tracking-widest"
            style={{
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
              color: "rgba(167, 243, 208, 0.85)",
              letterSpacing: "0.18em",
            }}
          >
            صحتك.. أسرع وأقرب
          </motion.p>

          {/* فاصل مضيء */}
          <motion.div
            variants={{
              initial: { scaleX: 0, opacity: 0 },
              animate: {
                scaleX: 1,
                opacity: 1,
                transition: { duration: 0.6, delay: 1.4, ease: "easeOut" },
              },
            }}
            className="mt-1 h-px w-32 origin-center"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.7), transparent)",
            }}
          />
        </motion.div>

        {/* شريط التحميل السفلي */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.6, duration: 0.4 }}
          className="flex flex-col items-center gap-2"
        >
          <div className="w-40 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #34d399, #0d9488)",
              }}
              initial={{ x: "-100%" }}
              animate={{ x: "0%" }}
              transition={{
                duration: 2.2,
                delay: 1.6,
                ease: [0.4, 0, 0.2, 1],
              }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            transition={{ delay: 1.8 }}
            className="text-[10px] text-emerald-300/60 tracking-widest uppercase font-mono"
          >
            dawai · v2.0
          </motion.p>
        </motion.div>
      </div>
    </motion.div>
  );
}
