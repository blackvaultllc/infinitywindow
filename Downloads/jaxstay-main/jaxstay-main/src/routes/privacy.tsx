import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — JaxStay" }, { name: "description", content: "How JaxStay handles your data." }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-700">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026 — placeholder copy, please review with legal counsel.</p>

        <Section title="What we collect">
          Account info (name, email), profile content (bio, photos, city), pet info you add, messages you send, and bookings you make.
        </Section>
        <Section title="How we use it">
          To operate the marketplace: show your sitter profile to owners, deliver messages, support bookings, send essential service emails, and improve the product.
        </Section>
        <Section title="Sharing">
          Your public profile (name, city, photos, bio, ratings) is visible to other users. We do not sell personal data. We share data only with service providers strictly necessary to run JaxStay (hosting, email).
        </Section>
        <Section title="Your rights">
          You can edit your profile in your dashboard, delete your account from Settings (which removes your data permanently), and contact us at privacy@jaxstay.example for any data request.
        </Section>
        <Section title="Cookies">
          We use essential cookies for authentication. No third-party advertising trackers.
        </Section>
        <Section title="Children">
          JaxStay is for adults 18+. We do not knowingly collect data from minors.
        </Section>
      </article>
    </SiteLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <h2 className="font-display text-2xl font-600">{title}</h2>
      <p className="mt-2 text-foreground/80 leading-relaxed">{children}</p>
    </div>
  );
}
