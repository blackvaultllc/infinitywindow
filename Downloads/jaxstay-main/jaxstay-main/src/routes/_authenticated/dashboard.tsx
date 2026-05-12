import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Camera, Loader2, Plus, Trash2, X, Settings as SettingsIcon, Dog, Briefcase, Calendar, MessageSquare, ShieldCheck, GraduationCap, Banknote, CreditCard, Clock, CheckCircle2, AlertCircle, HelpCircle, Search } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { STATES } from "@/data/cities";
import { apiFetch } from "@/lib/api-client";
import { VerificationCard } from "@/components/sitters/VerificationCard";
import { AvailabilityCalendar } from "@/components/sitters/AvailabilityCalendar";
import { BookingTimeline } from "@/components/bookings/BookingTimeline";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — JaxStay" }] }),
  component: Dashboard,
});

type Booking = {
  id: string; owner_id: string; sitter_id: string; service: string;
  start_date: string; end_date: string; status: string;
  payment_status: string; payout_released: boolean;
  amount_cents: number | null; created_at: string;
};
type MsgPreview = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string; read_at: string | null };


type Profile = {
  id: string;
  full_name: string;
  city: string | null;
  state: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_sitter: boolean;
  sitter_headline: string | null;
  sitter_rate: number | null;
  sitter_gallery: string[];
  sitter_test_passed_at: string | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
};

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  size: string;
  age_years: number | null;
  notes: string | null;
  photos: string[];
};

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [recentMsgs, setRecentMsgs] = useState<MsgPreview[]>([]);
  const [peerNames, setPeerNames] = useState<Record<string, string>>({});
  const [busyBooking, setBusyBooking] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: p }, { data: ps }, { data: roleRow }, { data: bs }, { data: ms }] = await Promise.all([
      supabase.rpc("get_my_profile"),
      supabase.from("pets").select("*").eq("owner_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle(),
      supabase.from("bookings").select("id, owner_id, sitter_id, service, start_date, end_date, status, payment_status, payout_released, amount_cents, created_at")
        .or(`owner_id.eq.${user.id},sitter_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(50),
      supabase.from("messages").select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at", { ascending: false }).limit(20),
    ]);
    setProfile(p as Profile | null);
    setPets((ps as Pet[]) ?? []);
    setIsAdmin(!!roleRow);
    const bList = (bs as Booking[]) ?? [];
    setBookings(bList);
    const mList = (ms as MsgPreview[]) ?? [];
    setRecentMsgs(mList);
    const ids = [...new Set([
      ...bList.flatMap((b) => [b.owner_id, b.sitter_id]),
      ...mList.flatMap((m) => [m.sender_id, m.recipient_id]),
    ])].filter((id) => id !== user.id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setPeerNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name ?? "—"])));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const payNow = async (id: string) => {
    setBusyBooking(id);
    try {
      const { url } = await apiFetch("/api/stripe/checkout", { method: "POST", body: JSON.stringify({ bookingId: id }) });
      window.location.href = url;
    } catch (e) { toast.error((e as Error).message); setBusyBooking(null); }
  };

  const acceptBooking = async (id: string) => {
    const { error } = await supabase.from("bookings").update({ status: "awaiting_payment" } as never).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Booking accepted — waiting for client payment");
    load();
  };


  const uploadAvatar = async (file: File) => {
    if (!user) return;
    // Sanitize filename: strip directory parts and any chars that could break the storage path
    const baseName = file.name.split(/[\\/]/).pop() || "avatar";
    const dotIdx = baseName.lastIndexOf(".");
    const ext = (dotIdx > 0 ? baseName.slice(dotIdx + 1) : "jpg").replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "jpg";
    // Stable per-user path so RLS folder check (auth.uid() = first folder) always passes
    const path = `${user.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, cacheControl: "3600", contentType: file.type || undefined });
    if (upErr) return toast.error(upErr.message);
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    const url = `${pub.publicUrl}?v=${Date.now()}`;
    const { data: updated, error: updErr } = await supabase
      .from("profiles")
      .update({ avatar_url: url } as never)
      .eq("id", user.id)
      .select("id");
    if (updErr) return toast.error(updErr.message);
    if (!updated || updated.length === 0) {
      // Profile row missing (older account) — create it
      const { error: upsertErr } = await supabase
        .from("profiles")
        .upsert({ id: user.id, avatar_url: url, full_name: user.user_metadata?.full_name ?? "", email: user.email } as never);
      if (upsertErr) return toast.error(upsertErr.message);
    }
    toast.success("Avatar updated");
    load();
  };

  const updateProfile = async (patch: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update(patch as never).eq("id", user.id);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    load();
  };

  const uploadGallery = async (file: File) => {
    if (!user || !profile) return;
    if ((profile.sitter_gallery ?? []).length >= 5) return toast.error("Max 5 photos");
    const path = `${user.id}/gallery-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("sitter-gallery").upload(path, file);
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("sitter-gallery").getPublicUrl(path);
    await supabase
      .from("profiles")
      .update({ sitter_gallery: [...(profile.sitter_gallery ?? []), pub.publicUrl] } as never)
      .eq("id", user.id);
    load();
  };

  const removeGallery = async (url: string) => {
    if (!user || !profile) return;
    await supabase
      .from("profiles")
      .update({ sitter_gallery: (profile.sitter_gallery ?? []).filter((u) => u !== url) } as never)
      .eq("id", user.id);
    load();
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-700">Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 🐾</h1>
            <p className="mt-1 text-muted-foreground">Everything for your bookings, messages, and pets — all in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/sitters" className="hidden items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground sm:flex"><Search className="h-4 w-4" /> Find a sitter</Link>
            <Link to="/help" className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted"><HelpCircle className="h-4 w-4" /> Help</Link>
            <Link to="/settings" className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted">
              <SettingsIcon className="h-4 w-4" /> Settings
            </Link>
          </div>
        </div>

        {/* Quick nav */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link to="/bookings" className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-600"><Calendar className="h-4 w-4" /> All bookings</Link>
          <Link to="/messages" className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-600"><MessageSquare className="h-4 w-4" /> Messages</Link>
          <Link to="/sitter-test" className="flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-600"><GraduationCap className="h-4 w-4" /> Sitter Test {profile?.sitter_test_passed_at ? "✓" : ""}</Link>
          {isAdmin && <Link to="/admin" className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-600"><ShieldCheck className="h-4 w-4" /> Admin</Link>}
        </div>

        {/* === OVERVIEW === */}
        <OverviewGrid
          userId={user!.id}
          bookings={bookings}
          recentMsgs={recentMsgs}
          peerNames={peerNames}
          pets={pets}
          busyBooking={busyBooking}
          onPay={payNow}
          onAccept={acceptBooking}
        />

        {/* Profile card */}
        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-start gap-5">
            <label className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border bg-muted">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full w-full place-items-center text-muted-foreground"><Camera className="h-6 w-6" /></div>
              )}
              <div className="absolute inset-0 hidden items-center justify-center bg-black/40 text-xs font-600 text-white group-hover:flex">Change</div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
            </label>

            <div className="flex-1 space-y-3">
              <input
                defaultValue={profile?.full_name ?? ""}
                onBlur={(e) => e.target.value !== profile?.full_name && updateProfile({ full_name: e.target.value })}
                placeholder="Your full name"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-base font-600 outline-none focus:border-accent"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  defaultValue={profile?.city ?? ""}
                  onBlur={(e) => e.target.value !== (profile?.city ?? "") && updateProfile({ city: e.target.value })}
                  placeholder="City (e.g. Brooklyn)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <select
                  defaultValue={profile?.state ?? ""}
                  onChange={(e) => updateProfile({ state: e.target.value || null })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">Select state</option>
                  {STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </select>
              </div>
              <textarea
                defaultValue={profile?.bio ?? ""}
                onBlur={(e) => e.target.value !== (profile?.bio ?? "") && updateProfile({ bio: e.target.value })}
                placeholder="A short bio that other users will see…"
                rows={3}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        {/* Sitter toggle + gallery */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="flex items-center gap-2 font-display text-2xl font-600"><Briefcase className="h-5 w-5 text-accent" /> Sitter listing</h2>
              <p className="mt-1 text-sm text-muted-foreground">Free to enable. Pass the qualification test to appear in search.</p>
            </div>
            {profile?.sitter_test_passed_at ? (
              <button
                onClick={() => updateProfile({ is_sitter: !profile?.is_sitter })}
                className={`rounded-full px-4 py-2 text-sm font-600 ${profile?.is_sitter ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}
              >
                {profile?.is_sitter ? "Listed as sitter ✓" : "Become a sitter"}
              </button>
            ) : (
              <Link to="/sitter-test" className="rounded-full bg-accent px-4 py-2 text-sm font-600">Take qualification test</Link>
            )}
          </div>

          {profile?.is_sitter && (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  defaultValue={profile.sitter_headline ?? ""}
                  onBlur={(e) => updateProfile({ sitter_headline: e.target.value })}
                  placeholder="Headline (e.g. Loving home, fenced yard)"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
                <input
                  type="number"
                  min={0}
                  defaultValue={profile.sitter_rate ?? ""}
                  onBlur={(e) => updateProfile({ sitter_rate: e.target.value ? Number(e.target.value) : null })}
                  placeholder="Rate per night ($)"
                  className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-600">Gallery photos ({(profile.sitter_gallery ?? []).length}/5)</p>
                <div className="flex flex-wrap gap-3">
                  {(profile.sitter_gallery ?? []).map((u) => (
                    <div key={u} className="relative h-24 w-24 overflow-hidden rounded-xl border border-border">
                      <img src={u} alt="gallery" className="h-full w-full object-cover" />
                      <button onClick={() => removeGallery(u)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {(profile.sitter_gallery ?? []).length < 5 && (
                    <label className="flex h-24 w-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border text-muted-foreground hover:bg-muted">
                      <Plus className="h-5 w-5" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadGallery(e.target.files[0])} />
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {profile?.is_sitter && <PayoutsCard profile={profile} onChange={load} />}
        {profile?.is_sitter && <VerificationCard userId={user!.id} />}
        {profile?.is_sitter && (
          <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <h2 className="flex items-center gap-2 font-display text-2xl font-600">
              <Calendar className="h-5 w-5 text-accent" /> Your availability
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tap dates to block off times you're unavailable. Owners see this on your profile so they don't request impossible dates.
            </p>
            <div className="mt-4">
              <AvailabilityCalendar sitterId={user!.id} editable />
            </div>
          </div>
        )}

        {/* Pets */}
        <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between gap-4">
            <h2 className="flex items-center gap-2 font-display text-2xl font-600"><Dog className="h-5 w-5 text-accent" /> Your pets</h2>
            <AddPetButton onAdded={load} userId={user!.id} />
          </div>
          {pets.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No pets yet — add your first dog above.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {pets.map((p) => (
                <PetRow key={p.id} pet={p} onChange={load} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}

function AddPetButton({ userId, onAdded }: { userId: string; onAdded: () => void }) {
  const [name, setName] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("pets").insert({ owner_id: userId, name: name.trim() } as never);
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Pet added");
    onAdded();
  };
  return (
    <div className="flex items-center gap-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Dog's name" className="rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-accent" />
      <button onClick={add} className="flex items-center gap-1 rounded-full bg-primary px-3 py-2 text-xs font-600 text-primary-foreground"><Plus className="h-3 w-3" /> Add</button>
    </div>
  );
}

function PetRow({ pet, onChange }: { pet: Pet; onChange: () => void }) {
  const update = async (patch: Partial<Pet>) => {
    const { error } = await supabase.from("pets").update(patch as never).eq("id", pet.id);
    if (error) toast.error(error.message);
    else onChange();
  };
  const remove = async () => {
    if (!confirm(`Remove ${pet.name}?`)) return;
    await supabase.from("pets").delete().eq("id", pet.id);
    onChange();
  };
  const uploadPhoto = async (file: File) => {
    if (pet.photos.length >= 5) return toast.error("Max 5 photos per pet");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const path = `${user.id}/${pet.id}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("pet-photos").upload(path, file);
    if (error) return toast.error(error.message);
    const { data: pub } = supabase.storage.from("pet-photos").getPublicUrl(path);
    update({ photos: [...pet.photos, pub.publicUrl] });
  };
  return (
    <li className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input defaultValue={pet.name} onBlur={(e) => e.target.value !== pet.name && update({ name: e.target.value })} className="rounded-lg border border-border bg-card px-2 py-1 text-sm font-600" />
        <input defaultValue={pet.breed ?? ""} placeholder="Breed" onBlur={(e) => update({ breed: e.target.value })} className="rounded-lg border border-border bg-card px-2 py-1 text-sm" />
        <select defaultValue={pet.size} onChange={(e) => update({ size: e.target.value as Pet["size"] })} className="rounded-lg border border-border bg-card px-2 py-1 text-sm">
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xlarge">XL</option>
        </select>
        <input type="number" defaultValue={pet.age_years ?? ""} placeholder="Age" onBlur={(e) => update({ age_years: e.target.value ? Number(e.target.value) : null })} className="w-20 rounded-lg border border-border bg-card px-2 py-1 text-sm" />
        <button onClick={remove} className="ml-auto grid h-8 w-8 place-items-center rounded-full text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pet.photos.map((u) => (
          <div key={u} className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
            <img src={u} alt="pet" className="h-full w-full object-cover" />
            <button onClick={() => update({ photos: pet.photos.filter((p) => p !== u) })} className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/60 text-white"><X className="h-3 w-3" /></button>
          </div>
        ))}
        {pet.photos.length < 5 && (
          <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-border text-muted-foreground hover:bg-muted">
            <Plus className="h-4 w-4" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
          </label>
        )}
      </div>
    </li>
  );
}

function PayoutsCard({ profile, onChange }: { profile: Profile; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);

  const connect = async () => {
    setBusy("connect");
    try {
      const { url } = await apiFetch("/api/stripe/connect-onboard", { method: "POST" });
      window.location.href = url;
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(null);
    }
  };
  const refresh = async () => {
    setBusy("refresh");
    try {
      await apiFetch("/api/stripe/connect-status", { method: "POST" });
      toast.success("Status refreshed");
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const ready = profile.stripe_charges_enabled && profile.stripe_payouts_enabled;

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-600">
            <Banknote className="h-5 w-5 text-accent" /> Payouts
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Connect Stripe to get paid securely. Funds are held in escrow and released once the job is done.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2.5 py-1 font-600 ${ready ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
              {ready ? "Ready to accept payments" : profile.stripe_account_id ? "Onboarding in progress" : "Not connected"}
            </span>
            {profile.stripe_account_id && (
              <span className="text-muted-foreground">
                Charges {profile.stripe_charges_enabled ? "✓" : "—"} · Payouts {profile.stripe_payouts_enabled ? "✓" : "—"}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.stripe_account_id && (
            <button onClick={refresh} disabled={busy === "refresh"} className="rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted">
              {busy === "refresh" ? "…" : "Refresh status"}
            </button>
          )}
          <button onClick={connect} disabled={busy === "connect"} className="rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground">
            {busy === "connect" ? "Opening…" : ready ? "Manage Stripe" : profile.stripe_account_id ? "Continue setup" : "Connect Stripe"}
          </button>
        </div>
      </div>

      <ol className="mt-5 grid gap-2 rounded-2xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
        {[
          ["1", "Connect Stripe", "One-time setup, ~3 minutes. Stripe handles tax forms & bank info securely."],
          ["2", "Owner books & pays", "Client pays through JaxStay using a card."],
          ["3", "Funds held in escrow", "Money is safely held until the job is finished."],
          ["4", "Both parties confirm", "After the booking ends, the owner marks the job complete."],
          ["5", "Auto-release", "If nobody confirms within 24 hours of the end date, payout is released automatically."],
          ["6", "Paid to your bank", "Stripe transfers your earnings (minus 15% platform fee) to your bank in 1–2 business days."],
        ].map(([n, t, d]) => (
          <li key={n} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-700 text-primary-foreground">{n}</span>
            <div>
              <p className="font-600">{t}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </div>
          </li>
        ))}
      </ol>
      {!profile.stripe_account_id && (
        <p className="mt-3 rounded-xl border border-dashed border-border bg-background p-3 text-xs text-muted-foreground">
          💡 If the Stripe page shows an error or dead-end, just close it and click <span className="font-600">Connect Stripe</span> again — the link is single-use and expires after a few minutes.
        </p>
      )}
    </div>
  );
}

// ============================================================
// Unified dashboard overview
// ============================================================
function OverviewGrid({
  userId, bookings, recentMsgs, peerNames, pets, busyBooking, onPay, onAccept,
}: {
  userId: string;
  bookings: Booking[];
  recentMsgs: MsgPreview[];
  peerNames: Record<string, string>;
  pets: Pet[];
  busyBooking: string | null;
  onPay: (id: string) => void;
  onAccept: (id: string) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const actionNeeded = useMemo(() => bookings.filter((b) => {
    const isOwner = b.owner_id === userId;
    if (isOwner && b.status === "awaiting_payment") return true;
    if (!isOwner && b.status === "pending") return true;
    return false;
  }), [bookings, userId]);

  const upcoming = useMemo(() => bookings
    .filter((b) => (b.status === "confirmed" || b.status === "accepted" || b.payment_status === "paid") && b.end_date >= today && !b.payout_released)
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, 4), [bookings, today]);

  const pending = useMemo(() => bookings.filter((b) => b.status === "pending").slice(0, 4), [bookings]);

  // group messages by peer, latest per peer
  const threads = useMemo(() => {
    const map = new Map<string, MsgPreview>();
    for (const m of recentMsgs) {
      const peer = m.sender_id === userId ? m.recipient_id : m.sender_id;
      if (!map.has(peer)) map.set(peer, m);
    }
    return Array.from(map.entries()).slice(0, 4);
  }, [recentMsgs, userId]);

  return (
    <div className="mt-8 grid gap-5 lg:grid-cols-3">
      {/* Action needed */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-600">Action needed</h2>
          <span className="ml-auto text-xs text-muted-foreground">{actionNeeded.length} item{actionNeeded.length === 1 ? "" : "s"}</span>
        </div>
        {actionNeeded.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">You're all caught up. 🎉</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {actionNeeded.map((b) => {
              const isOwner = b.owner_id === userId;
              const peer = peerNames[isOwner ? b.sitter_id : b.owner_id] ?? "—";
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-background p-4">
                  <div className="min-w-0">
                    <p className="font-600 capitalize">{b.service.replace(/_/g, " ")} — {peer}</p>
                    <p className="text-xs text-muted-foreground">{b.start_date} → {b.end_date}{b.amount_cents ? ` · $${(b.amount_cents/100).toFixed(2)}` : ""}</p>
                  </div>
                  {isOwner ? (
                    <button
                      onClick={() => onPay(b.id)}
                      disabled={busyBooking === b.id}
                      className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground"
                    >
                      {busyBooking === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Pay now
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => onAccept(b.id)} className="rounded-full bg-primary px-3 py-1.5 text-xs font-600 text-primary-foreground">Accept</button>
                      <Link to="/bookings" className="rounded-full border border-border px-3 py-1.5 text-xs">Review</Link>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Messages preview */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-600">Messages</h2>
          <Link to="/messages" className="ml-auto text-xs text-primary hover:underline">Open inbox</Link>
        </div>
        {threads.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {threads.map(([peer, m]) => {
              const unread = m.recipient_id === userId && !m.read_at;
              return (
                <li key={peer}>
                  <Link to="/messages" search={{ peer }} className="flex items-start gap-3 rounded-xl p-2 hover:bg-muted">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-600">
                      {(peerNames[peer] ?? "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${unread ? "font-700" : "font-600"}`}>{peerNames[peer] ?? "—"}</p>
                        {unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">{m.body}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Upcoming */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-2">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-600">Upcoming appointments</h2>
          <Link to="/bookings" className="ml-auto text-xs text-primary hover:underline">All bookings</Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled. <Link to="/sitters" className="text-primary underline">Find a sitter</Link>.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {upcoming.map((b) => {
              const isOwner = b.owner_id === userId;
              const peer = peerNames[isOwner ? b.sitter_id : b.owner_id] ?? "—";
              return (
                <li key={b.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-600 capitalize">{b.service.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground">{isOwner ? "with" : "for"} {peer}</p>
                    </div>
                    <PaymentChip booking={b} />
                  </div>
                  <p className="mt-2 text-sm">{b.start_date} → {b.end_date}</p>
                  <div className="mt-3"><BookingTimeline booking={b} /></div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pets summary */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2">
          <Dog className="h-5 w-5 text-accent" />
          <h2 className="font-display text-xl font-600">Your pets</h2>
          <span className="ml-auto text-xs text-muted-foreground">{pets.length}</span>
        </div>
        {pets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Add a pet below to make booking faster.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pets.slice(0, 4).map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-xl bg-background p-2">
                {p.photos[0] ? (
                  <img src={p.photos[0]} alt={p.name} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-secondary"><Dog className="h-4 w-4" /></div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-600">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{[p.breed, p.size, p.age_years && `${p.age_years}y`].filter(Boolean).join(" · ") || "—"}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pending requests (sitter-side) */}
      {pending.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft lg:col-span-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-accent" />
            <h2 className="font-display text-xl font-600">Pending booking requests</h2>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((b) => {
              const isOwner = b.owner_id === userId;
              const peer = peerNames[isOwner ? b.sitter_id : b.owner_id] ?? "—";
              return (
                <li key={b.id} className="rounded-2xl border border-border bg-background p-4">
                  <p className="font-600 capitalize">{b.service.replace(/_/g, " ")}</p>
                  <p className="text-xs text-muted-foreground">{isOwner ? "to" : "from"} {peer}</p>
                  <p className="mt-1 text-sm">{b.start_date} → {b.end_date}</p>
                  <Link to="/bookings" className="mt-3 inline-block text-xs font-600 text-primary hover:underline">Open →</Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function PaymentChip({ booking }: { booking: Booking }) {
  if (booking.payout_released) return <Chip className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Paid out</Chip>;
  if (booking.payment_status === "paid") return <Chip className="bg-primary/15 text-primary"><Banknote className="h-3 w-3" /> Paid · held</Chip>;
  if (booking.status === "awaiting_payment") return <Chip className="bg-accent/20"><CreditCard className="h-3 w-3" /> Awaiting payment</Chip>;
  return <Chip className="bg-muted text-muted-foreground">{booking.status.replace(/_/g, " ")}</Chip>;
}

function Chip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-600 ${className ?? ""}`}>{children}</span>;
}
