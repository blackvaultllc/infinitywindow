import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Loader2, Mail, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createSupportTicket } from "@/lib/support.functions";
import { useServerFn } from "@tanstack/react-start";

/**
 * Floating "Scribe of Thoth" support assistant.
 * - Streams from Lovable AI gateway via the supportChat server fn.
 * - Lets users escalate to a human ticket.
 * - Requires sign-in (gateway needs auth header).
 */
export function SupportChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [ticketMode, setTicketMode] = useState(false);
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const submitTicket = useServerFn(createSupportTicket);

  // Get bearer token for streaming (useChat needs it for DefaultChatTransport headers)
  useEffect(() => {
    let active = true;
    const sync = async () => {
      const { data } = await supabase.auth.getSession();
      if (active) setToken(data.session?.access_token ?? null);
    };
    sync();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setToken(s?.access_token ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/support-chat",
      headers: (): Record<string, string> => token ? { Authorization: `Bearer ${token}` } : {},
    }),
    onError: (err) => {
      toast.error("Scribe is silent", { description: err.message });
    },
  });

  const [input, setInput] = useState("");
  const loading = status === "submitted" || status === "streaming";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    await sendMessage({ text });
  };

  const handleTicket = async () => {
    if (!subject.trim() || !details.trim()) return;
    setSubmitting(true);
    try {
      const transcript = messages.map((m) => {
        const t = m.parts.map((p) => p.type === "text" ? p.text : "").join("");
        return `[${m.role}] ${t}`;
      }).join("\n");
      await submitTicket({ data: { subject: subject.trim(), category: "general", message: details.trim(), transcript } });
      toast.success("Ticket sent", { description: "An admin will reply in your inbox soon." });
      setTicketMode(false);
      setSubject(""); setDetails("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSubmitting(false); }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open support chat"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-background shadow-[0_0_24px_-4px_rgba(245,158,11,0.6)] ring-1 ring-amber-300/50 transition hover:scale-105 md:h-14 md:w-14"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-4 z-50 flex h-[min(80vh,640px)] w-[min(96vw,400px)] flex-col overflow-hidden rounded-2xl border border-amber-500/40 bg-card/95 shadow-2xl backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-amber-500/10 via-transparent to-crimson/10 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-700 text-background">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="font-display text-sm text-gradient-gold">Scribe of Thoth</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">XOVIA help assistant</div>
              </div>
            </div>

            {!user ? (
              <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
                Sign in to speak with the Scribe.
              </div>
            ) : ticketMode ? (
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <p className="text-xs text-muted-foreground">Open a support ticket for a human moderator to review. Your recent chat transcript will be attached.</p>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" maxLength={200} />
                <textarea
                  value={details} onChange={(e) => setDetails(e.target.value)}
                  placeholder="Describe the issue in detail…"
                  className="min-h-[140px] w-full rounded-md border border-border/60 bg-background/60 px-3 py-2 text-sm"
                  maxLength={4000}
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setTicketMode(false)}>Cancel</Button>
                  <Button className="flex-1 bg-amber-500 text-background hover:bg-amber-600" disabled={submitting} onClick={handleTicket}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send ticket"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4 text-sm">
                  {messages.length === 0 && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                      𓂀 Ask me about cards, wagers, currencies, packs, or anything in XOVIA Battle Generations. I cannot perform account actions for you — I can only show you how.
                    </div>
                  )}
                  {messages.map((m) => {
                    const text = m.parts.map((p) => p.type === "text" ? p.text : "").join("");
                    const isUser = m.role === "user";
                    return (
                      <div key={m.id} className={isUser ? "flex justify-end" : ""}>
                        <div className={isUser
                          ? "max-w-[85%] rounded-2xl rounded-br-sm bg-amber-500/90 px-3 py-2 text-background"
                          : "max-w-[90%] whitespace-pre-wrap text-foreground"}>
                          {text || (loading ? <span className="inline-flex gap-1"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:120ms]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:240ms]" /></span> : null)}
                        </div>
                      </div>
                    );
                  })}
                  {loading && messages[messages.length - 1]?.role === "user" && (
                    <div className="text-xs text-muted-foreground">𓂀 Thinking…</div>
                  )}
                </div>

                <form onSubmit={handleSend} className="flex flex-col gap-2 border-t border-border/60 bg-background/40 p-3">
                  <div className="flex gap-2">
                    <Input
                      autoFocus
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask the Scribe…"
                      disabled={loading}
                    />
                    <Button type="submit" size="icon" disabled={loading || !input.trim()} className="bg-amber-500 text-background hover:bg-amber-600">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                  <button type="button" onClick={() => setTicketMode(true)} className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground hover:text-amber-400">
                    <Mail className="h-3 w-3" /> Send to a human moderator instead
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}