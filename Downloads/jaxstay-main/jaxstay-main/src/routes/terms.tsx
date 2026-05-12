import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/Layout";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms of Service — JaxStay" }, { name: "description", content: "JaxStay terms of service." }] }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <article className="prose mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="font-display text-4xl font-700">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 2026 — placeholder copy, please review with legal counsel before launch.</p>

        <Section title="1. Acceptance">
          By creating a JaxStay account or using the platform you agree to these Terms. JaxStay is a marketplace that connects dog owners with independent pet sitters. We are not a party to bookings between users.
        </Section>
        <Section title="2. Eligibility">
          You must be 18+ and able to enter a binding contract. Sitters are independent contractors, not employees of JaxStay.
        </Section>
        <Section title="3. Free for owners">
          Creating an owner account, posting your dog, browsing sitters, and messaging is currently free.
        </Section>
        <Section title="4. Sitter payments">
          A 15% platform commission on completed bookings will apply once payments launch. Until then, all bookings are free of platform fees and any payment is arranged directly between users at their own risk.
        </Section>
        <Section title="5. User conduct">
          You agree to provide accurate information, treat other users with respect, and follow all applicable laws. We may suspend or remove accounts that violate these terms.
        </Section>
        <Section title="6. Disclaimer">
          JaxStay does not perform background checks beyond email verification at this time, does not provide veterinary care, insurance, or guarantee any sitter's qualifications. Use the platform at your own risk.
        </Section>
        <Section title="7. Limitation of liability">
          To the maximum extent permitted by law, JaxStay is not liable for any damages arising out of bookings, sitter conduct, or use of the platform.
        </Section>
        <Section title="8. Termination">
          You may delete your account at any time from Settings. We may terminate accounts that violate these terms.
        </Section>
        <Section title="9. Live pet tracking (premium)">
          JaxStay offers an optional Live Pet Tracking feature for owners on a premium plan. By using it, both owner and sitter agree to the following:
          {" "}
          <strong>Consent-first.</strong> A sitter must explicitly opt in to location sharing for each individual booking before any request can be sent. Sitters can disable sharing at any time from the booking screen.
          {" "}
          <strong>Request-based, not background.</strong> JaxStay never tracks a sitter's location passively. Each location ping requires the sitter to manually approve the request in-app, at which point a single GPS reading is captured from the sitter's device.
          {" "}
          <strong>Booking-scoped.</strong> Location requests are only available during an active, paid booking and automatically expire 15 minutes after they are sent if not answered.
          {" "}
          <strong>Audit log.</strong> Every request, approval, denial, and expiration is logged and visible to both parties. Captured coordinates are retained for the booking plus 7 days, then deleted.
          {" "}
          <strong>Permitted use.</strong> Owners may use shared locations only to confirm the welfare of their own pet. Using location data to harass, surveil, stalk, or otherwise harm a sitter is strictly prohibited and grounds for immediate account termination and referral to law enforcement.
          {" "}
          <strong>Not an emergency service.</strong> Live tracking is not a substitute for calling 911, animal control, or your veterinarian in an emergency. JaxStay does not guarantee accuracy, availability, or response time of any location ping.
          {" "}
          <strong>Minors and third parties.</strong> The feature shares only the sitter's device location during an active booking. It does not track minors, bystanders, or anyone other than the consenting sitter.
          {" "}
          <strong>Sitter rights.</strong> A sitter may decline any individual request without explanation and may revoke booking-level consent at any time without penalty to their JaxStay rating.
        </Section>
        <Section title="10. Contact">
          Questions: support@jaxstay.example
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
