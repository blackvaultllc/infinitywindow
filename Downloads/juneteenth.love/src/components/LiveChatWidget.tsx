import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { sendChatMessage } from "@/lib/chat.functions";

type ChatMessage = {
  id: string;
  conversation_id: string;
  sender: "user" | "ai" | "owner";
  content: string;
  created_at: string;
};

export function LiveChatWidget() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const send = useServerFn(sendChatMessage);

  // Track session
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setUserId(data.session?.user.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setUserId(s?.user.id ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Load existing conversation + messages when signed in
  useEffect(() => {
    if (!userId) {
      setConvoId(null);
      setMessages([]);
      return;
    }
    (async () => {
      const { data: c } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();
      if (!c) return;
      setConvoId(c.id);
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("id, conversation_id, sender, content, created_at")
        .eq("conversation_id", c.id)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages((msgs as ChatMessage[]) ?? []);
    })();
  }, [userId]);

  // Realtime subscription
  useEffect(() => {
    if (!convoId) return;
    const channel = supabase
      .channel(`chat-${convoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `conversation_id=eq.${convoId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((prev) =>
            prev.some((p) => p.id === m.id) ? prev : [...prev, m],
          );
          if (!open && m.sender !== "user") setUnread((n) => n + 1);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [convoId, open]);

  // Auto scroll
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    if (!userId) {
      navigate({ to: "/auth" });
      return;
    }
    setSending(true);
    // Optimistic
    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      conversation_id: convoId ?? "",
      sender: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft("");
    try {
      const res = await send({ data: { content: text } });
      if (res?.conversationId && !convoId) setConvoId(res.conversationId);
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat with the owner"}
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-gold text-background shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex items-center justify-center hover:brightness-110 transition"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
        {unread > 0 && !open && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[11px] font-semibold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(360px,calc(100vw-2.5rem))] h-[min(520px,calc(100vh-8rem))] bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-background/60">
            <p className="font-serif text-foreground">Talk to the owner</p>
            <p className="text-[11px] text-muted-foreground">
              Live chat — Domenick personally replies right here.
            </p>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-background/30"
          >
            {!userId && (
              <div className="text-sm text-muted-foreground text-center py-8 px-3">
                <p>Please sign in so the owner can reply to your conversation.</p>
                <button
                  onClick={() => navigate({ to: "/auth" })}
                  className="mt-3 inline-block text-xs uppercase tracking-[0.2em] text-gold hover:underline"
                >
                  Sign in to start
                </button>
              </div>
            )}
            {userId && messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                Say hello — write your message below.
              </p>
            )}
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>

          <form
            onSubmit={onSend}
            className="border-t border-border p-2 flex items-end gap-2 bg-background/60"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend(e as unknown as React.FormEvent);
                }
              }}
              placeholder={userId ? "Type a message…" : "Sign in to chat"}
              maxLength={4000}
              rows={1}
              disabled={!userId || sending}
              className="flex-1 resize-none bg-background border border-border rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-gold/60 max-h-32"
            />
            <button
              type="submit"
              disabled={!userId || sending || !draft.trim()}
              className="px-3 py-2 text-xs uppercase tracking-[0.2em] text-gold hover:text-foreground disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.sender === "user";
  const isOwner = message.sender === "owner";
  const label = isUser ? "You" : isOwner ? "Owner" : "Assistant";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${
          isUser
            ? "bg-gold/15 border border-gold/30 text-foreground"
            : isOwner
              ? "bg-foreground/10 border border-foreground/20 text-foreground"
              : "bg-card border border-border text-foreground/85"
        }`}
      >
        <p className="text-[10px] uppercase tracking-[0.18em] opacity-60 mb-1">
          {label}
        </p>
        {message.content}
      </div>
    </div>
  );
}
