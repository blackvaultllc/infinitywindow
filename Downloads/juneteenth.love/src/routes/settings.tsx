import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { toast } from "sonner";
import { validateImageFile } from "@/lib/validate-image";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Your Profile — Juneteenth.Love" },
      { name: "description", content: "Update your name, bio, location, and avatar." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user.id;
      if (!uid) {
        navigate({ to: "/auth" });
        return;
      }
      setUserId(uid);
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name,bio,avatar_url,location")
        .eq("id", uid)
        .maybeSingle();
      if (p) {
        setDisplayName(p.display_name ?? "");
        setBio(p.bio ?? "");
        setLocation(p.location ?? "");
        setAvatarUrl(p.avatar_url ?? "");
      }
      setLoading(false);
    })();
  }, [navigate]);

  const uploadAvatar = async (file: File) => {
    if (!userId) return;
    const check = await validateImageFile(file, 5 * 1024 * 1024);
    if (!check.ok) {
      toast.error(check.reason);
      return;
    }
    const path = `${userId}/avatar-${Date.now()}.${check.ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: check.mime });
    if (error) {
      toast.error(error.message);
      return;
    }
    // Bucket is private (workspace policy blocks public buckets), so use a long-lived signed URL.
    const { data, error: signErr } = await supabase.storage
      .from("avatars")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !data) {
      toast.error(signErr?.message ?? "Could not generate avatar URL");
      return;
    }
    setAvatarUrl(data.signedUrl);
    toast.success("Avatar uploaded.");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim().slice(0, 80) || "Anonymous",
        bio: bio.trim().slice(0, 1000) || null,
        location: location.trim().slice(0, 120) || null,
        avatar_url: avatarUrl || null,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved.");
  };

  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />
      <section className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-xl mx-auto">
          <h1 className="font-serif text-3xl sm:text-4xl mb-2">Your profile</h1>
          <p className="text-muted-foreground text-sm mb-8">
            How you appear next to your stories.
          </p>

          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <form onSubmit={save} className="space-y-5">
              <div className="flex items-center gap-5">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-card border border-border flex items-center justify-center text-gold font-serif text-2xl">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-[0.2em] text-gold cursor-pointer hover:text-foreground">
                    Upload avatar
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadAvatar(f);
                      }}
                    />
                  </label>
                  <p className="text-[11px] text-muted-foreground leading-snug max-w-[220px]">
                    Square image works best (e.g. 400×400). JPG, PNG, WEBP or GIF, under 5MB.
                  </p>
                </div>
              </div>

              <Field label="Display name">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
                />
              </Field>

              <Field label="Location">
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  maxLength={120}
                  placeholder="Long Beach, CA"
                  className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
                />
              </Field>

              <Field label="Bio">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={5}
                  placeholder="A line or two about who you are."
                  className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-[0.2em] text-foreground/60 block mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}
