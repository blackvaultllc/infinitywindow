import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { CARDS, rarityLabel } from "@/data/cards";
import { toast } from "sonner";
import { useAudio } from "@/components/AudioProvider";

export const Route = createFileRoute("/drops")({
  component: DropsPage,
  head: () => ({
    meta: [
      { title: "Drop Center — Limited Edition Pack Drops" },
      { name: "description", content: "Live and upcoming Exodia pack drops with deterministic rarity odds and finite supply." },
    ],
  }),
});

interface Drop {
  id: string; name: string; description: string | null; price_exod: number; cards_per_pack: number;
  total_supply: number; remaining_supply: number; rarity_weights: Record<string, number>;
  drop_at: string; closes_at: string | null; status: string;
}

function rollPack(weights: Record<string, number>, count: number) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  const picks: typeof CARDS = [];
  for (let i = 0; i < count; i++) {
    const r = Math.random() * total;
    let acc = 0; let rarity = entries[0][0];
    for (const [k, v] of entries) { acc += v; if (r < acc) { rarity = k; break; } }
    const pool = CARDS.filter(c => c.rarity === rarity);
    if (pool.length === 0) continue;
    picks.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return picks;
}

function DropsPage() {
  const { user } = useAuth();
  const { playSfx } = useAudio();
  const [drops, setDrops] = useState<Drop[]>([]);
  const [opening, setOpening] = useState<{ name: string; cards: typeof CARDS } | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [pendingFreePacks, setPendingFreePacks] = useState(0);

  useEffect(() => {
    supabase.from("pack_drops").select("*").order("drop_at").then(({ data }) => setDrops((data ?? []) as Drop[]));
  }, []);

  useEffect(() => {
    if (!user) { setPendingFreePacks(0); return; }
    supabase.from("profiles").select("pending_free_packs").eq("id", user.id).maybeSingle()
      .then(({ data }) => setPendingFreePacks((data?.pending_free_packs as number) ?? 0));
  }, [user]);

  const buyPack = async (d: Drop) => {
    if (!user) return toast.error("Sign in to open packs.");
    if (d.remaining_supply <= 0) return toast.error("Sold out.");
    if (d.status !== "active") return toast.error("Drop not yet active.");
    const cards = rollPack(d.rarity_weights, d.cards_per_pack);
    // Optimistic supply decrement
    const { error } = await supabase.from("pack_drops").update({ remaining_supply: d.remaining_supply - 1 }).eq("id", d.id);
    if (error) return toast.error(error.message);
    await supabase.from("pack_purchases").insert({ user_id: user.id, drop_id: d.id, cards_received: cards.map(c => ({ id: c.id, name: c.name, rarity: c.rarity })) });
    await supabase.from("platform_revenue").insert({ source: "pack_sale", amount: d.price_exod, currency: "EXOD", ref_id: d.id });
    // EXOD deduction is left for Phase-3 atomic RPC; for now we log the revenue and animate.
    setDrops((ds) => ds.map(x => x.id === d.id ? { ...x, remaining_supply: x.remaining_supply - 1 } : x));
    setOpening({ name: d.name, cards });
    setRevealed(0);
    playSfx("magic");
  };

  const claimFreePack = async (d: Drop) => {
    if (!user) return toast.error("Sign in to claim.");
    if (pendingFreePacks <= 0) return toast.error("No free pack credits.");
    if (d.status !== "active") return toast.error("Drop not active.");
    const { data, error } = await supabase.rpc("claim_free_pack", { _drop_id: d.id });
    if (error) return toast.error(error.message);
    const result = data as { pending_free_packs?: number; cards?: { id: string; name: string; rarity: string }[] } | null;
    const remaining = result?.pending_free_packs ?? Math.max(0, pendingFreePacks - 1);
    const serverCards = result?.cards ?? [];
    const cards = serverCards
      .map((sc) => CARDS.find((c) => c.id === sc.id))
      .filter((c): c is (typeof CARDS)[number] => Boolean(c));
    setPendingFreePacks(remaining);
    setOpening({ name: `${d.name} (Free)`, cards });
    setRevealed(0);
    playSfx("magic");
    toast.success("Free pack opened", { description: `${remaining} credit${remaining === 1 ? "" : "s"} left.` });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-card/40 py-10">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Drop Center</div>
          <h1 className="mt-1 font-display text-3xl md:text-5xl text-gradient-gold">Limited Pack Drops</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Finite supply. Deterministic odds. Once sold out, the drop is sealed forever.</p>
          {user && pendingFreePacks > 0 && (
            <div className="mt-4 inline-flex items-center gap-3 rounded-full border border-gold/60 bg-gold/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.25em] text-gold">
              <span className="font-display text-base">★</span>
              {pendingFreePacks} free pack{pendingFreePacks === 1 ? "" : "s"} ready to open below
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto grid gap-6 px-4 py-10 md:grid-cols-2 lg:grid-cols-3">
        {drops.map((d) => {
          const pct = Math.round((d.remaining_supply / d.total_supply) * 100);
          return (
            <div key={d.id} className="flex flex-col rounded-xl border border-gold/30 bg-card/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl text-gradient-gold">{d.name}</h3>
                {d.remaining_supply === 0 && <span className="rounded-full bg-destructive/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-destructive">Sold out</span>}
                {d.status === "upcoming" && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Upcoming</span>}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>
              <div className="my-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Rarity Odds</div>
              <ul className="space-y-0.5 text-[11px]">
                {Object.entries(d.rarity_weights).map(([k, v]) => <li key={k} className="flex justify-between"><span>{rarityLabel(k)}</span><span className="text-gold/80">{v}%</span></li>)}
              </ul>
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-muted-foreground"><span>Supply</span><span>{d.remaining_supply} / {d.total_supply}</span></div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-gold to-accent" style={{ width: `${pct}%` }} /></div>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4">
                <div className="font-display text-xl text-gold">{d.price_exod} <span className="text-[10px] text-muted-foreground">EXOD</span></div>
                <div className="flex gap-2">
                  {pendingFreePacks > 0 && d.status === "active" && (
                    <Button onClick={() => claimFreePack(d)} variant="outline" className="border-gold/70 text-gold hover:bg-gold/10">Use Free Pack</Button>
                  )}
                  <Button onClick={() => buyPack(d)} disabled={d.remaining_supply === 0 || d.status !== "active"} className="bg-gold text-gold-foreground hover:bg-gold/90">Open Pack</Button>
                </div>
              </div>
            </div>
          );
        })}
      </section>
      {!user && <p className="pb-10 text-center text-xs text-muted-foreground"><Link to="/auth" className="underline">Sign in</Link> to open packs.</p>}
      <SiteFooter />

      {opening && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 px-4" onClick={() => { if (revealed >= opening.cards.length) setOpening(null); }}>
          <h2 className="font-display text-2xl text-gradient-gold">{opening.name}</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            {opening.cards.map((c, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); if (i === revealed) { setRevealed(revealed + 1); playSfx(c.rarity === "Exodius" ? "relic" : "card"); } }}
                className={`relative h-56 w-40 rounded-lg border ${i < revealed ? `card-frame-${c.rarity}` : "border-gold/40 bg-card/80"} overflow-hidden transition-transform ${i === revealed ? "ring-2 ring-gold animate-pulse" : ""}`}>
                {i < revealed ? (
                  <>
                    <img src={c.art} alt="" className="h-full w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/95 to-transparent p-2 text-center">
                      <div className="font-display text-sm text-foreground">{c.name}</div>
                      <div className="text-[10px] text-gold">{rarityLabel(c.rarity)}</div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center font-display text-3xl text-gold/60">?</div>
                )}
              </button>
            ))}
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">{revealed < opening.cards.length ? "Tap each card to reveal" : "Tap anywhere to close"}</p>
        </div>
      )}
    </div>
  );
}