/**
 * SplashIntro — Ultra-Premium Cinematic Splash Screen
 * ─────────────────────────────────────────────────────
 * Timeline (total ≈ 4.5s experience):
 *   0.00s  : Pitch black → spotlight breathes on
 *   0.20s  : Capsule rises from void (spring physics)
 *   1.20s  : Capsule glows + locks in position
 *   1.60s  : "دوائي" springs up
 *   2.00s  : "THE DIGITAL PHARMACY" expands in
 *   2.60s  : "Powered by Promptify IQ" fades in (very subtle)
 *   3.60s  : Exit — zoom-in + deep blur + fade to reveal app
 */
import { motion, useAnimationControls } from "framer-motion";
import { useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// Moving Studio Spotlight
// ═══════════════════════════════════════════════════════════════
function Spotlight({ color, size, delay, duration, xRange, yRange }: {
  color: string; size: number; delay: number; duration: number;
  xRange: [number, number]; yRange: [number, number];
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: size, height: size,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        top: "50%", left: "50%",
        x: "-50%", y: "-50%",
        filter: "blur(1px)",
      }}
      animate={{
        x: [xRange[0] - size / 2, xRange[1] - size / 2, xRange[0] - size / 2],
        y: [yRange[0] - size / 2, yRange[1] - size / 2, yRange[0] - size / 2],
        opacity: [0, 0.55, 0.4, 0.55, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// 3D Capsule — The Hero Element
// ═══════════════════════════════════════════════════════════════
function Capsule3D() {
  const glowControls = useAnimationControls();

  useEffect(() => {
    const timeout = setTimeout(async () => {
      await glowControls.start({
        opacity: [0.6, 1, 0.6],
        scale: [1, 1.04, 1],
        transition: { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
      });
    }, 1200);
    return () => clearTimeout(timeout);
  }, [glowControls]);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ y: 220, scale: 0.2, opacity: 0, filter: "blur(28px)", rotate: -35 }}
      animate={{ y: 0, scale: 1, opacity: 1, filter: "blur(0px)", rotate: -35 }}
      transition={{
        type: "spring",
        stiffness: 80,
        damping: 18,
        delay: 0.2,
      }}
    >
      {/* ── Outer Glow Halo ── */}
      <motion.div
        animate={glowControls}
        initial={{ opacity: 0 }}
        className="absolute"
        style={{
          width: 280, height: 120,
          borderRadius: 100,
          background: "radial-gradient(ellipse, rgba(52,211,153,0.55) 0%, transparent 70%)",
          filter: "blur(18px)",
          transform: "rotate(0deg)",
        }}
      />

      {/* ── Outer Glow Ring (second layer, deeper) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.3, scale: 1 }}
        transition={{ delay: 1.0, duration: 0.6 }}
        className="absolute"
        style={{
          width: 340, height: 150,
          borderRadius: 100,
          background: "radial-gradient(ellipse, rgba(13,148,136,0.35) 0%, transparent 65%)",
          filter: "blur(30px)",
        }}
      />

      {/* ── Capsule Body ── */}
      <div
        className="relative overflow-hidden"
        style={{
          width: 220, height: 96, borderRadius: 100,
          boxShadow: [
            "inset 0 -10px 30px rgba(0,0,0,0.5)",
            "inset 0 10px 24px rgba(255,255,255,0.15)",
            "0 0 80px rgba(52,211,153,0.7)",
            "0 0 160px rgba(52,211,153,0.25)",
            "0 30px 80px rgba(0,0,0,0.8)",
          ].join(", "),
        }}
      >
        {/* Left half — Pearl White */}
        <div
          className="absolute top-0 left-0 h-full"
          style={{
            width: "50%",
            background: "linear-gradient(160deg, #ffffff 0%, #dde6f0 40%, #bfcfe0 100%)",
          }}
        />

        {/* Right half — Deep Emerald */}
        <div
          className="absolute top-0 right-0 h-full"
          style={{
            width: "50%",
            background: "linear-gradient(200deg, #5eead4 0%, #34d399 35%, #059669 70%, #064e3b 100%)",
          }}
        />

        {/* Center divider line */}
        <div
          className="absolute top-0 h-full"
          style={{
            left: "calc(50% - 1px)", width: 2,
            background: "linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.1), rgba(0,0,0,0.3))",
          }}
        />

        {/* Top specular highlight */}
        <div
          className="absolute"
          style={{
            top: 10, left: 18,
            width: 72, height: 22,
            borderRadius: 20,
            background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)",
            filter: "blur(2px)",
          }}
        />

        {/* Right side specular highlight */}
        <div
          className="absolute"
          style={{
            top: 10, right: 12,
            width: 36, height: 18,
            borderRadius: 20,
            background: "rgba(255,255,255,0.2)",
            filter: "blur(2px)",
          }}
        />

        {/* Inner depth rim */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            boxShadow: "inset 0 0 20px rgba(0,0,0,0.25)",
          }}
        />
      </div>

      {/* ── Reflection on floor ── */}
      <motion.div
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: 0.18, scaleY: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        className="absolute"
        style={{
          bottom: -60, width: 220, height: 60,
          borderRadius: 100,
          background: "linear-gradient(to bottom, rgba(52,211,153,0.4) 0%, transparent 100%)",
          filter: "blur(8px)",
          transform: "rotate(0deg) scaleY(-0.6)",
          transformOrigin: "top center",
        }}
      />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export function SplashIntro() {
  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{
        scale: 1.5,
        opacity: 0,
        filter: "blur(32px)",
        transition: { duration: 1.0, ease: [0.4, 0, 1, 1] },
      }}
    >

      {/* ══════════════════════════════════════════ */}
      {/* Studio Spotlights — Moving in background  */}
      {/* ══════════════════════════════════════════ */}
      <Spotlight
        color="rgba(16, 90, 60, 0.7)"
        size={700}
        delay={0}
        duration={8}
        xRange={[-80, 80]}
        yRange={[-60, 60]}
      />
      <Spotlight
        color="rgba(52, 211, 153, 0.18)"
        size={500}
        delay={1.5}
        duration={11}
        xRange={[60, -60]}
        yRange={[40, -40]}
      />
      <Spotlight
        color="rgba(6, 78, 59, 0.5)"
        size={400}
        delay={0.5}
        duration={7}
        xRange={[-120, 120]}
        yRange={[80, -80]}
      />

      {/* Subtle scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, transparent 1px, transparent 3px)",
          backgroundSize: "100% 4px",
        }}
      />

      {/* ══════════════════════════════════════════ */}
      {/* Main Stage                                 */}
      {/* ══════════════════════════════════════════ */}
      <div className="relative z-10 flex flex-col items-center" style={{ gap: "52px" }}>

        {/* 3D Capsule */}
        <Capsule3D />

        {/* ── Typography ── */}
        <div className="flex flex-col items-center gap-3" dir="rtl">

          {/* اسم التطبيق */}
          <motion.h1
            initial={{ y: 40, opacity: 0, filter: "blur(10px)", scale: 0.85 }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 100,
              damping: 16,
              delay: 1.6,
            }}
            className="font-black text-white select-none"
            style={{
              fontFamily: "'Cairo', 'Tajawal', sans-serif",
              fontSize: "clamp(52px, 10vw, 88px)",
              lineHeight: 1,
              letterSpacing: "-0.02em",
              textShadow: [
                "0 0 80px rgba(52,211,153,0.5)",
                "0 0 200px rgba(52,211,153,0.2)",
                "0 4px 40px rgba(0,0,0,0.8)",
              ].join(", "),
            }}
          >
            دوائي
          </motion.h1>

          {/* English subtitle */}
          <motion.p
            initial={{ opacity: 0, letterSpacing: "0.2em", y: 8 }}
            animate={{ opacity: 0.55, letterSpacing: "0.55em", y: 0 }}
            transition={{ duration: 1.0, delay: 2.0, ease: "easeOut" }}
            className="text-white font-light tracking-widest uppercase select-none text-xs"
            style={{ fontFamily: "system-ui, 'SF Pro Text', sans-serif" }}
          >
            The Digital Pharmacy
          </motion.p>

          {/* Emerald accent line */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.8, delay: 2.1, ease: [0.4, 0, 0.2, 1] }}
            style={{
              height: 1,
              width: 120,
              background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.8), transparent)",
              transformOrigin: "center",
            }}
          />
        </div>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* Developer Signature — Bottom              */}
      {/* ══════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2.0, delay: 2.6 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none"
      >
        <p
          className="text-[10px] font-light select-none"
          style={{
            color: "rgba(100,116,139,0.45)",
            fontFamily: "system-ui, 'SF Pro Text', sans-serif",
            letterSpacing: "0.18em",
          }}
        >
          POWERED BY PROMPTIFY IQ
        </p>
      </motion.div>

    </motion.div>
  );
}
