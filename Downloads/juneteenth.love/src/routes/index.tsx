import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart } from "lucide-react";
import heroStone from "@/assets/hero-stone.jpg";
import portraitSamuel from "@/assets/hero-samuel.jpg";
import portraitElara from "@/assets/hero-elara.jpg";
import portraitMarcus from "@/assets/hero-marcus.jpg";
import portraitDella from "@/assets/hero-della.jpg";
import portraitJoseph from "@/assets/hero-joseph.jpg";
import portraitRuth from "@/assets/hero-ruth.jpg";
import handsImg from "@/assets/hero-hands.jpg";
import ownerPortrait from "@/assets/domenick-arlon-hall.jpg.asset.json";
import freedomDayBanner from "@/assets/juneteenth-freedom-day.jpg.asset.json";
import { SiteNav } from "@/components/SiteNav";
import { DONATE_URL } from "@/lib/donate";


const PAGE_TITLE =
  "Juneteenth 2026 — One People, One Future | Black History, Freedom & Community Stories";
const PAGE_DESCRIPTION =
  "A Juneteenth tribute honoring African American resilience since June 19, 1865 — Black history, lives lost to injustice, community stories, and solidarity with every people still seeking freedom. Counting down to Juneteenth 2026.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      {
        name: "keywords",
        content:
          "Juneteenth, Juneteenth 2026, June 19 1865, Galveston Texas, General Order No 3, Black history, African American history, Freedom Day, Emancipation Proclamation, Black lives lost, police violence, racial justice, civil rights, unity, solidarity, immigrant freedom, community stories, Black blog",
      },
      { name: "author", content: "Domenick Arlon Hall" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/" },
      { property: "og:image", content: heroStone },
      { property: "og:image:alt", content: "Warm candlelight on dark stone — a Juneteenth tribute" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: heroStone },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Juneteenth — Freedom Day",
          startDate: "2026-06-19",
          endDate: "2026-06-19",
          eventStatus: "https://schema.org/EventScheduled",
          eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
          description:
            "Juneteenth commemorates June 19, 1865, the day enslaved African Americans in Galveston, Texas learned of their freedom. A day of remembrance, celebration, and recommitment to justice.",
          image: [heroStone],
          location: {
            "@type": "Country",
            name: "United States",
          },
          organizer: {
            "@type": "Organization",
            name: "Juneteenth Tribute",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Juneteenth — One People, One Future",
          description: PAGE_DESCRIPTION,
          image: [heroStone],
          datePublished: "2026-06-01",
          author: { "@type": "Person", name: "Domenick Arlon Hall" },
          publisher: { "@type": "Organization", name: "Juneteenth Tribute" },
          about: [
            "Juneteenth",
            "African American history",
            "Black history",
            "Racial justice",
            "Civil rights",
          ],
          keywords:
            "Juneteenth, Black history, African American history, emancipation, racial justice, police violence remembrance, unity",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: "Domenick Arlon Hall",
          description:
            "Owner and author of this Juneteenth tribute. A Black American who grew up across Long Beach, Inglewood, Compton, Watts, Chicago and beyond, and who mentors brothers and fathers toward education, unity, and shared purpose.",
          knowsAbout: [
            "Juneteenth",
            "Black history",
            "African American history",
            "Civil rights",
            "Mentorship",
            "Community building",
          ],
          nationality: "American",
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "/" },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

const honorees = [
  {
    name: "Samuel Thorne",
    role: "Community Builder",
    tribute:
      "For forty years of planting neighborhood gardens that fed the body and the soul.",
    img: portraitSamuel,
  },
  {
    name: "Elara Vance",
    role: "Local Organizer",
    tribute:
      "Organizing voices for educational equity so every child has a path to rise.",
    img: portraitElara,
  },
  {
    name: "Marcus Reed",
    role: "Devoted Parent",
    tribute:
      "Modeling resilience and tenderness for the next generation, one quiet day at a time.",
    img: portraitMarcus,
  },
  {
    name: "Della Hayes",
    role: "Night-Shift Nurse",
    tribute:
      "Three decades of holding hands at bedsides, carrying strangers through the dark.",
    img: portraitDella,
  },
  {
    name: "Joseph Mwangi",
    role: "Union Steward",
    tribute:
      "Walking the line for dignity in the workplace when the cost of speaking up was high.",
    img: portraitJoseph,
  },
  {
    name: "Ruth Calloway",
    role: "Church Mother",
    tribute:
      "Sunday plates, school clothes, and a roof for every child who had nowhere else to go.",
    img: portraitRuth,
  },
];

const remembranceLabels = [
  "The Unnamed",
  "The Lost",
  "The Seekers",
  "The Pioneers",
  "The Silent",
  "The Brave",
];

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { threshold: 0.15 },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 1s cubic-bezier(0.22,0.61,0.36,1) ${delay}ms, transform 1s cubic-bezier(0.22,0.61,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function useDaysUntilNextJuneteenth() {
  return useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    let next = new Date(year, 5, 19); // June 19
    if (now > next) next = new Date(year + 1, 5, 19);
    const days = Math.ceil((next.getTime() - now.getTime()) / 86_400_000);
    return { days, year: next.getFullYear() };
  }, []);
}

