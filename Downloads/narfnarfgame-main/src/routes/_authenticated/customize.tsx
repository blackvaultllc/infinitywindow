import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { PlayerAvatar, type AvatarConfig } from "@/components/avatar/PlayerAvatar";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/customize")({
  component: CustomizePage,
});

const SKINS = ["#f4d4b0", "#e6b894", "#d8b48a", "#b58963", "#8d5a3c", "#5b3a24", "#3b2414"];
const ACCENTS = ["#38bdf8", "#a855f7", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#eab308", "#14b8a6"];
const HAIR_COLORS = ["#1a1a1a", "#3b2414", "#8b5a2b", "#c9a36b", "#e8d27a", "#b91c1c", "#1e3a8a", "#7c3aed", "#e2e8f0"];
const SHIRT_COLORS = ["#334155", "#1f2937", "#0f172a", "#e2e8f0", "#dc2626", "#2563eb", "#16a34a", "#f59e0b", "#a855f7", "#ec4899"];
const PANTS_COLORS = ["#1e293b", "#0b0f17", "#0a0f1c", "#475569", "#3f3f46", "#1e3a8a", "#365314", "#7c2d12"];

const UNIFORMS = [
  { id: "standard", label: "Standard" },
  { id: "tactical", label: "Tactical" },
  { id: "dress", label: "Dress" },
  { id: "lab", label: "Lab Coat" },
];
const ROLES = [
  { id: "diplomat", label: "Diplomat" },
  { id: "commander", label: "Commander" },
  { id: "scientist", label: "Scientist" },
  { id: "engineer", label: "Engineer" },
];
const GENDERS = [
  { id: "masculine", label: "Masculine" },
  { id: "feminine", label: "Feminine" },
  { id: "neutral", label: "Neutral" },
];
const HAIR_STYLES = [
  { id: "short", label: "Short" },
  { id: "long", label: "Long" },
  { id: "ponytail", label: "Ponytail" },
  { id: "buzz", label: "Buzz" },
  { id: "afro", label: "Afro" },
  { id: "mohawk", label: "Mohawk" },
  { id: "cap", label: "Cap" },
  { id: "bald", label: "Bald" },
];
const FACES = [
  { id: "smile", label: "Smile" },
  { id: "smirk", label: "Smirk" },
  { id: "serious", label: "Serious" },
  { id: "open", label: "Open" },
];
const FLAGS = ["UN", "US", "UK", "JP", "DE", "FR", "BR", "IN", "CN", "RU", "ZA", "AU"];

function CustomizePage() {
  const { profile, reload } = useProfile();
  const navigate = useNavigate();
  const [cfg, setCfg] = useState<AvatarConfig>({
    role: "diplomat",
    gender: "neutral",
    skin: SKINS[2],
    uniform: "standard",
    flag: "UN",
    accent: ACCENTS[0],
    hairStyle: "short",
    hairColor: HAIR_COLORS[0],
    shirtColor: SHIRT_COLORS[0],
    pantsColor: PANTS_COLORS[0],
    face: "smile",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const p = profile as any;
    setCfg({
      role: p.avatar_role || "diplomat",
      gender: p.avatar_gender || "neutral",
      skin: p.avatar_skin || SKINS[2],
      uniform: p.avatar_uniform || "standard",
      flag: p.avatar_flag || "UN",
      accent: p.avatar_accent || ACCENTS[0],
      hairStyle: p.avatar_hair_style || "short",
      hairColor: p.avatar_hair_color || HAIR_COLORS[0],
      shirtColor: p.avatar_shirt_color || SHIRT_COLORS[0],
      pantsColor: p.avatar_pants_color || PANTS_COLORS[0],
      face: p.avatar_face || "smile",
    });
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_role: cfg.role,
        avatar_gender: cfg.gender,
        avatar_skin: cfg.skin,
        avatar_uniform: cfg.uniform,
        avatar_flag: cfg.flag,
        avatar_accent: cfg.accent,
        avatar_hair_style: cfg.hairStyle,
        avatar_hair_color: cfg.hairColor,
        avatar_shirt_color: cfg.shirtColor,
        avatar_pants_color: cfg.pantsColor,
        avatar_face: cfg.face,
      } as any)
      .eq("id", profile.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Avatar saved");
    await reload();
    navigate({ to: "/select" });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-3xl font-bold">Customize Your Operative</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Build your character — Roblox-style blocky look. Your avatar appears on the HUD and as your beacon on the world map.
        </p>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <div className="flex flex-col items-center gap-4 rounded-xl border bg-card p-6 md:sticky md:top-6 self-start">
            <div className="rounded-xl bg-gradient-to-b from-slate-900 to-slate-800 p-4">
              <PlayerAvatar config={cfg} size={220} />
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold capitalize">{cfg.role}</div>
              <div className="text-xs text-muted-foreground">Flag: {cfg.flag}</div>
            </div>
          </div>

          <div className="space-y-5">
            <Section label="Role">
              <Chips options={ROLES} value={cfg.role} onChange={(v) => setCfg({ ...cfg, role: v })} />
            </Section>
            <Section label="Gender Presentation">
              <Chips options={GENDERS} value={cfg.gender} onChange={(v) => setCfg({ ...cfg, gender: v })} />
            </Section>
            <Section label="Face">
              <Chips options={FACES} value={cfg.face} onChange={(v) => setCfg({ ...cfg, face: v })} />
            </Section>
            <Section label="Skin Tone">
              <Swatches colors={SKINS} value={cfg.skin} onChange={(c) => setCfg({ ...cfg, skin: c })} />
            </Section>
            <Section label="Hair Style">
              <Chips options={HAIR_STYLES} value={cfg.hairStyle} onChange={(v) => setCfg({ ...cfg, hairStyle: v })} />
            </Section>
            <Section label="Hair Color">
              <Swatches colors={HAIR_COLORS} value={cfg.hairColor} onChange={(c) => setCfg({ ...cfg, hairColor: c })} />
            </Section>
            <Section label="Shirt Color">
              <Swatches colors={SHIRT_COLORS} value={cfg.shirtColor} onChange={(c) => setCfg({ ...cfg, shirtColor: c })} />
            </Section>
            <Section label="Pants Color">
              <Swatches colors={PANTS_COLORS} value={cfg.pantsColor} onChange={(c) => setCfg({ ...cfg, pantsColor: c })} />
            </Section>
            <Section label="Uniform Preset">
              <Chips options={UNIFORMS} value={cfg.uniform} onChange={(v) => setCfg({ ...cfg, uniform: v })} />
            </Section>
            <Section label="Accent Color">
              <Swatches colors={ACCENTS} value={cfg.accent} onChange={(c) => setCfg({ ...cfg, accent: c })} />
            </Section>
            <Section label="Country / Flag">
              <Chips
                options={FLAGS.map((f) => ({ id: f, label: f }))}
                value={cfg.flag}
                onChange={(v) => setCfg({ ...cfg, flag: v })}
              />
            </Section>

            <div className="sticky bottom-0 -mx-1 flex gap-3 bg-background/95 py-3 backdrop-blur">
              <Button onClick={save} disabled={saving} className="flex-1">
                {saving ? "Saving..." : "Save Avatar"}
              </Button>
              <Button variant="outline" onClick={() => navigate({ to: "/select" })}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function Swatches({
  colors,
  value,
  onChange,
}: {
  colors: string[];
  value: string | null | undefined;
  onChange: (c: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="h-10 w-10 rounded-full border-2 transition"
          style={{
            background: c,
            borderColor: value === c ? "hsl(var(--primary))" : "transparent",
            boxShadow: value === c ? "0 0 0 2px hsl(var(--background))" : undefined,
          }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-[44px] rounded-lg border px-4 py-2 text-sm transition ${
            value === o.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card hover:bg-accent"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
