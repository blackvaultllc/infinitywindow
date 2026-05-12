import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, CreditCard, CheckCircle2, Loader2, Banknote, AlertCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api-client";
import { LiveTrackingPanel } from "@/components/bookings/LiveTrackingPanel";

export const Route = createFileRoute("/_authenticated/bookings")({
  head: () => ({ meta: [{ title: "My Bookings — JaxStay" }] }),
  component: BookingsPage,
  validateSearch: (s: Record<string, unknown>) => ({
    paid: typeof s.paid === "string" ? s.paid : undefined,
    cancel: typeof s.cancel === "string" ? s.cancel : undefined,
  }),
});

type Booking = {
  id: string; owner_id: string; sitter_id: string; service: string;
  start_date: string; end_date: string; status: string; message: string | null;
  created_at: string; payment_status: string; payout_released: boolean;
  amount_cents: number | null; platform_fee_cents: number | null;
  completed_at: string | null;
};

type SitterPayoutInfo = { stripe_onboarding_complete: boolean; stripe_payouts_enabled: boolean } | null;

function BookingsPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/bookings" });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [payoutInfo, setPayoutInfo] = useState<SitterPayoutInfo>(null);
  const [trackingPremium, setTrackingPremium] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .or(`owner_id.eq.${user.id},sitter_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    const list = (data as Booking[]) ?? [];
    setBookings(list);
    const ids = [...new Set(list.flatMap((b) => [b.owner_id, b.sitter_id]))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name])));
    }
    const { data: rs } = await supabase.from("reviews").select("booking_id").eq("author_id", user.id);
    setReviewed(new Set((rs ?? []).map((r) => r.booking_id).filter(Boolean) as string[]));

    const { data: me } = await supabase.rpc("get_my_profile");
    if (me?.is_sitter) {
      setPayoutInfo({
        stripe_onboarding_complete: !!me.stripe_onboarding_complete,
        stripe_payouts_enabled: !!me.stripe_payouts_enabled,
      });
    }
    setTrackingPremium(!!(me as { tracking_premium?: boolean } | null)?.tracking_premium);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (search.paid) toast.success("Payment received — booking confirmed!");
    if (search.cancel) toast.message("Payment cancelled. You can try again anytime.");
  }, [search.paid, search.cancel]);

  const updateStatus = async (
    id: string,
    status: "accepted" | "awaiting_payment" | "declined" | "completed" | "cancelled"
  ) => {
    const { error } = await supabase.from("bookings").update({ status } as never).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Booking ${status.replace("_", " ")}`);
    load();
  };

  const payNow = async (id: string) => {
    setBusy(id);
    try {
      const { url } = await apiFetch("/api/stripe/checkout", {
        method: "POST",
        body: JSON.stringify({ bookingId: id }),
      });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  const markComplete = async (id: string) => {
    if (!confirm("Confirm sitter did a great job and release the payout?")) return;
    setBusy(id);
    try {
      await apiFetch("/api/bookings/complete", { method: "POST", body: JSON.stringify({ bookingId: id }) });
      toast.success("Booking complete — payout released to sitter");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const refund = async (id: string) => {
    if (!confirm("Cancel and refund this booking? You'll get the full amount back.")) return;
    setBusy(id);
    try {
      await apiFetch("/api/bookings/refund", { method: "POST", body: JSON.stringify({ bookingId: id }) });
      toast.success("Refund issued");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const connectStripe = async () => {
    setBusy("connect");
    try {
      const { url } = await apiFetch("/api/stripe/connect-onboard", { method: "POST" });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-700">Bookings</h1>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
        </div>

        {payoutInfo && !payoutInfo.stripe_payouts_enabled && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4">
            <AlertCircle className="h-5 w-5 text-accent-foreground" />
            <div className="flex-1">
              <p className="font-600">Connect Stripe to receive payouts</p>
              <p className="text-sm text-muted-foreground">
                Clients can only pay you after you finish Stripe onboarding (takes ~2 minutes).
              </p>
            </div>
            <button
              onClick={connectStripe}
              disabled={busy === "connect"}
              className="rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground"
            >
              {busy === "connect" ? "Opening…" : payoutInfo.stripe_onboarding_complete ? "Continue setup" : "Connect Stripe"}
            </button>
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-muted-foreground">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="mt-6 text-muted-foreground">
            No bookings yet. <Link to="/sitters" className="text-primary underline">Find a sitter</Link>.
          </p>
        ) : (
          <ul className="mt-6 space-y-3">
            {bookings.map((b) => {
              const isOwner = b.owner_id === user?.id;
              const counterparty = isOwner ? names[b.sitter_id] : names[b.owner_id];
              const amount = b.amount_cents ? `$${(b.amount_cents / 100).toFixed(2)}` : null;
              return (
                <li key={b.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-600">{b.service} — {counterparty ?? "—"}</p>
                      <p className="text-sm text-muted-foreground">{b.start_date} → {b.end_date}{amount ? ` · ${amount}` : ""}</p>
                      {b.message && <p className="mt-2 text-sm">{b.message}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={b.status} />
                      <PayoutBadge booking={b} />
                    </div>
                  </div>

                  {/* Owner: payment prompt after sitter accepts */}
                  {isOwner && b.status === "awaiting_payment" && (
                    <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
                      <p className="text-sm font-600">Your sitter accepted the booking. Complete payment to confirm.</p>
                      <button
                        onClick={() => payNow(b.id)}
                        disabled={busy === b.id}
                        className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground"
                      >
                        {busy === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                        Pay & confirm booking
                      </button>
                    </div>
                  )}

                  {/* Live tracking — active (paid, not yet completed) bookings only */}
                  {b.payment_status === "paid" && !b.payout_released && b.status !== "cancelled" && (
                    <LiveTrackingPanel
                      bookingId={b.id}
                      ownerId={b.owner_id}
                      sitterId={b.sitter_id}
                      currentUserId={user!.id}
                      ownerHasPremium={isOwner ? trackingPremium : true}
                    />
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/messages" search={{ peer: isOwner ? b.sitter_id : b.owner_id }} className="rounded-full border border-border px-3 py-1 text-xs">Message</Link>

                    {isOwner && (b.status === "pending" || b.status === "accepted" || b.status === "awaiting_payment" || b.status === "confirmed") && (
                      <Link to="/bookings/$bookingId/intake" params={{ bookingId: b.id }} className="rounded-full bg-accent px-3 py-1 text-xs font-600">Pet intake form</Link>
                    )}

                    {/* Sitter actions */}
                    {!isOwner && b.status === "pending" && (
                      <>
                        <button onClick={() => updateStatus(b.id, "awaiting_payment")} className="rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground">Accept</button>
                        <button onClick={() => updateStatus(b.id, "declined")} className="rounded-full border border-border px-3 py-1 text-xs">Decline</button>
                      </>
                    )}

                    {/* Owner: mark complete after payment */}
                    {isOwner && b.status === "confirmed" && b.payment_status === "paid" && !b.payout_released && (
                      <button
                        onClick={() => markComplete(b.id)}
                        disabled={busy === b.id}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground"
                      >
                        {busy === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Mark booking complete
                      </button>
                    )}

                    {/* Owner: cancel + refund (only before completion) */}
                    {isOwner && b.payment_status === "paid" && !b.payout_released && (
                      <button onClick={() => refund(b.id)} disabled={busy === b.id} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive">
                        Cancel & refund
                      </button>
                    )}

                    {/* Legacy accepted bookings */}
                    {b.status === "accepted" && (
                      <button onClick={() => updateStatus(b.id, "completed")} className="rounded-full bg-accent px-3 py-1 text-xs font-600">Mark complete</button>
                    )}

                    {isOwner && (b.status === "completed" || b.payout_released) && !reviewed.has(b.id) && (
                      <ReviewForm bookingId={b.id} sitterId={b.sitter_id} authorId={user!.id} onDone={load} />
                    )}
                    {isOwner && reviewed.has(b.id) && <span className="text-xs text-muted-foreground">✓ Review submitted</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </SiteLayout>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-accent/20",
    awaiting_payment: "bg-primary/15 text-primary",
    accepted: "bg-primary/15 text-primary",
    confirmed: "bg-primary/20 text-primary",
    completed: "bg-secondary",
    declined: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-600 ${map[status] ?? "bg-muted"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function PayoutBadge({ booking }: { booking: Booking }) {
  let label = "";
  let cls = "bg-muted text-muted-foreground";
  if (booking.status === "awaiting_payment") { label = "Awaiting payment"; cls = "bg-accent/15 text-accent-foreground"; }
  else if (booking.payment_status === "paid" && !booking.payout_released) { label = "Confirmed"; cls = "bg-primary/15 text-primary"; }
  else if (booking.payout_released) { label = "Paid out"; cls = "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"; }
  else if (booking.payment_status === "refunded") { label = "Refunded"; cls = "bg-destructive/15 text-destructive"; }
  else return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-600 ${cls}`}>
      <Banknote className="h-3 w-3" /> {label}
    </span>
  );
}

function ReviewForm({ bookingId, sitterId, authorId, onDone }: { bookingId: string; sitterId: string; authorId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const submit = async () => {
    const { error } = await supabase.from("reviews").insert({ booking_id: bookingId, sitter_id: sitterId, author_id: authorId, rating, body } as never);
    if (error) return toast.error(error.message);
    toast.success("Review posted");
    setOpen(false);
    onDone();
  };
  if (!open) return <button onClick={() => setOpen(true)} className="rounded-full border border-border px-3 py-1 text-xs">Leave review</button>;
  return (
    <div className="w-full rounded-xl border border-border bg-background p-3">
      <div className="flex gap-1">
        {[1,2,3,4,5].map((n) => <button key={n} onClick={() => setRating(n)}><Star className={`h-5 w-5 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground/40"}`} /></button>)}
      </div>
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="How was your experience?" className="mt-2 w-full rounded-lg border border-border bg-card px-2 py-1 text-sm" />
      <div className="mt-2 flex gap-2">
        <button onClick={submit} className="rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground">Submit</button>
        <button onClick={() => setOpen(false)} className="rounded-full border border-border px-3 py-1 text-xs">Cancel</button>
      </div>
    </div>
  );
}
