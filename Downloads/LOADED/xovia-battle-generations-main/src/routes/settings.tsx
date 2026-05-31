import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  head: () => ({ meta: [{ title: "Profile Settings — Exodia" }] }),
});

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { navigate({ to: "/auth", search: { mode: "signin" } as never }); return; }
    supabase.from("profiles").select("username, display_name, bio, is_public").eq("id", user.id).maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setUsername(data.username ?? "");
        setDisplayName(data.display_name ?? "");
        setBio(data.bio ?? "");
        setIsPublic(data.is_public ?? true);
      });
  }, [user, loading, navigate]);

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      if (username) {
        const { error } = await supabase.rpc("set_username", { _username: username.toLowerCase() });
        if (error) throw error;
      }
      const { error: pErr } = await supabase.from("profiles")
        .update({ display_name: displayName, bio, is_public: isPublic })
        .eq("id", user.id);
      if (pErr) throw pErr;
      toast.success("Profile saved");
    } catch (e) {
      toast.error("Could not save", { description: (e as Error).message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <section className="container mx-auto max-w-2xl px-4 py-12">
        <div className="text-xs uppercase tracking-[0.3em] text-gold">Account</div>
        <h1 className="mt-2 font-display text-4xl text-gradient-gold">Profile Settings</h1>

        <div className="mt-8 space-y-6 rounded-lg border border-border/60 bg-card/40 p-6">
          <Field label="Username (your /u/ handle)" hint="3–20 chars · a–z, 0–9, underscore">
            <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="exodia" />
          </Field>
          <Field label="Display name">
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Domenick Arlon Hall" />
          </Field>
          <Field label="Bio">
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              className="w-full rounded-md border border-border/60 bg-background/60 p-3 text-sm" placeholder="Tell duelists about yourself…" />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} className="h-4 w-4" />
            <span>
              <span className="font-display text-foreground">Public profile</span>
              <span className="ml-2 text-muted-foreground">Allow anyone to view your stats & achievements at /u/{username || "yourname"}</span>
            </span>
          </label>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Link to="/u/$username" params={{ username: username || "yourname" }} className="text-sm text-gold underline">
              Preview public profile →
            </Link>
            <Button onClick={save} disabled={saving} className="bg-gold text-gold-foreground hover:bg-gold/90">
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</label>
      {hint && <div className="mt-1 text-[11px] text-muted-foreground/70">{hint}</div>}
      <div className="mt-2">{children}</div>
    </div>
  );
}