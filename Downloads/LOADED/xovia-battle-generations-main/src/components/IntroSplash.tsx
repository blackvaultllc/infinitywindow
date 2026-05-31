import { useEffect, useState } from "react";
import logo from "@/assets/logo-xovia.jpg";

/**
 * 7-second cinematic intro shown once per session (per browser tab visit-day).
 * Bypassable by tap/click.
 */
export function IntroSplash() {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("exo-intro-played") !== "1";
  });

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => close(), 7000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const close = () => {
    sessionStorage.setItem("exo-intro-played", "1");
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      onClick={close}
      className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-background"
      style={{ animation: "intro-fade-out 7s forwards" }}
    >
      <div
        className="pointer-events-none absolute inset-0 hieroglyph-bg opacity-30"
        style={{ animation: "intro-pan 7s linear" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.30 0.12 60 / 0.45), transparent 65%), radial-gradient(ellipse at bottom, oklch(0.20 0.18 25 / 0.5), transparent 70%)",
        }}
      />
      <img
        src={logo}
        alt="XOVIA"
        className="relative h-40 w-40 rounded-full drop-shadow-[0_0_60px_oklch(0.78_0.13_85/0.8)]"
        style={{ animation: "intro-zoom 7s ease-out forwards" }}
      />
      <div
        className="relative mt-6 font-display text-4xl md:text-6xl text-gradient-gold tracking-[0.18em]"
        style={{ animation: "intro-rise 2.4s ease-out 0.4s both" }}
      >
        XOVIA
      </div>
      <div
        className="relative mt-2 text-xs md:text-sm tracking-[0.5em] text-muted-foreground"
        style={{ animation: "intro-rise 2.4s ease-out 1.4s both" }}
      >
        BATTLE GENERATIONS
      </div>
      <div
        className="relative mt-10 text-[10px] uppercase tracking-[0.4em] text-gold/70"
        style={{ animation: "intro-rise 1.6s ease-out 3.6s both" }}
      >
        Collect · Battle · Ascend
      </div>
      <div className="absolute bottom-6 text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
        Tap to enter
      </div>
      <style>{`
        @keyframes intro-zoom { 0% { transform: scale(0.6); opacity: 0; filter: blur(8px); } 30% { opacity: 1; filter: blur(0); } 100% { transform: scale(1.08); opacity: 1; } }
        @keyframes intro-rise { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes intro-pan  { from { background-position: 0 0; } to { background-position: 600px 600px; } }
        @keyframes intro-fade-out { 0%, 85% { opacity: 1; } 100% { opacity: 0; pointer-events: none; } }
      `}</style>
    </div>
  );
}