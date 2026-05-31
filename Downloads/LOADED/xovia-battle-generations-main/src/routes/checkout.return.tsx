import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-gradient-gold">Offering accepted</h1>
      <p className="mt-4 text-muted-foreground">
        {session_id
          ? "Your payment cleared. Sealed goods are dropping into your vault now — pack credits and EXOD post within a few seconds."
          : "We could not find a session id on this return. If your card was charged, check your vault — fulfillment is automatic."}
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link to="/vault" className="rounded-md border border-gold/30 px-4 py-2 text-sm hover:bg-gold/10">Open Vault</Link>
        <Link to="/drops" className="rounded-md bg-gold/20 px-4 py-2 text-sm">Open packs</Link>
      </div>
    </div>
  );
}