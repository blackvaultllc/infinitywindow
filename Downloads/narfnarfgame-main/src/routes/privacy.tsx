import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Narf Narf" },
      {
        name: "description",
        content:
          "How Narf Narf, developed by Exodia Holdings LLC, collects, uses, and protects your information.",
      },
    ],
  }),
  component: PrivacyPolicy,
});

function PrivacyPolicy() {
  return (
    <div style={{ background: "#0a0a0a", color: "#e0e0e0", minHeight: "100vh", lineHeight: 1.8, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        <span style={{ display: "inline-block", background: "#1a1a2e", border: "1px solid #3b82f6", color: "#3b82f6", fontSize: "0.75rem", padding: "3px 10px", borderRadius: 20, marginBottom: "1rem" }}>Legal</span>
        <h1 style={{ fontSize: "2rem", fontWeight: 600, color: "#fff", marginBottom: "0.25rem" }}>Privacy Policy</h1>
        <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "3rem" }}>
          Narf Narf &nbsp;·&nbsp; Developed by Exodia Holdings LLC &nbsp;·&nbsp; Last updated: June 11, 2025
        </p>

        <P>Exodia Holdings LLC ("we," "us," or "our") operates the Narf Narf mobile application (the "App"). This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our App. By using Narf Narf, you agree to the terms of this policy.</P>

        <H2>1. Information We Collect</H2>
        <P>We may collect the following types of information:</P>
        <UL items={[
          <><strong>Account information:</strong> Username, email address, and password when you create an account.</>,
          <><strong>Gameplay data:</strong> Game progress, character selections, in-game decisions, scores, and session activity.</>,
          <><strong>Device information:</strong> Device type, operating system, unique device identifiers, and mobile network information.</>,
          <><strong>Purchase information:</strong> Transaction records for in-app purchases processed through Stripe. We do not store full payment card details — all payment data is handled securely by Stripe.</>,
          <><strong>Community content:</strong> Posts, comments, or content you submit in the community forums.</>,
          <><strong>Usage data:</strong> How you interact with the App, features used, session duration, and crash reports.</>,
        ]} />

        <H2>2. How We Use Your Information</H2>
        <UL items={[
          "To operate, maintain, and improve the App and its features.",
          "To process in-app purchases and manage your store transactions.",
          "To personalize your gameplay experience and character customization.",
          "To send important notices such as updates, security alerts, or support messages.",
          "To moderate community forums and enforce our community standards.",
          "To analyze usage trends and improve game performance.",
          "To comply with legal obligations.",
        ]} />

        <H2>3. Sharing Your Information</H2>
        <P>We do not sell your personal information. We may share information with:</P>
        <UL items={[
          <><strong>Stripe:</strong> Our payment processor. Subject to <A href="https://stripe.com/privacy">Stripe's Privacy Policy</A>.</>,
          <><strong>Service providers:</strong> Hosting, analytics, and support tools that help us operate the App, under confidentiality agreements.</>,
          <><strong>Legal authorities:</strong> When required by law, court order, or to protect the safety of our users.</>,
        ]} />

        <H2>4. Children's Privacy</H2>
        <P>Narf Narf is rated Everyone 10+ and is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us personal information, please contact us at the email below and we will delete it promptly.</P>

        <H2>5. Data Retention</H2>
        <P>We retain your information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time by contacting us.</P>

        <H2>6. Security</H2>
        <P>We implement industry-standard security measures to protect your information. However, no method of transmission over the internet or electronic storage is 100% secure. We encourage you to use a strong, unique password for your account.</P>

        <H2>7. Third-Party Links</H2>
        <P>The App and community forums may contain links to third-party websites including <A href="https://www.infinitycomics.xyz">infinitycomics.xyz</A> and <A href="https://rememberfi.space">rememberfi.space</A>. We are not responsible for the privacy practices of those sites and encourage you to review their policies.</P>

        <H2>8. Your Rights</H2>
        <P>Depending on your location, you may have the right to:</P>
        <UL items={[
          "Access the personal information we hold about you.",
          "Request correction of inaccurate data.",
          "Request deletion of your personal data.",
          "Opt out of certain data processing activities.",
        ]} />
        <P>To exercise any of these rights, contact us at the email address below.</P>

        <H2>9. Changes to This Policy</H2>
        <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by updating the "Last updated" date at the top of this page. Continued use of the App after changes constitutes acceptance of the updated policy.</P>

        <H2>10. Contact Us</H2>
        <P>If you have any questions about this Privacy Policy, please contact us:</P>
        <UL items={[
          <><strong>Company:</strong> Exodia Holdings LLC</>,
          <><strong>Website:</strong> <A href="https://exodiaxholdings.enterprises">exodiaxholdings.enterprises</A></>,
          <><strong>Email:</strong> legal@exodiaxholdings.enterprises</>,
        ]} />

        <div style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid #222", fontSize: "0.8rem", color: "#555" }}>
          © 2025 Exodia Holdings LLC. All rights reserved. &nbsp;·&nbsp; Narf Narf is a product of Black Vault Digital LLC.
        </div>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", margin: "2.5rem 0 0.75rem", borderLeft: "3px solid #3b82f6", paddingLeft: 12 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "0.95rem", color: "#b0b0b0", marginBottom: "1rem" }}>{children}</p>;
}
function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul style={{ paddingLeft: "1.25rem", marginBottom: "1rem" }}>
      {items.map((it, i) => (
        <li key={i} style={{ fontSize: "0.95rem", color: "#b0b0b0", marginBottom: "0.4rem" }}>{it}</li>
      ))}
    </ul>
  );
}
function A({ href, children }: { href: string; children: React.ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: "#3b82f6", textDecoration: "none" }}>{children}</a>;
}
