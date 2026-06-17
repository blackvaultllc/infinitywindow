import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/how-to-play")({
  head: () => ({
    meta: [
      { title: "How To Play — Narf Narf" },
      {
        name: "description",
        content:
          "The full Narf Narf playbook. Learn the premise, the two sides, the energy and stability systems, every channel, every Council role, win conditions, and the combo cascades.",
      },
      { property: "og:title", content: "How To Play — Narf Narf" },
      { property: "og:description", content: "The full Narf Narf playbook — premise, roles, abilities, combos, and how to win." },
      { property: "og:url", content: "/how-to-play" },
    ],
    links: [{ rel: "canonical", href: "/how-to-play" }],
  }),
  component: HowToPlayPage,
});

type Chapter = {
  id: string;
  num: string;
  title: string;
  kicker: string;
  body: React.ReactNode;
};

const TERRA = "#E24B4A";
const BLUE = "#378ADD";
const GOLD = "#EF9F27";
const GREEN = "#45C490";

const CHAPTERS: Chapter[] = [
  {
    id: "premise",
    num: "01",
    title: "Earth Is Alive. And She Is Angry.",
    kicker: "The Premise",
    body: (
      <>
        <p>
          In Narf Narf, the planet Earth is a <span style={{ color: TERRA }}>sentient living being</span>{" "}
          who has grown tired of humanity's destruction. Terra — the planet — has awakened, and she is
          using the forces of nature and the cosmos to fight back.
        </p>
        <p>
          On the other side stands <span style={{ color: BLUE }}>The Council</span> — four specialists
          who together are humanity's last hope. Their job: survive long enough to appease Terra and
          restore balance.
        </p>
        <p className="text-foreground/70">
          This is not a war between players. It is a war between civilization and nature itself.
        </p>
      </>
    ),
  },
  {
    id: "sides",
    num: "02",
    title: "The Two Sides",
    kicker: "Choose Your Seat",
    body: (
      <div className="grid md:grid-cols-2 gap-3">
        <SideCard color={TERRA} title="YOU ARE TERRA">
          <li>You ARE the planet. You feel every storm, every quake.</li>
          <li>Goal: drive Stability to 0% before the clock runs out.</li>
          <li>Unlimited destructive power, but limited Energy — choose when and where carefully.</li>
          <li>Channel the Sun, Moon, Star Clusters, your Core, and the Atmosphere.</li>
          <li>The more humanity ignores you, the faster Energy regenerates.</li>
          <li>Win by strategy and timing — not by spamming abilities.</li>
        </SideCard>
        <SideCard color={BLUE} title="YOU ARE THE COUNCIL">
          <li>Humanity's last defense. Four specialists, one mission: survive.</li>
          <li>Goal: keep Global Stability above 0% until Terra's energy runs out.</li>
          <li>Every role does something different. One role alone cannot win.</li>
          <li>Engineer builds. Diplomat appeases. Scientist predicts. Commander coordinates.</li>
          <li>Talk constantly in match chat. Anticipate, don't react.</li>
        </SideCard>
      </div>
    ),
  },
  {
    id: "energy",
    num: "03",
    title: "The Energy System (Terra)",
    kicker: "Power, Patience, Rage",
    body: (
      <ul className="space-y-2">
        <Bullet>Terra starts each match with <b>50 / 100 Energy</b>.</Bullet>
        <Bullet>Regenerates at <b>+1 per second</b> passively.</Bullet>
        <Bullet>Pollution events boost regen to <b>+2/sec</b> (random, scales with match length).</Bullet>
        <Bullet>Every ability costs Energy. You cannot fire what you cannot afford.</Bullet>
        <Bullet>
          Hold <b>100 Energy</b> for 5 seconds without spending and{" "}
          <span style={{ color: TERRA }}>Rage Mode</span> triggers — 20 seconds of double damage and
          half cooldowns. After Rage, Energy is drained to 20.
        </Bullet>
        <Bullet>
          If the Diplomat completes <b>3 appeasement actions in a row</b>, Terra is{" "}
          <span style={{ color: GREEN }}>Pacified for 15 seconds</span> — abilities lock, regen slows
          to 0.3/sec.
        </Bullet>
      </ul>
    ),
  },
  {
    id: "stability",
    num: "04",
    title: "The Stability System (Council)",
    kicker: "Hold The Line",
    body: (
      <ul className="space-y-2">
        <Bullet>Global Stability starts at <b>100%</b> every match.</Bullet>
        <Bullet>Disasters in populated regions drain Stability. High-density regions lose more per hit.</Bullet>
        <Bullet>The bar is shared by all four Council players. If it hits 0%, the team loses.</Bullet>
        <Bullet>Diplomat appeasements restore <b>+5%</b> each.</Bullet>
        <Bullet>Stability cannot exceed 100% or fall below 0%.</Bullet>
        <Bullet><b>0% before time runs out:</b> Terra wins instantly.</Bullet>
        <Bullet><b>Time runs out first:</b> The Council wins — they survived.</Bullet>
      </ul>
    ),
  },
  {
    id: "channels",
    num: "05",
    title: "Channels & Abilities",
    kicker: "Terra's Arsenal",
    body: (
      <div className="grid md:grid-cols-2 gap-2.5">
        <ChannelCard color="#FFB347" name="SUN" tag="Heat">
          Drought, heatwave, UV surge, solar flare. Drains Stability gradually over time rather than in single hits.
        </ChannelCard>
        <ChannelCard color="#A1B5FF" name="MOON" tag="Gravity">
          Tidal surge, tectonic shift, gravitational storm. Hits hard, long cooldowns.
        </ChannelCard>
        <ChannelCard color="#C893FF" name="STAR CLUSTER" tag="Cosmos">
          Meteor shower, asteroid strike, cosmic radiation, magnetic pulse. Most expensive — highest single-hit damage.
        </ChannelCard>
        <ChannelCard color="#FF7766" name="CORE" tag="Internal">
          Earthquake, volcanic eruption, wildfire. Medium cost, fast cooldown, great for chain combos.
        </ChannelCard>
        <ChannelCard color="#7FE8FF" name="ATMOSPHERE" tag="Weather">
          Hurricane, tornado, blizzard, acid rain. Cheapest Energy, most frequent, wear them down.
        </ChannelCard>
      </div>
    ),
  },
  {
    id: "roles",
    num: "06",
    title: "Council Roles — Deep Dive",
    kicker: "Four Specialists, One Mission",
    body: (
      <div className="space-y-2.5">
        <RoleCard color="#FF8A33" name="ENGINEER" job="Block disasters. Repair damage.">
          <li><b>Deploy Shield</b> — barrier over a region; blocks the next disaster. 40s CD.</li>
          <li><b>Repair Grid</b> — +10% Stability. 60s CD. Save for after big hits.</li>
          <li><b>Fortify Region</b> — -50% damage in one region for 2 min. Use early on high-density zones.</li>
          <li>Tip: pre-place Shields from Scientist's forecasts, not after the fact.</li>
        </RoleCard>
        <RoleCard color={GREEN} name="DIPLOMAT" job="Calm Terra. Restore Stability.">
          <li><b>Plant Forest</b> — +5% Stability, -3% Terra aggression. 30s CD.</li>
          <li><b>Clean Ocean</b> — -5% Terra aggression. 45s CD.</li>
          <li><b>Reduce Emissions</b> — stacks -2% Terra regen (max 3 = -6%). 90s per stack.</li>
          <li>Three uninterrupted actions = <span style={{ color: GREEN }}>Pacification</span>. Coordinate with Commander to buy the chain.</li>
          <li>Warning: a disaster between action 2 and 3 resets the chain to 0.</li>
        </RoleCard>
        <RoleCard color={BLUE} name="SCIENTIST" job="Gather intel. Warn the team.">
          <li><b>Weather Scan</b> — reveals Terra's next 2 queued abilities. 45s CD. Share in chat.</li>
          <li><b>Energy Probe</b> — reveals Terra's exact Energy. 20s CD. Use constantly.</li>
          <li><b>Disaster Forecast</b> — 10s advance warning to all Council. 90s CD. Most valuable ability in the game.</li>
          <li>Tip: never stop talking. Your information wins matches.</li>
        </RoleCard>
        <RoleCard color="#FFFFFF" name="COMMANDER" job="Escalate. Coordinate. Rally.">
          <li><b>Evacuate Region</b> — civilians out for 90s; zero damage in that zone. 60s CD.</li>
          <li><b>Emergency Broadcast</b> — +30% Council action speed for 20s. 120s CD. Burn during Rage.</li>
          <li><b>Rally</b> — resets ALL Council cooldowns. <b>Once per match.</b> Save for crisis.</li>
          <li>Tip: never spend Rally early. Wait for Rage with all CDs down.</li>
        </RoleCard>
        <p className="text-foreground/70 text-[12px] pt-1">
          If nobody plays a role, that role's abilities lock for the team. Severe disadvantage.
        </p>
      </div>
    ),
  },
  {
    id: "winlose",
    num: "07",
    title: "Winning, Losing, and the Edge Cases",
    kicker: "How a match resolves",
    body: (
      <ul className="space-y-2">
        <Bullet><b style={{ color: TERRA }}>Terra wins:</b> Stability hits 0% before the timer expires.</Bullet>
        <Bullet><b style={{ color: BLUE }}>Council wins:</b> Stability stays above 0% until the timer expires.</Bullet>
        <Bullet><b style={{ color: GOLD }}>Draw:</b> Pacification triggers at the exact moment the timer expires — both sides get half points.</Bullet>
        <Bullet>
          <b>Disconnect:</b> Council players have 60 seconds to reconnect before AI (Easy) takes over.
          If 3+ Council players DC, the match ends as a Terra win.
        </Bullet>
      </ul>
    ),
  },
  {
    id: "combos",
    num: "08",
    title: "The Combo System — Cascades",
    kicker: "Two hits become three",
    body: (
      <>
        <ul className="space-y-2 mb-3">
          <Bullet>Two or more disasters in the same region within 30s = <b style={{ color: TERRA }}>Cascade Event</b>.</Bullet>
          <Bullet>Cascades deal <b>1.5x</b> the combined damage.</Bullet>
          <Bullet>Council sees a Cascade Warning 5s before resolution — only Commander's Evacuate is fast enough.</Bullet>
        </ul>
        <div className="grid md:grid-cols-2 gap-2">
          <ComboCard a="Earthquake" b="Flood" name="MEGA TSUNAMI" desc="Highest single-hit damage in the game." />
          <ComboCard a="Drought" b="Wildfire" name="INFERNO CASCADE" desc="Spreads to adjacent regions." />
          <ComboCard a="Solar Flare" b="Magnetic Pulse" name="GRID COLLAPSE" desc="Disables Engineer Shield for 30s." />
          <ComboCard a="Hurricane" b="Tornado" name="SUPERSTORM" desc="Continuous drain for 45s." />
        </div>
      </>
    ),
  },
];

