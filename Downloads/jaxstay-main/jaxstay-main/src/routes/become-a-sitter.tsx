import { createFileRoute, Link } from "@tanstack/react-router";
import { DollarSign, Clock, Shield, Calendar, Users, Sparkles } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { PawIcon } from "@/components/site/Logo";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/become-a-sitter")({
  head: () => ({
    meta: [
      { title: "Become a Dog Sitter — Earn $1,000+/mo | JaxStay" },
      { name: "description", content: "Set your own rates and schedule. Join 18,000+ sitters earning real income loving dogs on JaxStay." },
    ],
  }),
  component: BecomeSitter,
});

function BecomeSitter() {
  const { user } = useAuth();
  const applyTo = user ? "/sitter-test" : "/login";
  const perks = [
    { icon: DollarSign, t: "Set your own rates", d: "Top sitters earn $3,000+ a month. You keep 80% of every booking." },
    { icon: Clock, t: "Work on your time", d: "Choose the days, services, and dogs you want to host." },
    { icon: Shield, t: "Insurance included", d: "Every booking comes with $1M of liability protection at no cost." },
    { icon: Users, t: "We bring the clients", d: "Get matched with dog parents in your neighborhood." },
    { icon: Calendar, t: "Easy scheduling", d: "Calendar, messaging, and payments all in one place." },
    { icon: Sparkles, t: "Grow your reputation", d: "Build reviews and become a top-rated sitter in your area." },
  ];
  return (
    <SiteLayout>
      <section className="paw-bg">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/20 px-3 py-1 text-xs font-600 text-foreground">
              <PawIcon className="h-3.5 w-3.5 text-accent" /> Join 18,000+ sitters
            </span>
            <h1 className="mt-4 font-display text-5xl font-700 sm:text-6xl text-balance">
              Get paid to <span className="italic text-primary">hang out with dogs.</span>
            </h1>
            <p className="mt-5 text-lg text-foreground/75 max-w-lg">
              Set your own rates. Work the hours you want. Join the most-loved community of
              dog sitters in the country.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to={applyTo} className="rounded-full bg-primary px-7 py-3.5 text-sm font-600 text-primary-foreground shadow-soft hover:scale-[1.03] transition-transform">
                Apply to be a sitter
              </Link>
              <Link to="/how-it-works" className="rounded-full border border-border px-7 py-3.5 text-sm font-600 hover:bg-muted">
                Learn more
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free to apply. Approval in ~3 days.</p>
          </div>

          <div className="rounded-3xl bg-card p-8 shadow-warm">
            <h3 className="font-display text-2xl font-600">Estimate your earnings</h3>
            <p className="mt-1 text-sm text-muted-foreground">Based on average rates in your area.</p>

            <div className="mt-6 space-y-5">
              <Row label="Boarding (8 nights/mo)" value="$384" />
              <Row label="Daycare (12 days/mo)" value="$420" />
              <Row label="Walks (20/mo)" value="$360" />
              <div className="border-t border-border pt-5">
                <Row label="Estimated monthly earnings" value="$1,164" big />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-secondary p-4 text-sm text-secondary-foreground">
              💡 Top 10% of sitters in your area earn over <strong>$3,200/month</strong>.
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <h2 className="mx-auto max-w-2xl text-center font-display text-4xl font-700 sm:text-5xl text-balance">
          Everything you need to thrive as a sitter.
        </h2>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((p) => (
            <div key={p.t} className="rounded-3xl border border-border bg-card p-7">
              <p.icon className="h-7 w-7 text-accent" />
              <h3 className="mt-4 font-display text-xl font-600">{p.t}</h3>
              <p className="mt-2 text-foreground/75">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-forest py-20 text-primary-foreground">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="font-display text-4xl font-700 sm:text-5xl">Ready to start?</h2>
          <p className="mt-3 text-primary-foreground/80">Application takes about 10 minutes.</p>
          <Link to={applyTo} className="mt-8 inline-block rounded-full bg-accent px-8 py-4 text-sm font-600 text-accent-foreground shadow-warm hover:scale-[1.03] transition-transform">
            Apply now — it's free
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function Row({ label, value, big = false }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={big ? "font-600" : "text-foreground/75"}>{label}</span>
      <span className={`font-display ${big ? "text-3xl font-700 text-primary" : "text-xl font-600"}`}>{value}</span>
    </div>
  );
}
