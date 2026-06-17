import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, AlertTriangle, Clock, Ban } from "lucide-react";

export const Route = createFileRoute("/_authenticated/mod")({
  head: () => ({
    meta: [
      { title: "Moderation — Narf Narf" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ModPage,
});

type Report = { id: string; message_id: string; reporter_id: string; reason: string | null; created_at: string; body?: string; author_id?: string; author_name?: string };
type AuditRow = { id: string; actor_id: string; action: string; target_user_id: string | null; reason: string | null; created_at: string };

function ModPage() {
  const { profile } = useProfile();
  const [isStaff, setIsStaff] = useState<boolean | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    (async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", profile.id);
      const roles = ((data as any[]) ?? []).map(r => r.role);
      setIsStaff(roles.includes("admin") || roles.includes("moderator") || roles.includes("support"));
    })();
  }, [profile]);

  const load = useCallback(async () => {
    const [{ data: reps }, { data: aud }] = await Promise.all([
      supabase.from("chat_reports" as any).select("id,message_id,reporter_id,reason,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(30),
      supabase.from("moderation_actions" as any).select("id,actor_id,action,target_user_id,reason,created_at").order("created_at", { ascending: false }).limit(50),
    ]);
    const msgIds = ((reps as any[]) ?? []).map(r => r.message_id);
    const { data: msgs } = msgIds.length ? await supabase.from("chat_messages").select("id,user_id,body,display_name").in("id", msgIds) : { data: [] as any[] };
    const msgMap = new Map(((msgs as any[]) ?? []).map(m => [m.id, m]));
    setReports(((reps as any[]) ?? []).map(r => ({ ...r, body: msgMap.get(r.message_id)?.body, author_id: msgMap.get(r.message_id)?.user_id, author_name: msgMap.get(r.message_id)?.display_name })));
    setAudit(((aud as any[]) ?? []));
  }, []);

  useEffect(() => { if (isStaff) void load(); }, [isStaff, load]);

  if (isStaff === false) return <Navigate to="/play" />;
  if (!isStaff) return null;

  const hide = async (r: Report) => {
    setBusy(true);
    const { error } = await supabase.rpc("mod_hide_message" as any, { _message_id: r.message_id, _reason: r.reason || "violation" });
    setBusy(false);
    if (error) return toast.error(error.message);
    await supabase.rpc("mod_review_report" as any, { _report_id: r.id, _dismiss: false });
    toast.success("Message hidden");
    await load();
  };

  const mute = async (r: Report, minutes: number) => {
    if (!r.author_id) return;
    setBusy(true);
    const { error } = await supabase.rpc("mod_mute_user" as any, { _target: r.author_id, _minutes: minutes, _reason: r.reason || "chat violation" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Muted ${minutes}m`);
    await load();
  };

  const dismiss = async (r: Report) => {
    await supabase.rpc("mod_review_report" as any, { _report_id: r.id, _dismiss: true });
    await load();
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <header className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-[#9cc6f5]" />
        <h1 className="text-2xl font-bold">Moderation</h1>
      </header>

      <section className="rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-[#EF9F27] flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Pending Reports · {reports.length}</h2>
        {reports.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pending reports.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {reports.map(r => (
              <li key={r.id} className="rounded-lg border border-white/10 bg-background/60 p-3">
                <div className="text-xs text-muted-foreground">From {r.author_name || "operator"} — reason: {r.reason || "(none)"}</div>
                <p className="mt-1 text-sm">{r.body || "(message deleted)"}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void hide(r)} disabled={busy}>Hide</Button>
                  <Button size="sm" variant="outline" onClick={() => void mute(r, 60)} disabled={busy}><Clock className="h-3 w-3 mr-1" />Mute 1h</Button>
                  <Button size="sm" variant="outline" onClick={() => void mute(r, 60 * 24)} disabled={busy}><Clock className="h-3 w-3 mr-1" />Mute 24h</Button>
                  <Button size="sm" variant="ghost" onClick={() => void dismiss(r)} disabled={busy}>Dismiss</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-2"><Ban className="h-4 w-4" />Audit Log</h2>
        <div className="mt-3 max-h-96 overflow-y-auto text-xs">
          <table className="w-full">
            <thead className="text-muted-foreground"><tr><th className="text-left py-1">When</th><th className="text-left">Action</th><th className="text-left">Target</th><th className="text-left">Reason</th></tr></thead>
            <tbody>
              {audit.map(a => (
                <tr key={a.id} className="border-t border-white/5">
                  <td className="py-1 text-muted-foreground">{new Date(a.created_at).toLocaleString()}</td>
                  <td className="font-mono text-[#9cc6f5]">{a.action}</td>
                  <td className="text-muted-foreground truncate max-w-[160px]">{a.target_user_id?.slice(0, 8) || "—"}</td>
                  <td className="text-muted-foreground">{a.reason || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
