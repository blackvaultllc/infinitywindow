import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";
import { PawIcon } from "@/components/site/Logo";
import heroDog from "@/assets/hero-dog.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About JaxStay — A marketplace built for dogs like Jax" },
      { name: "description", content: "JaxStay started with one good boy named Jax. Today we're a community of 240,000+ dog parents and 18,000 trusted sitters." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <SiteLayout>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
        <div>
          <PawIcon className="h-10 w-10 text-accent" />
          <h1 className="mt-4 font-display text-5xl font-700 sm:text-6xl text-balance">
            We started with <span className="italic text-primary">one good boy.</span>
          </h1>
          <p className="mt-5 text-lg text-foreground/75">
            JaxStay began the day our co-founder couldn't find anyone to watch his rescue mutt Jax
            during a last-minute work trip. He thought: <em>there has to be a better way.</em>
          </p>
          <p className="mt-4 text-foreground/75">
            Today, JaxStay connects 240,000+ dog parents with 18,000 background-checked sitters
            across the country. Every booking is protected, every sitter is reviewed, and every
            stay is built around what dogs actually need: love, routine, and somebody who shows up.
          </p>
        </div>
        <div className="overflow-hidden rounded-[2rem] shadow-warm">
          <img src={heroDog} alt="The original Jax" className="aspect-square w-full object-cover" />
        </div>
      </section>

      <section className="bg-gradient-forest py-20 text-primary-foreground">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 sm:grid-cols-3 sm:px-6 lg:px-8">
          {[
            { v: "240k+", l: "Dog parents" },
            { v: "18k", l: "Trusted sitters" },
            { v: "$1M", l: "Insurance per booking" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-5xl font-700 text-accent">{s.v}</div>
              <div className="mt-1 text-primary-foreground/75">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-700 sm:text-5xl text-balance">Our values</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {[
            { t: "Dogs first", d: "Every product decision starts with: is this better for the dog?" },
            { t: "Real humans", d: "24/7 support from people who know and love animals." },
            { t: "Fair to sitters", d: "We pay sitters more, faster, than the industry standard." },
            { t: "Radical transparency", d: "Every review is real. Every fee is clear. Every photo is daily." },
          ].map((v) => (
            <div key={v.t} className="rounded-3xl border border-border bg-card p-6">
              <h3 className="font-display text-xl font-600">{v.t}</h3>
              <p className="mt-2 text-foreground/75">{v.d}</p>
            </div>
          ))}
        </div>
      </section>
    </SiteLayout>
  );
}
