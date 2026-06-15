import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

const TITLE = "Why June 19, 1865 Matters — The Origin of Juneteenth";
const DESC =
  "The full origin story of Juneteenth: General Order No. 3, Galveston, Texas, and the long road from the Emancipation Proclamation to actual freedom.";

export const Route = createFileRoute("/origins")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
    links: [{ rel: "canonical", href: "/origins" }],
  }),
  component: OriginsPage,
});

function OriginsPage() {
  return (
    <main className="bg-background text-foreground font-sans">
      <SiteNav />
      <article className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
            The Origin Story
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-medium mb-3 leading-tight text-balance">
            Why June 19, 1865 <span className="italic text-gold">matters</span>
          </h1>
          <div className="flex items-center gap-4 mb-12">
            <span className="h-px w-12 bg-gold/60" />
            <span className="text-[10px] uppercase tracking-[0.4em] text-foreground/50">
              Galveston · Texas · General Order No. 3
            </span>
          </div>

          <div className="space-y-6 text-foreground/80 text-lg leading-relaxed text-pretty">
            <p>
              President Abraham Lincoln signed the Emancipation Proclamation on
              January 1, 1863. On paper, every enslaved person in the rebelling
              Confederate states was &ldquo;forever free.&rdquo; In reality, paper
              does not free anyone — armies do. Where the Union Army had not yet
              reached, slavery continued. Texas, the farthest western edge of the
              Confederacy, was that place. Enslavers from across the South fled
              there with the people they held captive, betting that the war would
              not arrive before they could.
            </p>
            <p>
              On June 19, 1865 — two and a half years after the Proclamation, and
              more than two months after Robert E. Lee surrendered at Appomattox —
              Union Major General Gordon Granger landed at Galveston, Texas with
              about 2,000 federal troops. From a balcony in the city, he read
              aloud <span className="text-gold">General Order No. 3</span>:
            </p>
            <blockquote className="font-serif italic text-xl md:text-2xl text-foreground/90 border-l-2 border-gold/60 pl-6 leading-relaxed">
              &ldquo;The people of Texas are informed that, in accordance with a
              proclamation from the Executive of the United States, all slaves
              are free.&rdquo;
            </blockquote>
            <p>
              With those words, the last roughly 250,000 enslaved African
              Americans in the United States learned — for the first time — that
              they were no longer property. Some walked off the plantation that
              day. Others were forced to stay through the harvest. Many were
              never told at all by the people who held them. Freedom, even when
              declared, had to be reached for, fought for, and protected.
            </p>
            <p>
              That is why we mark June 19 — not because the country delivered
              freedom on time, but because it did not. Juneteenth is the record
              of a delay: the receipt that proves emancipation in America was
              always partial, always uneven, always slow to arrive for the
              people it most belonged to. To honor it is to refuse the lie that
              justice in this country has ever been automatic.
            </p>
            <p>
              One hundred and fifty-six years later, on June 17, 2021, Juneteenth
              became a federal holiday. Recognition is a step. It is not the
              destination.
            </p>
          </div>

          <div className="mt-14 flex flex-wrap gap-3">
            <Link
              to="/history"
              className="bg-gold text-primary-foreground px-6 py-3 rounded-sm font-medium text-xs tracking-[0.22em] uppercase hover:-translate-y-0.5 transition-transform"
            >
              Continue: Black history timeline →
            </Link>
            <Link
              to="/solidarity"
              className="px-6 py-3 rounded-sm font-medium text-xs tracking-[0.22em] uppercase ring-1 ring-gold/40 hover:ring-gold text-foreground/80 hover:text-foreground transition"
            >
              One Freedom, Many Peoples
            </Link>
          </div>
        </div>
      </article>
    </main>
  );
}
