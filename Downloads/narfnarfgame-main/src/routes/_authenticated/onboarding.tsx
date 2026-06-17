import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { useOnboardingRedirect } from "@/lib/useOnboardingGate";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — Narf Narf" },
      { name: "description", content: "Take the oath before entering the theater — pick your alignment and lock in your operator for the Narf Narf campaign." },
      { property: "og:title", content: "Onboarding — Narf Narf" },
      { property: "og:description", content: "Take the oath before entering the theater in Narf Narf." },
      { property: "og:url", content: "/onboarding" },
    ],
    links: [{ rel: "canonical", href: "/onboarding" }],
  }),
  component: Onboarding,
});

type Choice = "planet" | "humans" | "watcher";

function Onboarding() {
  const navigate = useNavigate();
  const { profile, loading, reload } = useProfile();
  // Allow the user to land here to CHANGE their oath, without redirect-back-to-/select.
  const isChange = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("change") === "1";
  useOnboardingRedirect(profile, loading, isChange ? { allowHere: ["/onboarding"] } : undefined);
  const [saving, setSaving] = useState<Choice | null>(null);
  const [error, setError] = useState<string | null>(null);

  const goNext = (hasUsername: boolean) => {
    const to = hasUsername ? "/select" : "/onboarding-profile";
    void navigate({ to, replace: true });
    window.setTimeout(() => {
      if (window.location.pathname === "/onboarding") window.location.replace(to);
    }, 350);
  };

  useEffect(() => {
    if (loading || saving || !profile?.prologue_choice) return;
    if (isChange) return; // user is here intentionally to swap sides
    goNext(!!profile.username);
  }, [loading, profile?.prologue_choice, profile?.username, saving, isChange]);

  const commit = async (choice: Choice) => {
    if (saving) return;
    setError(null);
    setSaving(choice);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update({ prologue_choice: choice, alignment_locked: true } as any)
        .eq("id", auth.user.id)
        .select("username")
        .maybeSingle();
      if (error) {
        setError(error.message || "Couldn't save your oath. Try again.");
        setSaving(null);
        return;
      }
      localStorage.setItem("narf.prologue.choice", choice);
      // Navigate as soon as the oath write succeeds. Waiting for the profile
      // refetch here can leave the UI stuck on "Saving oath…" if the network
      // is slow, even though the oath has already been saved.
      goNext(!!(updatedProfile?.username || profile?.username));
      void reload();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong saving your oath.");
      setSaving(null);
    }
  };

  return (
    <div
      className="fixed inset-0 overflow-y-auto flex flex-col px-6 py-8"
      style={{
        background:
          "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
          NARF NARF · OPERATOR INTAKE
        </span>
        <Link to="/select" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">
          EXIT →
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full gap-5 py-6">
        <div className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#E24B4A" }}>
          PROLOGUE · 05
        </div>
        <h2 className="font-display text-3xl tracking-tight">CHOOSE YOUR OATH</h2>
        <p className="text-foreground/70 text-[13px] leading-relaxed">
          Tap your oath to lock it in. You can change your play mode later for
          solo and multiplayer runs.
        </p>
        <div className="w-full flex flex-col gap-2.5">
          <OathBtn color="#378ADD" label="STAND WITH HUMANS" desc="Civilization gets one chance. Make it count." selected={saving === "humans"} disabled={!!saving} onClick={() => commit("humans")} />
          <OathBtn color="#E24B4A" label="STAND WITH THE PLANET" desc="The Earth chose to fight. You fight beside it." selected={saving === "planet"} disabled={!!saving} onClick={() => commit("planet")} />
          <OathBtn color="#EF9F27" label="WATCH AND DECIDE" desc="Pick a side later. Some prefer the long view." selected={saving === "watcher"} disabled={!!saving} onClick={() => commit("watcher")} />
        </div>
        {saving && (
          <div className="font-mono text-[10px] tracking-[0.3em] text-foreground/60">SAVING OATH…</div>
        )}
      </div>

      {error && (
        <div className="max-w-sm mx-auto w-full mb-2 text-xs font-mono text-center" style={{ color: "#E24B4A" }}>
          {error}
        </div>
      )}
    </div>
  );
}

function OathBtn({
  color, label, desc, selected, disabled, onClick,
}: { color: string; label: string; desc: string; selected: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
      style={{
        background: selected ? `${color}1f` : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? color : "rgba(255,255,255,0.12)"}`,
        boxShadow: selected ? `0 0 24px ${color}55` : "none",
      }}
    >
      <div className="font-display text-[13px] tracking-[0.2em]" style={{ color }}>{label}</div>
      <div className="text-[11px] text-foreground/70 mt-1">{desc}</div>
    </button>
  );
}