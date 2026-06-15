import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { StoryInteractions } from "@/components/StoryInteractions";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { SEED_STORIES } from "@/lib/seed-stories";
import { formatStoryContent } from "@/lib/format-story";
import { validateImageFile } from "@/lib/validate-image";


export const Route = createFileRoute("/stories")({
  head: () => ({
    meta: [
      { title: "Community Stories — Your Truth, Your Family, Your History | Juneteenth.Love" },
      { name: "description", content: "Real stories from the community — lived experience, family history, lives interrupted by injustice, and the truth people came here to tell. Sign up and add yours." },
      { name: "keywords", content: "community stories, Black experiences, family history, racial injustice stories, wrongful incarceration, lived experience, oral history, Juneteenth blog" },
      { property: "og:title", content: "Community Stories — Juneteenth.Love" },
      { property: "og:description", content: "Real stories from the community. Lived experience, family history, the truth people came here to tell." },
      { property: "og:url", content: "/stories" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/stories" }],
  }),
  component: StoriesPage,
});

const CATEGORIES = [
  { value: "experience", label: "Lived Experience" },
  { value: "family_history", label: "Family History" },
  { value: "injustice", label: "Injustice / My Side" },
  { value: "heritage", label: "Heritage & Culture" },
  { value: "other", label: "Other" },
] as const;

type Story = {
  id: string;
  title: string;
  content: string;
  category: string;
  author_id: string;
  created_at: string;
  media_url: string | null;
  comments_enabled: boolean;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

function StoriesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("experience");
  const [content, setContent] = useState("");
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadRoles = async (uid: string | null) => {
      setUserId(uid);
      if (!uid) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", uid);
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
    };
    supabase.auth.getSession().then(({ data }) => loadRoles(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      loadRoles(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const { data: stories, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id,title,content,category,author_id,created_at,media_url,comments_enabled")
        .eq("published", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((s) => s.author_id)));
      let profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .in("id", ids);
        profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]));
      }
      return (data ?? []).map((s) => ({ ...s, profiles: profileMap[s.author_id] ?? null })) as Story[];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      navigate({ to: "/auth" });
      return;
    }
    if (title.trim().length < 1 || content.trim().length < 1) return;
    setSubmitting(true);

    let mediaUrl: string | null = null;
    if (mediaFile) {
      const check = await validateImageFile(mediaFile, 10 * 1024 * 1024);
      if (!check.ok) {
        toast.error(check.reason);
        setSubmitting(false);
        return;
      }
      const path = `${userId}/story-${Date.now()}.${check.ext}`;
      const { error: upErr } = await supabase.storage
        .from("story-media")
        .upload(path, mediaFile, { contentType: check.mime });
      if (upErr) {
        toast.error(upErr.message);
        setSubmitting(false);
        return;
      }
      mediaUrl = supabase.storage.from("story-media").getPublicUrl(path).data.publicUrl;
    }

    const rawContent = content.trim().slice(0, 20000);
    const rawTitle = title.trim().slice(0, 200);
    // Soften shouting in the title (admins still see the original).
    const displayTitle = rawTitle === rawTitle.toUpperCase() && rawTitle.replace(/[^A-Z]/g, "").length >= 4
      ? rawTitle.charAt(0) + rawTitle.slice(1).toLowerCase()
      : rawTitle;

    const { error } = await supabase.from("stories").insert({
      author_id: userId,
      title: displayTitle,
      category,
      content: formatStoryContent(rawContent),
      original_content: rawContent,
      media_url: mediaUrl,
      comments_enabled: commentsEnabled,
    });
    setSubmitting(false);
    if (error) return toast.error(error.message);
    toast.success("Your story has been posted.");
    setTitle("");
    setContent("");
    setCategory("experience");
    setMediaFile(null);
    setCommentsEnabled(true);
    setShowForm(false);
    qc.invalidateQueries({ queryKey: ["stories"] });
  };

  const deleteStory = async (id: string) => {
    if (!confirm("Delete this story?")) return;
    const { error } = await supabase.from("stories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stories"] });
  };

  const toggleStoryComments = async (id: string, next: boolean) => {
    const { error } = await supabase.from("stories").update({ comments_enabled: next }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["stories"] });
  };

  const reportStory = async (storyId: string) => {
    const reason = prompt("What's wrong with this post? (spam, harassment, false info, hate speech, other)");
    if (!reason) return;
    const details = prompt("Optional: anything else we should know?") ?? "";
    const { error } = await supabase.from("story_reports").insert({
      story_id: storyId,
      reporter_id: userId,
      reason: reason.slice(0, 200),
      details: details.slice(0, 1000) || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Reported. Moderators will review.");
  };

  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />

      <section className="px-4 sm:px-6 py-16 sm:py-20 border-b border-border">
        <div className="max-w-3xl mx-auto text-center">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4">
            Community Stories
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-medium mb-6 leading-tight text-balance">
            Tell the story <span className="italic text-gold">only you can tell.</span>
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-4 text-pretty">
            If you are African American, Black, Native, or any person of color who
            has lived through what Juneteenth people lived through — racial
            profiling, wrongful arrest, harassment, eviction, a name dragged
            through the dirt, a family member taken too soon — this page is for
            you. Tell us where you're from. Tell us what happened. Bring
            pictures if you have them.
          </p>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-8 text-pretty">
            We built this country alongside everyone else, but we were the ones
            slaving to build it. A lot of us are getting older and we are tired
            of being treated like trash. The way we find peace is by getting
            it out. Your words become part of this archive.
          </p>
          {userId ? (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform"
            >
              {showForm ? "Close" : "Write a Story"}
            </button>
          ) : (
            <Link
              to="/auth"
              className="inline-block bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform"
            >
              Sign Up to Post Your Story
            </Link>
          )}
        </div>
      </section>

      {showForm && userId && (
        <section className="px-4 sm:px-6 py-12 border-b border-border bg-card/30">
          <form onSubmit={submit} className="max-w-2xl mx-auto space-y-5">
            <h2 className="font-serif text-2xl text-gold">Your Story</h2>
            <Field label="Title">
              <input
                type="text"
                required
                maxLength={200}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Add a photo (optional, max 10MB)">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-foreground/70 file:bg-gold/10 file:border-0 file:text-gold file:px-3 file:py-1.5 file:rounded-sm file:mr-3 file:text-xs file:uppercase file:tracking-wider"
              />
              {mediaFile && (
                <p className="text-[10px] text-foreground/50 mt-1">{mediaFile.name}</p>
              )}
            </Field>
            <Field label="Your story">
              <textarea
                required
                maxLength={20000}
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Take your time. Say it the way you'd say it out loud."
                className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60 leading-relaxed"
              />
              <p className="text-[10px] text-foreground/40 mt-1">{content.length}/20000</p>
            </Field>
            <label className="flex items-center gap-2 text-xs text-foreground/70 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={commentsEnabled}
                onChange={(e) => setCommentsEnabled(e.target.checked)}
                className="accent-gold"
              />
              Allow people to reply to my story. You can change this later and you can delete any reply.
            </label>
            <p className="text-[11px] text-foreground/50">
              We never change your words. We only break long blocks into
              paragraphs and soften ALL-CAPS so it's easier to read. Your
              original wording is kept on file. Hate speech, targeted
              harassment, and personal info doxxing will be removed.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="bg-gold text-primary-foreground px-7 py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post Story"}
            </button>
          </form>
        </section>
      )}

      {/* Community stories first — real people, right now. */}
      <section className="px-4 sm:px-6 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-3">
              From the community · today
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-medium mb-3 text-balance">
              Real people. <span className="italic text-gold">Right now.</span>
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-[58ch] mx-auto text-pretty">
              These are stories submitted by members of this community. Read
              them with the weight they were written with.
            </p>
          </div>
          <div className="space-y-12">
            {isLoading && <p className="text-center text-muted-foreground">Loading stories…</p>}
            {!isLoading && stories && stories.length === 0 && (
              <p className="text-center text-muted-foreground italic">
                No community stories yet. Be the first to share.
              </p>
            )}
            {stories?.map((s) => {
              const cat = CATEGORIES.find((c) => c.value === s.category)?.label ?? s.category;
              const isAuthor = userId === s.author_id;
              return (
                <article key={s.id} className="border-l-2 border-gold/40 pl-5 sm:pl-6 py-2">
                  <div className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-[0.28em] text-gold flex-wrap">
                    <span>{cat}</span>
                    <span className="text-foreground/30">·</span>
                    <span className="text-foreground/50">
                      {new Date(s.created_at).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-medium mb-2 text-balance">
                    {s.title}
                  </h3>
                  <Link
                    to="/u/$userId"
                    params={{ userId: s.author_id }}
                    className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-4 hover:text-gold"
                  >
                    {s.profiles?.avatar_url ? (
                      <img src={s.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-[10px] text-gold">
                        {(s.profiles?.display_name ?? "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                    by {s.profiles?.display_name ?? "Anonymous"}
                  </Link>
                  {s.media_url && (
                    <img
                      src={s.media_url}
                      alt=""
                      loading="lazy"
                      className="rounded-sm border border-border my-3 max-h-[500px] object-cover w-full"
                    />
                  )}
                  <div className="text-foreground/85 leading-relaxed whitespace-pre-wrap text-pretty break-words space-y-4">
                    {s.content.split(/\n{2,}/).map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>

                  <StoryInteractions
                    storyId={s.id}
                    storyAuthorId={s.author_id}
                    commentsEnabled={s.comments_enabled}
                    currentUserId={userId}
                    isAdmin={isAdmin}
                  />

                  <div className="flex items-center gap-4 mt-3 text-xs">
                    {isAuthor && (
                      <>
                        <button
                          onClick={() => toggleStoryComments(s.id, !s.comments_enabled)}
                          className="text-foreground/50 hover:text-gold cursor-pointer"
                        >
                          {s.comments_enabled ? "Turn off replies" : "Turn on replies"}
                        </button>
                        <button onClick={() => deleteStory(s.id)} className="text-foreground/40 hover:text-destructive cursor-pointer">
                          Delete
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => reportStory(s.id)}
                      className="text-foreground/40 hover:text-gold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Flag size={11} /> Report
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bold divider between living voices and historical record */}
      <div aria-hidden="true" className="relative py-12 border-y border-gold/40 bg-card/30">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span className="block text-gold text-[10px] uppercase tracking-[0.4em] mb-2">
            ↓ The ground beneath these stories ↓
          </span>
          <p className="text-foreground/60 text-sm italic">
            What follows is the historical record — the events that shaped why
            the stories above had to be told at all.
          </p>
        </div>
      </div>

      {/* Historical witnesses — curated, non-DB seed stories */}
      <section
        aria-labelledby="historical-witnesses"
        className="px-4 sm:px-6 py-16 border-b border-border bg-card/20"
      >
        <div className="max-w-3xl mx-auto">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-3 text-center">
            Historical record
          </span>
          <h2
            id="historical-witnesses"
            className="font-serif text-2xl sm:text-4xl font-medium mb-3 text-balance text-center"
          >
            What Black people <span className="italic text-gold">have already lived through.</span>
          </h2>
          <p className="text-center text-muted-foreground text-sm sm:text-base mb-12 max-w-[58ch] mx-auto text-pretty">
            History is not background. It is the floor we stand on when we
            write what is happening to us right now.
          </p>
          <div className="space-y-10">
            {SEED_STORIES.map((s) => (
              <article key={s.id} className="border-l-2 border-gold/40 pl-5 sm:pl-6">
                <div className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-[0.28em] text-gold flex-wrap">
                  <span>{s.year}</span>
                  <span className="text-foreground/30">·</span>
                  <span className="text-foreground/50">{s.attribution}</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-medium mb-2 text-balance">
                  {s.title}
                </h3>
                <p className="text-foreground/80 leading-relaxed text-pretty">
                  {s.body}
                </p>
              </article>
            ))}
          </div>
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
