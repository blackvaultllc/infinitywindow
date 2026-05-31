import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Lock, Check } from "lucide-react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export const Route = createFileRoute("/duel-pass")({
  component: DuelPassPage,
  head: () => ({
    meta: [
      { title: "Duel Pass — Exodia Season Rewards" },
      { name: "description", content: "Climb the 8-week reward track. Free + Premium tiers, exclusive cards, EXOD tokens, and the Exodia Prime relic at week 8." },
    ],
  }),
});

interface Week {
  n: number;
  free: { label: string; icon: string };
  prem: { label: string; icon: string };
}

const WEEKS: Week[] = [
  { n: 1, free: { label: "100 EXOD",         icon: "🪙" }, prem: { label: "Scarab Warrior + 300 EXOD",          icon: "🪲" } },
  { n: 2, free: { label: "Common Pack",      icon: "📦" }, prem: { label: "Rare Pack + Gold Card Back",         icon: "🃏" } },
  { n: 3, free: { label: "150 EXOD",         icon: "🪙" }, prem: { label: "Horus (Rare) + 500 EXOD",            icon: "🦅" } },
  { n: 4, free: { label: "2 Trap Cards",     icon: "🪤" }, prem: { label: "Divine Pack + Animated Border",       icon: "✨" } },
  { n: 5, free: { label: "200 EXOD",         icon: "🪙" }, prem: { label: "Set, God of Chaos + 750 EXOD",       icon: "⛈️" } },
  { n: 6, free: { label: "2 Spell Cards",    icon: "📜" }, prem: { label: "Legendary Pack + Pharaoh Frame",      icon: "👑" } },
  { n: 7, free: { label: "300 EXOD",         icon: "🪙" }, prem: { label: "Ra the Eternal Flame + 1000 EXOD",   icon: "☀️" } },
  { n: 8, free: { label: "Rare Pack",        icon: "🎁" }, prem: { label: "EXODIA PRIME RELIC + Gold Border",   icon: "👁️" } },
];

function DuelPassPage() {
  const { user } = useAuth();
  const [premium, setPremium] = useState(false);
  const [claimed, setClaimed] = useState<Record<string, true>>({});
  const currentWeek = 1; // Phase 1 hardcode; server time syncs in Phase 3
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: prof } = await supabase.from("profiles").select("duel_pass_premium_until").eq("id", user.id).maybeSingle();
      const until = prof?.duel_pass_premium_until as string | null | undefined;
      setPremium(!!until && new Date(until).getTime() > Date.now());
      const { data: cs } = await supabase.from("duel_pass_claims").select("week_number,track").eq("user_id", user.id);
      const map: Record<string, true> = {};
      (cs ?? []).forEach((c: { week_number: number; track: string }) => { map[`${c.week_number}-${c.track}`] = true; });
      setClaimed(map);
    })();
  }, [user]);

  const subscribe = (priceId: "duel_pass_season" | "duel_pass_monthly") => {
    if (!user) return toast.error("Sign in first");
    openCheckout({ priceId, userId: user.id, customerEmail: user.email ?? undefined });
  };

  const claim = async (week: number, track: "free" | "premium") => {
    if (!user) return toast.error("Sign in first");
    if (track === "premium" && !premium) return toast.error("Premium track requires the Duel Pass.");
    if (week > currentWeek) return toast.error("Locked until this week's reset.");
    const { error } = await supabase.from("duel_pass_claims").insert({ user_id: user.id, week_number: week, track });
    if (error) return toast.error(error.message);
    setClaimed((c) => ({ ...c, [`${week}-${track}`]: true }));
    toast.success("Reward claimed.");
  };

  return (
    <div className="min-h-screen">
      <PaymentTestModeBanner />
      <SiteHeader />
      <section className="border-b border-border/60 bg-card/40 py-10">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">Season I · The First Dynasty</div>
          <h1 className="mt-1 font-display text-3xl md:text-5xl text-gradient-gold">Duel Pass</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Eight weeks of escalating rewards. The free track rewards every duelist — the premium track ends in the EXODIA PRIME RELIC card.
          </p>
          {!premium && (
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button onClick={() => subscribe("duel_pass_season")} className="bg-gold text-gold-foreground hover:bg-gold/90">Unlock Season — $19.99 once</Button>
              <Button onClick={() => subscribe("duel_pass_monthly")} variant="outline" className="border-gold/60 text-gold hover:bg-gold/10">Subscribe — $7.99 / mo</Button>
              {!user && <Link to="/auth" className="text-xs text-muted-foreground underline">Sign in first</Link>}
            </div>
          )}
          {premium && <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-xs text-gold">★ Premium Active</div>}
        </div>
      </section>

      <section className="container mx-auto overflow-x-auto px-4 py-8">
        <div className="min-w-[820px]">
          <div className="mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Free Track</div>
          <div className="grid grid-cols-8 gap-3">
            {WEEKS.map((w) => <Node key={`f-${w.n}`} week={w.n} icon={w.free.icon} label={w.free.label} unlocked={w.n <= currentWeek} claimed={!!claimed[`${w.n}-free`]} onClaim={() => claim(w.n, "free")} />)}
          </div>
          <div className="my-4 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-gold">
            <span>Premium Track</span>
            {!premium && <span className="text-muted-foreground">Locked — unlock the Pass to claim</span>}
          </div>
          <div className={`grid grid-cols-8 gap-3 ${!premium ? "opacity-50" : ""}`}>
            {WEEKS.map((w) => <Node key={`p-${w.n}`} premium week={w.n} icon={w.prem.icon} label={w.prem.label} unlocked={premium && w.n <= currentWeek} claimed={!!claimed[`${w.n}-premium`]} onClaim={() => claim(w.n, "premium")} />)}
          </div>
        </div>
      </section>
      <SiteFooter />
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-2xl p-0 sm:p-0">
          <div className="max-h-[85vh] overflow-y-auto">{checkoutElement}</div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Node({ week, icon, label, unlocked, claimed, onClaim, premium }: { week: number; icon: string; label: string; unlocked: boolean; claimed: boolean; onClaim: () => void; premium?: boolean }) {
  return (
    <div className={`flex flex-col items-center rounded-lg border p-3 text-center text-[10px] ${premium ? "border-gold/40 bg-gold/5" : "border-border/60 bg-card/40"}`}>
      <div className="mb-1 text-[9px] uppercase tracking-[0.25em] text-muted-foreground">Week {week}</div>
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 line-clamp-2 text-foreground/90">{label}</div>
      <button
        onClick={onClaim}
        disabled={!unlocked || claimed}
        className={`mt-2 flex items-center gap-1 rounded px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${claimed ? "bg-accent/10 text-accent" : unlocked ? "bg-gold/15 text-gold hover:bg-gold/25" : "bg-muted text-muted-foreground"}`}
      >
        {claimed ? <><Check className="h-3 w-3" /> Claimed</> : unlocked ? "Claim" : <><Lock className="h-3 w-3" /> Locked</>}
      </button>
    </div>
  );
}