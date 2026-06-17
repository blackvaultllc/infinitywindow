import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { AudioSettings } from "@/components/AudioSettings";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Narf Narf" },
      { name: "description", content: "Tune your interface — pick between Regular and Advanced control modes, manage audio, and configure your account." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { profile, loading, reload } = useProfile();
  const [saving, setSaving] = useState<"regular" | "advanced" | null>(null);

  const setMode = async (mode: "regular" | "advanced") => {
    if (!profile || saving || profile.ui_mode === mode) return;
    setSaving(mode);
    try {
      await supabase.from("profiles").update({ ui_mode: mode } as any).eq("id", profile.id);
      await reload();
    } finally {
      setSaving(null);
    }
  };

  return (
    <div
      className="min-h-dvh px-4 py-6 pb-24 md:pb-10"
      style={{
        background: "radial-gradient(ellipse at 50% 20%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
              NARF NARF · CONFIG
            </div>
            <h1 className="font-display text-3xl tracking-tight mt-1">SETTINGS</h1>
          </div>
          <Link
            to="/select"
            className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground"
          >
            ← BACK
          </Link>
        </div>

        {loading || !profile ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite">
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
            <div className="h-24 rounded-2xl bg-white/5 animate-pulse" />
          </div>
        ) : (
          <section aria-labelledby="ui-mode-heading" className="terra-panel rounded-2xl p-5">
            <h2 id="ui-mode-heading" className="font-display tracking-[0.25em] text-sm mb-1">
              INTERFACE MODE
            </h2>
            <p className="text-[12px] text-muted-foreground mb-4">
              Regular Mode hides advanced controls and adds tooltips. Advanced Mode unlocks
              keyboard shortcuts and the full HUD.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ModeCard
                title="REGULAR"
                blurb="Streamlined HUD · tap-and-hold tooltips · safer defaults."
                active={profile.ui_mode === "regular"}
                pending={saving === "regular"}
                onClick={() => setMode("regular")}
                accent="#378ADD"
              />
              <ModeCard
                title="ADVANCED"
                blurb="Full HUD · keyboard shortcuts · raw stats and timers."
                active={profile.ui_mode === "advanced"}
                pending={saving === "advanced"}
                onClick={() => setMode("advanced")}
                accent="#EF9F27"
              />
            </div>
          </section>
        )}
        <AudioSettings />
        {profile && <PresenceControl profile={profile} reload={reload} />}
        {profile && <ParentControls profile={profile} reload={reload} />}
      </div>
    </div>
  );
}

function ModeCard({
  title,
  blurb,
  active,
  pending,
  onClick,
  accent,
}: {
  title: string;
  blurb: string;
  active: boolean;
  pending: boolean;
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      disabled={pending}
      className="text-left rounded-xl p-4 min-h-11 transition active:scale-[0.98] disabled:opacity-60"
      style={{
        border: `1px solid ${active ? accent : "rgba(255,255,255,0.12)"}`,
        background: active ? `${accent}1a` : "rgba(255,255,255,0.03)",
        boxShadow: active ? `0 0 24px ${accent}40` : undefined,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="font-display tracking-[0.3em] text-sm" style={{ color: accent }}>
          {title}
        </div>
        {active && (
          <span className="font-mono text-[10px] tracking-[0.2em] text-foreground/80">
            ACTIVE
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2 leading-snug">{blurb}</p>
      {pending && (
        <div className="mt-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground">
          SAVING…
        </div>
      )}
    </button>
  );
}

function ParentControls({ profile, reload }: { profile: any; reload: () => void }) {
  const [isParent, setIsParent] = useState<boolean>(!!profile.is_parent);
  const [isMinor, setIsMinor] = useState<boolean>(!!profile.is_minor);
  const [parentEmail, setParentEmail] = useState<string>(profile.parent_email ?? "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ is_parent: isParent, is_minor: isMinor, parent_email: parentEmail || null } as any)
      .eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Saved");
      reload();
    }
  };

  return (
    <section aria-labelledby="parent-heading" className="terra-panel rounded-2xl p-5 mt-4">
      <h2 id="parent-heading" className="font-display tracking-[0.25em] text-sm mb-1">FAMILY · PARENTAL CONTROLS</h2>
      <p className="text-[12px] text-muted-foreground mb-4">
        Parent accounts get email approval requests when their child wants to change settings or buy items. Children flagged here send purchases through the approval queue automatically.
      </p>
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 py-2 min-h-11">
          <span className="font-display tracking-[0.2em] text-xs">PARENT ACCOUNT</span>
          <Switch checked={isParent} onCheckedChange={setIsParent} />
        </label>
        <label className="flex items-center justify-between gap-3 py-2 min-h-11">
          <span className="font-display tracking-[0.2em] text-xs">CHILD ACCOUNT (REQUIRES APPROVAL)</span>
          <Switch checked={isMinor} onCheckedChange={setIsMinor} />
        </label>
        {isMinor && (
          <div>
            <label className="font-display tracking-[0.2em] text-xs block mb-1">PARENT EMAIL</label>
            <Input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com" />
          </div>
        )}
        <Button onClick={save} disabled={busy} className="min-h-11">{busy ? "Saving…" : "Save family settings"}</Button>
      </div>
    </section>
  );
}

function PresenceControl({ profile, reload }: { profile: any; reload: () => void }) {
  const [show, setShow] = useState<boolean>(profile.show_online !== false);
  const [busy, setBusy] = useState(false);

  const toggle = async (next: boolean) => {
    setShow(next);
    setBusy(true);
    const { error } = await supabase.rpc("set_show_online" as any, { _show: next });
    setBusy(false);
    if (error) {
      setShow(!next);
      toast.error(error.message);
    } else {
      toast.success(next ? "You'll appear online to clan & friends" : "You'll appear offline");
      reload();
    }
  };

  return (
    <section aria-labelledby="presence-heading" className="terra-panel rounded-2xl p-5 mt-4">
      <h2 id="presence-heading" className="font-display tracking-[0.25em] text-sm mb-1">PRIVACY · ONLINE STATUS</h2>
      <p className="text-[12px] text-muted-foreground mb-4">
        When on, your clanmates and friends see a green dot next to your name while you're active. Turn off to stay invisible.
      </p>
      <label className="flex items-center justify-between gap-3 py-2 min-h-11">
        <span className="font-display tracking-[0.2em] text-xs">SHOW ME AS ONLINE</span>
        <Switch checked={show} onCheckedChange={toggle} disabled={busy} />
      </label>
    </section>
  );
}
