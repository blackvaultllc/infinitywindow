import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api-client";
import { DISTANCE_TIERS, TRIP_TYPES, type DistanceTierKey, type TripTypeKey } from "@/data/city-coords";
import { computeTransportQuote, formatUSD, type TierPrices } from "@/lib/transport-pricing";

type Props = {
  sitterId: string;
  sitterName: string;
  prices: TierPrices;
  extraStopFeeCents: number | null;
  waitingFeePerHourCents: number | null;
};

export function TransportBookingForm({ sitterId, sitterName, prices, extraStopFeeCents, waitingFeePerHourCents }: Props) {
  const { user } = useAuth();
  const nav = useNavigate();
  const [tripType, setTripType] = useState<TripTypeKey>("one_way");
  const [tier, setTier] = useState<DistanceTierKey>("tier_0_5");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [datetime, setDatetime] = useState("");
  const [returnDatetime, setReturnDatetime] = useState("");
  const [notes, setNotes] = useState("");
  const [extraStops, setExtraStops] = useState(0);
  const [waitingHours, setWaitingHours] = useState(0);
  const [busy, setBusy] = useState(false);

  const quote = useMemo(() => computeTransportQuote({
    tripType, tier, prices,
    extraStops, extraStopFeeCents,
    waitingHours, waitingFeePerHourCents,
  }), [tripType, tier, prices, extraStops, extraStopFeeCents, waitingHours, waitingFeePerHourCents]);

  const requiresQuote = tier === "tier_50_plus" && quote.quoteOnly;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { nav({ to: "/login", search: { mode: "signup", redirect: `/sitters/${sitterId}` } as never }); return; }
    if (user.id === sitterId) return toast.error("You can't book yourself");
    if (!pickup.trim() || !dropoff.trim() || !datetime) return toast.error("Pickup, drop-off, and date/time are required");
    if (tripType === "scheduled_return" && !returnDatetime) return toast.error("Return date/time is required");
    if (quote.totalCents <= 0) return toast.error("Sitter has not set a price for this tier yet");

    setBusy(true);
    try {
      const start = new Date(datetime).toISOString().slice(0, 10);
      const end = (tripType === "scheduled_return" ? new Date(returnDatetime) : new Date(datetime)).toISOString().slice(0, 10);

      const { data: booking, error } = await supabase.from("bookings").insert({
        owner_id: user.id,
        sitter_id: sitterId,
        service: "Pet Transportation",
        service_category: "transport",
        trip_type: tripType,
        distance_tier: tier,
        pickup_address: pickup,
        dropoff_address: dropoff,
        return_datetime: tripType === "scheduled_return" ? new Date(returnDatetime).toISOString() : null,
        transport_notes: notes || null,
        start_date: start,
        end_date: end,
        status: "awaiting_payment",
        message: notes || null,
      } as never).select("id").single();
      if (error || !booking) throw error ?? new Error("Failed to create booking");

      const { url } = await apiFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ bookingId: (booking as { id: string }).id }),
      });
      if (url) window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start checkout");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-display text-lg font-600">🚗 Book Pet Transportation</h3>
      <p className="text-xs text-muted-foreground">With {sitterName}</p>

      <div className="mt-4 space-y-3">
        <label className="block text-xs font-500">Pickup address
          <input value={pickup} onChange={(e) => setPickup(e.target.value)} required maxLength={200}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="123 Main St" />
        </label>
        <label className="block text-xs font-500">Drop-off address
          <input value={dropoff} onChange={(e) => setDropoff(e.target.value)} required maxLength={200}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Vet, groomer, etc." />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-500">Trip type
            <select value={tripType} onChange={(e) => setTripType(e.target.value as TripTypeKey)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              {TRIP_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-500">Distance
            <select value={tier} onChange={(e) => setTier(e.target.value as DistanceTierKey)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
              {DISTANCE_TIERS.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-500">Pickup date & time
            <input type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          {tripType === "scheduled_return" && (
            <label className="block text-xs font-500">Return date & time
              <input type="datetime-local" value={returnDatetime} onChange={(e) => setReturnDatetime(e.target.value)} required
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
            </label>
          )}
          <label className="block text-xs font-500">Extra stops (optional)
            <input type="number" min={0} value={extraStops} onChange={(e) => setExtraStops(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
          <label className="block text-xs font-500">Waiting hours (optional)
            <input type="number" min={0} step="0.5" value={waitingHours} onChange={(e) => setWaitingHours(Math.max(0, Number(e.target.value) || 0))}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
          </label>
        </div>
        <label className="block text-xs font-500">Notes
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Pet name, carrier, special instructions…" />
        </label>
      </div>

      <div className="mt-4 rounded-xl bg-muted/40 p-3">
        {requiresQuote ? (
          <p className="text-sm text-foreground/80">50+ mile trips need a custom quote. Message the sitter to confirm pricing.</p>
        ) : quote.totalCents > 0 ? (
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-600 text-muted-foreground">Estimated total</span>
            <span className="font-display text-2xl font-700">{formatUSD(quote.totalCents)}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sitter has not set a price for this tier yet.</p>
        )}
      </div>

      {requiresQuote ? (
        <Link to="/messages" search={{ peer: sitterId } as never}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground">
          <MessageSquare className="h-4 w-4" /> Request Quote / Message Sitter
        </Link>
      ) : (
        <button type="submit" disabled={busy || quote.totalCents <= 0}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {user ? "Pay & book transport" : "Sign in to book"}
        </button>
      )}
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        Secure checkout via Stripe. Final price is recalculated server-side.
      </p>
    </form>
  );
}
