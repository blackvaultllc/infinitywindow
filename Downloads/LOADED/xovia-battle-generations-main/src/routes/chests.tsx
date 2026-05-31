import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/chests")({
  component: ChestVault,
  head: () => ({
    meta: [
      { title: "Open Chests — Exodia NFT Battle" },
      { name: "description", content: "Crack open sealed tomb chests and reveal divine cards." },
    ],
  }),
});

const RARITY_COLOR: Record<string, string> = {
  Common: "from-zinc-500 to-zinc-300",
  Rare: "from-sky-500 to-cyan-300",
  Divine: "from-fuchsia-500 to-purple-300",
  Legendary: "from-amber-500 to-yellow-300",
  Exodius: "from-rose-500 via-amber-400 to-cyan-400",
};

interface Reveal { card_id: string; card_name: string; card_rarity: string }

function ChestVault() {
  const { user } = useAuth();
  const [unopened, setUnopened] = useState(0);
  const [opening, setOpening] = useState(false);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [phase, setPhase] = useState<"idle" | "shake" | "burst" | "card">("idle");

  const refresh = async () => {
    if (!user) return;
    const { data } = await supabase.from("user_chests").select("unopened").eq("user_id", user.id).maybeSingle();
    setUnopened(data ? Number((data as { unopened: number }).unopened ?? 0) : 0);
  };
  useEffect(() => { refresh(); }, [user]);

  const open = async () => {
    if (!user || unopened <= 0 || opening) return;
    setOpening(true);
    setPhase("shake");
    await new Promise((r) => setTimeout(r, 900));
    const { data, error } = await supabase.rpc("open_chest");
    if (error) {
      setPhase("idle"); setOpening(false);
      toast.error(error.message); return;
    }
    setPhase("burst");
    await new Promise((r) => setTimeout(r, 600));
    setReveal(data as unknown as Reveal);
    setPhase("card");
    setUnopened((u) => Math.max(0, u - 1));
  };

  const close = () => { setReveal(null); setPhase("idle"); setOpening(false); };

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="container mx-auto py-20 text-center">
          <h1 className="font-display text-3xl text-gradient-gold">Locked Vault</h1>
          <p className="mt-2 text-muted-foreground">Sign in to open your chests.</p>
          <Link to="/auth" className="mt-6 inline-block"><Button className="bg-gold text-gold-foreground hover:bg-gold/90">Sign in</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto px-4 py-12">
        <div className="text-xs uppercase tracking-[0.3em] text-amber-400">Unsealing Chamber</div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl text-gradient-gold">Your Chests</h1>
        <p className="mt-2 text-sm text-muted-foreground">{unopened} sealed chest{unopened===1?"":"es"} awaiting the ritual.</p>

        <div className="mt-12 flex flex-col items-center">
          <motion.div
            className="relative h-48 w-48 cursor-pointer"
            animate={phase === "shake" ? { rotate: [0, -8, 8, -8, 8, 0], scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.9, repeat: phase === "shake" ? 0 : 0 }}
            onClick={open}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-700 via-amber-500 to-amber-900 shadow-[0_0_60px_rgba(245,158,11,0.4)]">
              <div className="absolute inset-2 rounded-xl border-2 border-amber-300/40 bg-gradient-to-b from-amber-800 to-amber-950 flex items-center justify-center">
                <span className="text-6xl">☥</span>
              </div>
              <div className="absolute left-0 right-0 top-1/2 h-1 bg-amber-300/60" />
            </div>
            <AnimatePresence>
              {phase === "burst" && (
                <motion.div
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 8, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 rounded-full bg-amber-300 blur-2xl"
                />
              )}
            </AnimatePresence>
          </motion.div>

          <Button
            onClick={open}
            disabled={unopened <= 0 || opening}
            className="mt-8 bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-40"
          >
            {opening ? "Opening…" : unopened > 0 ? "Open Chest" : "No chests left"}
          </Button>
          {unopened === 0 && (
            <Link to="/shop/chests" className="mt-3 text-xs text-amber-400 underline">Buy more chests →</Link>
          )}
        </div>
      </section>

      <AnimatePresence>
        {reveal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={close}
          >
            <motion.div
              initial={{ scale: 0.4, rotateY: 180, opacity: 0 }}
              animate={{ scale: 1, rotateY: 0, opacity: 1 }}
              transition={{ type: "spring", duration: 0.9 }}
              className={`relative rounded-2xl bg-gradient-to-br ${RARITY_COLOR[reveal.card_rarity] ?? RARITY_COLOR.Common} p-1 shadow-[0_0_80px_rgba(255,200,80,0.6)]`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-xl bg-background/90 px-12 py-10 text-center min-w-[300px]">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{reveal.card_rarity}</div>
                <div className="mt-2 font-display text-3xl text-gradient-gold">{reveal.card_name}</div>
                {reveal.card_rarity === "Exodius" && (
                  <div className="mt-3 text-xs text-rose-400 font-bold tracking-widest animate-pulse">⚡ ONE IN TEN MILLION ⚡</div>
                )}
                <div className="mt-6 flex justify-center gap-2">
                  <Button onClick={close} variant="outline" className="border-border/60">Close</Button>
                  {unopened > 0 && (
                    <Button onClick={() => { close(); setTimeout(open, 100); }} className="bg-amber-500 text-black hover:bg-amber-400">
                      Open another
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <SiteFooter />
    </div>
  );
}