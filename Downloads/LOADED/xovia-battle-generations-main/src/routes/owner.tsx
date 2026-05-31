import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/owner")({ component: OwnerConsole });

type Tab = "suspicion" | "alerts" | "audit" | "roles" | "reports";

function OwnerConsole() {
  const [tab, setTab] = useState<Tab>("suspicion");
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { setAllowed(false); return; }
      const { data } = await supabase.rpc("has_permission", {
        _uid: sess.session.user.id, _key: "roles.manage",
      });
      setAllowed(!!data);
    })();
  }, []);

  if (allowed === null) return <div className="p-8 text-muted-foreground">Loading…</div>;
  if (!allowed) return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Owner Console</h1>
      <p className="text-muted-foreground">Restricted. <Link to="/" className="underline">Go home</Link>.</p>
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Owner Console</h1>
        <p className="text-sm text-muted-foreground">Salute Linux Cali. Backtrack — the quieter you are, the more you hear.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["suspicion","alerts","audit","roles","reports"] as Tab[]).map(t => (
          <Button key={t} variant={tab===t?"default":"outline"} size="sm" onClick={()=>setTab(t)}>
            {t.toUpperCase()}
          </Button>
        ))}
      </div>
      {tab === "suspicion" && <SuspicionPanel />}
      {tab === "alerts" && <AlertsPanel />}
      {tab === "audit" && <AuditPanel />}
      {tab === "roles" && <RolesPanel />}
      {tab === "reports" && <ReportsPanel />}
    </div>
  );
}

function SuspicionPanel() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("v_user_suspicion").select("*").order("score", { ascending: false }).limit(50)
      .then(({ data }) => setRows(data ?? []));
  }, []);
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3">Top suspicion scores (7 days)</h2>
      {rows.length === 0 ? <p className="text-sm text-muted-foreground">No signals yet.</p> : (
        <div className="space-y-2">
          {rows.map(r => (
            <div key={r.user_id} className="flex items-center justify-between border-b py-2 text-sm">
              <div className="font-mono text-xs">{r.user_id.slice(0,8)}…</div>
              <div className="flex items-center gap-3">
                <Badge variant={r.score>=80?"destructive":r.score>=60?"default":"secondary"}>{r.score}%</Badge>
                <span className="text-muted-foreground">{r.event_count} events</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function AlertsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("owner_alerts").select("*").order("created_at",{ascending:false}).limit(50)
    .then(({data}) => setRows(data ?? []));
  useEffect(() => {
    load();
    const ch = supabase.channel("owner_alerts").on("postgres_changes",
      { event: "INSERT", schema: "public", table: "owner_alerts" }, load).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const markRead = async (id: string) => {
    await supabase.from("owner_alerts").update({ read_at: new Date().toISOString() }).eq("id", id);
    load();
  };
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3">Alerts</h2>
      {rows.map(a => (
        <div key={a.id} className={`border-b py-2 text-sm flex justify-between gap-2 ${a.read_at?"opacity-50":""}`}>
          <div>
            <Badge variant={a.severity==="critical"?"destructive":"default"}>{a.severity}</Badge>{" "}
            <span className="font-mono text-xs">{a.user_id.slice(0,8)}…</span> — {a.reason}
            <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
          </div>
          {!a.read_at && <Button size="sm" variant="ghost" onClick={()=>markRead(a.id)}>Mark read</Button>}
        </div>
      ))}
    </Card>
  );
}

function AuditPanel() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("mod_actions").select("*").order("created_at",{ascending:false}).limit(100)
      .then(({data}) => setRows(data ?? []));
  }, []);
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3">Mod audit log</h2>
      {rows.map(a => (
        <div key={a.id} className="border-b py-2 text-xs">
          <div><Badge>{a.action}</Badge> by <span className="font-mono">{a.actor_id.slice(0,8)}</span>
            {a.target_user_id ? <> on <span className="font-mono">{a.target_user_id.slice(0,8)}</span></> : null}</div>
          <div className="text-muted-foreground">{a.reason}{a.resolution_note ? ` — ${a.resolution_note}` : ""}</div>
          <div className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
        </div>
      ))}
    </Card>
  );
}

function RolesPanel() {
  const [perms, setPerms] = useState<any[]>([]);
  const [grants, setGrants] = useState<Record<string, Set<string>>>({});
  const roles = ["admin", "user"] as const;
  const load = async () => {
    const { data: p } = await supabase.from("permissions").select("*").order("category").order("key");
    const { data: rp } = await supabase.from("role_permissions").select("role,permission_key");
    setPerms(p ?? []);
    const g: Record<string, Set<string>> = {};
    (rp ?? []).forEach((r: any) => { (g[r.role] ??= new Set()).add(r.permission_key); });
    setGrants(g);
  };
  useEffect(() => { load(); }, []);
  const toggle = async (role: "admin" | "user", key: string, on: boolean) => {
    if (on) await supabase.from("role_permissions").insert({ role, permission_key: key });
    else await supabase.from("role_permissions").delete().eq("role", role).eq("permission_key", key);
    load();
  };
  return (
    <Card className="p-4 overflow-auto">
      <h2 className="font-semibold mb-3">Role permissions</h2>
      <table className="text-xs w-full">
        <thead><tr className="text-left"><th className="p-1">Permission</th>{roles.map(r=><th key={r} className="p-1">{r}</th>)}</tr></thead>
        <tbody>
          {perms.map(p => (
            <tr key={p.key} className="border-t">
              <td className="p-1"><div className="font-medium">{p.label}</div><div className="text-muted-foreground">{p.key}</div></td>
              {roles.map(r => (
                <td key={r} className="p-1">
                  <input type="checkbox" checked={grants[r]?.has(p.key) ?? false} onChange={e=>toggle(r,p.key,e.target.checked)} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ReportsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("user_reports").select("*").order("created_at",{ascending:false}).limit(50)
    .then(({data}) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const resolve = async (id: string, outcome: "resolved"|"dismissed") => {
    const note = prompt("Resolution note (required, min 5 chars):") || "";
    if (note.trim().length < 5) return;
    const { error } = await supabase.rpc("resolve_user_report", {
      _report_id: id, _outcome: outcome, _resolution_note: note,
    });
    if (error) alert(error.message); else load();
  };
  return (
    <Card className="p-4">
      <h2 className="font-semibold mb-3">Reports queue</h2>
      {rows.length === 0 && <p className="text-sm text-muted-foreground">No reports.</p>}
      {rows.map(r => (
        <div key={r.id} className="border-b py-2 text-sm">
          <div><Badge>{r.status}</Badge> <Badge variant="outline">{r.category}</Badge></div>
          <div className="text-xs text-muted-foreground">reporter {r.reporter_id.slice(0,8)} → target {r.reported_user_id.slice(0,8)}</div>
          <div className="my-1">{r.body}</div>
          {r.status === "open" && (
            <div className="flex gap-2">
              <Button size="sm" onClick={()=>resolve(r.id,"resolved")}>Resolve</Button>
              <Button size="sm" variant="outline" onClick={()=>resolve(r.id,"dismissed")}>Dismiss</Button>
            </div>
          )}
          {r.resolution_note && <div className="text-xs text-muted-foreground mt-1">Note: {r.resolution_note}</div>}
        </div>
      ))}
    </Card>
  );
}