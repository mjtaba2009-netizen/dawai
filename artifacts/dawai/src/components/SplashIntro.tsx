/**
 * SplashIntro — Ultra-Premium Cinematic Splash Screen
 * "Minimalist Glowing Aura & Fluid Path" concept
 * ─────────────────────────────────────────────────────
 * Timeline (hard cap: 3.5s mount → fully unmounted):
 *   0.00s : Pitch black
 *   0.00s : Ultra-thin glowing heartbeat (EKG) line draws (pathLength 0→1, 1.2s)
 *   1.20s : Line collapses into a single glowing dot
 *   1.35s : Dot bursts softly (scale 0→12) into an ambient aura
 *   1.50s : Massive blurred Emerald aura breathes on (blur 100px, opacity ~0.4)
 *   1.50s : "دوائي" reveals — majestic fade-in with upward drift
 *   2.00s : "THE DIGITAL PHARMACY" fades in
 *   2.20s : "Powered by Promptify IQ" — barely-visible signature
 *   2.50s : App triggers unmount → Glass-Wipe exit (zoom 1.1 + blur + fade, 1.0s)
 *   3.50s : Fully revealed app underneath
 *
 * NOTE: the "majestic" title fade is 1.0s (compressed from the ideal 1.5s) so the
 * full cinematic sequence — including the 1.2s line draw and 1.0s exit wipe — fits
 * inside the required 3.5s hard cap.
 */
import { motion } from "framer-motion";

const EMERALD = "#34d399";

// ═══════════════════════════════════════════════════════════════
// Ambient Aura — massive, soft, breathing emerald glow
// ═══════════════════════════════════════════════════════════════
function AmbientAura() {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: 620,
        height: 620,
        top: "50%",
        left: "50%",
        x: "-50%",
        y: "-50%",
        background:
          "radial-gradient(circle, rgba(52,211,153,0.55) 0%, rgba(16,185,129,0.20) 35%, transparent 70%)",
        filter: "blur(100px)",
      }}
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: [0, 0.4, 0.32, 0.4], scale: [0.55, 1, 0.96, 1] }}
      transition={{
        opacity: {
          duration: 2.6,
          delay: 1.5,
          times: [0, 0.35, 0.7, 1],
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
        scale: {
          duration: 3.2,
          delay: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// Fluid Path — heartbeat line draws, collapses to a dot, bursts
// ═══════════════════════════════════════════════════════════════
function HeartbeatPath() {
  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{ width: 340, height: 170, top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
    >
      {/* EKG line — fades out once it has collapsed into the dot */}
      <motion.svg
        viewBox="0 0 200 100"
        className="absolute"
        style={{ width: 340, height: 170, overflow: "visible" }}
        initial={{ opacity: 1, scaleX: 1 }}
        animate={{ opacity: [1, 1, 0], scaleX: [1, 1, 0.04] }}
        transition={{ duration: 0.35, delay: 1.2, times: [0, 0.4, 1], ease: "easeIn" }}
      >
        <motion.path
          d="M 0 50 H 70 L 80 50 L 88 33 L 98 64 L 108 12 L 120 88 L 130 50 L 140 50 H 200"
          fill="none"
          stroke={EMERALD}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{
            pathLength: { duration: 1.2, ease: "easeInOut" },
            opacity: { duration: 0.2 },
          }}
          style={{
            filter:
              "drop-shadow(0 0 6px rgba(52,211,153,0.95)) drop-shadow(0 0 18px rgba(52,211,153,0.55))",
          }}
        />
      </motion.svg>

      {/* Glowing dot — arrives as the line collapses, then bursts into the aura */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 14,
          height: 14,
          background: "radial-gradient(circle, #ecfdf5 0%, #34d399 45%, #059669 100%)",
          boxShadow: "0 0 22px rgba(52,211,153,0.95), 0 0 60px rgba(52,211,153,0.5)",
        }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 1, 12], opacity: [0, 1, 1, 0] }}
        transition={{
          duration: 0.75,
          delay: 1.25,
          times: [0, 0.22, 0.45, 1],
          ease: "easeOut",
        }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════
export function SplashIntro() {
  return (
    <motion.div
      key="splash"
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{
        scale: 1.1,
        opacity: 0,
        filter: "blur(24px)",
        backdropFilter: "blur(40px)",
        transition: { duration: 1.0, ease: [0.4, 0, 0.2, 1] },
      }}
    >
      {/* ── Ambient breathing aura ── */}
      <AmbientAura />

      {/* ── Fluid heartbeat path → dot → burst ── */}
      <HeartbeatPath />

      {/* ── Premium Typography ── */}
      <div className="relative z-10 flex flex-col items-center" dir="rtl">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 1.5, ease: "easeOut" }}
          className="text-white select-none tracking-tight"
          style={{
            fontFamily: "'Cairo', sans-serif",
            fontWeight: 800,
            fontSize: "clamp(56px, 13vw, 96px)",
            lineHeight: 1,
            textShadow:
              "0 0 60px rgba(52,211,153,0.45), 0 0 160px rgba(52,211,153,0.18), 0 4px 30px rgba(0,0,0,0.7)",
          }}
        >
          دوائي
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 2.0, ease: "easeOut" }}
          className="text-slate-400 uppercase select-none text-xs mt-5"
          style={{
            fontFamily: "'Helvetica Neue', 'Inter', sans-serif",
            fontWeight: 300,
            letterSpacing: "0.3em",
          }}
        >
          The Digital Pharmacy
        </motion.p>
      </div>

      {/* ── Developer Signature — subtle luxury footprint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 2.2 }}
        className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none"
      >
        <p
          className="text-slate-600 text-[10px] select-none"
          style={{ letterSpacing: "0.2em" }}
        >
          Powered by Promptify IQ
        </p>
      </motion.div>
    </motion.div>
  );
}
