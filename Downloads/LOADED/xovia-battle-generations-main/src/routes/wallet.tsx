import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/wallet")({
  component: WalletPage,
  head: () => ({
    meta: [
      { title: "XOVIA Wallet — Battle Generations" },
      { name: "description", content: "Manage your EXOD token balance, transaction history, and on-ramp." },
    ],
  }),
});

interface Wallet { exod_balance: number; lifetime_earned: number; lifetime_spent: number; daily_earned: number }
interface Tx { id: string; amount: number; type: string; description: string; created_at: string }

function WalletPage() {
  const { user, loading } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [tx, setTx] = useState<Tx[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: w } = await supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle();
      setWallet(w as Wallet | null);
      const { data: t } = await supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
      setTx((t ?? []) as Tx[]);
    })();
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-gradient-gold">Wallet Locked</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to view your EXOD balance.</p>
          <Link to="/auth" className="mt-6 inline-block"><Button className="bg-gold text-gold-foreground hover:bg-gold/90">Sign in</Button></Link>
        </div>
      </div>
    );
  }

  const earnDaily = async () => {
    const { data, error } = await supabase.rpc("claim_daily_exod");
    if (error) { toast.error(error.message); return; }
    const res = (data ?? {}) as { claimed?: boolean; amount?: number; reason?: string };
    if (res.claimed) toast.success(`+${res.amount} EXOD claimed`);
    else toast.info("Already claimed today — come back tomorrow.");
    const { data: coinData, error: coinErr } = await supabase.rpc("claim_daily_coins");
    if (!coinErr && coinData) {
      const amt = (coinData as { amount?: number }).amount;
      if (amt) toast.success(`+${amt} ☥ Ankh claimed`);
    }
    const { data: w } = await supabase.from("wallets").select("*").eq("user_id", user!.id).maybeSingle();
    setWallet(w as Wallet | null);
    const { data: t } = await supabase.from("transactions").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(50);
    setTx((t ?? []) as Tx[]);
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto px-4 py-10">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Royal Treasury</div>
        <h1 className="mt-1 font-display text-3xl md:text-5xl text-gradient-gold">XOVIA Wallet</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gold/30 bg-card/60 p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Balance</div>
            <div className="mt-2 font-display text-5xl text-gold">{wallet?.exod_balance ?? 0}</div>
            <div className="mt-1 text-xs text-muted-foreground">≈ ${((wallet?.exod_balance ?? 0) * 0.1).toFixed(2)} USD</div>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => toast.info("Crypto on-ramp opens in Phase 3.")} className="bg-gold text-gold-foreground hover:bg-gold/90">Buy EXOD</Button>
              <Button variant="outline" onClick={() => toast.info("Withdrawal flow opens in Phase 3.")}>Withdraw</Button>
            </div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/40 p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Lifetime Earned</div>
            <div className="mt-2 font-display text-3xl">{wallet?.lifetime_earned ?? 0}</div>
            <div className="mt-4 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Lifetime Spent</div>
            <div className="mt-1 font-display text-xl text-muted-foreground">{wallet?.lifetime_spent ?? 0}</div>
          </div>
          <div className="rounded-xl border border-border/60 bg-card/40 p-6">
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Daily Earn Cap</div>
            <div className="mt-2 font-display text-3xl">{wallet?.daily_earned ?? 0} / 500</div>
            <div className="mt-1 text-xs text-muted-foreground">Anti-farming cap. Resets daily at UTC midnight.</div>
            <Button onClick={earnDaily} className="mt-4 w-full bg-accent text-accent-foreground hover:bg-accent/90">Claim Daily +25</Button>
          </div>
        </div>

        <h2 className="mt-12 font-display text-2xl text-foreground">Transaction History</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr><th className="px-3 py-2">Date</th><th>Type</th><th>Description</th><th className="text-right pr-3">Amount</th></tr>
            </thead>
            <tbody>
              {tx.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No transactions yet — claim your daily bonus to begin.</td></tr>}
              {tx.map((t) => (
                <tr key={t.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                  <td className="capitalize">{t.type}</td>
                  <td>{t.description}</td>
                  <td className={`pr-3 text-right font-display ${t.amount < 0 ? "text-destructive" : "text-gold"}`}>{t.amount > 0 ? "+" : ""}{t.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}