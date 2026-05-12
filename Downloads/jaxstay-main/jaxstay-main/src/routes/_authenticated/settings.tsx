import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LogOut, Trash2, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — JaxStay" }] }),
  component: Settings,
});

type TierPrices = Partial<Record<"tier_0_5" | "tier_6_15" | "tier_16_30" | "tier_31_50" | "tier_50_plus", number>>;

type PrivacyForm = {
  inactive: boolean;
  hide_past_pets: boolean;
  accepts_dogs: boolean;
  accepts_cats: boolean;
  max_pet_weight_lbs: number | null;
  address_line: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  is_sitter: boolean;
  sitter_transport_enabled: boolean;
  sitter_transport_has_vehicle: boolean;
  sitter_transport_multi_pet: boolean;
  sitter_transport_has_crate: boolean;
  sitter_transport_prices_by_tier: TierPrices;
  sitter_extra_stop_fee_cents: number | null;
  sitter_waiting_fee_per_hour_cents: number | null;
};

function Settings() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyForm | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.rpc("get_my_profile");
      if (data) {
        const d = data as typeof data & {
          sitter_transport_enabled?: boolean;
          sitter_transport_has_vehicle?: boolean;
          sitter_transport_multi_pet?: boolean;
          sitter_transport_has_crate?: boolean;
          sitter_transport_prices_by_tier?: TierPrices;
          sitter_extra_stop_fee_cents?: number | null;
          sitter_waiting_fee_per_hour_cents?: number | null;
        };
        setPrivacy({
          inactive: d.inactive ?? false,
          hide_past_pets: d.hide_past_pets ?? true,
          accepts_dogs: d.accepts_dogs ?? true,
          accepts_cats: d.accepts_cats ?? false,
          max_pet_weight_lbs: d.max_pet_weight_lbs,
          address_line: d.address_line ?? "",
          city: d.city ?? "",
          state: d.state ?? "",
          zip: d.zip ?? "",
          phone: d.phone ?? "",
          is_sitter: d.is_sitter ?? false,
          sitter_transport_enabled: d.sitter_transport_enabled ?? false,
          sitter_transport_has_vehicle: d.sitter_transport_has_vehicle ?? false,
          sitter_transport_multi_pet: d.sitter_transport_multi_pet ?? false,
          sitter_transport_has_crate: d.sitter_transport_has_crate ?? false,
          sitter_transport_prices_by_tier: (d.sitter_transport_prices_by_tier ?? {}) as TierPrices,
          sitter_extra_stop_fee_cents: d.sitter_extra_stop_fee_cents ?? null,
          sitter_waiting_fee_per_hour_cents: d.sitter_waiting_fee_per_hour_cents ?? null,
        });
      }
    })();
  }, [user]);

  const savePrivacy = async () => {
    if (!user || !privacy) return;
    setSavingPrivacy(true);

    // Geocode city/state/zip via OpenStreetMap Nominatim so the sitter shows up on the map.
    let latitude: number | null = null;
    let longitude: number | null = null;
    const cityStr = privacy.city.trim();
    const stateStr = privacy.state.trim();
    const zipStr = privacy.zip.trim();
    if (cityStr || zipStr) {
      try {
        const q = encodeURIComponent(
          [cityStr, stateStr, zipStr, "USA"].filter(Boolean).join(", "),
        );
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${q}`,
          { headers: { Accept: "application/json" } },
        );
        const j = (await r.json()) as Array<{ lat: string; lon: string }>;
        if (j[0]) {
          latitude = parseFloat(j[0].lat);
          longitude = parseFloat(j[0].lon);
        }
      } catch {
        /* non-fatal — fall back to city centroid lookup on map */
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        inactive: privacy.inactive,
        hide_past_pets: privacy.hide_past_pets,
        accepts_dogs: privacy.accepts_dogs,
        accepts_cats: privacy.accepts_cats,
        max_pet_weight_lbs: privacy.max_pet_weight_lbs,
        address_line: privacy.address_line || null,
        city: cityStr || null,
        state: stateStr || null,
        zip: zipStr || null,
        phone: privacy.phone || null,
        latitude,
        longitude,
        sitter_transport_enabled: privacy.sitter_transport_enabled,
        sitter_transport_has_vehicle: privacy.sitter_transport_has_vehicle,
        sitter_transport_multi_pet: privacy.sitter_transport_multi_pet,
        sitter_transport_has_crate: privacy.sitter_transport_has_crate,
        sitter_transport_prices_by_tier: privacy.sitter_transport_prices_by_tier,
        sitter_extra_stop_fee_cents: privacy.sitter_extra_stop_fee_cents,
        sitter_waiting_fee_per_hour_cents: privacy.sitter_waiting_fee_per_hour_cents,
      } as never)
      .eq("id", user.id);
    setSavingPrivacy(false);
    if (error) return toast.error(error.message);
    toast.success(
      latitude != null
        ? "Settings saved — your pin is on the map"
        : "Settings saved",
    );
  };

  const deleteAccount = async () => {
    if (confirmText !== "DELETE") return toast.error('Type DELETE to confirm');
    setBusy(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });
      if (!resp.ok) {
        const j = await resp.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed");
      }
      toast.success("Account deleted");
      await signOut();
      nav({ to: "/" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-4xl font-700">Settings</h1>
        <p className="mt-1 text-muted-foreground">{user?.email}</p>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 font-display text-xl font-600">
            <Shield className="h-5 w-5 text-primary" /> Privacy & Service Settings
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your full address and phone are only revealed to a pet owner after a booking is accepted. Public visitors see only your first name, neighborhood, and bio.
          </p>

          {!privacy ? (
            <div className="mt-6 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (
            <div className="mt-6 space-y-5">
              {privacy.is_sitter && (
                <>
                  <Toggle label="Hide from search (Inactive)" hint="Hides your profile from new clients. Existing clients can still book." checked={privacy.inactive} onChange={(v) => setPrivacy({ ...privacy, inactive: v })} />
                  <Toggle label="Hide past clients' pets from gallery" hint="Photos from past bookings won't appear on your public profile." checked={privacy.hide_past_pets} onChange={(v) => setPrivacy({ ...privacy, hide_past_pets: v })} />

                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-sm font-600">Booking preferences</p>
                    <p className="text-xs text-muted-foreground">Filter the kinds of pets you'll accept.</p>
                    <div className="mt-3 space-y-3">
                      <Toggle label="I accept dogs" checked={privacy.accepts_dogs} onChange={(v) => setPrivacy({ ...privacy, accepts_dogs: v })} />
                      <Toggle label="I accept cats" checked={privacy.accepts_cats} onChange={(v) => setPrivacy({ ...privacy, accepts_cats: v })} />
                      <label className="block text-xs font-500">Max pet weight (lbs) — leave empty for no limit
                        <input
                          type="number"
                          value={privacy.max_pet_weight_lbs ?? ""}
                          onChange={(e) => setPrivacy({ ...privacy, max_pet_weight_lbs: e.target.value ? Number(e.target.value) : null })}
                          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                          placeholder="e.g. 20"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-muted/40 p-4">
                    <p className="text-sm font-600">🚗 Pet Transportation</p>
                    <p className="text-xs text-muted-foreground">Offer trips to the vet, groomer, or anywhere else owners need their pet driven.</p>
                    <div className="mt-3 space-y-3">
                      <Toggle label="I offer Pet Transportation" checked={privacy.sitter_transport_enabled} onChange={(v) => setPrivacy({ ...privacy, sitter_transport_enabled: v })} />
                      {privacy.sitter_transport_enabled && (
                        <>
                          <Toggle label="I have a vehicle suitable for pets" checked={privacy.sitter_transport_has_vehicle} onChange={(v) => setPrivacy({ ...privacy, sitter_transport_has_vehicle: v })} />
                          <Toggle label="I can transport multiple pets" checked={privacy.sitter_transport_multi_pet} onChange={(v) => setPrivacy({ ...privacy, sitter_transport_multi_pet: v })} />
                          <Toggle label="I provide a crate or seatbelt harness" checked={privacy.sitter_transport_has_crate} onChange={(v) => setPrivacy({ ...privacy, sitter_transport_has_crate: v })} />

                          <div className="space-y-2 rounded-xl bg-background p-3">
                            <p className="text-xs font-600">Pricing per distance tier (USD)</p>
                            {([
                              ["tier_0_5", "0–5 miles"],
                              ["tier_6_15", "6–15 miles"],
                              ["tier_16_30", "16–30 miles"],
                              ["tier_31_50", "31–50 miles"],
                            ] as const).map(([key, label]) => (
                              <label key={key} className="flex items-center justify-between gap-3 text-xs font-500">
                                <span>{label}</span>
                                <input
                                  type="number" min={0} step="1"
                                  value={privacy.sitter_transport_prices_by_tier[key] ?? ""}
                                  onChange={(e) => setPrivacy({
                                    ...privacy,
                                    sitter_transport_prices_by_tier: {
                                      ...privacy.sitter_transport_prices_by_tier,
                                      [key]: e.target.value ? Number(e.target.value) : undefined,
                                    },
                                  })}
                                  className="w-28 rounded-lg border border-border bg-background px-2 py-1.5 text-right text-sm"
                                  placeholder="$"
                                />
                              </label>
                            ))}
                            <p className="pt-1 text-[11px] text-muted-foreground">50+ miles requires a custom quote — owners will message you.</p>
                          </div>

                          <label className="block text-xs font-500">Extra-stop fee (USD, optional)
                            <input type="number" min={0} value={privacy.sitter_extra_stop_fee_cents != null ? privacy.sitter_extra_stop_fee_cents / 100 : ""}
                              onChange={(e) => setPrivacy({ ...privacy, sitter_extra_stop_fee_cents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 10" />
                          </label>
                          <label className="block text-xs font-500">Waiting fee per hour (USD, optional)
                            <input type="number" min={0} value={privacy.sitter_waiting_fee_per_hour_cents != null ? privacy.sitter_waiting_fee_per_hour_cents / 100 : ""}
                              onChange={(e) => setPrivacy({ ...privacy, sitter_waiting_fee_per_hour_cents: e.target.value ? Math.round(Number(e.target.value) * 100) : null })}
                              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="e.g. 20" />
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="rounded-2xl bg-muted/40 p-4">
                <p className="text-sm font-600">Private contact info</p>
                <p className="text-xs text-muted-foreground">Stored privately. Only shown after a booking is accepted.</p>
                <div className="mt-3 space-y-3">
                  <label className="block text-xs font-500">Phone
                    <input value={privacy.phone} onChange={(e) => setPrivacy({ ...privacy, phone: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="(555) 555-5555" />
                  </label>
                  <label className="block text-xs font-500">Street address
                    <input value={privacy.address_line} onChange={(e) => setPrivacy({ ...privacy, address_line: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="123 Main St, Apt 4" />
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="col-span-2 block text-xs font-500">City
                      <input value={privacy.city} onChange={(e) => setPrivacy({ ...privacy, city: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="Mobile" />
                    </label>
                    <label className="block text-xs font-500">State
                      <input value={privacy.state} onChange={(e) => setPrivacy({ ...privacy, state: e.target.value.toUpperCase().slice(0,2) })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="AL" maxLength={2} />
                    </label>
                  </div>
                  <label className="block text-xs font-500">ZIP
                    <input value={privacy.zip} onChange={(e) => setPrivacy({ ...privacy, zip: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" placeholder="36601" />
                  </label>
                  {privacy.is_sitter && (
                    <p className="text-[11px] text-muted-foreground">
                      📍 Your city, state, and ZIP are used to place your pin on the sitter map so nearby pet owners can find you. Your street address stays private.
                    </p>
                  )}
                </div>
              </div>

              <button onClick={savePrivacy} disabled={savingPrivacy} className="rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground shadow-soft disabled:opacity-50">
                {savingPrivacy ? "Saving…" : "Save privacy settings"}
              </button>
            </div>
          )}
        </div>

        <TrackingPremiumCard />

        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-600">Account</h2>
          <button onClick={async () => { await signOut(); nav({ to: "/" }); }} className="mt-4 flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-destructive/30 bg-destructive/5 p-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-600 text-destructive"><AlertTriangle className="h-5 w-5" /> Delete account</h2>
          <p className="mt-2 text-sm text-foreground/80">
            This permanently removes your profile, pets, photos, bookings, and messages. This cannot be undone.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='Type "DELETE" to confirm'
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-destructive"
            />
            <button
              disabled={busy || confirmText !== "DELETE"}
              onClick={deleteAccount}
              className="flex items-center justify-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-600 text-destructive-foreground disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" /> {busy ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-600">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </button>
    </label>
  );
}

function TrackingPremiumCard() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("tracking_premium")
        .eq("id", user.id)
        .maybeSingle();
      setEnabled(!!(data as { tracking_premium?: boolean } | null)?.tracking_premium);
    })();
  }, [user]);

  const toggle = async () => {
    if (!user || enabled === null) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ tracking_premium: !enabled } as never)
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    setEnabled(!enabled);
    toast.success(!enabled ? "Live tracking enabled" : "Live tracking disabled");
  };

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <h2 className="font-display text-xl font-600">📍 Live Pet Tracking (Premium)</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        While a sitter is caring for your pet, you can request a one-time location ping. The sitter must opt in per booking and approve every request — no background tracking, no surprise location sharing. Every request is logged.
      </p>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Currently free during early access. Paid subscription coming soon.
      </p>
      <button
        onClick={toggle}
        disabled={busy || enabled === null}
        className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground shadow-soft disabled:opacity-50"
      >
        {enabled === null ? "Loading…" : busy ? "Saving…" : enabled ? "Disable live tracking" : "Enable live tracking"}
      </button>
    </div>
  );
}
