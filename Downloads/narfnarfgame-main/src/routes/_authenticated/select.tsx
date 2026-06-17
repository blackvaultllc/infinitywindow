import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { useGame } from "@/game/store";
import { useProfile, hasAnyRole } from "@/lib/useProfile";
import { useOnboardingRedirect, nextOnboardingPath } from "@/lib/useOnboardingGate";
import { ROLE_BLURB, ROLE_ICON } from "@/game/data";
import type { GameMode, Role } from "@/game/types";
import { PlayerAvatar } from "@/components/avatar/PlayerAvatar";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



export const Route = createFileRoute("/_authenticated/select")({
  head: () => ({
    meta: [
      { title: "Choose Your Side — Narf Narf" },
      { name: "description", content: "Pick your role — Diplomat, Commander, Scientist, or Engineer — and enter the live Narf Narf crisis theater." },
      { property: "og:title", content: "Choose Your Side — Narf Narf" },
      { property: "og:description", content: "Pick your operator role and enter the live theater." },
      { property: "og:url", content: "/select" },
    ],
    links: [{ rel: "canonical", href: "/select" }],
  }),
  component: RoleSelect,
});

const HUMAN_ROLES: Role[] = ["Commander", "Scientist", "Diplomat", "Engineer"];

function RoleSelect() {
  const start = useGame((s) => s.start);
  const reset = useGame((s) => s.reset);
  const navigate = useNavigate();
  const { profile, loading } = useProfile();
  const isStaff = hasAnyRole(profile, ["admin", "moderator", "support"]);
  useOnboardingRedirect(profile, loading);

  const [mode, setMode] = useState<GameMode>("solo");
  const inClan = !!(profile as any)?.clan_id;
  // Clan perks apply when the user is actually in a clan AND queuing co-op or ranked
  const clanBoost = inClan && (mode === "coop" || mode === "ranked");

  const pick = (role: Role) => {
    reset();
    start(role, { mode, clanBoost });
    navigate({ to: "/play" });
  };

  const oath = (profile as any)?.prologue_choice as "humans" | "planet" | "watcher" | undefined;
  const showTerra = oath !== "humans"; // humans-side hides Terra
  const showHumans = oath !== "planet"; // planet-side hides human ops



  // Hold the page blank while we're still resolving the profile or about to
  // redirect into onboarding — prevents the role grid from flashing in for a
  // frame before the router swaps the route.
  const needsRedirect = !!profile && nextOnboardingPath(profile) !== null;
  if (loading || !profile || needsRedirect) {
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{
          background:
            "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
        }}
      >
        <div
          className="font-mono text-[10px] tracking-[0.4em] animate-pulse"
          style={{ color: "#378ADD" }}
        >
          SYNCING OPERATOR…
        </div>
      </div>
    );
  }

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div
      className="fixed inset-0 overflow-x-hidden overflow-y-auto flex flex-col pb-24 md:pb-0"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <header className="flex items-center justify-between gap-3 px-5 py-4 border-b border-white/10 backdrop-blur-md">
        <div className="font-display tracking-[0.25em] text-[11px] min-w-0 truncate">SIS · GRAND ORACLE</div>

        {/* Mobile: single cabinet dropdown so the header never overflows */}
        <div className="sm:hidden shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Open menu"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-display tracking-widest"
              style={{
                color: "#EF9F27",
                border: "1px solid rgba(239,159,39,0.5)",
                background: "rgba(239,159,39,0.08)",
              }}
            >
              <Menu className="h-4 w-4" /> MENU
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Cabinet</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isStaff && (
                <DropdownMenuItem asChild>
                  <Link to="/admin">Admin</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem asChild><Link to="/clan">Clan</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/store">Store</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/forums">Forums</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/customize">Customize</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/how-to-play">How to Play</Link></DropdownMenuItem>
              <DropdownMenuItem asChild><Link to="/settings">Settings</Link></DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={signOut} className="text-destructive focus:text-destructive">
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop: inline links */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {isStaff && (
            <Link
              to="/admin"
              className="text-[11px] font-display tracking-widest px-2.5 py-1 rounded-md transition"
              style={{
                color: "#EF9F27",
                border: "1px solid rgba(239,159,39,0.6)",
                background: "rgba(239,159,39,0.1)",
              }}
            >
              ADMIN →
            </Link>
          )}
          <Link to="/clan" className="text-[11px] font-display tracking-widest text-foreground/80 hover:text-foreground transition">CLAN →</Link>
          <Link to="/store" className="text-[11px] font-display tracking-widest text-foreground/80 hover:text-foreground transition">STORE →</Link>
          <Link to="/forums" className="text-[11px] font-display tracking-widest text-foreground/80 hover:text-foreground transition">FORUMS →</Link>
          <Link to="/customize" className="text-[11px] font-display tracking-widest text-foreground/80 hover:text-foreground transition">CUSTOMIZE →</Link>
          <Link to="/how-to-play" className="text-[11px] font-display tracking-widest text-foreground/80 hover:text-foreground transition">HOW TO PLAY →</Link>
          <Link to="/settings" className="text-[11px] font-display tracking-widest text-foreground/80 hover:text-foreground transition">SETTINGS →</Link>
          <button
            onClick={signOut}
            className="text-[11px] font-display tracking-widest text-foreground/60 hover:text-destructive transition"
          >
            SIGN OUT
          </button>
        </div>
      </header>


      <section className="flex-1 px-4 py-4 max-w-3xl mx-auto w-full sm:px-5 sm:py-6">
        <div className="mb-4 flex items-start gap-3 sm:gap-4">
          <PlayerAvatar
            config={{
              role: (profile as any).avatar_role,
              gender: (profile as any).avatar_gender,
              skin: (profile as any).avatar_skin,
              uniform: (profile as any).avatar_uniform,
              flag: (profile as any).avatar_flag,
              accent: (profile as any).avatar_accent,
            }}
            size={72}
          />
          <div className="min-w-0">
            <div className="font-display tracking-[0.35em] text-[10px] mb-2" style={{ color: "#E24B4A" }}>
              DEPLOYMENT · NARF NARF
            </div>
            <h1 className="font-display text-4xl leading-none">
              PICK YOUR<span style={{ color: "#E24B4A" }}>.</span>
              <br />
              <span className="text-muted-foreground">SEAT</span>
            </h1>
          </div>
        </div>

        <div className="font-display text-[10px] tracking-widest text-muted-foreground mb-2">GAME MODE</div>
        <ModeGrid mode={mode} setMode={setMode} inClan={inClan} />
        {clanBoost && (
          <div
            className="mb-3 rounded-md border px-3 py-2 text-[11px]"
            style={{ borderColor: "rgba(127,119,221,0.5)", background: "rgba(127,119,221,0.1)", color: "#cfc9ff" }}
          >
            CLAN PERK ACTIVE — +1 action, primed shield, +10 starting trust.
          </div>
        )}

        {showTerra && (
          <>
            <div className="font-display text-[10px] tracking-widest text-muted-foreground mb-2">PLANET</div>
            <RoleCard
              role="Terra"
              blurb="Become the disaster. Chain catastrophes across the globe."
              icon={ROLE_ICON.Terra}
              onPick={() => pick("Terra")}
              accent="var(--terra-crimson)"
              compact
              wide
            />
          </>
        )}

        {showHumans && (
          <>
            <div className="mt-3 font-display text-[10px] tracking-widest text-muted-foreground mb-2">
              HUMAN ROLES
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {HUMAN_ROLES.map((r) => (
                <RoleCard
                  key={r}
                  role={r}
                  blurb={ROLE_BLURB[r as Exclude<Role, "Terra">]}
                  icon={ROLE_ICON[r]}
                  onPick={() => pick(r)}
                  accent="var(--terra-blue)"
                  compact
                />
              ))}
            </div>
          </>
        )}

        {oath && (
          <div className="mb-3 text-[10px] font-mono tracking-widest text-foreground/60">
            OATH · {oath.toUpperCase()} ·{" "}
            <Link to="/onboarding" search={{ change: "1" } as any} className="underline hover:text-foreground">change</Link>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <PromoLink to="/store" label="Store" body="Coins, cosmetics, passes" accent="#EF9F27" />
          <PromoLink to="/forums" label="Forums" body="Captain Infinity + RememberFi" accent="#7F77DD" />
          <PromoLink to="/pastimes" label="Pastimes" body="Chess + cube modes" accent="#378ADD" />
        </div>
      </section>
    </div>
  );
}

const MODES: { id: GameMode; label: string; body: string; accent: string }[] = [
  { id: "ranked",   label: "Ranked",        body: "Standard match. Wins & losses count.",       accent: "#E24B4A" },
  { id: "solo",     label: "Solo vs AI",    body: "You + AI teammates against an AI Terra.",     accent: "#378ADD" },
  { id: "coop",     label: "Humans vs Planet", body: "Clan co-op vs Terra AI. Perks active.",   accent: "#7F77DD" },
  { id: "practice", label: "Practice",      body: "Sandbox. No ranked record.",                  accent: "#EF9F27" },
];

function ModeGrid({
  mode,
  setMode,
  inClan,
}: {
  mode: GameMode;
  setMode: (m: GameMode) => void;
  inClan: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      {MODES.map((m) => {
        const active = mode === m.id;
        const coopLocked = m.id === "coop" && !inClan;
        return (
          <button
            key={m.id}
            onClick={() => !coopLocked && setMode(m.id)}
            disabled={coopLocked}
            className="rounded-md border px-3 py-2 text-left transition active:scale-[0.98] disabled:opacity-50"
            style={{
              borderColor: active ? m.accent : `${m.accent}55`,
              background: active ? `${m.accent}22` : "rgba(3,6,15,0.6)",
            }}
          >
            <div className="font-display text-[11px] tracking-widest" style={{ color: m.accent }}>
              {m.label.toUpperCase()}
            </div>
            <div className="mt-0.5 text-[10px] leading-snug text-foreground/70">
              {coopLocked ? "Join a clan in Forums to unlock." : m.body}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PromoLink({ to, label, body, accent }: { to: "/store" | "/forums" | "/codex" | "/pastimes"; label: string; body: string; accent: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border p-3 transition active:scale-[0.98]"
      style={{ borderColor: `${accent}88`, background: `${accent}14` }}
    >
      <div className="font-display text-[11px] tracking-widest" style={{ color: accent }}>{label.toUpperCase()}</div>
      <div className="mt-1 text-[11px] leading-snug text-foreground/75">{body}</div>
    </Link>
  );
}

function RoleCard({
  role,
  blurb,
  icon,
  onPick,
  accent,
  wide,
  compact,
}: {
  role: Role;
  blurb: string;
  icon: string;
  onPick: () => void;
  accent: string;
  wide?: boolean;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onPick}
      className={`terra-panel rounded-lg p-3 text-left group transition hover:translate-y-[-2px] active:scale-[0.98] sm:p-4 ${
        wide ? "w-full" : ""
      }`}
      style={{ borderColor: accent, background: "rgba(3,6,15,0.75)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded flex items-center justify-center font-display text-lg shrink-0"
          style={{ backgroundColor: accent, color: "#0a0a0f" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="font-display tracking-widest text-base text-foreground">{role.toUpperCase()}</div>
          <div className="text-[10px] tracking-widest font-display" style={{ color: accent }}>
            DEPLOY →
          </div>
        </div>
      </div>
      {!compact && <p className="text-[13px] text-foreground/85 mt-2 leading-snug">{blurb}</p>}
    </button>
  );
}