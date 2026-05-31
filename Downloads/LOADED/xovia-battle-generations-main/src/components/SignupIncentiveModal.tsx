import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const STORAGE_KEY = "exodius:incentive-seen";

export function SignupIncentiveModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    // First-visit timer
    const t = window.setTimeout(() => setOpen(true), 12_000);

    // Exit-intent
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !sessionStorage.getItem(STORAGE_KEY)) {
        setOpen(true);
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  const close = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
      <DialogContent className="max-w-md border-gold/50 bg-card/95 backdrop-blur">
        <div className="text-[10px] uppercase tracking-[0.3em] text-crimson">Don't leave the dynasty</div>
        <DialogTitle className="font-display text-2xl text-gradient-gold">Claim your founder cards before they mint.</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Every card minted by Exodia Holdings becomes an immutable NFT. Cards held in your vault BEFORE the mint event are
          locked to your account at zero cost. After the mint, you'll have to buy them at floor price.
        </DialogDescription>

        <ul className="mt-2 space-y-2 text-xs">
          <li className="flex gap-2"><span className="text-gold">𓋹</span> Free founder card pack on sign-up</li>
          <li className="flex gap-2"><span className="text-gold">𓋹</span> Priority access to Exodia Prime relic drops</li>
          <li className="flex gap-2"><span className="text-gold">𓋹</span> Lifetime fee discount on the marketplace</li>
          <li className="flex gap-2"><span className="text-gold">𓋹</span> Eligible for retroactive XP / leveling on Phase 2 launch</li>
        </ul>

        <div className="mt-2 flex gap-2">
          <Button
            className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
            onClick={() => { toast("Sign-up arrives in Phase 2 with Google + Apple."); close(); }}
          >Reserve my founder spot</Button>
          <Button variant="ghost" onClick={close}>Maybe later</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
