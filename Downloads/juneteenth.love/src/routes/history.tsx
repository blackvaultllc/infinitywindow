import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      {
        title:
          "Black History Timeline — From Slavery to Civil Rights to Today | Juneteenth.Love",
      },
      {
        name: "description",
        content:
          "A scrolling slideshow of Black history milestones — from the Middle Passage to Emancipation, Reconstruction, Jim Crow, Civil Rights, and the struggle that continues today.",
      },
      {
        name: "keywords",
        content:
          "Black history, African American history, slavery, Emancipation Proclamation, Juneteenth, Reconstruction, Jim Crow, Civil Rights Movement, MLK, Malcolm X, Black Lives Matter, Tulsa massacre, Brown v. Board",
      },
      {
        property: "og:title",
        content: "Black History Timeline | Juneteenth.Love",
      },
      {
        property: "og:description",
        content:
          "A slideshow of Black history milestones — slavery, freedom, struggle, and resilience.",
      },
      { property: "og:url", content: "/history" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "/history" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Black History Timeline — Slavery to Today",
          description:
            "A scrolling timeline of Black American history from the Middle Passage to the present.",
          author: { "@type": "Person", name: "Domenick Arlon Hall" },
          datePublished: "2026-06-01",
          about: ["Black history", "African American history", "Civil Rights"],
        }),
      },
    ],
  }),
  component: HistoryPage,
});

const TIMELINE: { year: string; title: string; body: string }[] = [
  {
    year: "1619",
    title: "Arrival at Point Comfort",
    body: "The first enslaved Africans are brought to the English colony of Virginia, beginning more than two centuries of chattel slavery on American soil.",
  },
  {
    year: "1739",
    title: "Stono Rebellion",
    body: "Enslaved Africans in South Carolina rise up in one of the earliest organized rebellions — a reminder that resistance is as old as bondage itself.",
  },
  {
    year: "1808",
    title: "Transatlantic Slave Trade Banned",
    body: "Congress prohibits the importation of enslaved people. Domestic slavery and the internal slave trade expand violently across the South.",
  },
  {
    year: "1831",
    title: "Nat Turner's Rebellion",
    body: "Turner leads an uprising in Virginia. The brutal backlash hardens slave codes, but the rebellion stays in the memory of every generation that follows.",
  },
  {
    year: "1849",
    title: "Harriet Tubman Escapes",
    body: "Tubman flees slavery in Maryland and returns again and again to lead others to freedom on the Underground Railroad.",
  },
  {
    year: "Jan 1, 1863",
    title: "Emancipation Proclamation",
    body: "Lincoln declares enslaved people in rebelling states 'forever free' — but enforcement depends on the Union Army's reach.",
  },
  {
    year: "June 19, 1865",
    title: "Juneteenth — Freedom Reaches Galveston",
    body: "Two and a half years after the Proclamation, Maj. Gen. Gordon Granger reads General Order No. 3 in Galveston, Texas. The last 250,000 enslaved African Americans learn they are free. Freedom delayed is freedom denied — and that delay is exactly why we remember.",
  },
  {
    year: "1865–1870",
    title: "13th, 14th, and 15th Amendments",
    body: "Slavery is abolished (except as punishment for a crime — a loophole that still echoes). Citizenship and the vote are extended to Black men. Reconstruction begins.",
  },
  {
    year: "1877",
    title: "End of Reconstruction",
    body: "Federal troops withdraw from the South. Black political power is dismantled. Jim Crow laws begin codifying a new system of racial caste.",
  },
  {
    year: "1896",
    title: "Plessy v. Ferguson",
    body: "The Supreme Court enshrines 'separate but equal.' The 'equal' part was always a lie.",
  },
  {
    year: "1921",
    title: "Tulsa Race Massacre",
    body: "A white mob burns Black Wall Street in Greenwood, Oklahoma to the ground. Hundreds killed. Generations of wealth destroyed in a single night.",
  },
  {
    year: "1954",
    title: "Brown v. Board of Education",
    body: "The Supreme Court strikes down school segregation. Implementation will be slow, contested, and incomplete.",
  },
  {
    year: "1955",
    title: "Rosa Parks · Montgomery Bus Boycott",
    body: "Parks refuses to give up her seat. A 26-year-old Martin Luther King Jr. helps organize a 381-day boycott that changes the country.",
  },
  {
    year: "1963",
    title: "March on Washington",
    body: "250,000 people gather. King speaks of a dream still owed to America's children.",
  },
  {
    year: "1964–1965",
    title: "Civil Rights & Voting Rights Acts",
    body: "Landmark legislation outlaws segregation and federal voter suppression. The fight does not end — it just changes shape.",
  },
  {
    year: "1968",
    title: "Dr. King Assassinated",
    body: "King is killed in Memphis. The nation grieves, burns, and keeps going.",
  },
  {
    year: "2008",
    title: "Barack Obama Elected",
    body: "The first Black president of the United States. Symbolic and historic — and not the end of the work.",
  },
  {
    year: "2013–Today",
    title: "Black Lives Matter",
    body: "After the killing of Trayvon Martin, a movement names what has never stopped: Black lives, taken too often, by systems that were supposed to protect them. The names keep coming. So does the demand for accountability.",
  },
  {
    year: "2021",
    title: "Juneteenth Becomes a Federal Holiday",
    body: "156 years after that day in Galveston, the United States formally recognizes it. Recognition is a beginning, not a finish line.",
  },
];

