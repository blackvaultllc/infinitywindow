import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/tournaments")({
  component: TournamentsPage,
  head: () => ({
    meta: [
      { title: "Tournaments — Exodia Arena Brackets" },
      { name: "description", content: "Pay EXOD, climb the bracket, win the prize pool. 80% to players, 20% to the dynasty." },
    ],
  }),
});

interface T { id: string; name: string; description: string | null; entry_fee_exod: number; prize_pool_exod: number; max_players: number; registered_count: number; status: string; starts_at: string }

function TournamentsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<T[]>([]);

  const load = async () => {
    const { data } = await supabase.from("tournaments").select("*").order("starts_at");
    setItems((data ?? []) as T[]);
  };
  useEffect(() => { load(); }, []);

  const register = async (id: string) => {
    if (!user) return toast.error("Sign in to register.");
    const { error } = await supabase.rpc("register_tournament", { _tournament_id: id });
    if (error) return toast.error(error.message);
    toast.success("Registered. May Ra favor your draw.");
    load();
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-card/40 py-10">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Sacred Brackets</div>
          <h1 className="mt-1 font-display text-3xl md:text-5xl text-gradient-gold">Tournaments</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">80% of entry fees flow to the prize pool. Winners take 50% · 25% · 12.5% · 12.5%.</p>
        </div>
      </section>
      <section className="container mx-auto grid gap-5 px-4 py-10 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => {
          const pct = (t.registered_count / t.max_players) * 100;
          return (
            <div key={t.id} className="rounded-xl border border-border/60 bg-card/60 p-5">
              <h3 className="font-display text-xl text-gradient-gold">{t.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div><div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Entry</div><div className="font-display text-lg text-foreground">{t.entry_fee_exod} EXOD</div></div>
                <div><div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Prize Pool</div><div className="font-display text-lg text-gold">{t.prize_pool_exod} EXOD</div></div>
              </div>
              <div className="mt-3"><div className="flex justify-between text-[10px] text-muted-foreground"><span>Players</span><span>{t.registered_count} / {t.max_players}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div></div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Starts {new Date(t.starts_at).toLocaleString()}</div>
                <Button onClick={() => register(t.id)} disabled={t.status !== "upcoming" || t.registered_count >= t.max_players} className="bg-gold text-gold-foreground hover:bg-gold/90">Register</Button>
              </div>
            </div>
          );
        })}
      </section>
      {!user && <p className="pb-10 text-center text-xs text-muted-foreground"><Link to="/auth" className="underline">Sign in</Link> to register.</p>}
      <SiteFooter />
    </div>
  );
}