function HowToPlayPage() {
  const router = useRouter();
  const [open, setOpen] = useState<string>(CHAPTERS[0].id);
  const tocItems = useMemo(
    () => CHAPTERS.map((c) => ({ id: c.id, num: c.num, title: c.title })),
    [],
  );

  const goBack = () => {
    if (window.history.length > 1) router.history.back();
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
      {/* Sticky header */}
      <header
        className="sticky top-0 z-30 backdrop-blur-md border-b"
        style={{
          background: "rgba(5,10,31,0.85)",
          borderColor: "rgba(55,138,221,0.25)",
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
          <div className="font-display tracking-[0.3em] text-[11px]" style={{ color: BLUE }}>
            HOW TO PLAY
          </div>
          <div className="w-12" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        <section className="mb-7">
          <div className="font-display tracking-[0.4em] text-[10px] mb-2" style={{ color: TERRA }}>
            FIELD MANUAL · v1
          </div>
          <h1 className="font-display text-4xl leading-none mb-2">
            THE NARF NARF
            <br />
            <span style={{ color: BLUE }}>PLAYBOOK</span>
          </h1>
          <p className="text-foreground/70 text-[13px] leading-relaxed max-w-xl">
            Eight chapters covering everything you need to survive — or destroy — the world. Bookmark this page; you can come back any time from the menu.
          </p>
        </section>

        {/* Table of contents */}
        <nav
          aria-label="Chapters"
          className="rounded-xl p-3 mb-6 border"
          style={{
            background: "rgba(10,20,46,0.55)",
            borderColor: "rgba(55,138,221,0.25)",
          }}
        >
          <div className="font-display tracking-[0.3em] text-[10px] mb-2 text-foreground/60">
            CHAPTERS
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {tocItems.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={() => setOpen(c.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] hover:bg-white/5 transition"
                >
                  <span
                    className="font-display tracking-widest text-[10px] w-6"
                    style={{ color: TERRA }}
                  >
                    {c.num}
                  </span>
                  <span className="text-foreground/85">{c.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Chapters */}
        <div className="space-y-3">
          {CHAPTERS.map((c) => {
            const isOpen = open === c.id;
            return (
              <article
                key={c.id}
                id={c.id}
                className="rounded-xl border overflow-hidden"
                style={{
                  background: "rgba(10,20,46,0.55)",
                  borderColor: isOpen ? "rgba(226,75,74,0.45)" : "rgba(55,138,221,0.2)",
                  boxShadow: isOpen ? "0 0 32px rgba(226,75,74,0.12)" : "none",
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? "" : c.id)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0">
                    <div
                      className="font-display tracking-[0.35em] text-[10px] mb-1"
                      style={{ color: TERRA }}
                    >
                      CHAPTER {c.num} · {c.kicker.toUpperCase()}
                    </div>
                    <h2 className="font-display text-lg leading-tight truncate">{c.title}</h2>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-foreground/60 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-foreground/60 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 pt-1 text-[13px] leading-relaxed space-y-3 border-t border-white/5">
                    {c.body}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {/* CTA footer */}
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

/* ---------- helpers ---------- */

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span style={{ color: TERRA }} aria-hidden>
        ▸
      </span>
      <span className="text-foreground/85">{children}</span>
    </li>
  );
}

function SideCard({
  color, title, children,
}: { color: string; title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ borderColor: `${color}55`, background: `${color}0d` }}
    >
      <div
        className="font-display tracking-[0.3em] text-[11px] mb-2"
        style={{ color }}
      >
        {title}
      </div>
      <ul className="space-y-1.5 text-[12px]">
        {Array.isArray(children) ? children : <>{children}</>}
      </ul>
    </div>
  );
}

function ChannelCard({
  color, name, tag, children,
}: { color: string; name: string; tag: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ borderColor: `${color}55`, background: `${color}0d` }}
    >
      <div className="flex items-baseline justify-between mb-1">
        <div className="font-display tracking-[0.25em] text-[12px]" style={{ color }}>
          {name}
        </div>
        <div className="font-mono text-[9px] tracking-[0.2em] text-foreground/50">{tag.toUpperCase()}</div>
      </div>
      <p className="text-[12px] text-foreground/80">{children}</p>
    </div>
  );
}

function RoleCard({
  color, name, job, children,
}: { color: string; name: string; job: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{ borderColor: `${color}55`, background: `${color}0d` }}
    >
      <div className="flex items-baseline justify-between mb-1.5">
        <div className="font-display tracking-[0.25em] text-[12px]" style={{ color }}>
          {name}
        </div>
        <div className="text-[10px] text-foreground/60 italic">{job}</div>
      </div>
      <ul className="space-y-1 text-[12px] text-foreground/85 list-disc pl-4">
        {children}
      </ul>
    </div>
  );
}

function ComboCard({ a, b, name, desc }: { a: string; b: string; name: string; desc: string }) {
  return (
    <div
      className="rounded-lg p-3 border"
      style={{
        borderColor: "rgba(226,75,74,0.4)",
        background: "linear-gradient(135deg, rgba(226,75,74,0.08), rgba(239,159,39,0.05))",
      }}
    >
      <div className="font-mono text-[10px] tracking-widest text-foreground/60 mb-1">
        {a.toUpperCase()} + {b.toUpperCase()}
      </div>
      <div className="font-display tracking-[0.2em] text-[13px]" style={{ color: TERRA }}>
        {name}
      </div>
      <p className="text-[11px] text-foreground/75 mt-1">{desc}</p>
    </div>
  );
}
