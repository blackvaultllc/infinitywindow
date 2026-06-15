import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteNav } from "@/components/SiteNav";
import { AdminChatInbox } from "@/components/AdminChatInbox";
import { toast } from "sonner";

export const Route = createFileRoute("/moderation")({
  head: () => ({
    meta: [
      { title: "Moderation Queue — Juneteenth.Love" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ModerationPage,
});

function ModerationPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) {
        navigate({ to: "/auth" });
        return;
      }
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid);
      const ok = !!roles?.some((r) => r.role === "admin" || r.role === "moderator");
      setAuthorized(ok);
    })();
  }, [navigate]);

  const { data: stories } = useQuery({
    enabled: !!authorized,
    queryKey: ["mod-stories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stories")
        .select("id,title,content,status,author_id,created_at,media_url")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((s) => s.author_id)));
      let profileMap: Record<string, { display_name: string }> = {};
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles").select("id,display_name").in("id", ids);
        profileMap = Object.fromEntries((profs ?? []).map((p) => [p.id, { display_name: p.display_name }]));
      }
      return (data ?? []).map((s) => ({ ...s, profiles: profileMap[s.author_id] ?? null }));
    },
  });

  const { data: reports } = useQuery({
    enabled: !!authorized,
    queryKey: ["mod-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("story_reports")
        .select("id,story_id,reason,details,status,created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("stories").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Story ${status}.`);
    qc.invalidateQueries({ queryKey: ["mod-stories"] });
  };

  const resolveReport = async (id: string, status: string) => {
    const { error } = await supabase.from("story_reports").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["mod-reports"] });
  };

  if (authorized === null) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <SiteNav />
        <p className="p-8 text-muted-foreground">Checking access…</p>
      </main>
    );
  }
  if (!authorized) {
    return (
      <main className="bg-background text-foreground min-h-screen">
        <SiteNav />
        <div className="max-w-md mx-auto p-8 text-center">
          <h1 className="font-serif text-2xl mb-2">Not authorized</h1>
          <p className="text-muted-foreground">
            Moderation is for admins and moderators. Ask Domenick to grant access.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />
      <section className="px-4 sm:px-6 py-10">
        <div className="max-w-4xl mx-auto space-y-12">
          <div>
            <h1 className="font-serif text-3xl mb-1">Moderation</h1>
            <p className="text-muted-foreground text-sm">Keep the archive honest and safe.</p>
          </div>

          <AdminChatInbox />



          <div>
            <h2 className="text-gold text-xs uppercase tracking-[0.28em] mb-4">
              Open reports ({reports?.length ?? 0})
            </h2>
            {!reports?.length && (
              <p className="text-muted-foreground italic text-sm">No open reports.</p>
            )}
            <ul className="space-y-3">
              {reports?.map((r) => (
                <li key={r.id} className="border border-border rounded-sm p-4 bg-card/30">
                  <p className="text-xs text-foreground/60">
                    Story <span className="font-mono">{r.story_id.slice(0, 8)}</span> · {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="font-medium mt-1">{r.reason}</p>
                  {r.details && (
                    <p className="text-sm text-foreground/70 mt-1">{r.details}</p>
                  )}
                  <div className="flex gap-3 mt-3 text-xs">
                    <button onClick={() => resolveReport(r.id, "reviewed")} className="text-gold hover:underline">Mark reviewed</button>
                    <button onClick={() => resolveReport(r.id, "dismissed")} className="text-foreground/50 hover:text-foreground">Dismiss</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-gold text-xs uppercase tracking-[0.28em] mb-4">All stories</h2>
            <ul className="space-y-4">
              {stories?.map((s: any) => (
                <li key={s.id} className="border border-border rounded-sm p-4 bg-card/30">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-serif text-lg">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        by {s.profiles?.display_name ?? "—"} · status:{" "}
                        <span className={s.status === "removed" ? "text-destructive" : s.status === "pending" ? "text-gold" : "text-foreground/80"}>
                          {s.status}
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <button onClick={() => setStatus(s.id, "approved")} className="text-gold hover:underline">Approve</button>
                      <button onClick={() => setStatus(s.id, "pending")} className="text-foreground/60 hover:text-foreground">Hold</button>
                      <button onClick={() => setStatus(s.id, "removed")} className="text-destructive hover:underline">Remove</button>
                    </div>
                  </div>
                  <p className="text-sm text-foreground/70 mt-2 line-clamp-3 whitespace-pre-wrap">{s.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
