import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: string;
  initial_message: string;
  created_at: string;
}
interface Msg { id: string; body: string; sender_role: string; created_at: string }

export function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setTickets((data ?? []) as Ticket[]);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!active) { setMsgs([]); return; }
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("id,body,sender_role,created_at")
        .eq("ticket_id", active)
        .order("created_at", { ascending: true });
      if (alive) setMsgs((data ?? []) as Msg[]);
    })();
    return () => { alive = false; };
  }, [active]);

  const send = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) { setSending(false); return; }
    const { error } = await supabase.from("support_messages").insert({
      ticket_id: active, sender_id: uid, sender_role: "admin", body: reply.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setReply("");
    const { data } = await supabase.from("support_messages").select("id,body,sender_role,created_at").eq("ticket_id", active).order("created_at", { ascending: true });
    setMsgs((data ?? []) as Msg[]);
  };

  const setStatus = async (status: string) => {
    if (!active) return;
    const patch: { status: string; resolved_at?: string } = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await supabase.from("support_tickets").update(patch).eq("id", active);
    if (error) { toast.error(error.message); return; }
    toast.success(`Ticket ${status}`);
    load();
  };

  const current = tickets.find((t) => t.id === active);

  return (
    <div>
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 text-amber-400" />
        <h2 className="font-display text-2xl">Support Tickets</h2>
        <span className="ml-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-amber-300">
          {tickets.filter((t) => t.status === "open").length} open
        </span>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-[280px_1fr]">
        <div className="max-h-[520px] space-y-1 overflow-y-auto rounded-lg border border-border/60 p-2">
          {tickets.map((t) => (
            <button key={t.id} onClick={() => setActive(t.id)} className={`w-full rounded-md p-2 text-left text-xs transition ${active === t.id ? "bg-amber-500/15 border border-amber-500/40" : "hover:bg-card/60"}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="line-clamp-1 font-medium">{t.subject}</span>
                <span className={`text-[9px] uppercase ${t.status === "open" ? "text-amber-400" : "text-muted-foreground"}`}>{t.status}</span>
              </div>
              <div className="mt-0.5 text-[10px] text-muted-foreground">{t.category} · {new Date(t.created_at).toLocaleDateString()}</div>
            </button>
          ))}
          {tickets.length === 0 && <div className="p-3 text-center text-xs text-muted-foreground">No tickets.</div>}
        </div>

        <div className="rounded-lg border border-border/60 p-3">
          {!current ? (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Select a ticket to view the thread.</div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border/40 pb-2">
                <div>
                  <div className="font-display text-sm">{current.subject}</div>
                  <div className="text-[10px] text-muted-foreground">{current.user_id.slice(0, 12)}… · {current.category}</div>
                </div>
                <div className="flex gap-1">
                  {current.status !== "open" && <Button size="sm" variant="outline" onClick={() => setStatus("open")}>Reopen</Button>}
                  {current.status === "open" && <Button size="sm" variant="outline" onClick={() => setStatus("pending")}>Mark pending</Button>}
                  <Button size="sm" className="bg-amber-500 text-background hover:bg-amber-600" onClick={() => setStatus("resolved")}>Resolve</Button>
                </div>
              </div>
              <div className="my-3 max-h-[360px] flex-1 space-y-3 overflow-y-auto text-xs">
                {msgs.map((m) => (
                  <div key={m.id} className={m.sender_role === "admin" ? "flex justify-end" : ""}>
                    <div className={m.sender_role === "admin"
                      ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-amber-500/90 px-3 py-2 text-background"
                      : "max-w-[90%] whitespace-pre-wrap rounded-md bg-card/60 px-3 py-2"}>{m.body}</div>
                  </div>
                ))}
                {msgs.length === 0 && <div className="text-muted-foreground">No replies yet.</div>}
              </div>
              <div className="flex gap-2">
                <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to user…" />
                <Button onClick={send} disabled={sending || !reply.trim()} className="bg-amber-500 text-background hover:bg-amber-600">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}