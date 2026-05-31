import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";

type Achievement = { id: string; name: string; description: string; icon: string; category: string; unlocked_at: string };
type PublicProfile = {
  username: string; display_name: string | null; avatar_url: string | null; bio: string | null;
  rank: string; level: number; xp: number; duels_played: number; duels_won: number;
  created_at: string; achievements: Achievement[];
};

export const Route = createFileRoute("/u/$username")({
  component: PublicProfilePage,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Exodia Profile` },
      { name: "description", content: `Public profile of @${params.username} on Exodia NFT Battle.` },
    ],
  }),
});

function PublicProfilePage() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase.rpc("get_public_profile", { _username: username }).then(({ data }) => {
      setProfile((data as unknown as PublicProfile) ?? null);
      setLoading(false);
    });
  }, [username]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <p className="text-muted-foreground">Loading profile…</p>
        ) : !profile ? (
          <div className="rounded-lg border border-border/60 bg-card/40 p-10 text-center">
            <h1 className="font-display text-3xl text-gradient-gold">Profile not found</h1>
            <p className="mt-3 text-muted-foreground">
              @{username} doesn't exist or has set their profile to private.
            </p>
            <Link to="/" className="mt-6 inline-block text-gold underline">Return home</Link>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-end gap-6 border-b border-border/60 pb-8">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name ?? profile.username} className="h-24 w-24 rounded-full border border-gold/60" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-gold/60 bg-card/60 font-display text-3xl text-gold">
                  {(profile.display_name ?? profile.username).slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-gold">{profile.rank} · Lv {profile.level}</div>
                <h1 className="mt-1 font-display text-4xl text-gradient-gold">{profile.display_name ?? profile.username}</h1>
                <div className="text-sm text-muted-foreground">@{profile.username}</div>
                {profile.bio && <p className="mt-3 max-w-xl text-sm text-foreground/80">{profile.bio}</p>}
              </div>
            </header>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="XP" value={profile.xp.toLocaleString()} />
              <Stat label="Duels" value={profile.duels_played} />
              <Stat label="Wins" value={profile.duels_won} />
              <Stat label="Win %" value={profile.duels_played > 0 ? `${Math.round((profile.duels_won / profile.duels_played) * 100)}%` : "—"} />
            </div>

            <h2 className="mt-12 font-display text-2xl text-gradient-gold">Achievements</h2>
            {profile.achievements.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No achievements unlocked yet.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {profile.achievements.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-lg border border-gold/30 bg-card/40 p-4">
                    <div className="text-3xl">{a.icon}</div>
                    <div>
                      <div className="font-display text-gold">{a.name}</div>
                      <div className="text-xs text-muted-foreground">{a.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl text-gradient-gold">{value}</div>
    </div>
  );
}