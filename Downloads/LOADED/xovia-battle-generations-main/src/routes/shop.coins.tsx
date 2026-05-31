import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/shop/coins")({
  component: CoinShop,
  head: () => ({
    meta: [
      { title: "Ankh Coin Shop — Exodia NFT Battle" },
      { name: "description", content: "Top up Ankh Coins to buy chest boxes and trade cards with other players." },
    ],
  }),
});

const PACKS = [
  { id: "ankh_60",    coins: 60,    price: "$0.99",  cents: 99,   bonus: 0,  popular: false, label: "Starter Offering" },
  { id: "ankh_350",   coins: 350,   price: "$4.99",  cents: 499,  bonus: 10, popular: false, label: "Scribe's Pouch" },
  { id: "ankh_1200",  coins: 1200,  price: "$14.99", cents: 1499, bonus: 20, popular: true,  label: "Vizier's Chest" },
  { id: "ankh_3500",  coins: 3500,  price: "$39.99", cents: 3999, bonus: 30, popular: false, label: "High Priest Hoard" },
  { id: "ankh_12500", coins: 12500, price: "$99.99", cents: 9999, bonus: 50, popular: false, label: "Pharaoh's Hoard" },
];

function CoinShop() {
  const { user } = useAuth();
  const [ankh, setAnkh] = useState(0);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("ankh_balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setAnkh(data ? Number((data as { ankh_balance: number }).ankh_balance ?? 0) : 0));
  }, [user]);

  const buy = (priceId: string) => {
    if (!user) { toast.error("Sign in first."); return; }
    openCheckout({
      priceId,
      quantity: 1,
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-gradient-to-b from-amber-950/30 to-background py-12">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400">Royal Treasury</div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl text-gradient-gold">Ankh Coin Shop</h1>
          <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
            Ankh Coins (☥) are the sacred currency of Exodia. Use them to crack open chest boxes from the tombs
            of the gods or trade cards directly with other duelists.
          </p>
          {user && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-amber-300 font-display">
              <span className="text-xl">☥</span>
              <span>{ankh.toLocaleString()} Ankh</span>
            </div>
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        {!user ? (
          <div className="rounded-lg border border-border/60 bg-card/40 p-12 text-center">
            <p className="text-muted-foreground">Sign in to top up Ankh Coins.</p>
            <Link to="/auth" className="mt-4 inline-block"><Button className="bg-gold text-gold-foreground hover:bg-gold/90">Sign in</Button></Link>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
            {PACKS.map((p) => {
              const total = Math.round(p.coins * (1 + p.bonus / 100));
              return (
                <div key={p.id} className={`relative rounded-xl border bg-card/60 p-5 transition hover:scale-[1.02] hover:border-amber-500/60 ${p.popular ? "border-amber-500/70 bg-amber-500/5" : "border-border/60"}`}>
                  {p.popular && <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-black">Best Value</div>}
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{p.label}</div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-3xl">☥</span>
                    <span className="font-display text-3xl text-amber-300">{total.toLocaleString()}</span>
                  </div>
                  {p.bonus > 0 && (
                    <div className="mt-1 text-xs text-emerald-400">+{p.bonus}% bonus ({p.coins.toLocaleString()} base)</div>
                  )}
                  <div className="mt-4 font-display text-2xl text-gold">{p.price}</div>
                  <Button onClick={() => buy(p.id)} className="mt-4 w-full bg-amber-500 text-black hover:bg-amber-400">Buy</Button>
                </div>
              );
            })}
          </div>
        )}
        <Dialog open={isOpen} onOpenChange={(o) => { if (!o) closeCheckout(); }}>
          <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 sm:p-4">
            <DialogHeader className="px-4 pt-4 sm:px-0 sm:pt-0">
              <DialogTitle className="font-display text-gradient-gold">Complete your offering</DialogTitle>
            </DialogHeader>
            <div className="px-2 pb-4 sm:px-0">{checkoutElement}</div>
          </DialogContent>
        </Dialog>
      </section>
      <SiteFooter />
    </div>
  );
}