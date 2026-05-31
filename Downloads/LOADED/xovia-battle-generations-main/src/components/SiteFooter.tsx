import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background/60">
      <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-4">
        <div>
          <div className="font-display text-lg tracking-[0.2em] text-gradient-gold">XOVIA · BATTLE GENERATIONS</div>
          <p className="mt-3 text-sm text-muted-foreground">
            Collect. Battle. Ascend. An on-chain card game forged in the sands of an
            original Egyptian mythos.
          </p>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">Play</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/vault" className="hover:text-gold">Vault</Link></li>
            <li><Link to="/arena" className="hover:text-gold">Battle Arena</Link></li>
            <li><Link to="/codex" className="hover:text-gold">Card Codex</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">Trade</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/marketplace" className="hover:text-gold">Marketplace</Link></li>
            <li><span className="text-muted-foreground">Mint Studio · soon</span></li>
            <li><span className="text-muted-foreground">Pack Drops · soon</span></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">Sponsor</div>
          <p className="text-sm text-muted-foreground">
            Proudly sponsored & operated by <span className="text-gold">Exodia Holdings LLC</span>.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">© {new Date().getFullYear()} Exodia Holdings LLC. All sigils reserved.</p>
        </div>
      </div>
    </footer>
  );
}