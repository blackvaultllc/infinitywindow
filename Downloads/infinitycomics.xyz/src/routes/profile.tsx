import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { medusaModal } from "@/lib/medusa-modal";
import { MedusaHelpButton } from "@/components/MedusaHelpButton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/profile")({
  component: ProfilePage,
  head: () => ({ meta: [{ title: "Profile & Settings — Mr. Infinity" }] }),
});

type ProfileRow = {
  id: string;
  nickname: string | null;
  display_name: string | null;
  full_name: string | null;
  address: string | null;
  bio: string | null;
  website: string | null;
  website_approved: boolean;
  notify_announcements: boolean;
  notify_releases: boolean;
  avatar_url: string | null;
};

type Certificate = {
  id: string;
  recipient_name: string;
  achievement: string;
  notes: string | null;
  signature_name: string;
  issued_at: string;
};

function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (authLoading || !user) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [p, c] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
        supabase.from("certificates").select("id, recipient_name, achievement, notes, signature_name, issued_at")
          .eq("recipient_user_id", user!.id).order("issued_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (p.data) {
        setProfile(p.data as unknown as ProfileRow);
      } else {
        // create a row if missing
        await supabase.from("profiles").insert({ id: user!.id });
        const again = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
        if (again.data) setProfile(again.data as unknown as ProfileRow);
      }
      setCerts((c.data ?? []) as Certificate[]);
      setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [authLoading, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setErr(null);
    setMsg(null);
    const patch = {
      nickname: profile.nickname?.trim() || null,
      display_name: profile.display_name?.trim() || null,
      full_name: profile.full_name?.trim() || null,
      address: profile.address?.trim() || null,
      bio: profile.bio?.trim() || null,
      website: profile.website?.trim() || null,
      notify_announcements: profile.notify_announcements,
      notify_releases: profile.notify_releases,
    };
    const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
    setSaving(false);
    if (error) setErr(error.message);
    else setMsg("Saved.");
  }

  async function uploadAvatar(file: File) {
    if (!user) return;
    setErr(null);
    setMsg(null);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    if (!["jpg", "jpeg", "png", "webp", "gif"].includes(ext)) {
      setErr("Use JPG, PNG, WEBP, or GIF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Image must be under 5 MB.");
      return;
    }
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const up = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (up.error) { setErr(up.error.message); return; }
    const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 60 * 60 * 24 * 365);
    const url = signed?.signedUrl ?? null;
    if (!url) { setErr("Could not generate URL."); return; }
    const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id);
    if (error) setErr(error.message);
    else {
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
      setMsg("Avatar updated.");
    }
  }

  if (authLoading || loading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gold/60 text-xs tracking-[0.4em] uppercase">Loading profile…</div>;
  }
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-[0.6rem] tracking-[0.45em] uppercase text-gold/70">Sealed</p>
          <h1 className="mt-3 font-display text-3xl text-gold">Sign in to view your profile</h1>
          <Link to="/login" className="mt-6 inline-block bg-gold text-primary-foreground px-8 py-3 tracking-[0.35em] text-xs uppercase" style={{ backgroundColor: "var(--gold)" }}>
            Enter
          </Link>
        </div>
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="min-h-[80vh] py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-8">
          <p className="text-[0.6rem] tracking-[0.5em] uppercase text-gold/70">Your Sanctum</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl text-gold glow-gold">Profile &amp; Settings</h1>
        </header>

        {/* Avatar */}
        <section className="bg-card/40 border border-gold/25 p-5 mb-6 flex flex-col sm:flex-row items-center gap-5">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gold/50 bg-background/60 grid place-items-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-3xl text-gold">𓂀</span>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[0.55rem] tracking-[0.35em] uppercase text-gold/55">Profile Image</p>
            <p className="mt-1 text-xs text-foreground/70">JPG, PNG, WEBP — under 5 MB.</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                onClick={() => fileRef.current?.click()}
                className="border border-gold/50 text-gold px-4 py-2 text-[0.6rem] tracking-[0.3em] uppercase hover:bg-gold/10"
              >
                {profile.avatar_url ? "Change" : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }}
              />
            </div>
          </div>
        </section>

        <form onSubmit={save} className="space-y-6">
          {/* Identity */}
          <section className="bg-card/40 border border-gold/25 p-5">
            <h2 className="font-display text-lg text-gold mb-4">Identity</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Nickname (shown in nav)">
                <input value={profile.nickname ?? ""} maxLength={32}
                  onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
                  className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm" />
              </Field>
              <Field label="Display Name">
                <input value={profile.display_name ?? ""} maxLength={64}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                  className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm" />
              </Field>
              <Field label="Full Name (private)">
                <input value={profile.full_name ?? ""} maxLength={120}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm" />
              </Field>
              <Field label="Email (concealed)">
                <input value={user.email ?? ""} disabled
                  className="w-full bg-background/30 border border-gold/15 px-3 py-2 text-sm text-foreground/50 font-mono" />
              </Field>
            </div>
          </section>

          {/* Optional details */}
          <section className="bg-card/40 border border-gold/25 p-5">
            <h2 className="font-display text-lg text-gold mb-1">Optional Details</h2>
            <p className="text-[0.6rem] tracking-[0.25em] uppercase text-gold/40 mb-4">All optional · only you see address &amp; full name</p>
            <div className="space-y-4">
              <Field label="Address (private)">
                <input value={profile.address ?? ""} maxLength={200}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm" />
              </Field>
              <Field label={`Website ${profile.website_approved ? "· approved ✓" : "· awaiting approval"}`}>
                <input value={profile.website ?? ""} maxLength={200} placeholder="https://…"
                  onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                  className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm font-mono" />
                <p className="mt-1 text-[0.6rem] text-foreground/50 italic">
                  Your website will not be promoted publicly until reviewed by the Architect.
                </p>
              </Field>
              <Field label="Bio">
                <textarea value={profile.bio ?? ""} maxLength={500} rows={3}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm resize-none" />
              </Field>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-card/40 border border-gold/25 p-5">
            <h2 className="font-display text-lg text-gold mb-4">Updates</h2>
            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <input type="checkbox" checked={profile.notify_announcements}
                onChange={(e) => setProfile({ ...profile, notify_announcements: e.target.checked })} />
              Announcements from the Architect
            </label>
            <label className="flex items-center gap-3 text-sm cursor-pointer mt-3">
              <input type="checkbox" checked={profile.notify_releases}
                onChange={(e) => setProfile({ ...profile, notify_releases: e.target.checked })} />
              New comics, cards, &amp; game releases
            </label>
          </section>

          {msg && <p className="text-xs text-gold/80 font-serif italic">{msg}</p>}
          {err && <p className="text-xs text-destructive">{err}</p>}

          <button type="submit" disabled={saving}
            className="w-full sm:w-auto bg-gold text-primary-foreground px-8 py-3 tracking-[0.35em] text-xs uppercase disabled:opacity-40"
            style={{ backgroundColor: "var(--gold)" }}>
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>

        {/* Medusa Help — moved into Settings */}
        <section className="mt-8 bg-card/40 border border-gold/25 p-5">
          <h2 className="font-display text-lg text-gold mb-2">Help · Bugs · Complaints</h2>
          <p className="text-sm text-muted-foreground">Send Medusa a help request, bug report, or complaint directly from your settings. Your ticket will be routed to the Command Center.</p>
          <div className="mt-4 flex gap-3">
            <button onClick={() => medusaModal.setOpen(true)} className="bg-gold text-primary-foreground px-4 py-2 uppercase text-sm tracking-[0.3em]">Open Medusa</button>
            <Link to="/medusa" className="border border-gold/40 text-gold px-4 py-2 uppercase text-sm tracking-[0.3em]">Full Medusa Page</Link>
          </div>
        </section>
        <MedusaHelpButton />

        {/* Certificates */}
        <section className="mt-10 bg-card/40 border border-gold/25 p-5">
          <h2 className="font-display text-lg text-gold mb-4">Your Certificates · {certs.length}</h2>
          {certs.length === 0 ? (
            <p className="text-xs text-foreground/50 italic">No certificates yet. Earn one by completing a course or challenge.</p>
          ) : (
            <ul className="space-y-3">
              {certs.map((c) => (
                <li key={c.id} className="border border-gold/30 p-4 bg-background/40">
                  <p className="text-[0.55rem] tracking-[0.35em] uppercase text-gold/60">Certificate of Achievement</p>
                  <p className="mt-1 font-display text-xl text-gold">{c.achievement}</p>
                  <p className="mt-1 text-sm font-serif italic">Awarded to <span className="text-gold">{c.recipient_name}</span></p>
                  {c.notes && <p className="mt-1 text-xs text-foreground/70">{c.notes}</p>}
                  <div className="mt-3 flex justify-between text-[0.55rem] tracking-[0.3em] uppercase text-foreground/50">
                    <span>{c.signature_name}</span>
                    <span>{new Date(c.issued_at).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[0.55rem] tracking-[0.35em] uppercase text-gold/55 mb-1">{label}</span>
      {children}
    </label>
  );
}
