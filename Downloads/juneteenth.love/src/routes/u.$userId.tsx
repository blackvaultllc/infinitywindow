import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/u/$userId")({
  head: ({ params }) => ({
    meta: [
      { title: `Storyteller Profile — Juneteenth.Love` },
      { name: "description", content: `Stories and history shared by community member ${params.userId.slice(0, 8)}.` },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { userId } = Route.useParams();

  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name,bio,avatar_url,location,created_at")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: stories } = useQuery({
    queryKey: ["stories-by", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id,title,category,created_at,content,media_url")
        .eq("author_id", userId)
        .eq("published", true)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />
      <section className="px-4 sm:px-6 py-12 sm:py-16 border-b border-border">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="w-36 h-36 rounded-full overflow-hidden bg-card border border-gold/30 flex items-center justify-center text-gold font-serif text-4xl shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name ?? "Avatar"} className="w-full h-full object-cover" />
            ) : (
              (profile?.display_name ?? "?").charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="font-serif text-3xl sm:text-4xl mb-1">
              {profile?.display_name ?? "Storyteller"}
            </h1>
            {profile?.location && (
              <p className="text-xs uppercase tracking-[0.28em] text-gold mb-3">
                {profile.location}
              </p>
            )}
            {profile?.bio && (
              <p className="text-foreground/80 leading-relaxed max-w-prose">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 py-12">
        <div className="max-w-3xl mx-auto space-y-10">
          <h2 className="font-serif text-2xl text-balance">
            Stories from {profile?.display_name ?? "this storyteller"}
          </h2>
          {!stories?.length && (
            <p className="text-muted-foreground italic">No stories yet.</p>
          )}
          {stories?.map((s) => (
            <article key={s.id} className="border-l-2 border-gold/40 pl-5 sm:pl-6 py-2">
              <p className="text-[10px] uppercase tracking-[0.28em] text-gold mb-1">
                {s.category} · {new Date(s.created_at).toLocaleDateString()}
              </p>
              <h3 className="font-serif text-xl sm:text-2xl mb-2 text-balance">{s.title}</h3>
              {s.media_url && (
                <img src={s.media_url} alt="" className="rounded-sm border border-border my-3 max-h-96 object-cover w-full" />
              )}
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap line-clamp-6">
                {s.content}
              </p>
            </article>
          ))}
          <p className="pt-6 border-t border-border">
            <Link to="/stories" className="text-gold hover:text-foreground text-xs uppercase tracking-[0.28em]">
              ← All community stories
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
