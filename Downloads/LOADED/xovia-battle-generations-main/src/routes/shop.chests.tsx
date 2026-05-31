import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/shop/chests")({
  component: ChestShop,
  head: () => ({
    meta: [
      { title: "Chest Box Shop — Exodia NFT Battle" },
      { name: "description", content: "Buy 1 to 100 sealed tomb chests with Ankh Coins. Each chest holds one random card with a 1-in-10-million chance for a divine Exodius relic." },
    ],
  }),
});

function unitPrice(qty: number): number {
  if (qty >= 100) return 45;
  if (qty >= 50)  return 50;
  if (qty >= 25)  return 54;
  if (qty >= 10)  return 57;
  return 60;
}

function ChestShop() {
  const { user } = useAuth();
  const [qty, setQty] = useState(10);
  const [ankh, setAnkh] = useState(0);
  const [unopened, setUnopened] = useState(0);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    if (!user) return;
    const [{ data: w }, { data: c }] = await Promise.all([
      supabase.from("wallets").select("ankh_balance").eq("user_id", user.id).maybeSingle(),
      supabase.from("user_chests").select("unopened").eq("user_id", user.id).maybeSingle(),
    ]);
    setAnkh(w ? Number((w as { ankh_balance: number }).ankh_balance ?? 0) : 0);
    setUnopened(c ? Number((c as { unopened: number }).unopened ?? 0) : 0);
  };
  useEffect(() => { refresh(); }, [user]);

  const unit = unitPrice(qty);
  const total = unit * qty;
  const canAfford = ankh >= total;

  const buy = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.rpc("buy_chests", { _quantity: qty });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Sealed ${qty} chests into your vault.`);
    refresh();
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-gradient-to-b from-amber-950/40 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400">Tomb Bazaar</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-gradient-gold">Sealed Chest Boxes</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Each chest is server-sealed and contains exactly one random card. The vault keeper rolls every chest live;
            drop rates are public and immutable.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-5 text-xs">
            <Rate r="Common" v="70%" color="text-zinc-300" />
            <Rate r="Rare" v="22%" color="text-sky-400" />
            <Rate r="Divine" v="7%" color="text-fuchsia-400" />
            <Rate r="Legendary" v="~1%" color="text-amber-400" />
            <Rate r="Exodius" v="0.00001%" color="text-rose-400" />
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {!user ? (
          <div className="rounded-lg border border-border/60 bg-card/40 p-12 text-center">
            <p className="text-muted-foreground">Sign in to buy chests.</p>
            <Link to="/auth" className="mt-4 inline-block"><Button className="bg-gold text-gold-foreground hover:bg-gold/90">Sign in</Button></Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-amber-500/30 bg-card/60 p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Bundle</div>
              <div className="mt-2 font-display text-6xl text-amber-300">{qty}</div>
              <div className="text-sm text-muted-foreground">chest{qty > 1 ? "es" : ""}</div>
              <div className="mt-5 px-2">
                <Slider min={1} max={100} step={1} value={[qty]} onValueChange={([v]) => setQty(v)} />
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>1</span><span>100</span></div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2 text-xs">
                {[1,10,25,50,100].map((q) => (
                  <Button key={q} variant="outline" size="sm" onClick={() => setQty(q)} className="border-border/60">{q}</Button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gold/30 bg-card/60 p-6">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Cost</div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl">☥</span>
                <span className="font-display text-4xl text-amber-300">{total.toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{unit} ankh / chest {qty >= 10 && <span className="text-emerald-400">(volume discount)</span>}</div>
              <div className="mt-6 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Your balance</span>
                <span className="text-amber-300 font-display">☥ {ankh.toLocaleString()}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">In vault</span>
                <span>{unopened} sealed</span>
              </div>
              <Button disabled={!canAfford || busy} onClick={buy} className="mt-6 w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40">
                {busy ? "Sealing…" : canAfford ? `Buy ${qty} chest${qty>1?"es":""}` : "Insufficient Ankh"}
              </Button>
              {!canAfford && (
                <Link to="/shop/coins" className="mt-2 block text-center text-xs text-amber-400 underline">Top up coins →</Link>
              )}
              <Link to="/chests" className="mt-2 block text-center text-xs text-muted-foreground hover:text-foreground">Open your chests →</Link>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Rate({ r, v, color }: { r: string; v: string; color: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className={`font-display text-base ${color}`}>{r}</div>
      <div className="text-muted-foreground">{v}</div>
    </div>
  );
}