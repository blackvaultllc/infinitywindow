import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Convo = {
  id: string;
  user_id: string;
  owner_joined: boolean;
  last_message_at: string;
  display_name: string | null;
};

type Msg = {
  id: string;
  conversation_id: string;
  sender: "user" | "ai" | "owner";
  content: string;
  created_at: string;
};

export function AdminChatInbox() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const { data: conversations } = useQuery({
    queryKey: ["admin-chat-conversations"],
    queryFn: async (): Promise<Convo[]> => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("id, user_id, owner_joined, last_message_at")
        .order("last_message_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      const ids = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      let map: Record<string, string> = {};
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", ids);
        map = Object.fromEntries(
          (profs ?? []).map((p) => [p.id, p.display_name ?? ""]),
        );
      }
      return (data ?? []).map((c) => ({ ...c, display_name: map[c.user_id] ?? null }));
    },
    refetchInterval: 10_000,
  });

  // Auto-select first conversation
  useEffect(() => {
    if (!activeId && conversations && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const { data: messages } = useQuery({
    enabled: !!activeId,
    queryKey: ["admin-chat-messages", activeId],
    queryFn: async (): Promise<Msg[]> => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, conversation_id, sender, content, created_at")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data as Msg[];
    },
  });

  // Realtime per active conversation
  useEffect(() => {
    if (!activeId) return;
    const ch = supabase
      .channel(`admin-chat-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["admin-chat-messages", activeId] });
          qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [activeId, qc]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const reply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeId) return;
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      conversation_id: activeId,
      sender: "owner",
      content: text,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDraft("");
  };

  return (
    <div>
      <h2 className="text-gold text-xs uppercase tracking-[0.28em] mb-4">
        Live chat inbox ({conversations?.length ?? 0})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 border border-border rounded-sm bg-card/30 overflow-hidden">
        {/* Conversation list */}
        <div className="border-b md:border-b-0 md:border-r border-border max-h-[60vh] overflow-y-auto">
          {!conversations?.length && (
            <p className="p-4 text-sm text-muted-foreground italic">No conversations yet.</p>
          )}
          <ul>
            {conversations?.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left px-3 py-3 border-b border-border/60 hover:bg-background/40 transition ${activeId === c.id ? "bg-background/60" : ""}`}
                >
                  <p className="text-sm font-medium truncate">
                    {c.display_name || "Anonymous member"}
                  </p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>{new Date(c.last_message_at).toLocaleString()}</span>
                    {!c.owner_joined && (
                      <span className="text-gold uppercase tracking-[0.15em]">New</span>
                    )}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Active conversation */}
        <div className="flex flex-col min-h-[400px] max-h-[60vh]">
          {!activeId && (
            <p className="p-6 text-sm text-muted-foreground">
              Select a conversation to read and reply.
            </p>
          )}
          {activeId && (
            <>
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 space-y-2"
              >
                {messages?.map((m) => {
                  const align = m.sender === "owner" ? "justify-end" : "justify-start";
                  const tone =
                    m.sender === "owner"
                      ? "bg-gold/15 border-gold/30"
                      : m.sender === "ai"
                        ? "bg-card border-border"
                        : "bg-foreground/10 border-foreground/20";
                  return (
                    <div key={m.id} className={`flex ${align}`}>
                      <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap border ${tone}`}>
                        <p className="text-[10px] uppercase tracking-[0.18em] opacity-60 mb-1">
                          {m.sender === "user" ? "Member" : m.sender === "owner" ? "You" : "Assistant"}
                        </p>
                        {m.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={reply} className="border-t border-border p-2 flex items-end gap-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={1}
                  maxLength={4000}
                  placeholder="Reply as the owner…"
                  className="flex-1 resize-none bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/60 max-h-32"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      reply(e as unknown as React.FormEvent);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold hover:text-foreground disabled:opacity-40"
                >
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
