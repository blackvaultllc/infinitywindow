import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Narf Narf" },
      { name: "description", content: "Your Narf Narf operator profile, stats, and cosmetics." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MyProfilePage,
});

function MyProfilePage() {
  const { profile, loading, reload } = useProfile();
  const [edit, setEdit] = useState(false);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [friendCount, setFriendCount] = useState<number | null>(null);

  useEffect(() => {
    if (profile) setBio(profile.bio ?? "");
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { count } = await supabase
        .from("friends")
        .select("id", { count: "exact", head: true })
        .eq("status", "accepted")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);
      setFriendCount(count ?? 0);
    })();
  }, [profile]);

  if (loading && !profile) return null;
  if (!profile) return <Navigate to="/auth" />;
  if (!profile.username) {
    return (
      <Shell>
        <FinishOnboardingCard
          to="/onboarding-profile"
          title="FINISH OPERATOR SETUP"
          body="You need a callsign before your profile page lights up. Takes about 30 seconds."
          cta="SET CALLSIGN →"
        />
      </Shell>
    );
  }

  const save = async () => {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({ bio: bio.slice(0, 120) || null } as any)
        .eq("id", profile.id);
      await reload();
      setEdit(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell>
      <ProfileHeader
        avatar={profile.avatar_url}
        username={profile.username}
        displayName={profile.display_name}
        region={profile.region}
        bio={profile.bio}
        editable
        onEditBio={() => setEdit(true)}
      />

      {edit && (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
            BIO · {bio.length}/120
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 120))}
            rows={3}
            className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-[#378ADD] resize-none"
          />
          <div className="flex gap-2 mt-3">
            <button
              onClick={save}
              disabled={saving}
              className="font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg"
              style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)" }}
            >
              {saving ? "SAVING…" : "SAVE"}
            </button>
            <button
              onClick={() => { setEdit(false); setBio(profile.bio ?? ""); }}
              className="font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              CANCEL
            </button>
          </div>
        </div>
      )}

      <StatsGrid profile={profile} friendCount={friendCount} />

      <ReferralCard userId={profile.id} />

      <div className="mt-5 flex gap-2">
        <Link
          to="/friends"
          className="font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg"
          style={{ background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.4)" }}
        >
          FRIENDS →
        </Link>
        <Link
          to="/select"
          className="font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          BACK TO MENU
        </Link>
        <DangerZone profileId={profile.id} />
      </div>
    </Shell>
  );
}

function ReferralCard({ userId }: { userId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState<boolean>(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("referral_code, referral_redeemed")
        .eq("id", userId)
        .maybeSingle();
      setCode(((data as any)?.referral_code as string) ?? null);
      setRedeemed(Boolean((data as any)?.referral_redeemed));
    })();
  }, [userId]);

  const shareUrl = code ? `${window.location.origin}/auth?ref=${code}` : "";

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setMsg("Link copied!");
    setTimeout(() => setMsg(null), 1800);
  };

  const redeem = async () => {
    if (!input.trim()) return;
    setBusy(true); setMsg(null);
    const { error } = await supabase.rpc("apply_referral" as any, { _code: input.trim().toUpperCase() });
    setBusy(false);
    if (error) setMsg(error.message);
    else { setMsg("Redeemed! 500 coins added."); setRedeemed(true); setInput(""); }
  };

  return (
    <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
      <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#F5C518" }}>
        REFERRALS · EARN COINS
      </div>
      <p className="text-[12px] text-foreground/70 mt-2">
        Share your invite link. When a friend signs up and redeems your code, you both get 500 ¢.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <code className="font-mono text-sm px-3 py-2 rounded bg-white/5 border border-white/10">{code ?? "…"}</code>
        <button
          onClick={copy}
          className="font-mono text-[10px] tracking-[0.3em] px-3 py-2 rounded-lg"
          style={{ background: "rgba(245,197,24,0.15)", border: "1px solid rgba(245,197,24,0.5)", color: "#F5C518" }}
        >
          COPY INVITE LINK
        </button>
      </div>
      {!redeemed && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.toUpperCase().slice(0, 16))}
            placeholder="Have a code? Enter it"
            className="flex-1 min-w-[180px] bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-[#F5C518]"
          />
          <button
            onClick={redeem}
            disabled={busy || !input}
            className="font-mono text-[10px] tracking-[0.3em] px-3 py-2 rounded-lg disabled:opacity-40"
            style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)" }}
          >
            REDEEM
          </button>
        </div>
      )}
      {msg && <div className="mt-2 text-[11px] font-mono text-foreground/70">{msg}</div>}
    </div>
  );
}