function HistoryPage() {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % TIMELINE.length);
    }, 7000);
    return () => clearInterval(id);
  }, [auto]);

  const current = TIMELINE[index];

  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />

      <section className="px-6 py-16 border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
            A People's History
          </span>
          <h1 className="font-serif text-4xl md:text-6xl font-medium mb-6 leading-tight text-balance">
            Black History — <span className="italic text-gold">the long road</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-[58ch] mx-auto text-pretty leading-relaxed">
            A scrolling slideshow of the moments that shape who we are.
            Start at 1619. Walk forward. Don't look away.
          </p>
        </div>
      </section>

      {/* Slideshow */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative min-h-[340px] md:min-h-[300px] bg-card/40 border border-border rounded-sm p-10 md:p-14 ring-1 ring-gold/10"
            onMouseEnter={() => setAuto(false)}
            onMouseLeave={() => setAuto(true)}
          >
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
              {current.year}
            </span>
            <h2 className="font-serif text-3xl md:text-4xl font-medium mb-5 text-balance leading-tight">
              {current.title}
            </h2>
            <p className="text-foreground/80 text-lg leading-relaxed text-pretty">
              {current.body}
            </p>
          </div>

          <div className="flex items-center justify-between mt-6">
            <button
              onClick={() => {
                setAuto(false);
                setIndex((i) => (i - 1 + TIMELINE.length) % TIMELINE.length);
              }}
              className="text-xs uppercase tracking-[0.28em] text-foreground/60 hover:text-gold transition-colors cursor-pointer"
            >
              ← Previous
            </button>
            <span className="text-xs text-foreground/40">
              {index + 1} / {TIMELINE.length}
            </span>
            <button
              onClick={() => {
                setAuto(false);
                setIndex((i) => (i + 1) % TIMELINE.length);
              }}
              className="text-xs uppercase tracking-[0.28em] text-foreground/60 hover:text-gold transition-colors cursor-pointer"
            >
              Next →
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-1.5 mt-6">
            {TIMELINE.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setAuto(false);
                  setIndex(i);
                }}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  i === index ? "w-6 bg-gold" : "w-1.5 bg-foreground/20 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Full list for SEO */}
      <section className="px-6 py-20 border-t border-border bg-card/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-12 text-center text-balance">
            The full timeline
          </h2>
          <ol className="space-y-10 list-none p-0">
            {TIMELINE.map((t) => (
              <li key={t.year + t.title} className="border-l-2 border-gold/40 pl-6">
                <span className="block text-gold text-[10px] uppercase tracking-[0.32em] mb-2">
                  {t.year}
                </span>
                <h3 className="font-serif text-xl md:text-2xl font-medium mb-2">
                  {t.title}
                </h3>
                <p className="text-foreground/75 leading-relaxed text-pretty">
                  {t.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
