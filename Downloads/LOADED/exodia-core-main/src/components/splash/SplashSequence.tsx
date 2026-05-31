import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, type ReactElement } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import hallSeal from "@/assets/seals/hall.jpg";
import augieSeal from "@/assets/seals/augie.png";
import medusaSeal from "@/assets/seals/medusa.png";
import { TriforceAssemble } from "./TriforceAssemble";

type Frame = {
  id: string;
  duration: number; // ms before auto-advance
  render: () => ReactElement;
};

export function SplashSequence() {
  const [step, setStep] = useState(0);
  const [authed, setAuthed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
  }, []);

  const frames: Frame[] = [
    {
      id: "hall",
      duration: 5200,
      render: () => (
        <SealFrame
          seal={hallSeal}
          alt="Hall Family Legacy seal"
          eyebrow="◆ The Hall Family Legacy ◆"
          title="Mr. Infinity"
          subtitle="Family · Protection · Loyalty · Love — through all connections."
          caption="Dominic H. — Est. 1984"
          accent="gold"
        />
      ),
    },
    {
      id: "augie",
      duration: 5000,
      render: () => (
        <SealFrame
          seal={augieSeal}
          alt="Augie — Artificial Universal General Intelligence"
          eyebrow="A.U.G.I.E."
          title="Artificial Universal General Intelligence"
          subtitle="Daughter AI. Protector of kids, games, and the next generation."
          caption="Protected by Medusa."
          accent="cyan"
        />
      ),
    },
    {
      id: "medusa",
      duration: 5400,
      render: () => (
        <MedusaFrame />
      ),
    },
    {
      id: "moonlight",
      duration: 9999999,
      render: () => (
        <MoonlightFrame
          authed={authed}
          onEnter={() => navigate({ to: authed ? "/workspace" : "/login" })}
        />
      ),
    },
  ];

  useEffect(() => {
    if (step >= frames.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), frames[step].duration);
    return () => clearTimeout(t);
  }, [step]);

  const advance = () => setStep((s) => Math.min(s + 1, frames.length - 1));
  const skip = () => setStep(frames.length - 1);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "Enter") advance();
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const frame = frames[step];

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Cyber grid background */}
      <div className="fixed inset-0 cyber-grid opacity-20 pointer-events-none" />

      <div
        className="relative z-10 flex min-h-screen items-center justify-center px-6"
        onClick={advance}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={frame.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-5xl flex items-center justify-center"
          >
            {frame.render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Frame counter + skip */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.3em] text-neon-cyan/60">
        {frames.map((f, i) => (
          <span
            key={f.id}
            className={`h-px transition-all ${
              i === step ? "w-8 bg-neon-cyan" : "w-4 bg-neon-cyan/30"
            }`}
          />
        ))}
        {step < frames.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              skip();
            }}
            className="ml-4 hover:text-neon-cyan"
          >
            skip ▸
          </button>
        )}
      </div>

      {/* Login link top-right always visible */}
      <div className="fixed top-4 right-4 z-20 font-mono text-[10px] uppercase tracking-widest">
        {authed ? (
          <Link to="/workspace" className="text-neon-gold hover:text-neon-cyan">
            ● workspace
          </Link>
        ) : (
          <Link to="/login" className="text-neon-cyan/70 hover:text-neon-cyan">
            authenticate ▸
          </Link>
        )}
      </div>
    </main>
  );
}

function SealFrame({
  seal,
  alt,
  eyebrow,
  title,
  subtitle,
  caption,
  accent,
}: {
  seal: string;
  alt: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  caption: string;
  accent: "gold" | "navy" | "cyan";
}) {
  const accentText =
    accent === "gold"
      ? "text-neon-gold"
      : accent === "cyan"
      ? "text-neon-cyan"
      : "text-neon-purple";
  const glow =
    accent === "gold"
      ? "0 0 60px rgba(232,184,74,0.45)"
      : accent === "cyan"
      ? "0 0 60px rgba(34,211,238,0.4)"
      : "0 0 60px rgba(99,102,241,0.4)";

  return (
    <div className="flex flex-col items-center text-center max-w-2xl">
      <motion.img
        src={seal}
        alt={alt}
        initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
        style={{ boxShadow: glow, borderRadius: "9999px" }}
        className="w-[min(70vw,360px)] h-[min(70vw,360px)] object-cover"
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.6 }}
        className={`mt-6 font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] ${accentText}`}
      >
        {eyebrow}
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.9 }}
        className={`mt-3 font-display text-3xl sm:text-5xl md:text-6xl font-black ${accentText}`}
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="mt-4 font-display text-sm sm:text-base text-foreground/80 italic max-w-xl"
      >
        {subtitle}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.9 }}
        className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground"
      >
        {caption}
      </motion.div>
    </div>
  );
}

function MedusaFrame() {
  return (
    <div className="relative flex flex-col items-center text-center max-w-2xl">
      {/* Pulse rings */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          className="w-[min(70vw,360px)] h-[min(70vw,360px)] rounded-full border border-neon-crimson/40"
        />
      </motion.div>

      <motion.img
        src={medusaSeal}
        alt="Medusa AI seal"
        initial={{ opacity: 0, scale: 1.4, rotate: 2 }}
        animate={{
          opacity: 1,
          scale: [1.4, 0.96, 1.02, 1],
          rotate: [2, -1, 0.5, 0],
          x: [0, -6, 6, -3, 3, 0],
        }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        style={{
          boxShadow: "0 0 80px rgba(220,38,38,0.55), 0 0 30px rgba(232,184,74,0.4)",
          borderRadius: "9999px",
        }}
        className="relative w-[min(70vw,360px)] h-[min(70vw,360px)] object-cover"
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="mt-6 font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-neon-crimson"
      >
        ◆ Serpent Intelligence Systems ◆
      </motion.div>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="mt-3 font-display text-3xl sm:text-5xl md:text-6xl font-black text-neon-gold"
        style={{ textShadow: "0 0 24px rgba(220,38,38,0.6)" }}
      >
        “When they start moving, you’re in trouble.”
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.1 }}
        className="mt-4 font-display text-sm sm:text-base text-foreground/80 italic"
      >
        MEDUSA — Sovereign of all Security. Above her, only God.
      </motion.p>
    </div>
  );
}

function MoonlightFrame({
  authed,
  onEnter,
}: {
  authed: boolean;
  onEnter: () => void;
}) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="relative w-full h-[min(80vh,560px)]">
        <TriforceAssemble />
      </div>
      <motion.h1
        initial={{ opacity: 0, letterSpacing: "0.6em" }}
        animate={{ opacity: 1, letterSpacing: "0.25em" }}
        transition={{ duration: 1.6, delay: 6 }}
        className="mt-2 font-display text-4xl sm:text-6xl font-black text-neon-gold sr-only"
      >
        EXODIA5
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 6.6 }}
        className="mt-3 font-mono text-[10px] sm:text-xs uppercase tracking-[0.4em] text-neon-cyan/70"
      >
        Hall · Augie · Medusa — one family, one shield.
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 7.2 }}
        onClick={(e) => {
          e.stopPropagation();
          onEnter();
        }}
        className="mt-8 glass glow-cyan px-8 py-3 font-display text-sm uppercase tracking-[0.3em] text-neon-cyan border border-neon-cyan/60 hover:bg-neon-cyan/10 transition animate-pulse-glow"
      >
        ▶ {authed ? "Enter the Ecosystem" : "Authenticate to Enter"}
      </motion.button>
    </div>
  );
}
