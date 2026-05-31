import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/terms")({
  component: TermsPage,
  head: () => ({
    meta: [
      { title: "Terms, Privacy & Pull Rates — Exodia NFT Battle" },
      { name: "description", content: "Terms of service, privacy policy, and published rarity odds for Exodia NFT Battle, operated by Exodia Holdings LLC." },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
});

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-border/60 py-10 first:border-t-0">
      <h2 className="font-display text-2xl text-gradient-gold md:text-3xl">{title}</h2>
      <div className="prose prose-invert mt-4 max-w-none text-sm text-muted-foreground [&_p]:my-3 [&_li]:my-1 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function TermsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto max-w-4xl px-4 py-14">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Legal</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Terms, Privacy & Pull Rates</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Exodia NFT Battle is operated by <strong className="text-foreground">Exodia Holdings LLC</strong> ("Exodia",
          "we", "us"). By using the platform you agree to the terms below. Last updated May 16, 2026.
        </p>

        <nav className="mt-6 flex flex-wrap gap-2 text-xs">
          {[
            ["terms", "Terms"],
            ["purchases", "Purchases"],
            ["odds", "Pull Rates"],
            ["tokens", "EXOD Tokens"],
            ["privacy", "Privacy"],
            ["disputes", "Disputes"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`} className="rounded-full border border-border bg-card/60 px-3 py-1 hover:border-gold/60 hover:text-gold">
              {label}
            </a>
          ))}
        </nav>

        <Section id="terms" title="1. Terms of Service">
          <p>You must be 18 years of age or the age of majority in your jurisdiction to register, purchase digital items, or trade on the platform. Accounts are non-transferable. We may suspend accounts that violate these terms, exploit bugs, engage in fraud, chargebacks, or automated farming.</p>
          <p>Digital cards, packs, boxes, and NFT relics ("Digital Items") are collectibles intended for entertainment. They are not investment instruments, securities, or guarantees of future value. We make no promise of resale value, liquidity, or market demand.</p>
        </Section>

        <Section id="purchases" title="2. Purchases & Refunds">
          <p>All purchases of Digital Items, mint packs, mint boxes, EXOD token bundles, and the Duel Pass subscription are <strong>final and non-refundable</strong> once the item has been delivered or the pack has been opened. Subscriptions may be cancelled at any time and will remain active through the end of the paid period.</p>
          <p>Payment is processed by Stripe and other regulated payment providers. We do not store payment card details.</p>
        </Section>

        <Section id="odds" title="3. Published Pull Rates">
          <p>Every mint pack and rarity box discloses its rarity weights on the Drop Center listing prior to purchase. The current baseline odds across all standard booster packs are:</p>
          <ul className="ml-6 list-disc">
            <li><strong>Common</strong> — 60%</li>
            <li><strong>Rare</strong> — 25%</li>
            <li><strong>Epic</strong> — 10%</li>
            <li><strong>Legendary</strong> — 4%</li>
            <li><strong>Divine</strong> — 0.9%</li>
            <li><strong>Exodia (Relic)</strong> — 0.1%</li>
          </ul>
          <p>Card rolls are executed server-side using cryptographically seeded randomness. Outcomes cannot be predicted or altered by clients. Owner-only and reserved cards are excluded from the public pool.</p>
        </Section>

        <Section id="tokens" title="4. EXOD Utility & In-Game Currency">
          <p>EXOD is an in-game utility credit used to open packs, buy boxes, and trade on the marketplace. EXOD has no monetary value off-platform, is not redeemable for cash, and may be adjusted, capped, or expired to preserve game economy health (e.g. the 1,000 EXOD per-day level-up cap, the 5-pack credit cap, the 30-second anti-farming cooldown).</p>
        </Section>

        <Section id="privacy" title="5. Privacy Policy">
          <p>We collect the minimum data required to operate the game: email, username, gameplay statistics, purchase records, and (when applicable) wallet addresses. Public profiles are opt-in via your <Link to="/settings" className="text-gold underline">Settings</Link>; private profiles expose nothing beyond an anonymized rank.</p>
          <p>We never sell your personal data. We share data only with processors required to deliver the service (Stripe for payments, our cloud host for storage, email delivery providers). You may request export or deletion at any time by emailing <a href="mailto:support@exodianftbattle.com" className="text-gold underline">support@exodianftbattle.com</a>.</p>
        </Section>

        <Section id="disputes" title="6. Disputes, Liability & Jurisdiction">
          <p>Disputes will first be addressed through good-faith support correspondence. Unresolved disputes are governed by the laws of the State of Delaware, USA, and resolved by binding arbitration except where prohibited by local consumer-protection law.</p>
          <p>To the maximum extent permitted by law, Exodia's aggregate liability is limited to the amount you paid to us in the prior twelve months. We are not liable for indirect, incidental, or consequential damages, including loss of perceived NFT value due to market conditions.</p>
        </Section>

        <p className="mt-10 text-xs text-muted-foreground">© {new Date().getFullYear()} Exodia Holdings LLC. All rights reserved. "Exodia", "Exodia Prime", "EXOD", and the Forbidden Five are trademarks of Exodia Holdings LLC.</p>
      </div>
      <SiteFooter />
    </div>
  );
}