import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, hasAnyRole } from "@/lib/useProfile";
import { EarthGlobe } from "@/components/terra/EarthGlobe";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Narf Narf — Planet vs Humans" },
      {
        name: "description",
        content:
          "Narf Narf is a real-time planetary crisis strategy game. Pick a side — defend the planet or save the humans — and command the theater.",
      },
      { property: "og:title", content: "Narf Narf — Planet vs Humans" },
      {
        property: "og:description",
        content:
          "Real-time disaster strategy. Pick a side — defend the planet or save the humans — and command the theater.",
      },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"intro" | "landing">("landing");
  const { profile } = useProfile();
  const isStaff = hasAnyRole(profile, ["admin", "moderator", "support"]);

  const finishIntro = () => {
    localStorage.setItem("narf.intro.seen", "1");
    setPhase("landing");
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      {/* Starfield backdrop */}
      <Stars />

      {/* Fullscreen Earth backdrop — hidden during landing so the hero planet sits above the title */}
      <div
        className="fixed inset-0 z-10 pointer-events-none transition-opacity duration-700"
        style={{ width: "100vw", height: "100vh", opacity: phase === "intro" ? 1 : 0 }}
      >
        <EarthGlobe impacts={[]} />
      </div>

      {/* STORY INTRO */}
      {phase === "intro" && <StoryIntro onDone={finishIntro} />}

      {/* LANDING — phone-sized, no scroll */}
      <div
        className="relative z-10 flex-1 flex flex-col px-6 pt-10 pb-24 transition-opacity duration-700"
        style={{ opacity: phase === "landing" ? 1 : 0 }}
      >
        {/* Brand bar */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
            SIS · NARF NARF
          </span>
          <span
            className="rounded-full px-2 py-0.5 font-mono text-[9px] tracking-widest"
            style={{
              border: "1px solid rgba(226,75,74,0.5)",
              color: "#E24B4A",
              background: "rgba(226,75,74,0.08)",
            }}
          >
            LIVE OPS
          </span>
        </div>

        {/* Hero planet + title */}
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-0 pb-4">
          <h2 className="sr-only">Narf Narf — Planet vs Humans</h2>

          <Planet />

          <div className="-mt-10">
            <h1
              className="font-display text-6xl leading-[0.9] tracking-tight"
              aria-label="Narf Narf — Planet vs Humans"
              style={{
                backgroundImage: "linear-gradient(180deg, #ffffff 0%, #88BFFF 45%, #4a8fe8 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextStroke: "1px rgba(10,30,74,0.55)",
                textShadow: "0 2px 18px rgba(74,143,232,0.55), 0 0 38px rgba(10,30,74,0.85)",
                filter: "drop-shadow(0 4px 14px rgba(0,0,0,0.7))",
              }}
            >
              NARF<span style={{ color: "#E24B4A", WebkitTextFillColor: "#E24B4A" }}>·</span>NARF
              <span className="sr-only"> — Planet vs Humans</span>
            </h1>
            <div
              className="mt-3 font-display text-[13px] tracking-[0.4em] inline-block px-3 py-1 rounded-full"
              style={{
                background: "rgba(3,6,15,0.7)",
                border: "1px solid rgba(226,75,74,0.45)",
                color: "#ffffff",
                textShadow: "0 1px 8px rgba(0,0,0,0.9)",
                backdropFilter: "blur(6px)",
              }}
            >
              PLANET <span style={{ color: "#E24B4A" }}>vs</span> HUMANS
            </div>
          </div>
          <p
            className="text-[12px] max-w-[280px] leading-snug px-3 py-2 rounded-lg"
            style={{
              background: "rgba(3,6,15,0.55)",
              color: "#e8edff",
              textShadow: "0 1px 6px rgba(0,0,0,0.85)",
              backdropFilter: "blur(4px)",
            }}
          >
            Real-time global crisis. Pick a side, build your operator, command the theater.
          </p>
        </div>

        {/* CTA stack — App Store style */}
        <div className="flex flex-col gap-2.5">
          <h2 className="sr-only">Enter the game</h2>
          <button
            onClick={() => navigate({ to: "/auth" })}
            className="w-full py-3.5 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98]"
            style={{
              background: "linear-gradient(180deg, #4a8fe8 0%, #1B4FA8 100%)",
              color: "#03060F",
              boxShadow: "0 8px 24px rgba(55,138,221,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            PLAY
          </button>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="py-3.5 rounded-2xl font-display text-[13px] tracking-[0.25em] transition active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#ffffff",
              }}
            >
              SIGN IN
            </button>
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="py-3.5 rounded-2xl font-display text-[13px] tracking-[0.25em] transition active:scale-[0.98]"
              style={{
                background: "rgba(226,75,74,0.22)",
                border: "1px solid rgba(226,75,74,0.85)",
                color: "#ffd5d4",
              }}
            >
              CREATE
            </button>
          </div>
          {profile && (
            <div className="mt-1 flex items-center justify-center gap-3">
              <button
                onClick={() => navigate({ to: "/select" })}
                className="text-[10px] tracking-[0.3em] text-muted-foreground font-mono hover:text-foreground"
              >
                RESUME COMMAND →
              </button>
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/" });
                }}
                className="text-[10px] tracking-[0.3em] text-muted-foreground font-mono hover:text-foreground"
              >
                SIGN OUT
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2 text-center text-[9px] font-mono tracking-widest text-muted-foreground/70">
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => setPhase("intro")} className="hover:text-foreground transition">
              REPLAY STORY
            </button>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <button onClick={() => navigate({ to: "/how-to-play" })} className="hover:text-foreground transition">
              HOW TO PLAY
            </button>
            <span aria-hidden className="opacity-40">·</span>
            <button onClick={() => navigate({ to: "/lore" })} className="hover:text-foreground transition">
              LORE
            </button>
            {profile && (
              <>
                <span aria-hidden className="opacity-40">
                  ·
                </span>
                <button onClick={() => navigate({ to: "/codex" })} className="hover:text-foreground transition">
                  CODEX
                </button>
              </>
            )}
            {profile && isStaff && (
              <>
                <span aria-hidden className="opacity-40">
                  ·
                </span>
                <button onClick={() => navigate({ to: "/admin" })} className="text-amber-400 hover:text-amber-300">
                  ADMIN
                </button>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-2 opacity-70">
            <span>EXODIA HOLDINGS</span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <span>BUILD 0.3</span>
            <span aria-hidden className="opacity-40">
              ·
            </span>
            <button onClick={() => navigate({ to: "/privacy" })} className="hover:text-foreground transition">
              PRIVACY
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 40px rgba(55,138,221,0.4), inset -10px -16px 28px rgba(0,0,0,0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 90px rgba(55,138,221,0.9), inset -10px -16px 28px rgba(0,0,0,0.6); }
        }
        @keyframes hero-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes story-fade {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function StoryIntro({ onDone }: { onDone: () => void }) {
  const beats = [
    {
      tag: "ACT I · THE BREAKING POINT",
      title: "TERRA AWAKENS",
      body: "Earth's core intelligence — TERRA — has awakened after centuries of human destruction. The disasters that follow are not random. They are deliberate. Strategic. Calculated. Governments are failing. No one knows why the planet is fighting back with intelligence. This is survival mode.",
    },
    {
      tag: "ACT II · THE WATCHERS",
      title: "M.I.B. — MAFIA INTERSTELLAR BUREAU",
      body: "Classified signal fragments leak through the static. An ancient off-world organization has monitored Earth for centuries without intervention. One operative appears, again and again, in corrupted data files. His file is sealed. His allegiance is unknown. They call him CAPTAIN INFINITY.",
    },
    {
      tag: "ACT III · ▒▒▒ REDACTED ▒▒▒",
      title: "[CLASSIFIED — CLEARANCE PENDING]",
      body: "Survivors who progress far enough begin to see the pattern. Disasters steer around innocent populations. Corrupt systems collapse first. Something inside the network is choosing targets. The full file unlocks once you have earned the right to read it.",
    },
    {
      tag: "ACT IV · THE RECKONING",
      title: "WHICH SIDE WILL YOU STAND ON?",
      body: "The entire game has been a test. TERRA, the M.I.B., and Captain Infinity have been evaluating every survivor. The question is no longer whether you can outlast Earth's wrath. The question is which side you stand on when the dust settles.",
    },
  ];
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<"planet" | "humans" | "watcher" | null>(null);
  const beat = beats[i];
  const last = i === beats.length - 1;
  const isChoice = i === beats.length; // virtual choice screen after the last narrative beat

  const commit = async (choice: "planet" | "humans" | "watcher") => {
    setChosen(choice);
    localStorage.setItem("narf.prologue.choice", choice);
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) {
      await supabase
        .from("profiles")
        .update({ prologue_choice: choice, alignment_locked: true })
        .eq("id", auth.user.id);
    }
  };

  if (isChoice) {
    return (
      <div
        className="absolute inset-0 z-20 flex flex-col px-6 py-8"
        style={{
          background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
            NARF NARF · OATH
          </span>
          <button
            onClick={onDone}
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            SKIP →
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full gap-5">
          <div className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#E24B4A" }}>
            PROLOGUE · 05
          </div>
          <h2 className="font-display text-3xl tracking-tight">CHOOSE YOUR OATH</h2>
          <p className="text-foreground/70 text-[13px] leading-relaxed">
            This choice is <span style={{ color: "#EF9F27" }}>permanent</span>. It will shape every alert, every
            alliance.
          </p>
          <div className="w-full flex flex-col gap-2.5">
            <OathBtn
              color="#E24B4A"
              label="STAND WITH THE PLANET"
              desc="The Earth chose to fight. You fight beside it."
              selected={chosen === "planet"}
              onClick={() => commit("planet")}
            />
            <OathBtn
              color="#378ADD"
              label="STAND WITH HUMANS"
              desc="Civilization gets one chance. Make it count."
              selected={chosen === "humans"}
              onClick={() => commit("humans")}
            />
            <OathBtn
              color="#EF9F27"
              label="WATCH AND DECIDE"
              desc="Pick a side later. Some prefer the long view."
              selected={chosen === "watcher"}
              onClick={() => commit("watcher")}
            />
          </div>
        </div>
        <button
          onClick={onDone}
          disabled={!chosen}
          className="w-full py-3.5 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98] disabled:opacity-40"
          style={{
            background: "linear-gradient(180deg, #E24B4A 0%, #8a1f1e 100%)",
            color: "#03060F",
            boxShadow: "0 8px 24px rgba(226,75,74,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          BEGIN
        </button>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col px-6 py-8"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
          NARF NARF · STORY
        </span>
        <button
          onClick={onDone}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          SKIP →
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
        <div key={i} className="w-full" style={{ animation: "story-fade 600ms ease-out" }}>
          <div className="font-mono text-[10px] tracking-[0.4em] mb-3" style={{ color: "#E24B4A" }}>
            {beat.tag}
          </div>
          <h2 className="font-display text-3xl leading-tight mb-5 tracking-tight">{beat.title}</h2>
          <p className="text-foreground/80 text-[14px] leading-relaxed">{beat.body}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-center gap-1.5">
          {beats.map((_, idx) => (
            <span
              key={idx}
              className="h-1 rounded-full transition-all"
              style={{
                width: idx === i ? 24 : 8,
                background: idx === i ? "#378ADD" : "rgba(255,255,255,0.2)",
              }}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="w-full py-3.5 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98]"
          style={{
            background: last
              ? "linear-gradient(180deg, #E24B4A 0%, #8a1f1e 100%)"
              : "linear-gradient(180deg, #4a8fe8 0%, #1B4FA8 100%)",
            color: "#03060F",
            boxShadow: "0 8px 24px rgba(55,138,221,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {last ? "ENTER LOBBY →" : "CONTINUE"}
        </button>
      </div>
    </div>
  );
}

function OathBtn({
  color,
  label,
  desc,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  desc: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl px-4 py-3 text-left transition active:scale-[0.98]"
      style={{
        background: selected ? `${color}1f` : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? color : "rgba(255,255,255,0.12)"}`,
        boxShadow: selected ? `0 0 24px ${color}55` : "none",
      }}
    >
      <div className="font-display text-[13px] tracking-[0.2em]" style={{ color }}>
        {label}
      </div>
      <div className="text-[11px] text-foreground/70 mt-1">{desc}</div>
    </button>
  );
}

function Planet() {
  return (
    <div className="relative" style={{ width: 280, height: 280, animation: "hero-float 6s ease-in-out infinite" }}>
      <EarthGlobe impacts={[]} compact />
    </div>
  );
}

function Stars() {
  // 60 deterministic-ish stars for SSR consistency
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: (i * 73) % 100,
    y: (i * 137) % 100,
    s: ((i * 17) % 3) + 1,
    o: 0.3 + ((i * 11) % 7) / 10,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${st.x}%`,
            top: `${st.y}%`,
            width: st.s,
            height: st.s,
            opacity: st.o,
          }}
        />
      ))}
    </div>
  );
}
