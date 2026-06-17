import { createFileRoute, Link, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { useOnboardingRedirect } from "@/lib/useOnboardingGate";

export const Route = createFileRoute("/_authenticated/onboarding-profile")({
  head: () => ({
    meta: [
      { title: "Profile Setup — Narf Narf" },
      { name: "description", content: "Set up your Narf Narf operator: username, avatar, region, and bio." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ProfileSetupPage,
});

const AVATARS = [
  "🛰️", "🌍", "🌑", "☄️", "🔭", "⚛️", "🧬", "🦠",
];

const REGIONS = [
  "North America", "South America", "Europe", "Africa",
  "Middle East", "Asia", "Oceania", "Antarctica",
];

function ProfileSetupPage() {
  const navigate = useNavigate();
  const { profile, loading, reload } = useProfile();
  // Only redirect AWAY from this page if the user already has a username
  // (i.e. they belong on a later step). Otherwise stay put so they can
  // actually set their callsign without flickering back to /select.
  useOnboardingRedirect(profile, loading, {
    allowHere: ["/onboarding-profile"],
  });
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [region, setRegion] = useState(REGIONS[0]);
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading) return null;
  if (!profile) return <Navigate to="/auth" />;

  const validUsername = /^[A-Za-z0-9_]{3,20}$/.test(username);

  const submit = async () => {
    setError(null);
    if (!validUsername) {
      setError("Username must be 3–20 chars, letters/numbers/underscore, no spaces.");
      return;
    }
    setSaving(true);
    try {
      const { error: e } = await supabase
        .from("profiles")
        .update({
          username,
          avatar_url: avatar,
          region,
          bio: bio.slice(0, 120) || null,
        } as any)
        .eq("id", profile.id);
      if (e) {
        if (e.code === "23505") setError("That username is taken.");
        else setError(e.message);
        return;
      }
      await reload();
      navigate({ to: "/onboarding" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-y-auto flex flex-col px-6 py-8"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
          NARF NARF · INTAKE
        </span>
        <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">
          STEP 1 OF 3
        </span>
        <Link
          to={profile.prologue_choice ? "/select" : "/onboarding"}
          className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground"
        >
          {profile.prologue_choice ? "PLAY →" : "OATH →"}
        </Link>
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        <h1 className="font-display text-3xl tracking-tight mb-1">SET YOUR CALLSIGN</h1>
        <p className="text-foreground/60 text-[13px] mb-6">
          Your operator profile. This is how the network sees you.
        </p>

        <Field label="USERNAME">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value.trim())}
            placeholder="e.g. terra_ops_07"
            maxLength={20}
            className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-[#378ADD]"
          />
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            3–20 chars · letters, numbers, underscore
          </div>
        </Field>

        <Field label="AVATAR">
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                className="aspect-square rounded-lg text-2xl flex items-center justify-center transition"
                style={{
                  background: avatar === a ? "rgba(55,138,221,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${avatar === a ? "rgba(55,138,221,0.8)" : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>

        <Field label="HOME REGION">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-[#378ADD]"
          >
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>

        <Field label={`BIO · ${bio.length}/120`}>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 120))}
            placeholder="Optional — what brings you to the theater?"
            rows={3}
            className="w-full bg-black/40 border border-white/15 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:border-[#378ADD] resize-none"
          />
        </Field>

        {error && (
          <div className="text-xs font-mono mb-3" style={{ color: "#E24B4A" }}>{error}</div>
        )}

        <button
          onClick={submit}
          disabled={!validUsername || saving}
          className="w-full py-3.5 rounded-2xl font-display tracking-[0.3em] text-sm transition active:scale-[0.98] disabled:opacity-40"
          style={{
            background: "linear-gradient(180deg, #378ADD 0%, #1a4a85 100%)",
            color: "#03060F",
            boxShadow: "0 8px 24px rgba(55,138,221,0.4), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        >
          {saving ? "SAVING…" : "CONFIRM PROFILE →"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}