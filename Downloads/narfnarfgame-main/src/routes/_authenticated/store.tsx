import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/store")({
  head: () => ({
    meta: [
      { title: "Council Store — Narf Narf" },
      { name: "description", content: "Spend coins on uniforms, accents, flags, and map themes." },
    ],
  }),
  component: StorePage,
});

type Item = {
  slug: string;
  name: string;
  description: string | null;
  category: string;
  price_coins: number;
  payload: Record<string, any>;
};

const CATEGORIES: { id: string; label: string }[] = [
  { id: "subscription", label: "Subscriptions" },
  { id: "accent", label: "HUD Accents" },
  { id: "uniform", label: "Uniforms" },
  { id: "flag", label: "Flags" },
  { id: "card_style", label: "Card Styles" },
  { id: "map_theme", label: "Map Themes" },
];

function StorePage() {
  const { profile, reload } = useProfile();
  const [items, setItems] = useState<Item[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [tab, setTab] = useState<string>("accent");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    const [{ data: it }, { data: inv }] = await Promise.all([
      supabase.from("store_items").select("*").eq("active", true).order("category"),
      supabase.from("player_inventory").select("item_slug"),
    ]);
    setItems((it as any) ?? []);
    setOwned(new Set(((inv as any[]) ?? []).map((r) => r.item_slug)));
  };

  useEffect(() => {
    load();
  }, []);

  const buy = async (slug: string) => {
    setBusy(slug);
    // Minor accounts route purchases through a parental approval request
    // instead of completing the buy. Parent gets notified via email + Medusa.
    if ((profile as any)?.is_minor) {
      try {
        const { fileParentalRequest } = await import("@/lib/parental.functions");
        const item = items.find((i) => i.slug === slug);
        await fileParentalRequest({ data: { kind: "purchase", payload: { item_slug: slug, item_name: item?.name, price_coins: item?.price_coins } } });
        toast.success("Approval request sent to your parent.");
      } catch (e: any) {
        toast.error(e?.message ?? "Could not send approval request");
      } finally {
        setBusy(null);
      }
      return;
    }
    const { data, error } = await supabase.rpc("purchase_store_item" as any, { _slug: slug });
    setBusy(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as any;
    if (result?.already_owned) toast("Already owned");
    else toast.success("Purchased");
    await Promise.all([load(), reload()]);
  };

  const filtered = items.filter((i) => i.category === tab);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
              Global Defense Council · Quartermaster
            </div>
            <h1 className="text-3xl font-bold">Council Store</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-md border bg-card px-3 py-2 text-sm">
              <span className="text-muted-foreground">Balance: </span>
              <span className="font-mono font-semibold">{profile?.coins ?? 0}</span>
              <span className="ml-1 text-xs text-muted-foreground">coins</span>
            </div>
            <Link to="/select" className="text-sm text-muted-foreground hover:text-foreground">
              ← Back
            </Link>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setTab(c.id)}
              className={`min-h-[40px] rounded-lg border px-4 py-2 text-sm ${
                tab === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0 && (
            <div className="col-span-full rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
              No items in this category yet.
            </div>
          )}
          {filtered.map((it) => {
            const isOwned = owned.has(it.slug);
            const canAfford = (profile?.coins ?? 0) >= it.price_coins;
            const accent =
              (it.payload?.accent as string | undefined) ??
              ({
                accent: "#378ADD",
                uniform: "#EF9F27",
                flag: "#E24B4A",
                card_style: "#7F77DD",
                map_theme: "#1D9E75",
                subscription: "#F5C518",
              } as Record<string, string>)[it.category] ??
              "#888780";
            const isSub = it.category === "subscription";
            return (
              <div key={it.slug} className="flex flex-col rounded-xl border bg-card p-4">
                <div
                  className="mb-3 flex h-32 items-center justify-center rounded-lg overflow-hidden relative"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 20%, rgba(120,170,255,0.15), transparent 60%), radial-gradient(circle at 70% 80%, rgba(80,40,140,0.25), transparent 70%), #03060F",
                  }}
                >
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 78% 32%, #fff, transparent), radial-gradient(1px 1px at 36% 72%, #fff, transparent), radial-gradient(1px 1px at 88% 80%, #fff, transparent), radial-gradient(1px 1px at 52% 12%, #fff, transparent)",
                    }}
                  />
                  <div
                    className="relative h-20 w-20 rounded-full"
                    style={{
                      background: `radial-gradient(circle at 32% 30%, ${accent} 0%, ${accent}cc 35%, #0a1224 78%, #02040c 100%)`,
                      boxShadow: `inset -10px -14px 24px rgba(0,0,0,0.7), inset 10px 10px 22px ${accent}55, 0 0 36px ${accent}66`,
                    }}
                  >
                    <div
                      className="absolute -inset-1 rounded-full pointer-events-none"
                      style={{ border: `1px solid ${accent}55`, boxShadow: `0 0 14px ${accent}33` }}
                    />
                    {isSub && (
                      <div
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rotate-12 h-2 w-28 rounded-full"
                        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 12px ${accent}` }}
                      />
                    )}
                  </div>
                </div>
                <div className="mb-1 font-semibold">{it.name}</div>
                <div className="mb-3 flex-1 text-xs text-muted-foreground">{it.description}</div>
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm">
                    {it.price_coins.toLocaleString()} ¢{isSub && <span className="text-muted-foreground">/mo</span>}
                  </div>
                  <Button
                    size="sm"
                    disabled={isOwned || !canAfford || busy === it.slug}
                    onClick={() => buy(it.slug)}
                    variant={isOwned ? "secondary" : "default"}
                  >
                    {isOwned ? "Owned" : busy === it.slug ? "..." : canAfford ? (isSub ? "Subscribe" : "Buy") : "Need coins"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
