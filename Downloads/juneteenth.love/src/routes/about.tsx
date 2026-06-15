import { createFileRoute, Link } from "@tanstack/react-router";
import ownerPortrait from "@/assets/domenick-arlon-hall.jpg.asset.json";
import { SiteNav } from "@/components/SiteNav";

const TITLE = "About Domenick Arlon Hall — The Voice Behind Juneteenth.Love";
const DESC =
  "The owner and author of Juneteenth.Love — a Black American who grew up across Long Beach, Inglewood, Compton, Watts, Chicago and beyond, mentoring brothers and fathers toward education, unity, and shared purpose.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:image", content: ownerPortrait.url },
      { name: "twitter:image", content: ownerPortrait.url },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <SiteNav />
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
          The Voice Behind This Tribute
        </span>
        <h1 className="font-serif text-4xl md:text-5xl font-medium mb-3 leading-tight text-balance">
          About <span className="italic text-gold">Domenick Arlon Hall</span>
        </h1>
        <div className="flex items-center gap-4 mb-10">
          <span className="h-px w-12 bg-gold/60" />
          <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/50">
            Owner · Author · Creator
          </span>
        </div>

        <figure className="mb-12 relative w-48 sm:w-56 md:w-64">
          <div className="absolute -top-3 -left-3 w-full h-full border border-gold/40 rounded-sm" />
          <img
            src={ownerPortrait.url}
            alt="Portrait of Domenick Arlon Hall"
            width={512}
            height={640}
            loading="lazy"
            className="relative z-10 w-full aspect-[4/5] object-cover rounded-sm ring-1 ring-white/10 grayscale-[20%]"
          />
          <div className="absolute -bottom-6 -right-6 size-32 bg-gold/15 blur-2xl pointer-events-none" />
        </figure>

        <p className="font-serif text-2xl md:text-3xl leading-snug text-foreground/90 mb-10 text-pretty">
          <span className="float-left font-serif text-7xl md:text-8xl leading-none mr-3 mt-1 text-gold">
            D
          </span>
          omenick Arlon Hall is the owner and author of this tribute — a Black
          American whose life and work give these pages their conviction.
        </p>

        <div className="space-y-6 text-foreground/80 text-lg leading-relaxed text-pretty">
          <p>
            He grew up Black across a country of neighborhoods — Long Beach,
            Inglewood, Compton, Watts, Chicago, and a dozen places in between.
            Each street taught him something different about struggle, about
            brotherhood, and about the cost of surviving systems that were
            never built with him in mind.
          </p>
          <p>
            Education was a doorway. Earning his way through on scholarship, he
            turned around and held that door open for others — mentoring
            brothers and fathers, investing in the next generation because of
            what he has seen, and because the future depends on who shows up
            for it.
          </p>
          <p>
            He has lived the part of America that doesn&apos;t make the
            speeches. Cops have harassed him from Long Beach all the way down
            to Mobile, Alabama — different zip codes, same script, same fear
            in the rearview. It is hard to live this way. He doesn&apos;t want
            a fight. He wants peace, and he wants the people who wear the
            badge to do the job they were sworn to do — honestly, evenly,
            without bias.
          </p>
          <p>
            His family draws a map across America: California, Ohio, Texas,
            New York, Pennsylvania, Wisconsin, Illinois. That map mirrors the
            African American journey itself — a people rooted everywhere,
            carrying the same hope into every state they call home.
          </p>
          <p>
            His message is plain. Other countries find ways to move as one.
            America has built separate categories for everything, and lets law
            and bias judge people before they have spoken. He refuses that.
            The work is to learn, to remember, to stand together — and to get
            it done.
          </p>
        </div>

        <figure className="mt-14 border-l-2 border-gold/60 pl-6">
          <blockquote className="font-serif italic text-xl md:text-2xl text-foreground leading-relaxed text-pretty">
            &ldquo;Why can other countries move their people as one, but not
            Americans? Because we built separate categories for everything.
            Let&apos;s get it done — together.&rdquo;
          </blockquote>
          <figcaption className="mt-4 text-[10px] uppercase tracking-[0.32em] text-gold">
            — Domenick Arlon Hall
          </figcaption>
        </figure>

        <div className="mt-14 flex flex-wrap gap-4">
          <Link
            to="/contact"
            className="bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm tracking-[0.18em] uppercase hover:-translate-y-0.5 transition-transform"
          >
            Send him a message
          </Link>
          <Link
            to="/stories"
            className="px-7 py-3 rounded-sm font-medium text-sm tracking-[0.18em] uppercase ring-1 ring-gold/40 hover:ring-gold text-foreground/80 hover:text-foreground"
          >
            Share your story
          </Link>
        </div>
      </section>
    </main>
  );
}
