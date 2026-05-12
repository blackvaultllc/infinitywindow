import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, MessageCircle, CalendarCheck, Heart, Shield, CreditCard, Camera, Phone } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How JaxStay Works — Booking, Safety & Payments" },
      { name: "description", content: "From search to wagging tail: how JaxStay matches dog parents with trusted sitters, with secure payments and 24/7 support." },
    ],
  }),
  component: HowPage,
});

function HowPage() {
  const steps = [
    { icon: Search, t: "Tell us about your pup", d: "Share their breed, energy level, quirks, and the dates you need care." },
    { icon: MessageCircle, t: "Browse and message", d: "Read sitter profiles, real reviews, and chat with anyone for free." },
    { icon: CalendarCheck, t: "Book a meet & greet", d: "Meet your sitter and their home before booking — no awkwardness." },
    { icon: Heart, t: "Drop off & relax", d: "Get daily photo updates and 24/7 vet support included with every stay." },
  ];
  const safety = [
    { icon: Shield, t: "Vetted sitters", d: "Background checks, references, and a rigorous review process." },
    { icon: CreditCard, t: "Secure payments", d: "Pay through JaxStay — funds release after a successful stay." },
    { icon: Camera, t: "Photo updates", d: "Sitters share daily photos so you never miss the cute moments." },
    { icon: Phone, t: "24/7 support", d: "Real humans and licensed vets on-call for any unexpected hiccup." },
  ];
  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-12 sm:px-6 lg:px-8 text-center">
        <p className="text-sm font-600 uppercase tracking-wider text-accent">How JaxStay Works</p>
        <h1 className="mt-3 font-display text-5xl font-700 sm:text-6xl text-balance">
          Booking great care should be <span className="italic text-primary">simple.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-foreground/75">
          Whether it's a one-night stay or a two-week trip, here's exactly how JaxStay
          gets your pup into the right hands.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {steps.map((s, i) => (
            <div key={s.t} className="grid gap-6 rounded-3xl border border-border bg-card p-8 shadow-soft sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <div className="font-display text-6xl font-700 text-accent">0{i + 1}</div>
              <div>
                <h3 className="font-display text-2xl font-600">{s.t}</h3>
                <p className="mt-2 text-foreground/75">{s.d}</p>
              </div>
              <s.icon className="hidden h-10 w-10 text-primary sm:block" />
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-warm py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-600 uppercase tracking-wider text-accent">The JaxStay Promise</p>
            <h2 className="mt-2 font-display text-4xl font-700 sm:text-5xl text-balance">
              Built on trust. Backed by real protection.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {safety.map((s) => (
              <div key={s.t} className="rounded-3xl bg-card p-6">
                <s.icon className="h-7 w-7 text-primary" />
                <h3 className="mt-4 font-display text-lg font-600">{s.t}</h3>
                <p className="mt-2 text-sm text-foreground/75">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-700 sm:text-5xl">Ready when you are.</h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/sitters" className="rounded-full bg-primary px-7 py-3.5 text-sm font-600 text-primary-foreground shadow-soft hover:scale-[1.03] transition-transform">
            Find a sitter
          </Link>
          <Link to="/become-a-sitter" className="rounded-full border border-border px-7 py-3.5 text-sm font-600 hover:bg-muted">
            Become a sitter
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
