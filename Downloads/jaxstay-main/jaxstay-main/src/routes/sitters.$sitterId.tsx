import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Star, Shield, MapPin, Award, Loader2, BadgeCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { TransportBookingForm } from "@/components/sitters/TransportBookingForm";
import { AvailabilityCalendar } from "@/components/sitters/AvailabilityCalendar";
import type { TierPrices } from "@/lib/transport-pricing";

export const Route = createFileRoute("/sitters/$sitterId")({
  head: () => ({ meta: [{ title: "Sitter Profile — JaxStay" }] }),
  component: SitterDetail,
});

type Profile = {
  id: string; full_name: string; city: string | null; state: string | null;
  bio: string | null; avatar_url: string | null; sitter_headline: string | null;
  sitter_rate: number | null; sitter_years_experience: number | null;
  sitter_gallery: string[]; is_sitter: boolean; sitter_test_passed_at: string | null;
  verification_status?: string;
  sitter_transport_enabled?: boolean;
  sitter_transport_prices_by_tier?: TierPrices;
  sitter_extra_stop_fee_cents?: number | null;
  sitter_waiting_fee_per_hour_cents?: number | null;
};
type Review = { id: string; rating: number; body: string | null; created_at: string; author_id: string; hidden: boolean; author_name?: string };

function SitterDetail() {
  const { sitterId } = Route.useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, city, state, bio, avatar_url, is_sitter, sitter_headline, sitter_rate, sitter_services, sitter_years_experience, sitter_gallery, sitter_test_passed_at, verification_status, accepts_dogs, accepts_cats, max_pet_weight_lbs, inactive, hide_past_pets, created_at, updated_at, sitter_transport_enabled, sitter_transport_prices_by_tier, sitter_extra_stop_fee_cents, sitter_waiting_fee_per_hour_cents")
      .eq("id", sitterId)
      .maybeSingle();
    setProfile(p as Profile | null);
    const { data: rs } = await supabase.from("reviews").select("*").eq("sitter_id", sitterId).eq("hidden", false).order("created_at", { ascending: false });
    const list = (rs as Review[]) ?? [];
    if (list.length) {
      const authorIds = [...new Set(list.map((r) => r.author_id))];
      const { data: authors } = await supabase.from("profiles").select("id, full_name").in("id", authorIds);
      const map = Object.fromEntries((authors ?? []).map((a) => [a.id, a.full_name]));
      list.forEach((r) => (r.author_name = map[r.author_id] ?? "JaxStay member"));
    }
    setReviews(list);
    setLoading(false);
  };
  useEffect(() => { load(); }, [sitterId]);

  if (loading) return <SiteLayout><div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></SiteLayout>;
  if (!profile || !profile.is_sitter) return (
    <SiteLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-700">Sitter not found</h1>
        <Link to="/sitters" className="mt-4 inline-block text-primary underline">Browse sitters</Link>
      </div>
    </SiteLayout>
  );

  const avg = reviews.length ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const submitBooking = async (form: FormData) => {
    if (!user) { nav({ to: "/login", search: { mode: "signup", redirect: `/sitters/${sitterId}` } as never }); return; }
    if (user.id === profile.id) return toast.error("You can't book yourself");
    const start = form.get("start") as string;
    const end = form.get("end") as string;
    const service = form.get("service") as string;
    const message = form.get("message") as string;
    const { error } = await supabase.from("bookings").insert({
      owner_id: user.id, sitter_id: profile.id, service, start_date: start, end_date: end, message, status: "pending",
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Request sent!");
    nav({ to: "/dashboard" });
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <Link to="/sitters" className="text-sm text-muted-foreground hover:text-foreground">← All sitters</Link>
        <div className="mt-6 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl shadow-warm bg-muted aspect-square w-full max-w-[360px] mx-auto">
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-7xl font-700 text-muted-foreground">{profile.full_name[0]}</div>}
          </div>
          <div>
            {profile.verification_status === "approved" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-700 text-amber-700 dark:text-amber-300"><BadgeCheck className="h-3 w-3" /> Verified</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-600 text-foreground"><Shield className="h-3 w-3" /> Qualified</span>
            )}
            <h1 className="mt-3 font-display text-4xl font-700">{profile.full_name}</h1>
            <p className="mt-1 flex items-center gap-1 text-muted-foreground"><MapPin className="h-4 w-4" />{profile.city}{profile.state ? `, ${profile.state}` : ""}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-600">{reviews.length ? avg.toFixed(1) : "New sitter"}</span>
              <span className="text-muted-foreground">({reviews.length} reviews)</span>
              {profile.sitter_years_experience ? <span className="ml-2 inline-flex items-center gap-1 text-muted-foreground"><Award className="h-3 w-3" />{profile.sitter_years_experience}y experience</span> : null}
            </div>
            {profile.sitter_rate != null && <p className="mt-4 text-2xl font-700">${profile.sitter_rate}<span className="text-base text-muted-foreground"> / night</span></p>}
            <p className="mt-4 text-foreground/80">{profile.bio ?? profile.sitter_headline ?? "Trusted JaxStay sitter."}</p>

            <form onSubmit={(e) => { e.preventDefault(); submitBooking(new FormData(e.currentTarget)); }} className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
              <h3 className="font-display text-lg font-600">Request a booking</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-500">Service
                  <select name="service" required className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm">
                    <option>Boarding</option><option>Daycare</option><option>Walks</option><option>Drop-in visits</option><option>House sitting</option>
                  </select>
                </label>
                <label className="text-xs font-500">Start<input type="date" name="start" required className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
                <label className="text-xs font-500">End<input type="date" name="end" required className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
              </div>
              <label className="mt-3 block text-xs font-500">Message<textarea name="message" rows={3} placeholder="Tell the sitter about your dog…" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" /></label>
              <button type="submit" className="mt-4 w-full rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground shadow-soft transition hover:scale-[1.01]">{user ? "Send booking request — free" : "Sign up to book this sitter"}</button>
              <p className="mt-2 text-center text-[11px] text-muted-foreground">No charge to request. Payment handled offline (marketplace payouts launching soon).</p>
            </form>

            {profile.sitter_transport_enabled && (
              <div className="mt-6">
                <TransportBookingForm
                  sitterId={profile.id}
                  sitterName={profile.full_name}
                  prices={(profile.sitter_transport_prices_by_tier ?? {}) as TierPrices}
                  extraStopFeeCents={profile.sitter_extra_stop_fee_cents ?? null}
                  waitingFeePerHourCents={profile.sitter_waiting_fee_per_hour_cents ?? null}
                />
              </div>
            )}
          </div>
        </div>

        {profile.sitter_gallery?.length > 0 && (
          <div className="mt-12">
            <h2 className="font-display text-2xl font-700">Gallery</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {profile.sitter_gallery.map((u) => <img key={u} src={u} alt="" className="aspect-square rounded-xl object-cover" />)}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="font-display text-2xl font-700">Availability</h2>
          <p className="mt-1 text-sm text-muted-foreground">Green = available · grey = blocked off · orange = already booked.</p>
          <div className="mt-4 max-w-md">
            <AvailabilityCalendar sitterId={profile.id} />
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-display text-2xl font-700">Reviews ({reviews.length})</h2>
          {reviews.length === 0 ? <p className="mt-3 text-muted-foreground">No reviews yet — be the first after your first booking.</p> : (
            <ul className="mt-4 space-y-4">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div>
                    <span className="text-sm font-600">{r.author_name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.body && <p className="mt-2 text-sm text-foreground/80">{r.body}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
