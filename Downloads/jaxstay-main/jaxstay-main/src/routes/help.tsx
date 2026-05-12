import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, HelpCircle, ShieldCheck, CreditCard, Search, Calendar, DollarSign, Zap } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & FAQ — JaxStay" },
      { name: "description", content: "How JaxStay works: booking, payments, safety, finding a sitter, pricing, and last-minute requests." },
    ],
  }),
  component: HelpPage,
});

const FAQ: { icon: React.ComponentType<{ className?: string }>; q: string; a: string }[] = [
  { icon: HelpCircle, q: "What is JaxStay?", a: "JaxStay is a trusted marketplace that connects pet parents with local sitters for boarding, house sitting, drop-in visits, doggy day care, and dog walking. Book in minutes, message your sitter, and pay securely — all in one place." },
  { icon: Calendar, q: "How does booking work?", a: "Search sitters near you, view their profile and reviews, then send a booking request with your dates and pet details. Your sitter reviews the request and accepts. Once accepted, you'll get a Pay Now button right on your dashboard. Payment is required to confirm the booking." },
  { icon: CreditCard, q: "How do payments work?", a: "When the sitter accepts, you pay through our secure Stripe checkout. Your funds are held safely on the platform — the sitter does not get paid until the stay is finished and you (or the sitter) mark it complete. If anything goes wrong, you can request a refund before completion." },
  { icon: ShieldCheck, q: "Is JaxStay safe?", a: "Sitters must pass a qualification test before they can be listed. All payments are protected — money is held in escrow until the sitting is done. You can message inside the platform, block or report users, and leave reviews after every completed booking. We never share your contact info publicly." },
  { icon: Search, q: "How do I find the right sitter?", a: "Use the search page to browse sitters near you. Filter by service type (boarding, walks, etc.), check ratings and reviews, look at their photo gallery, and read their bio. When you find a good fit, click Request Booking to start a conversation." },
  { icon: DollarSign, q: "How is pricing set?", a: "Each sitter sets their own nightly or per-visit rate. You'll see the rate on their profile and the total estimate before you book. JaxStay adds a small platform fee on top of the sitter's price to keep the service running and protect your payment." },
  { icon: Zap, q: "Can I book last-minute?", a: "Yes. Many sitters accept last-minute requests. Send a request as soon as you can — sitters get notified instantly and most reply within a few hours. For urgent needs, message a sitter first to confirm availability before booking." },
];

function HelpPage() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-700">Help & FAQ</h1>
        <p className="mt-2 text-muted-foreground">Everything you need to know about booking, payments, and safety on JaxStay.</p>

        <ul className="mt-8 space-y-3">
          {FAQ.map((item, i) => <FaqItem key={i} {...item} />)}
        </ul>

        <div className="mt-10 rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
          <p className="font-600">Still have questions?</p>
          <p className="mt-1 text-sm text-muted-foreground">Use the help bot in the bottom corner, or message us from your dashboard.</p>
          <Link to="/dashboard" className="mt-4 inline-block rounded-full bg-primary px-5 py-2 text-sm font-600 text-primary-foreground">Back to dashboard</Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function FaqItem({ icon: Icon, q, a }: { icon: React.ComponentType<{ className?: string }>; q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-card">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-3 p-5 text-left hover:bg-muted/40">
        <Icon className="h-5 w-5 shrink-0 text-accent" />
        <span className="flex-1 font-600">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-border bg-background px-5 py-4 text-sm leading-relaxed text-muted-foreground">{a}</div>}
    </li>
  );
}
