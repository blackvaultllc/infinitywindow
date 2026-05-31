import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy } from "lucide-react";

export const Route = createFileRoute("/referrals")({
  component: ReferralsPage,
  head: () => ({
    meta: [
      { title: "Referrals — Recruit Duelists, Earn EXOD" },
      { name: "description", content: "Invite friends. You both earn. 500 EXOD to you, 200 + free pack to them." },
    ],
  }),
});

function ReferralsPage() {
  const { user } = useAuth();
  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: p } = await supabase.from("profiles").select("referral_code").eq("id", user.id).maybeSingle();
      setCode(p?.referral_code ?? null);
      const { data: rs } = await supabase.from("referrals").select("commission_earned").eq("referrer_id", user.id);
      setCount(rs?.length ?? 0);
      setEarned((rs ?? []).reduce((s, r: { commission_earned: number }) => s + Number(r.commission_earned) + 500, 0));
    })();
  }, [user]);

  const link = code ? `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${code}` : "";

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-gradient-gold">Referral Vault Sealed</h1>
          <Link to="/auth" className="mt-4 inline-block"><Button className="bg-gold text-gold-foreground hover:bg-gold/90">Sign in</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto max-w-3xl px-4 py-10">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Royal Conscription</div>
        <h1 className="mt-1 font-display text-3xl md:text-5xl text-gradient-gold">Referrals</h1>
        <p className="mt-2 text-sm text-muted-foreground">Share your link. They get 200 EXOD + a Pharaoh's Vault Pack on signup. You earn 500 EXOD + 1% commission on their first purchase.</p>

        <div className="mt-6 rounded-xl border border-gold/30 bg-card/60 p-5">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your Code</div>
          <div className="mt-1 font-display text-3xl text-gold">{code}</div>
          <div className="mt-3 flex gap-2">
            <input readOnly value={link} className="flex-1 rounded border border-border/60 bg-background/60 px-3 py-2 text-xs text-foreground" />
            <Button onClick={() => { navigator.clipboard.writeText(link); toast.success("Link copied"); }} variant="outline"><Copy className="mr-1 h-3 w-3" /> Copy</Button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border/60 bg-card/40 p-4"><div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Recruits</div><div className="mt-1 font-display text-3xl">{count}</div></div>
          <div className="rounded-lg border border-border/60 bg-card/40 p-4"><div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">EXOD Earned</div><div className="mt-1 font-display text-3xl text-gold">{earned}</div></div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}