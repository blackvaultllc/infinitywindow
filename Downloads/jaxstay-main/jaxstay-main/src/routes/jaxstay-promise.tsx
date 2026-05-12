import { createFileRoute, Link } from "@tanstack/react-router";
import { Shield, Heart, Phone, AlertCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/jaxstay-promise")({
  head: () => ({ meta: [{ title: "The JaxStay Promise — Trust & Safety" }] }),
  component: Promise,
});

function Promise() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-700 sm:text-5xl">The JaxStay Promise</h1>
        <p className="mt-3 text-foreground/75">Our commitment to keeping every tail wagging.</p>

        <div className="mt-10 space-y-6">
          <Card icon={Shield} title="Verified profiles">
            Every sitter completes email verification and identity checks before listing. We continuously review reports from the community.
          </Card>
          <Card icon={Heart} title="Photo updates encouraged">
            We encourage daily photo updates between sitters and owners through in-app messaging.
          </Card>
          <Card icon={Phone} title="Support when you need it">
            Reach our team at support@jaxstay.example. Use the chat widget on any page for instant FAQ help.
          </Card>
          <Card icon={AlertCircle} title="Honest disclaimers">
            JaxStay is a marketplace. We do not employ sitters, provide veterinary care, or carry pet insurance at this time. For medical emergencies always contact a licensed veterinarian first. Booking payments are not yet processed through JaxStay — those features are coming with our payments rollout.
          </Card>
        </div>

        <div className="mt-12 rounded-3xl bg-gradient-forest p-8 text-primary-foreground">
          <h2 className="font-display text-2xl font-700">Questions about safety?</h2>
          <p className="mt-2 text-primary-foreground/80">Tap the help bubble in the corner — Jax is on call 24/7.</p>
          <Link to="/sitters" className="mt-5 inline-block rounded-full bg-accent px-6 py-3 text-sm font-600 text-accent-foreground">Browse sitters</Link>
        </div>
      </section>
    </SiteLayout>
  );
}

function Card({ icon: Icon, title, children }: { icon: typeof Shield; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
      <Icon className="h-7 w-7 text-accent" />
      <h3 className="mt-3 font-display text-xl font-600">{title}</h3>
      <p className="mt-2 text-foreground/80">{children}</p>
    </div>
  );
}
