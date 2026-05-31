import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo-xovia.jpg";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useAudio } from "@/components/AudioProvider";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Music, VolumeX, Volume2, Bell, BellOff, Check, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/vault", label: "Vault" },
  { to: "/chests", label: "Chests" },
  { to: "/trade", label: "Trade" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/drops", label: "Drops" },
  { to: "/arena", label: "Arena" },
  { to: "/board", label: "Gambit" },
  { to: "/modes", label: "Modes" },
  { to: "/duel-pass", label: "Duel Pass" },
  { to: "/tournaments", label: "Tournaments" },
  { to: "/eras", label: "Eras" },
  { to: "/codex", label: "Codex" },
] as const;

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const { musicOn, sfxOn, toggleMusic, toggleSfx, tracks, currentTrackId, setTrack } = useAudio();
  const [balance, setBalance] = useState<number | null>(null);
  const [ankh, setAnkh] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    if (!user) { setBalance(null); setAnkh(null); return; }
    supabase.from("wallets").select("exod_balance, ankh_balance").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setBalance(data ? Number((data as { exod_balance: number }).exod_balance) : 0);
        setAnkh(data ? Number((data as { ankh_balance: number }).ankh_balance ?? 0) : 0);
      });
  }, [user]);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-2 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          {/* Mobile / tablet hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                className="rounded p-1.5 text-muted-foreground hover:text-foreground lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 overflow-y-auto bg-background">
              <SheetHeader>
                <SheetTitle className="font-display text-gradient-gold">XOVIA</SheetTitle>
              </SheetHeader>
              <nav className="mt-4 flex flex-col gap-1">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setMobileOpen(false)}
                    className="rounded px-3 py-2 text-sm text-muted-foreground hover:bg-card hover:text-foreground"
                    activeProps={{ className: "bg-card text-foreground" }}
                    activeOptions={{ exact: n.to === "/" }}
                  >
                    {n.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="rounded px-3 py-2 text-sm text-accent hover:bg-card">
                    Admin
                  </Link>
                )}
                {user && (
                  <>
                    <div className="my-2 border-t border-border/40" />
                    <Link to="/wallet" onClick={() => setMobileOpen(false)} className="rounded px-3 py-2 text-sm text-gold hover:bg-card">
                      Wallet · {balance ?? 0} EXOD
                    </Link>
                    <Link to="/shop/coins" onClick={() => setMobileOpen(false)} className="rounded px-3 py-2 text-sm text-amber-400 hover:bg-card">
                      ☥ Ankh · {ankh ?? 0}
                    </Link>
                    <Link to="/settings" onClick={() => setMobileOpen(false)} className="rounded px-3 py-2 text-sm text-muted-foreground hover:bg-card">
                      Settings
                    </Link>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <img src={logo} alt="XOVIA emblem" width={40} height={40} className="h-10 w-10 rounded-full drop-shadow-[0_0_12px_oklch(0.62_0.20_255/0.65)]" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-base tracking-[0.18em] text-gradient-gold">XOVIA</span>
            <span className="hidden text-[10px] tracking-[0.3em] text-muted-foreground sm:inline">BATTLE GENERATIONS</span>
          </div>
          </Link>
        </div>
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="px-2 py-2 text-xs tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: n.to === "/" }}
            >
              {n.label}
            </Link>
          ))}
          {isAdmin && <Link to="/admin" className="px-2 py-2 text-xs text-accent">Admin</Link>}
        </nav>
        <div className="flex items-center gap-1">
          {/* Music picker — choose a different Egyptian track */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button title="Change soundtrack" className="rounded p-1.5 text-muted-foreground hover:text-foreground">
                <Music className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Soundtrack</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {tracks.map((t) => (
                <DropdownMenuItem key={t.id} onSelect={() => setTrack(t.id)} className="flex items-center justify-between gap-2 text-xs">
                  <span>{t.label}</span>
                  {t.id === currentTrackId && <Check className="h-3.5 w-3.5 text-gold" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Mute/unmute the soundtrack */}
          <button title={musicOn ? "Mute soundtrack" : "Play soundtrack"} onClick={toggleMusic} className="rounded p-1.5 text-muted-foreground hover:text-foreground">
            {musicOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          {/* SFX toggle */}
          <button title={sfxOn ? "Mute SFX" : "Enable SFX"} onClick={toggleSfx} className="rounded p-1.5 text-muted-foreground hover:text-foreground">
            {sfxOn ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          </button>
          {user ? (
            <>
              <Link to="/shop/coins" className="hidden rounded-full border border-amber-500/60 bg-amber-500/10 px-3 py-1 text-xs font-display text-amber-400 sm:inline-flex items-center gap-1" title="Ankh Coins">
                <span aria-hidden>☥</span> {ankh ?? 0}
              </Link>
              <Link to="/wallet" className="hidden rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-xs font-display text-gold sm:inline-block" title="XOVIA Wallet">
                {balance ?? 0} EXOD
              </Link>
              <Link to="/settings" className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline-block px-2">Settings</Link>
              <Button variant="outline" onClick={signOut} className="border-border/60">Sign out</Button>
            </>
          ) : (
            <>
              <Link to="/auth" search={{ mode: "signin" } as never} className="hidden sm:inline-block">
                <Button variant="outline" className="border-gold/60 text-gold hover:bg-gold/10">Log in</Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" } as never}>
                <Button className="bg-gold text-gold-foreground hover:bg-gold/90 glow-gold font-display tracking-wider">
                  Sign up free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}