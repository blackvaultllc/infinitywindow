import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ExternalLink, Pin, MessageCircle } from "lucide-react";
import { CommunityHub } from "@/components/community/CommunityHub";

export const Route = createFileRoute("/_authenticated/forums")({
  head: () => ({
    meta: [
      { title: "Community Forums — Narf Narf" },
      { name: "description", content: "Discuss Captain Infinity and RememberFi with the Narf Narf community." },
    ],
  }),
  component: ForumsPage,
});

type Thread = {
  id: string;
  brand: "captain-infinity" | "rememberfi";
  user_id: string;
  display_name: string | null;
  body: string;
  created_at: string;
};

function ForumsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">
        <div className="mb-2 font-display text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          Global Defense Council · Community
        </div>
        <div className="mb-6 flex items-end justify-between gap-3">
          <h1 className="text-3xl font-bold">Community Forums</h1>
          <Link to="/select" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        </div>

        <CommunityHub />

        <BrandSection
          brand="captain-infinity"
          name="Captain Infinity"
          tagline="A new comic universe. Issue #1 drops Juneteenth."
          description="Captain Infinity is a brand-new comic book universe. Issue #1 launches on Juneteenth — June 19th. Talk first impressions, fan theories, and easter eggs you spot in the field."
          href="https://www.infinitycomics.xyz"
          accent="#EF9F27"
          pinnedTitle="📖 Issue #1 launches Juneteenth (June 19th)"
          pinnedBody="Pre-order from infinitycomics.xyz. Drop your reactions, panel breakdowns, and lineage theories here once you've read it."
        />

        <BrandSection
          brand="rememberfi"
          name="RememberFi"
          tagline="You don't forget — you always remember."
          description="RememberFi is the memory layer for the things that matter most. Share what you're remembering, why it matters, and how it connects to the council's mission."
          href="https://rememberfi.space"
          accent="#7F77DD"
          pinnedTitle="🕯 You don't forget — you always remember."
          pinnedBody="What are you remembering today? Drop a name, a date, a moment. We hold the line together."
        />
      </div>
    </div>
  );
}

function BrandSection({
  brand,
  name,
  tagline,
  description,
  href,
  accent,
  pinnedTitle,
  pinnedBody,
}: {
  brand: Thread["brand"];
  name: string;
  tagline: string;
  description: string;
  href: string;
  accent: string;
  pinnedTitle: string;
  pinnedBody: string;
}) {
  const { profile } = useProfile();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("forum_threads")
      .select("*")
      .eq("brand", brand)
      .order("created_at", { ascending: false })
      .limit(30);
    setThreads(((data as any[]) ?? []) as Thread[]);
  };

  useEffect(() => {
    load();
  }, [brand]);

  const post = async () => {
    if (!profile) {
      toast("Sign in to post.");
      return;
    }
    const text = body.trim();
    if (text.length < 2 || text.length > 1000) {
      toast.error("Message must be 2–1000 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("forum_threads").insert({
      brand,
      user_id: profile.id,
      display_name: profile.display_name ?? profile.username ?? "operator",
      body: text,
    } as any);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    await load();
  };

  return (
    <section
      className="mb-8 overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: `${accent}55` }}
    >
      {/* Brand banner */}
      <div
        className="px-5 py-6"
        style={{
          background: `linear-gradient(135deg, ${accent}22, transparent 70%)`,
          borderBottom: `1px solid ${accent}33`,
        }}
      >
        <div className="font-display text-[10px] uppercase tracking-[0.35em]" style={{ color: accent }}>
          Partner Brand
        </div>
        <h2 className="mt-1 text-2xl font-bold">{name}</h2>
        <p className="mt-1 text-sm italic text-muted-foreground">{tagline}</p>
        <p className="mt-3 text-sm">{description}</p>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
          style={{ color: accent }}
        >
          Visit site <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Pinned post */}
      <div
        className="border-b px-5 py-4"
        style={{
          background: "rgba(255,255,255,0.02)",
          borderColor: `${accent}22`,
        }}
      >
        <div className="mb-1 flex items-center gap-2 text-xs font-semibold" style={{ color: accent }}>
          <Pin className="h-3.5 w-3.5" /> PINNED ANNOUNCEMENT
        </div>
        <div className="font-medium">{pinnedTitle}</div>
        <div className="text-sm text-muted-foreground">{pinnedBody}</div>
      </div>

      {/* Reply composer */}
      <div className="px-5 py-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <MessageCircle className="h-3.5 w-3.5" /> COMMUNITY THREAD ({threads.length})
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={profile ? `Reply to ${name}…` : "Sign in to post"}
            disabled={!profile || busy}
            maxLength={1000}
            rows={2}
            className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button onClick={post} disabled={!profile || busy || body.trim().length < 2}>
            {busy ? "…" : "Post"}
          </Button>
        </div>

        {/* Replies */}
        <ul className="mt-4 space-y-3">
          {threads.length === 0 && (
            <li className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No posts yet — start the conversation.
            </li>
          )}
          {threads.map((t) => (
            <li key={t.id} className="rounded-md border border-border bg-background px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium" style={{ color: accent }}>
                  {t.display_name || "operator"}
                </span>
                <time>{new Date(t.created_at).toLocaleString()}</time>
              </div>
              <div className="whitespace-pre-wrap text-sm">{t.body}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
