import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useServerFn } from "@tanstack/react-start";
import {
  listThreads,
  createThread,
  deleteThread,
  loadMessages,
  appendMessage,
  renameThread,
} from "@/lib/infinity.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
  type PromptInputMessage,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, LogOut } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/infinity-engine-logo.png";

type Thread = { id: string; title: string; updated_at: string };

export const Route = createFileRoute("/_authenticated/infinity")({
  head: () => ({
    meta: [
      { title: "Infinity Engine AI — SIS Command" },
      { name: "description", content: "Owner console for the Infinity Engine AI — manage threads, prompts, and live agent runs for Narf Narf operations." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InfinityPage,
});

function InfinityPage() {
  const navigate = useNavigate();
  const fetchThreads = useServerFn(listThreads);
  const fetchMessages = useServerFn(loadMessages);
  const createT = useServerFn(createThread);
  const deleteT = useServerFn(deleteThread);
  const append = useServerFn(appendMessage);
  const rename = useServerFn(renameThread);

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  const lastPersistedRef = useRef<string | null>(null);

  // Load thread list on mount
  useEffect(() => {
    void (async () => {
      try {
        const list = await fetchThreads();
        setThreads(list);
        if (list.length > 0) {
          await selectThread(list[0].id);
        } else {
          await handleNewThread();
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load threads");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectThread = async (id: string) => {
    try {
      const msgs = await fetchMessages({ data: { threadId: id } });
      setActiveId(id);
      setInitialMessages(
        msgs.map((m) => ({
          id: m.id,
          role: m.role,
          parts: m.parts as UIMessage["parts"],
        })) as UIMessage[],
      );
      lastPersistedRef.current = null;
      setChatKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load thread");
    }
  };

  const handleNewThread = async () => {
    try {
      const t = await createT({ data: {} });
      setThreads((prev) => [t as Thread, ...prev]);
      setActiveId(t.id);
      setInitialMessages([]);
      lastPersistedRef.current = null;
      setChatKey((k) => k + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create thread");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteT({ data: { id } });
      const remaining = threads.filter((t) => t.id !== id);
      setThreads(remaining);
      if (activeId === id) {
        if (remaining.length > 0) await selectThread(remaining[0].id);
        else await handleNewThread();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="fixed inset-0 flex" style={{ background: "#03060F", color: "#E8E5DA" }}>
      {/* Sidebar */}
      <aside
        className="w-64 flex-shrink-0 flex flex-col border-r"
        style={{ borderColor: "rgba(55,138,221,0.2)", background: "rgba(10,14,30,0.7)" }}
      >
        <div className="p-4 flex items-center gap-2 border-b" style={{ borderColor: "rgba(55,138,221,0.2)" }}>
          <img src={logo} alt="" width={32} height={32} />
          <div>
            <div className="font-mono text-[10px] tracking-widest" style={{ color: "#378ADD" }}>INFINITY ENGINE</div>
            <div className="text-[10px] text-muted-foreground">SIS // EXODIA</div>
          </div>
        </div>
        <div className="p-2">
          <Button onClick={handleNewThread} className="w-full" variant="outline" size="sm">
            <Plus className="w-3 h-3" /> New transmission
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {threads.map((t) => (
            <div
              key={t.id}
              className={`group flex items-center gap-1 rounded px-2 py-1.5 text-xs cursor-pointer ${
                activeId === t.id ? "bg-secondary" : "hover:bg-secondary/50"
              }`}
              onClick={() => selectThread(t.id)}
            >
              <span className="flex-1 truncate">{t.title}</span>
              <button
                type="button"
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleDelete(t.id);
                }}
                aria-label="Delete thread"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="p-2 border-t" style={{ borderColor: "rgba(55,138,221,0.2)" }}>
          <Button onClick={handleSignOut} variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <LogOut className="w-3 h-3" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeId && (
          <ChatWindow
            key={chatKey}
            threadId={activeId}
            initialMessages={initialMessages}
            onPersist={async (msg) => {
              if (!activeId) return;
              if (lastPersistedRef.current === msg.id) return;
              lastPersistedRef.current = msg.id;
              try {
                await append({
                  data: { threadId: activeId, role: msg.role, parts: msg.parts as unknown as unknown[] },
                });
              } catch (e) {
                console.error("persist failed", e);
              }
            }}
            onFirstUserMessage={async (text) => {
              if (!activeId) return;
              const current = threads.find((t) => t.id === activeId);
              if (!current || current.title !== "New transmission") return;
              const title = text.slice(0, 60);
              try {
                await rename({ data: { id: activeId, title } });
                setThreads((prev) => prev.map((t) => (t.id === activeId ? { ...t, title } : t)));
              } catch {
                /* non-fatal */
              }
            }}
          />
        )}
      </main>
    </div>
  );
}

function ChatWindow({
  threadId,
  initialMessages,
  onPersist,
  onFirstUserMessage,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  onPersist: (msg: UIMessage) => void | Promise<void>;
  onFirstUserMessage: (text: string) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat/infinity" }),
    onError: (e) => toast.error(e.message || "Transmission failed"),
    onFinish: ({ message }) => {
      void onPersist(message);
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId, status]);

  const handleSubmit = (msg: PromptInputMessage) => {
    const text = (msg.text ?? input).trim();
    if (!text) return;
    const userMsg: UIMessage = {
      id: crypto.randomUUID(),
      role: "user",
      parts: [{ type: "text", text }],
    };
    void onPersist(userMsg);
    if (messages.length === 0) void onFirstUserMessage(text);
    void sendMessage({ text });
    setInput("");
  };

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header
        className="px-6 py-3 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(55,138,221,0.2)", background: "rgba(3,6,15,0.6)" }}
      >
        <div className="font-mono text-xs tracking-widest" style={{ color: "#378ADD" }}>
          INFINITY ENGINE // ACTIVE LINK
        </div>
        <div className="font-mono text-[10px] text-muted-foreground">SECURE CHANNEL</div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="max-w-3xl mx-auto w-full">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={logo} alt="" width={64} height={64} />}
              title="Infinity Engine standing by."
              description="Issue your command, Owner."
            />
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent>
                  {m.parts.map((p, i) =>
                    p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Infinity Engine processing…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="p-4 max-w-3xl mx-auto w-full">
        <PromptInput onSubmit={handleSubmit}>
          <PromptInputTextarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Issue command to Infinity Engine…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() && !isLoading} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}