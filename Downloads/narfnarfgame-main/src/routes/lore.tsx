import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Lock, Unlock, ExternalLink } from "lucide-react";
import { useProfile, hasAnyRole } from "@/lib/useProfile";

export const Route = createFileRoute("/lore")({
  head: () => ({
    meta: [
      { title: "Lore — TERRA: Planet vs Humans | Narf Narf" },
      {
        name: "description",
        content:
          "The four-act saga of TERRA, the M.I.B., and Captain Infinity. Intercepted transmissions, sealed files, and the truth behind humanity's last test.",
      },
      { property: "og:title", content: "Lore — TERRA: Planet vs Humans" },
      {
        property: "og:description",
        content:
          "Earth's core has awakened. Read the intercepted files, decrypt the M.I.B. transmissions, and uncover who Captain Infinity really serves.",
      },
      { property: "og:url", content: "/lore" },
    ],
    links: [{ rel: "canonical", href: "/lore" }],
  }),
  component: LorePage,
});

const TERRA = "#E24B4A";
const BLUE = "#378ADD";
const GOLD = "#EF9F27";
const GREEN = "#45C490";

type Act = {
  num: 1 | 2 | 3 | 4;
  id: string;
  kicker: string;
  title: string;
  unlockHint: string;
  format: string;
  body: React.ReactNode;
  classified?: React.ReactNode;
};

const ACTS: Act[] = [
  {
    num: 1,
    id: "act-1",
    kicker: "ACT I · THE BREAKING POINT",
    title: "TERRA AWAKENS",
    unlockHint: "Available from game start.",
    format: "TERRA PULSE BROADCAST · CHANNEL 0",
    body: (
      <>
        <p>
          Earth's core intelligence — called <span style={{ color: TERRA }}>TERRA</span> — has
          awakened after centuries of human destruction. She is not random. She is strategic,
          deliberate, and evolving. She deploys natural disasters as <em>calculated weapons</em>{" "}
          against corrupt human systems.
        </p>
        <p>
          Players are survivors caught in the middle of a planetary war they don't yet
          understand. Floods. Earthquakes. Firestorms. Atmospheric collapse. World governments
          are failing. Nobody knows why the Earth is fighting back with intelligence.
        </p>
        <p className="text-foreground/70">This is survival mode.</p>
      </>
    ),
  },
  {
    num: 2,
    id: "act-2",
    kicker: "ACT II · THE WATCHERS",
    title: "M.I.B. — MAFIA INTERSTELLAR BUREAU",
    unlockHint: "Unlocks after your first completed match.",
    format: "INTERCEPTED TRANSMISSION · FRAGMENT 0014-B",
    body: (
      <>
        <p>
          As you progress, classified signal fragments begin to bleed through the static. They
          reference an organization called the{" "}
          <span style={{ color: BLUE }}>M.I.B. — Mafia Interstellar Bureau of Investigations</span>.
          Ancient. Off-world affiliated. They have monitored Earth for centuries without
          intervention.
        </p>
        <p>
          One operative appears repeatedly in corrupted data files:{" "}
          <span style={{ color: GOLD }}>CAPTAIN INFINITY</span>. His allegiance is unknown. His
          file is sealed.
        </p>
      </>
    ),
  },
  {
    num: 3,
    id: "act-3",
    kicker: "ACT III · THE TWIST",
    title: "THE FIELD GENERAL",
    unlockHint: "Unlocks after 5 completed matches.",
    format: "DECRYPTED M.I.B. FIELD REPORT · CLEARANCE ω",
    body: (
      <>
        <p>
          Captain Infinity has <em>not</em> been surveilling Earth for the M.I.B. He has been
          covertly coordinating with <span style={{ color: TERRA }}>TERRA</span> — feeding her
          targeting data, steering catastrophic events away from innocent populations while
          allowing corrupt systems to collapse.
        </p>
        <p>
          He is TERRA's <span style={{ color: GOLD }}>field general</span>, operating inside the
          enemy's own intelligence network. He is not against humanity. He is against what
          humanity became.
        </p>
      </>
    ),
    classified: (
      <p className="text-foreground/60 text-[12px] italic">
        Survivors who progress far enough begin to see the pattern. Disasters steer around
        innocent populations. Corrupt systems collapse first. Something inside the network is
        choosing targets.
      </p>
    ),
  },
  {
    num: 4,
    id: "act-4",
    kicker: "ACT IV · THE RECKONING",
    title: "WHICH SIDE WILL YOU STAND ON?",
    unlockHint: "Unlocks after 10 completed matches.",
    format: "FINAL DIRECTIVE · GRAND ORACLE SERIES",
    body: (
      <>
        <p>
          The entire game has been a test. TERRA, the M.I.B., and Captain Infinity have been
          evaluating every survivor. The final question is not whether you survived Earth's
          wrath.
        </p>
        <p className="font-display tracking-[0.15em]" style={{ color: GREEN }}>
          It is which side you stand on when the dust settles.
        </p>
        <p className="text-foreground/80">
          This gate opens the full TERRA experience and redirects you to the origin comic —
          where the Grand Oracle universe truly begins.
        </p>
        <a
          href="https://infinitycomics.xyz"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 mt-2 px-4 py-2.5 rounded-xl font-display tracking-[0.25em] text-[12px]"
          style={{
            background: "linear-gradient(180deg, #EF9F27 0%, #8a5a14 100%)",
            color: "#03060F",
            boxShadow: "0 8px 24px rgba(239,159,39,0.35)",
          }}
        >
          READ ISSUE ONE <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </>
    ),
    classified: (
      <p className="text-foreground/60 text-[12px] italic">
        A final reckoning awaits. Continue to play. The test is not over.
      </p>
    ),
  },
];

