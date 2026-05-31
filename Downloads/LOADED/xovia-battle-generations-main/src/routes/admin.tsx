import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { AdminDisputes } from "@/components/AdminDisputes";
import { AdminTickets } from "@/components/AdminTickets";
import { HeirConsole } from "@/components/HeirConsole";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Admin — Exodia" }, { name: "robots", content: "noindex" }] }),
});

interface Rev { id: string; source: string; amount: number; currency: string; created_at: string }
interface Purchase { id: string; user_id: string; drop_id: string; purchased_at: string; cards_received: unknown }
interface Listing { id: string; seller_id: string; card_name: string; card_rarity: string | null; price_exod: number; status: string; created_at: string; buyer_id: string | null }
interface ProfileRow { id: string; display_name: string | null; level: number; rank: string; duels_played: number; created_at: string }

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const [rev, setRev] = useState<Rev[]>([]);
  const [subs, setSubs] = useState(0);
  const [users, setUsers] = useState(0);
  const [waitlist, setWaitlist] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [recentUsers, setRecentUsers] = useState<ProfileRow[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      const { data: r } = await supabase.from("platform_revenue").select("*").order("created_at", { ascending: false }).limit(100);
      setRev((r ?? []) as Rev[]);
      const { count: s } = await supabase.from("duel_pass_subscriptions").select("*", { count: "exact", head: true }).eq("status", "active");
      setSubs(s ?? 0);
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      setUsers(u ?? 0);
      const { count: w } = await supabase.from("waitlist").select("*", { count: "exact", head: true });
      setWaitlist(w ?? 0);
      const { data: pp } = await supabase.from("pack_purchases").select("*").order("purchased_at", { ascending: false }).limit(50);
      setPurchases((pp ?? []) as Purchase[]);
      const { data: ll } = await supabase.from("marketplace_listings").select("*").order("created_at", { ascending: false }).limit(50);
      setListings((ll ?? []) as Listing[]);
      const { data: prs } = await supabase.from("profiles").select("id,display_name,level,rank,duels_played,created_at").order("created_at", { ascending: false }).limit(25);
      setRecentUsers((prs ?? []) as ProfileRow[]);
    })();
  }, [isAdmin]);

  if (loading) return null;
  if (!user) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="container mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Sign in required.</p>
        <Link to="/auth"><Button className="mt-4 bg-gold text-gold-foreground hover:bg-gold/90">Sign in</Button></Link></div></div>
  );
  if (!isAdmin) return (
    <div className="min-h-screen"><SiteHeader />
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-3xl text-gradient-gold">Forbidden</h1>
        <p className="mt-2 text-sm text-muted-foreground">Only the Pharaoh enters here.</p>
      </div></div>
  );

  const totals = rev.reduce<Record<string, number>>((acc, r) => { acc[r.source] = (acc[r.source] ?? 0) + Number(r.amount); return acc; }, {});
  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto px-4 py-10">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Pharaoh's Console</div>
        <h1 className="mt-1 font-display text-3xl md:text-5xl text-gradient-gold">Revenue Dashboard</h1>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Stat label="Total Revenue" value={`${grandTotal.toFixed(2)}`} hint="all currencies pooled" />
          <Stat label="Active Duel Pass" value={subs.toString()} hint={`MRR ≈ $${(subs * 9.99).toFixed(2)}`} />
          <Stat label="Users" value={users.toString()} hint="total profiles" />
          <Stat label="Waitlist" value={waitlist.toString()} hint="pre-launch emails" />
        </div>

        <div className="mt-10"><AdminDisputes /></div>
        <div className="mt-10"><AdminTickets /></div>
        <div className="mt-10"><HeirConsole /></div>

        <h2 className="mt-10 font-display text-2xl">Revenue by Source</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {Object.entries(totals).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border/60 bg-card/40 p-4">
              <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{k}</div>
              <div className="mt-1 font-display text-2xl text-gold">{v.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <h2 className="mt-10 font-display text-2xl">Recent Revenue Events</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr><th className="px-3 py-2">Date</th><th>Source</th><th className="text-right pr-3">Amount</th><th className="pr-3">Currency</th></tr>
            </thead>
            <tbody>
              {rev.map(r => (
                <tr key={r.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.source}</td>
                  <td className="pr-3 text-right font-display text-gold">{Number(r.amount).toFixed(2)}</td>
                  <td className="pr-3">{r.currency}</td>
                </tr>
              ))}
              {rev.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No revenue events yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* PACK PURCHASES */}
        <h2 className="mt-10 font-display text-2xl">Pack & Box Purchases</h2>
        <p className="text-xs text-muted-foreground">Every pack/box opened by every user. Use this to track velocity and reconcile drops.</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr><th className="px-3 py-2">When</th><th>Buyer ID</th><th>Drop ID</th><th className="text-right pr-3">Cards in pack</th></tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(p.purchased_at).toLocaleString()}</td>
                  <td className="font-mono text-[10px]">{p.user_id.slice(0, 8)}…</td>
                  <td className="font-mono text-[10px]">{p.drop_id.slice(0, 8)}…</td>
                  <td className="pr-3 text-right font-display text-gold">{Array.isArray(p.cards_received) ? p.cards_received.length : 0}</td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">No pack purchases yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* MARKETPLACE LISTINGS */}
        <h2 className="mt-10 font-display text-2xl">Marketplace Listings</h2>
        <p className="text-xs text-muted-foreground">Live + sold listings. 2.5% platform fee is auto-applied on sale.</p>
        <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr><th className="px-3 py-2">Listed</th><th>Card</th><th>Rarity</th><th className="text-right">Price (EXOD)</th><th>Status</th></tr>
            </thead>
            <tbody>
              {listings.map(l => (
                <tr key={l.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                  <td>{l.card_name}</td>
                  <td className="text-muted-foreground">{l.card_rarity ?? "—"}</td>
                  <td className="text-right font-display text-gold">{Number(l.price_exod).toLocaleString()}</td>
                  <td className={l.status === "sold" ? "text-accent" : "text-muted-foreground"}>{l.status}</td>
                </tr>
              ))}
              {listings.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No listings yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {/* RECENT USERS */}
        <h2 className="mt-10 font-display text-2xl">Recent Duelists</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-xs">
            <thead className="bg-card/60 text-left text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              <tr><th className="px-3 py-2">Joined</th><th>Display Name</th><th>Level</th><th>Rank</th><th className="text-right pr-3">Duels</th></tr>
            </thead>
            <tbody>
              {recentUsers.map(u => (
                <tr key={u.id} className="border-t border-border/40">
                  <td className="px-3 py-2 text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>{u.display_name ?? <span className="text-muted-foreground">unnamed</span>}</td>
                  <td className="font-display text-gold">{u.level}</td>
                  <td>{u.rank}</td>
                  <td className="pr-3 text-right">{u.duels_played}</td>
                </tr>
              ))}
              {recentUsers.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No users yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-gold/30 bg-card/60 p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl text-gold">{value}</div>
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}