function Index() {
  const { days, year } = useDaysUntilNextJuneteenth();
  return (
    <main className="bg-background text-foreground font-sans">
      <SiteNav />

      {/* Countdown / SEO push banner */}
      <div
        role="region"
        aria-label="Juneteenth countdown"
        className="bg-gold/10 border-b border-gold/30 text-center py-3 px-6 text-xs sm:text-sm tracking-[0.18em] uppercase text-foreground/80"
      >
        <span className="text-gold font-medium">{days} {days === 1 ? "day" : "days"}</span>{" "}
        until Juneteenth {year} ·{" "}
        <Link to="/stories" className="underline-offset-4 hover:underline hover:text-gold">
          Share your story
        </Link>{" "}
        ·{" "}
        <Link to="/history" className="underline-offset-4 hover:underline hover:text-gold">
          Black history timeline
        </Link>{" "}
        ·{" "}
        <a
          href="https://infinitycomics.xyz"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-4 hover:underline hover:text-gold"
        >
          Captain Infinity #1 drops Juneteenth →
        </a>
      </div>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroStone}
            alt="Warm candlelight on dark stone — a Juneteenth tribute to African American resilience"
            width={1920}
            height={1088}
            className="w-full h-full object-cover opacity-50"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="rise-in">
            <span className="block text-gold font-medium tracking-[0.32em] uppercase text-xs sm:text-sm mb-8">
              Established · June 19, 1865 · Freedom Day
            </span>
          </div>
          <h1
            className="rise-in font-serif text-5xl md:text-7xl lg:text-8xl font-medium leading-[0.95] text-balance mb-8"
            style={{ animationDelay: "120ms" }}
          >
            Juneteenth —<br />
            <span className="italic text-gold">One People, One Future</span>
          </h1>
          <p
            className="rise-in text-muted-foreground text-lg md:text-xl max-w-[52ch] text-pretty leading-relaxed mb-10"
            style={{ animationDelay: "240ms" }}
          >
            A tribute to African American freedom — to the resilience born of
            June 19, 1865, the dignity of remembrance, and the shared journey
            toward a unified future.
          </p>
          <div
            className="rise-in flex flex-wrap gap-4"
            style={{ animationDelay: "360ms" }}
          >
            <a
              href="#honor"
              className="bg-gold text-primary-foreground px-7 py-3.5 rounded-sm font-medium text-sm tracking-wide transition-transform hover:-translate-y-0.5 ring-1 ring-gold/40"
            >
              Begin the Journey
            </a>
            <a
              href="#remembrance"
              className="px-7 py-3.5 rounded-sm font-medium text-sm tracking-wide text-foreground/80 ring-1 ring-white/10 hover:ring-gold/40 hover:text-foreground transition"
            >
              In Remembrance
            </a>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-3">
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-gold/50 to-transparent" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/40">
            Scroll
          </span>
        </div>
      </section>

      {/* Freedom Day Banner */}
      <section
        aria-label="Juneteenth Freedom Day"
        className="py-20 px-6 border-t border-border bg-background"
      >
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <figure className="relative overflow-hidden rounded-sm border border-gold/20 shadow-[0_30px_80px_-40px_rgba(212,175,55,0.35)]">
              <div className="absolute -inset-8 bg-gold/10 blur-3xl -z-10" aria-hidden />
              <img
                src={freedomDayBanner.url}
                alt="Juneteenth Freedom Day — the red, black, and green Pan-African flag billowing against a dark field"
                className="w-full h-auto block"
                loading="lazy"
                decoding="async"
                width={1080}
                height={675}
              />
              <figcaption className="sr-only">
                Juneteenth — Freedom Day. To understand the significance of
                Juneteenth, we must be courageous in facing the truth about
                slavery in America, the anti-Black racism that it spawned and
                perpetuated, and the resulting racial and economic injustice
                that persist over 150 years later.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* Why We Remember Juneteenth */}
      <section
        id="why"
        aria-labelledby="why-heading"
        className="py-24 px-6 border-t border-border"
      >
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              Why We Remember
            </span>
            <h2
              id="why-heading"
              className="font-serif text-3xl md:text-5xl font-medium mb-8 leading-tight text-balance"
            >
              Juneteenth — the longest road to freedom
            </h2>
            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed text-pretty">
              <p>
                On June 19, 1865 — more than two years after the Emancipation
                Proclamation — Union troops reached Galveston, Texas, and the
                last enslaved African Americans were finally told they were
                free. Juneteenth marks that delayed dawn, and the truth that
                freedom delayed is freedom denied.
              </p>
              <p>
                Black history in America is a history of resilience: a people
                who built, taught, organized, marched, and loved across
                generations of injustice. Juneteenth honors emancipation, civil
                rights, and the everyday courage that carried a community
                forward when systems were built to hold it back.
              </p>
              <p>
                Today, the work continues. Honoring Juneteenth means
                remembering the lives lost to racial violence and to systems
                that failed them, recognizing the burden still carried, and
                recommitting to a future where freedom belongs to everyone.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Wall of Honor */}
      <section id="honor" className="py-28 px-6 bg-card/40 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div className="max-w-[56ch]">
              <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
                Chapter One
              </span>
              <h2 className="font-serif text-4xl md:text-5xl font-medium mb-4 text-balance leading-tight">
                The Wall of Honor
              </h2>
              <p className="text-muted-foreground text-pretty text-lg leading-relaxed">
                Celebrating the everyday heroes — workers, parents, organizers —
                whose persistence and love built the foundations beneath us.
              </p>
            </div>
            <div className="h-px md:h-16 md:w-px w-24 bg-gold/30" />
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {honorees.map((h, i) => (
              <Reveal key={h.name + i} delay={(i % 3) * 120}>
                <article className="group bg-background ring-1 ring-white/5 p-1 rounded-sm overflow-hidden h-full transition-all duration-500 hover:ring-gold/30">
                  <div className="overflow-hidden">
                    <img
                      src={h.img}
                      alt={`Portrait of ${h.name}, ${h.role}`}
                      width={800}
                      height={1024}
                      loading="lazy"
                      className="w-full aspect-[4/5] object-cover grayscale opacity-80 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-[1.03] transition-all duration-700"
                    />
                  </div>
                  <div className="p-7">
                    <h3 className="font-serif text-2xl font-medium mb-1">
                      {h.name}
                    </h3>
                    <p className="text-gold text-[10px] uppercase tracking-[0.32em] mb-4">
                      {h.role}
                    </p>
                    <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                      {h.tribute}
                    </p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Remembrance */}
      <section id="remembrance" className="relative py-40 px-6 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 w-[640px] h-[640px] bg-ember/20 rounded-full blur-[140px] candle-glow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 w-[240px] h-[240px] -translate-x-1/2 -translate-y-1/2 bg-gold/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="mx-auto mb-10 relative w-3 h-3">
              <div className="absolute inset-0 bg-gold rounded-full ember-pulse" />
              <div className="absolute -inset-3 bg-gold/30 rounded-full blur-md ember-pulse" />
            </div>
            <span className="block text-ember text-xs uppercase tracking-[0.32em] mb-6">
              Chapter Two
            </span>
            <h2 className="font-serif text-4xl md:text-6xl font-medium mb-12 text-balance leading-tight">
              In Silent Remembrance
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <p className="text-foreground text-xl md:text-2xl italic font-serif leading-relaxed mb-10 text-balance">
              &ldquo;The shadows of the past are long, but they do not define
              our reach.&rdquo;
            </p>
            <div className="h-px w-24 bg-ember/60 mx-auto mb-12" />
          </Reveal>

          <Reveal delay={300}>
            <ul
              aria-label="Those we remember"
              className="grid grid-cols-2 md:grid-cols-3 gap-y-10 gap-x-4 text-muted-foreground text-xs md:text-sm font-medium tracking-[0.32em] uppercase mb-16 list-none p-0"
            >
              {remembranceLabels.map((label) => (
                <li
                  key={label}
                  className="hover:text-gold transition-colors"
                >
                  {label}
                </li>
              ))}
            </ul>
            <div className="space-y-6 max-w-[62ch] mx-auto text-pretty">
              <p className="text-muted-foreground text-base leading-relaxed">
                We honor those whose names were lost to the wind, whose lives
                were cut short by systems that failed them, and whose quiet
                sacrifices paved the difficult road toward the light we now
                carry forward.
              </p>
              <p className="text-muted-foreground text-base leading-relaxed">
                We remember Black lives taken by police violence and by an
                unequal hand of justice — names that became a call for
                accountability, and a country&apos;s reckoning that is still
                unfinished. We say their memory plainly, with dignity, and we
                refuse the silence that protects injustice.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Moving Forward Together */}
      <section
        id="unity"
        className="py-32 px-6 relative overflow-hidden border-t border-border"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--gold-deep) 8%, transparent), transparent 70%)",
        }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              Chapter Three
            </span>
            <h2 className="font-serif text-4xl md:text-6xl font-medium mb-8 leading-[1.05] text-balance">
              Moving Forward <span className="italic text-gold">Together</span>
            </h2>
            <p className="text-foreground/80 text-lg leading-relaxed mb-10 max-w-[52ch] text-pretty">
              Unity is not the absence of difference — it is the presence of
              shared purpose. As we look toward the horizon, we carry the legacy
              of our ancestors into a future built on mutual respect and radical
              hope.
            </p>
            <ul className="flex flex-col gap-5">
              {[
                { dot: "bg-gold", text: "Fostering dialogue across generations" },
                { dot: "bg-ember", text: "Upholding the promise of true freedom" },
                { dot: "bg-gold", text: "Building bridges of empathy and action" },
              ].map((item) => (
                <li key={item.text} className="flex items-start gap-4 group">
                  <span
                    className={`size-2 rounded-full ${item.dot} mt-2 shrink-0 group-hover:scale-150 transition-transform`}
                  />
                  <p className="text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.text}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={200}>
            <div className="relative">
              <div className="absolute -top-4 -left-4 w-full h-full border border-gold/30 rounded-sm" />
              <img
                src={handsImg}
                alt="Many hands joined together in a circle, lit by warm candlelight"
                width={1216}
                height={1216}
                loading="lazy"
                className="relative z-10 w-full aspect-square object-cover rounded-sm ring-1 ring-white/5"
              />
              <div className="absolute -bottom-8 -right-8 size-48 bg-gold/15 blur-3xl pointer-events-none" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* About teaser — full bio lives at /about */}
      <section
        id="about-owner"
        aria-labelledby="about-owner-heading"
        className="py-24 px-6 border-t border-border bg-card/30"
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[auto_1fr] gap-10 items-center">
          <Reveal>
            <figure className="relative w-40 sm:w-48">
              <div className="absolute -top-3 -left-3 w-full h-full border border-gold/40 rounded-sm" />
              <img
                src={ownerPortrait.url}
                alt="Portrait of Domenick Arlon Hall"
                width={384}
                height={480}
                loading="lazy"
                className="relative z-10 w-full aspect-[4/5] object-cover rounded-sm ring-1 ring-white/10"
              />
            </figure>
          </Reveal>
          <Reveal delay={120}>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-3">
              The Voice Behind This Tribute
            </span>
            <h2
              id="about-owner-heading"
              className="font-serif text-3xl md:text-4xl font-medium mb-4 leading-tight text-balance"
            >
              Built by <span className="italic text-gold">Domenick Arlon Hall</span>
            </h2>
            <p className="text-foreground/80 leading-relaxed mb-6 text-pretty">
              A Black American who grew up across Long Beach, Inglewood,
              Compton, Watts, Chicago and beyond — mentoring brothers and
              fathers, refusing the lie that justice in this country has ever
              been automatic.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/about"
                className="bg-gold text-primary-foreground px-6 py-2.5 rounded-sm font-medium text-xs tracking-[0.18em] uppercase hover:-translate-y-0.5 transition-transform"
              >
                Read his story →
              </Link>
              <Link
                to="/contact"
                className="px-6 py-2.5 rounded-sm font-medium text-xs tracking-[0.18em] uppercase ring-1 ring-gold/40 hover:ring-gold text-foreground/80 hover:text-foreground"
              >
                Send a message
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Captain Infinity — creator's comic universe, launching Juneteenth */}
      <section
        id="captain-infinity"
        aria-labelledby="captain-infinity-heading"
        className="py-24 px-6 border-t border-gold/30 relative overflow-hidden"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--gold-deep) 14%, transparent), transparent 70%)",
        }}
      >
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <Reveal>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              Also from Domenick · Dropping Juneteenth 2026
            </span>
            <h2
              id="captain-infinity-heading"
              className="font-serif text-3xl md:text-5xl font-medium mb-5 leading-tight text-balance"
            >
              Captain Infinity — <span className="italic text-gold">Issue #1</span> launches on Juneteenth.
            </h2>
            <div className="space-y-5 text-foreground/80 text-base sm:text-lg leading-relaxed text-pretty mb-8 max-w-[62ch]">
              <p>
                The same voice behind this tribute is releasing a comic line
                from his own perspective — Black, fatherly, mythic. Captain
                Infinity is an origin story about the calling that changes
                everything: <em>before the legend, before the suit, there was a choice.</em>
              </p>
              <p>
                Beyond the comics, the Infinity world has trading cards you
                can actually play with, games that quietly teach math and
                real-world reasoning, a coding hub for kids, and tools built
                so families learn together. None of it is filler — it's a
                whole universe.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <a
                href="https://infinitycomics.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-xs tracking-[0.22em] uppercase hover:-translate-y-0.5 transition-transform ring-1 ring-gold/40"
              >
                Visit Infinity Comics →
              </a>
              <a
                href="https://infinitycomics.xyz/comics"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-sm font-medium text-xs tracking-[0.22em] uppercase ring-1 ring-gold/40 hover:ring-gold text-foreground/80 hover:text-foreground transition"
              >
                Read Issue #1
              </a>
              <a
                href="https://infinitycomics.xyz/cards"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3 rounded-sm font-medium text-xs tracking-[0.22em] uppercase ring-1 ring-gold/40 hover:ring-gold text-foreground/80 hover:text-foreground transition"
              >
                Collect the Cards
              </a>
            </div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40 mt-5">
              Independent · Owned at the source · infinitycomics.xyz
            </p>
          </Reveal>
        </div>
      </section>


      {/* Why June 19, 1865 — In Depth */}
      <section
        id="origins"
        aria-labelledby="origins-heading"
        className="py-28 px-6 border-t border-border"
      >
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              The Origin Story
            </span>
            <h2
              id="origins-heading"
              className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight text-balance"
            >
              Why June 19, 1865 <span className="italic text-gold">matters</span>
            </h2>
            <div className="flex items-center gap-4 mb-10">
              <span className="h-px w-12 bg-gold/60" />
              <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/50">
                Galveston · Texas · General Order No. 3
              </span>
            </div>

            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed text-pretty">
              <p>
                President Abraham Lincoln signed the Emancipation Proclamation
                on January 1, 1863. On paper, every enslaved person in the
                rebelling Confederate states was &ldquo;forever free.&rdquo;
                In reality, paper does not free anyone — armies do. Where the
                Union Army had not yet reached, slavery continued. Texas, the
                farthest western edge of the Confederacy, was that place.
                Enslavers from across the South fled there with the people
                they held captive, betting that the war would not arrive
                before they could.
              </p>
              <p>
                On June 19, 1865 — two and a half years after the
                Proclamation, and more than two months after Robert E. Lee
                surrendered at Appomattox — Union Major General Gordon
                Granger landed at Galveston, Texas with about 2,000 federal
                troops. From a balcony in the city, he read aloud{" "}
                <span className="text-gold">General Order No. 3</span>:
              </p>
              <blockquote className="font-serif italic text-xl md:text-2xl text-foreground/90 border-l-2 border-gold/60 pl-6 leading-relaxed">
                &ldquo;The people of Texas are informed that, in accordance
                with a proclamation from the Executive of the United States,
                all slaves are free.&rdquo;
              </blockquote>
              <p>
                With those words, the last roughly 250,000 enslaved African
                Americans in the United States learned — for the first time —
                that they were no longer property. Some walked off the
                plantation that day. Others were forced to stay through the
                harvest. Many were never told at all by the people who held
                them. Freedom, even when declared, had to be reached for,
                fought for, and protected.
              </p>
              <p>
                That is why we mark June 19 — not because the country
                delivered freedom on time, but because it did not. Juneteenth
                is the record of a delay: the receipt that proves emancipation
                in America was always partial, always uneven, always slow to
                arrive for the people it most belonged to. To honor it is to
                refuse the lie that justice in this country has ever been
                automatic.
              </p>
              <p>
                One hundred and fifty-six years later, on June 17, 2021,
                Juneteenth became a federal holiday. Recognition is a step.
                It is not the destination.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Solidarity Across Cultures */}
      <section
        id="solidarity"
        aria-labelledby="solidarity-heading"
        className="py-28 px-6 border-t border-border bg-card/30"
      >
        <div className="max-w-3xl mx-auto">
          <Reveal>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              One Freedom, Many Peoples
            </span>
            <h2
              id="solidarity-heading"
              className="font-serif text-4xl md:text-5xl font-medium mb-8 leading-tight text-balance"
            >
              Juneteenth belongs to <span className="italic text-gold">every people</span> still reaching for freedom
            </h2>
            <div className="space-y-6 text-foreground/80 text-lg leading-relaxed text-pretty">
              <p>
                Juneteenth is, first and always, an African American holiday —
                the marker of our freedom, our resilience, and our cost. That
                truth doesn&apos;t shrink when it&apos;s shared. It grows.
              </p>
              <p>
                Around the world there are peoples still walking the same
                road: Indigenous nations defending land and language;
                immigrants and refugees crossing borders in search of safety;
                workers organizing for dignity; women, queer and trans folks
                pushing against laws designed to erase them; Palestinians,
                Haitians, Sudanese, Uyghurs, and countless others living under
                occupation, displacement, or fear.
              </p>
              <p>
                We invite them to learn the meaning of Juneteenth — not to
                replace their story, but to stand beside ours. Freedom is not
                a finite resource. When one people gets free, the rest of us
                get closer.
              </p>
            </div>

            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                to="/history"
                className="block bg-background ring-1 ring-gold/30 hover:ring-gold/70 transition-all rounded-sm p-6"
              >
                <span className="block text-gold text-[10px] uppercase tracking-[0.32em] mb-2">
                  Learn
                </span>
                <span className="font-serif text-xl">
                  The Black History Timeline →
                </span>
              </Link>
              <Link
                to="/stories"
                className="block bg-background ring-1 ring-gold/30 hover:ring-gold/70 transition-all rounded-sm p-6"
              >
                <span className="block text-gold text-[10px] uppercase tracking-[0.32em] mb-2">
                  Speak
                </span>
                <span className="font-serif text-xl">
                  Add your story →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Support the work — strictly optional, NOT a Juneteenth fundraiser */}
      <section
        id="support"
        aria-labelledby="support-heading"
        className="py-24 px-6 border-t border-border"
      >
        <div className="max-w-2xl mx-auto text-center">
          <Reveal>
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              If You're Moved To
            </span>
            <h2
              id="support-heading"
              className="font-serif text-3xl md:text-5xl font-medium mb-6 leading-tight text-balance"
            >
              Support the creator, <span className="italic text-gold">not the holiday.</span>
            </h2>
            <div className="space-y-5 text-foreground/80 text-base sm:text-lg leading-relaxed text-pretty mb-9">
              <p>
                Juneteenth is not for sale. This site is not a Juneteenth
                organization and is not raising money in Juneteenth's name.
              </p>
              <p>
                If you respect this tribute and want to send something toward
                the person who built it — toward the other things he makes:
                kids' games, AI tools meant to help everyday people — that
                support is received with gratitude and goes directly to him.
              </p>
            </div>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-gold text-primary-foreground px-8 py-4 rounded-sm font-medium text-sm tracking-[0.18em] uppercase hover:-translate-y-0.5 transition-transform ring-1 ring-gold/40"
            >
              <Heart size={14} /> Donate to the Creator
            </a>
            <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40 mt-5">
              Secure checkout via Stripe · 100% optional
            </p>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-border bg-card/30">
        <div className="max-w-7xl mx-auto">

          <Reveal>
            <div className="text-center mb-14">
              <p className="font-serif italic text-5xl md:text-6xl font-medium mb-3">
                June 19, 1865
              </p>
              <p className="text-gold text-xs uppercase tracking-[0.4em]">
                A Legacy of Resilience
              </p>
            </div>

            <div className="flex justify-center mb-14">
              <a
                href="#honor"
                className="group inline-flex items-center gap-3 bg-gold text-primary-foreground px-10 py-4 rounded-sm font-medium text-sm tracking-[0.24em] uppercase hover:bg-foreground transition-colors duration-500"
              >
                Learn. Remember. Unite.
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
            </div>
          </Reveal>

          <div className="pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-6 text-[10px] uppercase tracking-[0.28em] text-foreground/40">
            <p>© {new Date().getFullYear()} · A Tribute by Domenick Arlon Hall · Learn. Remember. Unite.</p>
            <nav className="flex gap-6 flex-wrap justify-center">
              <Link to="/history" className="hover:text-gold transition-colors">
                Black History
              </Link>
              <Link to="/stories" className="hover:text-gold transition-colors">
                Stories
              </Link>
              <Link to="/origins" className="hover:text-gold transition-colors">
                June 19, 1865
              </Link>
              <Link to="/solidarity" className="hover:text-gold transition-colors">
                Solidarity
              </Link>
              <a href="#about-owner" className="hover:text-gold transition-colors">
                About
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </main>
  );
}
