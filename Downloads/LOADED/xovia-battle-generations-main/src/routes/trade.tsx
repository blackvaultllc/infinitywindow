import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/trade")({
  component: TradePage,
  head: () => ({
    meta: [
      { title: "Card Trading Post — Exodia NFT Battle" },
      { name: "description", content: "Trade Exodia cards directly with other duelists. Post listings in Ankh Coins; 2.5% house fee." },
    ],
  }),
});

interface Listing { id: string; card_id: string; card_name: string; card_rarity: string; price_ankh: number; seller_id: string }
interface OwnedCard { card_id: string; card_name: string; card_rarity: string; quantity: number }

function TradePage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [owned, setOwned] = useState<OwnedCard[]>([]);
  const [pickCard, setPickCard] = useState<string>("");
  const [price, setPrice] = useState<number>(60);

  const refresh = async () => {
    const { data: l } = await supabase
      .from("marketplace_listings")
      .select("id, card_id, card_name, card_rarity, price_ankh, seller_id")
      .eq("status", "active").eq("currency", "ankh")
      .order("id", { ascending: false }).limit(60);
    setListings((l ?? []) as Listing[]);
    if (user) {
      const { data: o } = await supabase
        .from("user_cards").select("card_id, card_name, card_rarity, quantity")
        .eq("user_id", user.id);
      setOwned((o ?? []) as OwnedCard[]);
    }
  };
  useEffect(() => { refresh(); }, [user]);

  const list = async () => {
    if (!pickCard || price < 1) return;
    const { error } = await supabase.rpc("list_card_for_ankh", { _card_id: pickCard, _price_ankh: price });
    if (error) { toast.error(error.message); return; }
    toast.success("Listing posted.");
    setPickCard(""); refresh();
  };

  const buy = async (id: string) => {
    const { error } = await supabase.rpc("purchase_listing_ankh", { _listing_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Card claimed.");
    refresh();
  };

  const cancel = async (id: string) => {
    const { error } = await supabase.rpc("cancel_listing", { _listing_id: id });
    if (error) { toast.error(error.message); return; }
    toast.success("Listing cancelled, card returned.");
    refresh();
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="border-b border-border/60 bg-card/40 py-10">
        <div className="container mx-auto px-4">
          <div className="text-xs uppercase tracking-[0.3em] text-amber-400">Bazaar</div>
          <h1 className="mt-2 font-display text-4xl text-gradient-gold">Card Trading Post</h1>
          <p className="mt-2 text-sm text-muted-foreground">List cards from your vault, set a price in Ankh, and let other duelists claim them. 2.5% house fee on every sale.</p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        {user && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-card/60 p-5">
            <h2 className="font-display text-xl text-amber-300">Post a listing</h2>
            {owned.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">You don't own any tradeable cards yet. <Link to="/chests" className="text-amber-400 underline">Open a chest →</Link></p>
            ) : (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <select value={pickCard} onChange={(e) => setPickCard(e.target.value)} className="rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm">
                  <option value="">Choose a card…</option>
                  {owned.filter((c) => c.card_rarity !== "Exodius").map((c) => (
                    <option key={c.card_id} value={c.card_id}>{c.card_name} ({c.card_rarity}) ×{c.quantity}</option>
                  ))}
                </select>
                <Input type="number" min={1} max={1000000} value={price} onChange={(e) => setPrice(Math.max(1, Number(e.target.value)))} placeholder="Ankh price" />
                <Button onClick={list} disabled={!pickCard} className="bg-amber-500 text-black hover:bg-amber-400">List for ☥ {price}</Button>
              </div>
            )}
          </div>
        )}

        <h2 className="font-display text-xl text-foreground">Active listings</h2>
        {listings.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No listings yet. Be the first to post one.</p>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {listings.map((l) => {
              const mine = user?.id === l.seller_id;
              return (
                <div key={l.id} className="rounded-xl border border-border/60 bg-card/60 p-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{l.card_rarity}</div>
                  <div className="mt-1 font-display text-lg text-gold">{l.card_name}</div>
                  <div className="mt-3 flex items-baseline gap-1 text-amber-300 font-display text-xl">
                    <span>☥</span><span>{Number(l.price_ankh).toLocaleString()}</span>
                  </div>
                  {mine ? (
                    <Button onClick={() => cancel(l.id)} variant="outline" className="mt-3 w-full border-border/60">Cancel</Button>
                  ) : (
                    <Button onClick={() => buy(l.id)} disabled={!user} className="mt-3 w-full bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40">
                      Buy now
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}