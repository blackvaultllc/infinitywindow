import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "Infinity Window — Bring the World Into Any Room" },
      {
        name: "description",
        content:
          "Infinity Window streams real remote locations onto your walls, maps each window to a direction, and shifts perspective as you move. Step into anywhere.",
      },
      { property: "og:title", content: "Infinity Window — Bring the World Into Any Room" },
      {
        property: "og:description",
        content:
          "A virtual window system that turns your walls into living views of remote places, with perspective that follows you across the room.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: "◷",
    title: "Real Remote Locations",
    body: "Stream curated directional feeds from beaches, mountains, and cities around the world — day or night, in real time.",
    accent: "gold" as const,
  },
  {
    icon: "▦",
    title: "Map Walls to Directions",
    body: "Assign each physical wall or window to a compass direction so the view aligns with the world outside your room.",
    accent: "violet" as const,
  },
  {
    icon: "⤢",
    title: "Living Perspective",
    body: "As you move through the room, the scene shifts and pans — recreating the parallax of looking through a real window.",
    accent: "gold" as const,
  },
  {
    icon: "§",
    title: "Patent-Grounded Design",
    body: "Built on the principles of virtual window systems (US20100271394A1) for a believable sense of depth and place.",
    accent: "violet" as const,
  },
];

const STEPS = [
  {
    n: "01",
    title: "Pick a Location",
    body: "Browse remote destinations and set one as your active feed.",
  },
  {
    n: "02",
    title: "Map Your Walls",
    body: "Tell Infinity Window which wall faces which direction.",
  },
  {
    n: "03",
    title: "Move & Watch",
    body: "Walk around the room and see the perspective follow you.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-gold/15 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/landing"
            className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-gold"
          >
            <span className="text-2xl leading-none">∞</span>
            <span>Infinity Window</span>
          </Link>
          <Link
            to="/"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-[#0a0a12] transition hover:bg-gold/90"
          >
            Launch App
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--gold) 14%, transparent), transparent 70%), radial-gradient(40% 40% at 80% 30%, color-mix(in oklab, var(--violet) 16%, transparent), transparent 70%)",
            }}
          />
          <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6 sm:py-32">
            <div className="animate-tab-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-violet/40 bg-violet/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-violet">
                ∞ Virtual Window System
              </span>
              <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-gold sm:text-6xl">
                Bring the world into any room
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Infinity Window turns your walls into living views of remote
                places — and the perspective shifts as you move, just like a
                real window.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <Link
                  to="/"
                  className="glow-gold rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-[#0a0a12] transition hover:bg-gold/90"
                >
                  Open Infinity Window
                </Link>
                <a
                  href="#how"
                  className="rounded-lg border border-gold/40 px-6 py-3 text-sm font-semibold text-gold transition hover:bg-gold/10"
                >
                  See how it works
                </a>
              </div>
            </div>

            {/* Window mock */}
            <div className="animate-tab-in mx-auto mt-16 max-w-3xl">
              <div className="glow-violet relative aspect-[16/9] overflow-hidden rounded-2xl border border-gold/30 bg-card">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, #1a2740 0%, #2b3c63 38%, #c9a84c33 70%, #0a0a12 100%)",
                  }}
                />
                <div
                  className="absolute left-1/2 top-[58%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, color-mix(in oklab, var(--gold) 90%, white) 0%, color-mix(in oklab, var(--gold) 60%, transparent) 45%, transparent 70%)",
                  }}
                />
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-1">
                  <span className="border-r-2 border-gold/30" />
                </div>
                <div className="absolute bottom-3 left-4 text-xs font-medium text-foreground/80">
                  ∞ Live · Remote feed
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-t border-gold/10 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <header className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gold">
                How it works
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Three steps from blank wall to a window on the world.
              </p>
            </header>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="rounded-xl border border-gold/15 bg-card p-6"
                >
                  <span className="text-3xl font-bold text-violet">{s.n}</span>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gold/10 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <header className="text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gold">
                Designed to feel real
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything you need to make a wall disappear.
              </p>
            </header>
            <div className="mt-12 grid gap-6 sm:grid-cols-2">
              {FEATURES.map((f) => (
                <article
                  key={f.title}
                  className="flex gap-4 rounded-xl border border-gold/15 bg-card p-6"
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-xl ${
                      f.accent === "gold"
                        ? "bg-gold/15 text-gold"
                        : "bg-violet/15 text-violet"
                    }`}
                  >
                    {f.icon}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {f.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-gold/10 py-24">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <div
              className="glow-gold rounded-2xl border border-gold/30 bg-card px-6 py-14 sm:px-12"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in oklab, var(--gold) 8%, var(--card)) 0%, var(--card) 100%)",
              }}
            >
              <span className="text-4xl leading-none text-gold">∞</span>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-gold sm:text-4xl">
                Step into anywhere
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Pick a location, map your walls, and let the view follow you.
                Your next window is one click away.
              </p>
              <Link
                to="/"
                className="mt-8 inline-block rounded-lg bg-gold px-7 py-3 text-sm font-semibold text-[#0a0a12] transition hover:bg-gold/90"
              >
                Launch Infinity Window
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gold/15 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-1.5 text-sm font-bold text-gold">
            <span className="text-xl leading-none">∞</span>
            <span>Infinity Window</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Virtual window system · Concept after US20100271394A1
          </p>
          <Link
            to="/"
            className="text-xs font-medium text-violet transition hover:text-gold"
          >
            Launch App →
          </Link>
        </div>
      </footer>
    </div>
  );
}