function readUnlockedAct(): number {
  if (typeof window === "undefined") return 1;
  const v = parseInt(localStorage.getItem("narf.lore.maxAct") ?? "1", 10);
  return isNaN(v) ? 1 : Math.max(1, Math.min(4, v));
}

function LorePage() {
  const router = useRouter();
  const { profile } = useProfile();
  const isStaff = hasAnyRole(profile, ["admin", "moderator", "support"]);
  const [maxAct, setMaxAct] = useState<number>(1);
  const [open, setOpen] = useState<string>("act-1");

  useEffect(() => {
    setMaxAct(readUnlockedAct());
  }, []);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) router.history.back();
    else router.navigate({ to: "/" });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
        color: "white",
      }}
    >
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          background: "rgba(5,10,31,0.85)",
          borderColor: "rgba(226,75,74,0.25)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={goBack}
            aria-label="Back"
            className="flex items-center gap-1.5 text-[11px] font-display tracking-[0.25em] text-foreground/80 hover:text-foreground transition"
          >
            <ArrowLeft className="w-4 h-4" /> BACK
          </button>
          <div className="font-display tracking-[0.3em] text-[11px]" style={{ color: TERRA }}>
            LORE · GRAND ORACLE
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <section className="mb-7">
          <div className="font-display tracking-[0.4em] text-[10px] mb-2" style={{ color: BLUE }}>
            UNIVERSE FILES · CLASSIFIED
          </div>
          <h1 className="font-display text-4xl leading-none mb-2">
            TERRA: <span style={{ color: TERRA }}>PLANET</span> vs HUMANS
          </h1>
          <p className="text-foreground/70 text-[13px] leading-relaxed max-w-xl">
            Four acts. Intercepted transmissions, TERRA pulse broadcasts, and corrupted field
            reports. Acts unlock as you survive longer. The final file redirects you to the
            origin comic at infinitycomics.xyz.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.25em]"
               style={{ background: "rgba(55,138,221,0.12)", border: "1px solid rgba(55,138,221,0.4)", color: BLUE }}>
            CLEARANCE · ACT {maxAct} / 4 {isStaff && "· STAFF OVERRIDE"}
          </div>
        </section>

        <div className="space-y-3">
          {ACTS.map((act) => {
            const unlocked = isStaff || maxAct >= act.num;
            const isOpen = open === act.id;
            return (
              <article
                key={act.id}
                id={act.id}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "rgba(10,20,46,0.55)",
                  borderColor: unlocked
                    ? isOpen
                      ? "rgba(226,75,74,0.45)"
                      : "rgba(55,138,221,0.25)"
                    : "rgba(255,255,255,0.08)",
                  boxShadow: isOpen && unlocked ? "0 0 32px rgba(226,75,74,0.12)" : "none",
                  opacity: unlocked ? 1 : 0.85,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? "" : act.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <div
                      className="font-display tracking-[0.35em] text-[10px] mb-1"
                      style={{ color: unlocked ? TERRA : "rgba(255,255,255,0.4)" }}
                    >
                      {act.kicker}
                    </div>
                    <h2 className="font-display text-lg leading-tight truncate">
                      {unlocked ? act.title : "▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒"}
                    </h2>
                  </div>
                  {unlocked ? (
                    <Unlock className="w-4 h-4 text-foreground/60 shrink-0" />
                  ) : (
                    <Lock className="w-4 h-4 text-foreground/40 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 pt-1 border-t border-white/5">
                    <div
                      className="font-mono text-[9px] tracking-[0.3em] mb-3 mt-2"
                      style={{ color: unlocked ? BLUE : "rgba(255,255,255,0.4)" }}
                    >
                      {unlocked ? act.format : "// SEALED FILE — INSUFFICIENT CLEARANCE"}
                    </div>
                    <div className="text-[13px] leading-relaxed space-y-3">
                      {unlocked ? act.body : act.classified ?? (
                        <p className="text-foreground/60 text-[12px] italic">
                          Survive longer to earn clearance.
                        </p>
                      )}
                    </div>
                    {!unlocked && (
                      <div className="mt-4 text-[11px] font-mono tracking-widest text-foreground/50">
                        {act.unlockHint}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <section
          className="mt-8 rounded-xl p-4 border"
          style={{
            background: "linear-gradient(135deg, rgba(239,159,39,0.08), rgba(226,75,74,0.05))",
            borderColor: "rgba(239,159,39,0.35)",
          }}
        >
          <div className="font-display tracking-[0.3em] text-[10px] mb-2" style={{ color: GOLD }}>
            CROSSLINK · GRAND ORACLE SERIES
          </div>
          <p className="text-[13px] text-foreground/85 mb-3">
            The origin story lives in the comic. Read Issue One and explore the full universe
            that connects TERRA, the M.I.B., and Captain Infinity.
          </p>
          <a
            href="https://infinitycomics.xyz"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-display tracking-[0.25em] text-[11px]"
            style={{ background: "rgba(239,159,39,0.2)", border: "1px solid rgba(239,159,39,0.6)", color: "#ffd58a" }}
          >
            VISIT INFINITYCOMICS.XYZ <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </section>

        <div className="mt-8 flex flex-col sm:flex-row gap-2">
          <Link
            to="/select"
            className="flex-1 text-center py-3 rounded-xl font-display tracking-[0.3em] text-[12px]"
            style={{
              background: "linear-gradient(180deg, #E24B4A 0%, #8a1f1e 100%)",
              color: "#03060F",
              boxShadow: "0 8px 24px rgba(226,75,74,0.35)",
            }}
          >
            DEPLOY NOW →
          </Link>
          <Link
            to="/"
            className="flex-1 text-center py-3 rounded-xl font-display tracking-[0.3em] text-[12px] border"
            style={{ borderColor: "rgba(55,138,221,0.5)", color: BLUE }}
          >
            ← HOME
          </Link>
        </div>
      </main>
    </div>
  );
}
