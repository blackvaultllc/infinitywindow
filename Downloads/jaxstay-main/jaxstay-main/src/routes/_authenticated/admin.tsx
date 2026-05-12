import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Star, EyeOff, Eye, Trash2, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — JaxStay" }] }),
  component: AdminPage,
});

type Review = { id: string; sitter_id: string; author_id: string; rating: number; body: string | null; hidden: boolean; created_at: string };
type Sitter = { id: string; full_name: string; city: string | null; state: string | null; is_sitter: boolean; sitter_test_passed_at: string | null };

function AdminPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!data);
    })();
  }, [user]);

  const load = async () => {
    const { data: rs } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
    const { data: ss } = await supabase.from("profiles").select("id, full_name, city, state, is_sitter, sitter_test_passed_at").eq("is_sitter", true);
    setReviews((rs as Review[]) ?? []);
    setSitters((ss as Sitter[]) ?? []);
    const ids = [...new Set([...(rs ?? []).flatMap((r) => [r.sitter_id, r.author_id]), ...(ss ?? []).map((s) => s.id)])];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name])));
    }
  };
  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  if (isAdmin === null) return <SiteLayout><div className="p-12 text-center text-muted-foreground">Loading…</div></SiteLayout>;
  if (!isAdmin) return (
    <SiteLayout>
      <div className="mx-auto max-w-xl py-24 text-center">
        <ShieldCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h1 className="mt-4 font-display text-2xl font-700">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Your account ({user?.email}) does not have the admin role. Add it to the <code>user_roles</code> table to access this panel.</p>
      </div>
    </SiteLayout>
  );

  const toggleHidden = async (r: Review) => {
    const { error } = await supabase.from("reviews").update({ hidden: !r.hidden } as never).eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };
  const deleteReview = async (id: string) => {
    if (!confirm("Delete review?")) return;
    await supabase.from("reviews").delete().eq("id", id);
    load();
  };
  const unlistSitter = async (id: string) => {
    if (!confirm("Remove this sitter from search?")) return;
    await supabase.from("profiles").update({ is_sitter: false } as never).eq("id", id);
    load();
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-700">Admin Panel</h1>
        <p className="mt-1 text-sm text-muted-foreground">Moderate reviews, ratings, and sitter listings.</p>

        <h2 className="mt-10 font-display text-xl font-700">Reviews ({reviews.length})</h2>
        <ul className="mt-3 space-y-2">
          {reviews.map((r) => (
            <li key={r.id} className={`rounded-2xl border border-border p-4 ${r.hidden ? "opacity-60" : ""} bg-card`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div>
                    <span className="font-600">{names[r.author_id]}</span>
                    <span className="text-muted-foreground">→ {names[r.sitter_id]}</span>
                  </div>
                  {r.body && <p className="mt-1 text-sm">{r.body}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleHidden(r)} className="rounded-full border border-border px-3 py-1 text-xs">{r.hidden ? <Eye className="inline h-3 w-3" /> : <EyeOff className="inline h-3 w-3" />} {r.hidden ? "Unhide" : "Hide"}</button>
                  <button onClick={() => deleteReview(r.id)} className="rounded-full border border-destructive px-3 py-1 text-xs text-destructive"><Trash2 className="inline h-3 w-3" /> Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-display text-xl font-700">Sitters ({sitters.length})</h2>
        <ul className="mt-3 space-y-2">
          {sitters.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="font-600">{s.full_name}</p>
                <p className="text-xs text-muted-foreground">{s.city}{s.state ? `, ${s.state}` : ""} · {s.sitter_test_passed_at ? "Test passed" : "Not tested"}</p>
              </div>
              <button onClick={() => unlistSitter(s.id)} className="rounded-full border border-border px-3 py-1 text-xs">Unlist</button>
            </li>
          ))}
        </ul>
      </section>
    </SiteLayout>
  );
}
