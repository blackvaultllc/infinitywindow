import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { useOnboardingRedirect } from "@/lib/useOnboardingGate";

export const Route = createFileRoute("/_authenticated/onboarding-tour")({
  head: () => ({
    meta: [
      { title: "Game Tour — Narf Narf" },
      { name: "description", content: "Mandatory walkthrough — learn Terra, the Council, the channels, and how to win." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TourPage,
});

type Step = {
  badge: string;
  title: string;
  body: string;
  cta: string;
};

const STEPS: Step[] = [
  {
    badge: "01 · PLANET",
    title: "MEET TERRA",
    body: "Terra is the living planet. She runs on cosmic energy and unleashes disasters when humans push too far. Energy regenerates between strikes — pick your moment.",
    cta: "I HEAR HER →",
  },
  {
    badge: "02 · CHANNELS",
    title: "COSMIC SIGNAL CHANNELS",
    body: "Five channels feed Terra: Sun, Moon, Star Cluster, Core, Atmosphere. Each channel powers a different disaster family. Mix them for combo strikes.",
    cta: "TUNE THE BANDS →",
  },
  {
    badge: "03 · TARGETING",
    title: "PICK A REGION",
    body: "Click anywhere on the globe to drop a strike point. Population, infrastructure, and Council defenses change what you can deploy and how much it costs.",
    cta: "PRACTICE TARGET →",
  },
  {
    badge: "04 · COUNCIL",
    title: "MEET THE COUNCIL",
    body: "Four human roles: Engineer, Diplomat, Scientist, Commander. They coordinate to predict, soothe, build, and dispatch — buying Earth time.",
    cta: "REVIEW THE BENCH →",
  },
  {
    badge: "05 · ABILITIES",
    title: "ROLE ABILITIES",
    body: "Engineer hardens cities. Diplomat appeases Terra. Scientist predicts strikes. Commander triggers global emergency response. Combine them or burn out alone.",
    cta: "DRILL THE LOADOUT →",
  },
  {
    badge: "06 · WIN STATE",
    title: "WINNING & LOSING",
    body: "Stability bar must hold for the round timer. Terra wins when stability hits zero. Council wins on the clock. Apex Wrath mode adds permanent scarring.",
    cta: "ACCEPT THE TERMS →",
  },
  {
    badge: "07 · LOBBIES",
    title: "LOBBY SYSTEM",
    body: "Browse open lobbies, chat the host, then queue. Solo Mode pits you against AI. Practice Mode is sandbox — no stats, no XP, no consequences.",
    cta: "I CAN FIND A GAME →",
  },
  {
    badge: "08 · PROGRESSION",
    title: "STORE & PROGRESSION",
    body: "Win matches → earn XP, Terra Coins, and seasonal rewards. Spend coins in the store on skins, FX packs, and HUD themes. Season Pass unlocks deeper drops.",
    cta: "DEPLOY ME →",
  },
];

function TourPage() {
  const navigate = useNavigate();
  const { profile, loading, reload } = useProfile();
  useOnboardingRedirect(profile, loading, {
    allowHere: ["/onboarding-tour"],
    fallback: "/select",
  });
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<"tour" | "ui-mode">("tour");

  useEffect(() => {
    if (!loading && profile && profile.username && profile.alignment_locked && !profile.onboarding_complete) {
      setStep(Math.min(profile.tour_step ?? 0, STEPS.length - 1));
    }
  }, [loading, profile]);

  if (loading) return null;
  if (!profile) return <Navigate to="/auth" />;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const advance = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (isLast) {
        await supabase
          .from("profiles")
          .update({ tour_step: STEPS.length } as any)
          .eq("id", profile.id);
        setPhase("ui-mode");
      } else {
        const next = step + 1;
        await supabase
          .from("profiles")
          .update({ tour_step: next } as any)
          .eq("id", profile.id);
        setStep(next);
      }
    } finally {
      setBusy(false);
    }
  };

  const pickMode = async (mode: "regular" | "advanced") => {
    if (busy) return;
    setBusy(true);
    try {
      await supabase
        .from("profiles")
        .update({ ui_mode: mode, onboarding_complete: true } as any)
        .eq("id", profile.id);
      await reload();
      navigate({ to: "/select" });
    } finally {
      setBusy(false);
    }
  };

  if (phase === "ui-mode") {
    return (
      <div
        className="fixed inset-0 overflow-y-auto flex flex-col"
        style={{
          background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
        }}
      >
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="relative max-w-md w-full text-center">
            <div className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: "#EF9F27" }}>
              09 · INTERFACE
            </div>
            <h2 className="font-display text-3xl tracking-tight mb-3">PICK YOUR HUD</h2>
            <p className="text-foreground/75 text-[13px] leading-relaxed mb-6 max-w-sm mx-auto">
              Regular Mode is streamlined with tooltips for new operators. Advanced Mode unlocks
              keyboard shortcuts and the raw HUD. Change anytime in Settings.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => pickMode("regular")}
                disabled={busy}
                className="w-full py-4 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98] disabled:opacity-40 min-h-11"
                style={{
                  background: "linear-gradient(180deg, #378ADD 0%, #1a4a85 100%)",
                  color: "#03060F",
                  boxShadow: "0 8px 24px rgba(55,138,221,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                REGULAR · GUIDED
              </button>
              <button
                onClick={() => pickMode("advanced")}
                disabled={busy}
                className="w-full py-4 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98] disabled:opacity-40 min-h-11"
                style={{
                  background: "linear-gradient(180deg, #EF9F27 0%, #8a5a14 100%)",
                  color: "#03060F",
                  boxShadow: "0 8px 24px rgba(239,159,39,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
                }}
              >
                ADVANCED · UNLEASHED
              </button>
            </div>
            {busy && (
              <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-4">
                LOCKING IN…
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 overflow-y-auto flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
          NARF NARF · BOOT CAMP
        </span>
        <div className="relative group">
          <button
            disabled
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground/40 cursor-not-allowed"
          >
            SKIP TOUR
          </button>
          <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-black/90 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-foreground/80 whitespace-nowrap z-10">
            You must complete the tour before your first match.
          </div>
        </div>
      </div>

      {/* Demo "globe" backdrop */}
      <div className="relative flex-1 flex items-center justify-center px-6 pb-8">
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
          style={{
            width: "min(60vmin,420px)",
            height: "min(60vmin,420px)",
            background: "radial-gradient(circle at 35% 30%, #2a6bb8 0%, #0d2748 55%, #02040c 100%)",
            boxShadow:
              "0 0 80px rgba(55,138,221,0.25), inset -30px -30px 80px rgba(0,0,0,0.6)",
            opacity: 0.55,
          }}
        />

        <div className="relative max-w-md w-full text-center">
          <div className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: "#EF9F27" }}>
            {current.badge}
          </div>
          <h2 className="font-display text-3xl tracking-tight mb-4">{current.title}</h2>
          <p className="text-foreground/75 text-[13px] leading-relaxed mb-6 max-w-sm mx-auto">
            {current.body}
          </p>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === step ? 24 : 8,
                  background:
                    i < step ? "#378ADD" : i === step ? "#EF9F27" : "rgba(255,255,255,0.15)",
                }}
              />
            ))}
          </div>

          <button
            onClick={advance}
            disabled={busy}
            className="w-full py-3.5 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98] disabled:opacity-40"
            style={{
              background: isLast
                ? "linear-gradient(180deg, #E24B4A 0%, #8a1f1e 100%)"
                : "linear-gradient(180deg, #378ADD 0%, #1a4a85 100%)",
              color: "#03060F",
              boxShadow: isLast
                ? "0 8px 24px rgba(226,75,74,0.4), inset 0 1px 0 rgba(255,255,255,0.3)"
                : "0 8px 24px rgba(55,138,221,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            {busy ? "SAVING…" : isLast ? "COMPLETE TOUR · ENTER MENU →" : current.cta}
          </button>

          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mt-4">
            STEP {step + 1} OF {STEPS.length}
          </div>
        </div>
      </div>
    </div>
  );
}