export function FinishOnboardingCard({
  to, title, body, cta,
}: { to: string; title: string; body: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
      <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#EF9F27" }}>
        ONBOARDING INCOMPLETE
      </div>
      <h2 className="font-display text-2xl tracking-tight mt-2">{title}</h2>
      <p className="text-[13px] text-foreground/70 mt-2 max-w-sm mx-auto">{body}</p>
      <Link
        to={to}
        className="inline-block mt-4 font-display tracking-[0.3em] text-xs px-5 py-3 rounded-xl"
        style={{
          background: "linear-gradient(180deg, #378ADD 0%, #1a4a85 100%)",
          color: "#03060F",
          boxShadow: "0 8px 24px rgba(55,138,221,0.4)",
        }}
      >
        {cta}
      </Link>
    </div>
  );
}

function DangerZone({ profileId }: { profileId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doDelete = async () => {
    setBusy(true);
    setError(null);
    try {
      // Soft account wipe: clear profile fields the user controls and sign out.
      // (Hard auth-user deletion needs a privileged edge function — kept out of
      // the client for safety.)
      const { error: e } = await supabase
        .from("profiles")
        .update({
          username: null,
          display_name: null,
          bio: null,
          avatar_url: null,
          region: null,
          onboarding_complete: false,
          alignment_locked: false,
          prologue_choice: null,
        } as any)
        .eq("id", profileId);
      if (e) throw e;
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err: any) {
      setError(err?.message ?? "Couldn't delete account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={() => (confirming ? doDelete() : setConfirming(true))}
      disabled={busy}
      className="ml-auto font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg disabled:opacity-40"
      style={{
        background: confirming ? "rgba(226,75,74,0.25)" : "rgba(226,75,74,0.1)",
        border: "1px solid rgba(226,75,74,0.6)",
        color: "#E24B4A",
      }}
      title={error ?? undefined}
    >
      {busy ? "DELETING…" : confirming ? "TAP AGAIN TO CONFIRM" : "DELETE ACCOUNT"}
    </button>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #0a1e4a 0%, #050a1f 60%, #02040c 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Link to="/select" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">
          ← BACK
        </Link>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

export function ProfileHeader({
  avatar, username, displayName, region, bio, editable, onEditBio,
}: {
  avatar: string | null;
  username: string;
  displayName: string | null;
  region: string | null;
  bio: string | null;
  editable?: boolean;
  onEditBio?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/40 p-5 flex gap-4 items-start">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shrink-0"
        style={{ background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.4)" }}
      >
        {avatar || "🛰️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">@{username}</div>
        <h1 className="font-display text-2xl tracking-tight truncate">{displayName || username}</h1>
        {region && (
          <div className="mt-1 font-mono text-[10px] tracking-[0.25em]" style={{ color: "#9cc6f5" }}>
            {region.toUpperCase()}
          </div>
        )}
        <p className="mt-2 text-[13px] text-foreground/70 leading-relaxed">
          {bio || <span className="text-muted-foreground/60">No bio yet.</span>}
        </p>
        {editable && (
          <button
            onClick={onEditBio}
            className="mt-2 font-mono text-[10px] tracking-[0.3em] text-[#378ADD] hover:underline"
          >
            EDIT BIO
          </button>
        )}
      </div>
    </div>
  );
}

function StatsGrid({ profile, friendCount }: { profile: any; friendCount: number | null }) {
  // Live stats are not implemented yet — show 0 placeholders with clear labels.
  const stats: { label: string; value: string | number }[] = [
    { label: "COINS", value: profile.coins ?? 0 },
    { label: "FRIENDS", value: friendCount ?? "…" },
    { label: "MATCHES", value: 0 },
    { label: "WIN RATE", value: "—" },
    { label: "WINS · TERRA", value: 0 },
    { label: "WINS · COUNCIL", value: 0 },
    { label: "DISASTERS FIRED", value: 0 },
    { label: "DISASTERS BLOCKED", value: 0 },
  ];
  return (
    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-white/10 bg-black/40 p-3"
        >
          <div className="font-mono text-[9px] tracking-[0.3em] text-muted-foreground">
            {s.label}
          </div>
          <div className="font-display text-lg mt-1">{s.value}</div>
        </div>
      ))}
    </div>
  );
}