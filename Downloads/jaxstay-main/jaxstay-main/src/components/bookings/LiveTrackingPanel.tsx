import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, ShieldCheck, Bell, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SitterMap, type Pin } from "@/components/sitters/SitterMap";

type Consent = {
  id: string;
  booking_id: string;
  sitter_id: string;
  owner_id: string;
  consented: boolean;
  consented_at: string | null;
  revoked_at: string | null;
};

type LocReq = {
  id: string;
  booking_id: string;
  owner_id: string;
  sitter_id: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  captured_at: string | null;
  responded_at: string | null;
  created_at: string;
  expires_at: string;
};

export function LiveTrackingPanel({
  bookingId,
  ownerId,
  sitterId,
  currentUserId,
  ownerHasPremium,
}: {
  bookingId: string;
  ownerId: string;
  sitterId: string;
  currentUserId: string;
  ownerHasPremium: boolean;
}) {
  const isOwner = currentUserId === ownerId;
  const isSitter = currentUserId === sitterId;
  const [consent, setConsent] = useState<Consent | null>(null);
  const [requests, setRequests] = useState<LocReq[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [{ data: c }, { data: r }] = await Promise.all([
      supabase
        .from("tracking_consents")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle(),
      supabase
        .from("location_requests")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setConsent((c as Consent) ?? null);
    setRequests((r as LocReq[]) ?? []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`tracking-${bookingId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tracking_consents", filter: `booking_id=eq.${bookingId}` },
        load,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "location_requests", filter: `booking_id=eq.${bookingId}` },
        load,
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const isActiveConsent =
    !!consent && consent.consented && !consent.revoked_at;

  // === Sitter actions ===
  const optIn = async () => {
    setBusy(true);
    const payload = {
      booking_id: bookingId,
      sitter_id: sitterId,
      owner_id: ownerId,
      consented: true,
      consented_at: new Date().toISOString(),
      revoked_at: null,
    };
    const { error } = consent
      ? await supabase
          .from("tracking_consents")
          .update(payload as never)
          .eq("id", consent.id)
      : await supabase.from("tracking_consents").insert(payload as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Live location sharing enabled for this booking");
  };

  const revoke = async () => {
    if (!consent) return;
    if (!confirm("Stop allowing location requests for this booking?")) return;
    setBusy(true);
    const { error } = await supabase
      .from("tracking_consents")
      .update({ consented: false, revoked_at: new Date().toISOString() } as never)
      .eq("id", consent.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.message("Live location sharing disabled");
  };

  const respond = async (req: LocReq, approve: boolean) => {
    setBusy(true);
    if (!approve) {
      await supabase
        .from("location_requests")
        .update({ status: "denied", responded_at: new Date().toISOString() } as never)
        .eq("id", req.id);
      setBusy(false);
      return;
    }
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported on this device");
      setBusy(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { error } = await supabase
          .from("location_requests")
          .update({
            status: "approved",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy_m: pos.coords.accuracy,
            captured_at: new Date().toISOString(),
            responded_at: new Date().toISOString(),
          } as never)
          .eq("id", req.id);
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("Location shared with the owner");
      },
      (err) => {
        setBusy(false);
        toast.error(err.message || "Couldn't read location — check browser permission");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  // === Owner action ===
  const requestLocation = async () => {
    if (!isActiveConsent) return toast.error("Sitter hasn't enabled location sharing for this booking yet");
    if (!ownerHasPremium) {
      return toast.error("Live tracking is a premium feature — upgrade in Settings to use it");
    }
    setBusy(true);
    const { error } = await supabase
      .from("location_requests")
      .insert({
        booking_id: bookingId,
        owner_id: ownerId,
        sitter_id: sitterId,
        status: "pending",
      } as never);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Request sent — sitter will be notified");
  };

  const latestApproved = requests.find((r) => r.status === "approved" && r.latitude && r.longitude);
  const pendingForSitter = isSitter
    ? requests.filter((r) => r.status === "pending" && new Date(r.expires_at) > new Date())
    : [];

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-4 w-4 text-primary" />
        <div className="flex-1">
          <p className="text-sm font-700">Live pet tracking</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Owner-on-request, sitter approves each ping. No background tracking. All requests are logged.
          </p>
        </div>
      </div>

      {/* SITTER VIEW */}
      {isSitter && (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-border bg-background p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-600">
                  {isActiveConsent ? "Sharing enabled" : "Sharing disabled"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {isActiveConsent
                    ? "Owner can ask for your location. You'll approve each request."
                    : "Opt in to let the owner request your location during this booking."}
                </p>
              </div>
              {isActiveConsent ? (
                <button
                  onClick={revoke}
                  disabled={busy}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-600"
                >
                  Disable
                </button>
              ) : (
                <button
                  onClick={optIn}
                  disabled={busy}
                  className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground"
                >
                  <ShieldCheck className="h-3 w-3" /> Enable
                </button>
              )}
            </div>
          </div>

          {pendingForSitter.length > 0 && (
            <div className="space-y-2">
              {pendingForSitter.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4 text-accent-foreground" />
                    <p className="text-xs font-600">
                      Owner is requesting your location (expires {new Date(r.expires_at).toLocaleTimeString()})
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => respond(r, true)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-600 text-primary-foreground"
                    >
                      {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      Share
                    </button>
                    <button
                      onClick={() => respond(r, false)}
                      disabled={busy}
                      className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-600"
                    >
                      <X className="h-3 w-3" /> Deny
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OWNER VIEW */}
      {isOwner && (
        <div className="mt-3 space-y-3">
          {!ownerHasPremium && (
            <p className="rounded-xl bg-muted px-3 py-2 text-[11px] text-muted-foreground">
              💎 Live tracking is a premium feature. Enable it in Settings to use it.
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {isActiveConsent
                ? "Sitter has enabled sharing — request a one-time location ping anytime."
                : "Sitter hasn't enabled live sharing for this booking yet."}
            </p>
            <button
              onClick={requestLocation}
              disabled={busy || !isActiveConsent || !ownerHasPremium}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <MapPin className="h-3 w-3" />}
              Request location
            </button>
          </div>

          {latestApproved && latestApproved.latitude && latestApproved.longitude && (
            <div>
              <p className="mb-1 text-[11px] text-muted-foreground">
                Last shared {new Date(latestApproved.captured_at!).toLocaleString()}
                {latestApproved.accuracy_m ? ` · ±${Math.round(latestApproved.accuracy_m)}m` : ""}
              </p>
              <SitterMap
                pins={
                  [
                    {
                      id: latestApproved.id,
                      name: "Sitter location",
                      lat: latestApproved.latitude,
                      lng: latestApproved.longitude,
                    } as Pin,
                  ]
                }
                center={{ lat: latestApproved.latitude, lng: latestApproved.longitude }}
                className="h-56 w-full overflow-hidden rounded-xl border border-border"
              />
            </div>
          )}
        </div>
      )}

      {/* Audit log (both sides) */}
      {requests.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-600 text-muted-foreground">
            History ({requests.length})
          </summary>
          <ul className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {requests.map((r) => (
              <li key={r.id} className="flex justify-between gap-2">
                <span>
                  {new Date(r.created_at).toLocaleString()} ·{" "}
                  <span className="font-600">{r.status}</span>
                </span>
                {r.responded_at && (
                  <span>responded {new Date(r.responded_at).toLocaleTimeString()}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
