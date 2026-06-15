import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  storyId: string;
  storyAuthorId: string;
  commentsEnabled: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
};

type CommentRow = {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
};

export function StoryInteractions({
  storyId,
  storyAuthorId,
  commentsEnabled,
  currentUserId,
  isAdmin,
}: Props) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const { data: likeCount = 0 } = useQuery({
    queryKey: ["story-like-count", storyId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("story_like_counts", { _story_ids: [storyId] });
      if (error) throw error;
      return Number(data?.[0]?.like_count ?? 0);
    },
  });

  const { data: liked = false } = useQuery({
    enabled: !!currentUserId,
    queryKey: ["story-liked", storyId, currentUserId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("did_i_like", { _story_id: storyId });
      if (error) throw error;
      return !!data;
    },
  });

  const toggleLike = async () => {
    if (!currentUserId) {
      toast("Sign in to like stories.");
      return;
    }
    if (liked) {
      const { error } = await supabase
        .from("story_likes")
        .delete()
        .eq("story_id", storyId)
        .eq("user_id", currentUserId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("story_likes")
        .insert({ story_id: storyId, user_id: currentUserId });
      if (error) return toast.error(error.message);
    }
    qc.invalidateQueries({ queryKey: ["story-like-count", storyId] });
    qc.invalidateQueries({ queryKey: ["story-liked", storyId, currentUserId] });
  };

  const { data: comments } = useQuery({
    enabled: open,
    queryKey: ["story-comments", storyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("story_comments")
        .select("id,content,author_id,created_at")
        .eq("story_id", storyId)
        .eq("status", "approved")
        .order("created_at", { ascending: true });
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((c) => c.author_id)));
      let profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url")
          .in("id", ids);
        profileMap = Object.fromEntries(
          (profs ?? []).map((p) => [p.id, { display_name: p.display_name, avatar_url: p.avatar_url }]),
        );
      }
      return ((data ?? []).map((c) => ({ ...c, profiles: profileMap[c.author_id] ?? null }))) as CommentRow[];
    },
  });

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    const body = draft.trim();
    if (!body) return;
    setPosting(true);
    const { error } = await supabase.from("story_comments").insert({
      story_id: storyId,
      author_id: currentUserId,
      content: body.slice(0, 2000),
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setDraft("");
    qc.invalidateQueries({ queryKey: ["story-comments", storyId] });
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("story_comments").delete().eq("id", commentId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["story-comments", storyId] });
  };

  const isStoryAuthor = currentUserId === storyAuthorId;
  const canModerateComments = isStoryAuthor || isAdmin;

  return (
    <div className="mt-4 border-t border-border/60 pt-3">
      <div className="flex items-center gap-5 text-xs">
        <button
          onClick={toggleLike}
          className={`inline-flex items-center gap-1.5 transition-colors ${
            liked ? "text-gold" : "text-foreground/50 hover:text-gold"
          }`}
          aria-pressed={liked}
        >
          <Heart size={14} fill={liked ? "currentColor" : "none"} />
          <span>{likeCount}</span>
        </button>
        {commentsEnabled ? (
          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-foreground/50 hover:text-gold transition-colors"
          >
            <MessageCircle size={14} />
            <span>{open ? "Hide" : "Reply"}</span>
          </button>
        ) : (
          <span className="text-foreground/30 italic text-[11px]">Comments off for this story</span>
        )}
      </div>

      {open && commentsEnabled && (
        <div className="mt-4 space-y-4">
          {comments?.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No replies yet.</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} className="border-l border-border pl-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to="/u/$userId"
                  params={{ userId: c.author_id }}
                  className="text-[11px] text-foreground/60 hover:text-gold inline-flex items-center gap-2"
                >
                  {c.profiles?.avatar_url ? (
                    <img src={c.profiles.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center text-[10px] text-gold">
                      {(c.profiles?.display_name ?? "?").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>{c.profiles?.display_name ?? "Anonymous"}</span>
                  <span className="text-foreground/30">·</span>
                  <span className="text-foreground/40">
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>
                </Link>
                {(canModerateComments || c.author_id === currentUserId) && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-foreground/30 hover:text-destructive"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground/85 mt-1 whitespace-pre-wrap break-words">{c.content}</p>
            </div>
          ))}

          {currentUserId ? (
            <form onSubmit={postComment} className="space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Reply with respect."
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/60"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-foreground/40">{draft.length}/2000</span>
                <button
                  type="submit"
                  disabled={posting || !draft.trim()}
                  className="bg-gold text-primary-foreground px-4 py-1.5 rounded-sm text-xs tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-60"
                >
                  {posting ? "Posting…" : "Post reply"}
                </button>
              </div>
            </form>
          ) : (
            <Link to="/auth" className="text-xs text-gold hover:underline">
              Sign in to reply
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
