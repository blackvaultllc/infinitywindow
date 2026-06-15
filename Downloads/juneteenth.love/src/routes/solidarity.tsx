import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

const TITLE = "One Freedom, Many Peoples — Solidarity Across Cultures";
const DESC =
  "Juneteenth is, first and always, an African American holiday — and an invitation to stand beside every people still reaching for freedom.";

export const Route = createFileRoute("/solidarity")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "/solidarity" }],
  }),
  component: SolidarityPage,
});

function SolidarityPage() {
  return (
    <main className="bg-background text-foreground font-sans">
      <SiteNav />
      <article className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
            One Freedom, Many Peoples
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-medium mb-10 leading-tight text-balance">
            Juneteenth belongs to{" "}
            <span className="italic text-gold">every people</span> still reaching for freedom
          </h1>

          <div className="space-y-6 text-foreground/80 text-lg leading-relaxed text-pretty">
            <p>
              Juneteenth is, first and always, an African American holiday — the
              marker of our freedom, our resilience, and our cost. That truth
              doesn&apos;t shrink when it&apos;s shared. It grows.
            </p>
            <p>
              Around the world there are peoples still walking the same road:
              Indigenous nations defending land and language; immigrants and
              refugees crossing borders in search of safety; workers organizing
              for dignity; women, queer and trans folks pushing against laws
              designed to erase them; Palestinians, Haitians, Sudanese, Uyghurs,
              and countless others living under occupation, displacement, or
              fear.
            </p>
            <p>
              We invite them to learn the meaning of Juneteenth — not to replace
              their story, but to stand beside ours. Freedom is not a finite
              resource. When one people gets free, the rest of us get closer.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/history"
              className="block bg-card/40 ring-1 ring-gold/30 hover:ring-gold/70 transition-all rounded-sm p-6"
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
              className="block bg-card/40 ring-1 ring-gold/30 hover:ring-gold/70 transition-all rounded-sm p-6"
            >
              <span className="block text-gold text-[10px] uppercase tracking-[0.32em] mb-2">
                Speak
              </span>
              <span className="font-serif text-xl">Add your story →</span>
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
