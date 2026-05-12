import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";

const search = z.object({ peer: z.string().optional() });

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({ meta: [{ title: "Messages — JaxStay" }] }),
  validateSearch: search,
  component: MessagesPage,
});

type Msg = { id: string; sender_id: string; recipient_id: string; body: string; created_at: string };

function MessagesPage() {
  const { user } = useAuth();
  const { peer: peerParam } = Route.useSearch();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [activePeer, setActivePeer] = useState<string | undefined>(peerParam);
  const [text, setText] = useState("");

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("messages").select("*").or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`).order("created_at");
    const list = (data as Msg[]) ?? [];
    setMsgs(list);
    const ids = [...new Set(list.flatMap((m) => [m.sender_id, m.recipient_id]))];
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((profs ?? []).map((p) => [p.id, p.full_name])));
    }
    if (peerParam && !activePeer) setActivePeer(peerParam);
  };
  useEffect(() => { load(); }, [user]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("msgs").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
      const m = p.new as Msg;
      if (m.sender_id === user.id || m.recipient_id === user.id) {
        setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      }
    }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  const threads = useMemo(() => {
    const map: Record<string, Msg[]> = {};
    for (const m of msgs) {
      const peer = m.sender_id === user?.id ? m.recipient_id : m.sender_id;
      (map[peer] ??= []).push(m);
    }
    return map;
  }, [msgs, user]);

  const peers = Object.keys(threads);
  const current = activePeer ? threads[activePeer] ?? [] : [];

  const send = async () => {
    if (!user || !activePeer || !text.trim()) return;
    const body = text.trim();
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: user.id, recipient_id: activePeer, body } as never)
      .select("*")
      .single();
    if (error) { toast.error(error.message); setText(body); return; }
    if (data) {
      const m = data as Msg;
      setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    }
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-3xl font-700">Messages</h1>
          <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">← Dashboard</Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-[260px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-2">
            {peers.length === 0 && !activePeer && <p className="p-3 text-sm text-muted-foreground">No conversations yet.</p>}
            {[...new Set([...(activePeer ? [activePeer] : []), ...peers])].map((p) => (
              <button key={p} onClick={() => setActivePeer(p)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${activePeer === p ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
                {names[p] ?? "JaxStay member"}
              </button>
            ))}
          </aside>
          <div className="flex min-h-[60vh] flex-col rounded-2xl border border-border bg-card">
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {!activePeer ? <p className="text-sm text-muted-foreground">Pick a conversation to start chatting.</p> : current.map((m) => (
                <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender_id === user?.id ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.body}</div>
              ))}
            </div>
            {activePeer && (
              <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex items-center gap-2 border-t border-border p-3">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none" />
                <button type="submit" className="rounded-full bg-primary p-2 text-primary-foreground"><Send className="h-4 w-4" /></button>
              </form>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
