import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, hasAnyRole } from "@/lib/useProfile";
import { useServerFn } from "@tanstack/react-start";
import { adminGrantCoins, adminGrantRole, adminSetBan } from "@/lib/admin.functions";
import { listMedusaEvents, sendMedusaEvent } from "@/lib/medusa.functions";
import {
  adminListCutscenes,
  adminUpsertCutscene,
  adminCreateCutsceneUploadUrl,
  adminDeleteCutsceneVideo,
} from "@/lib/cutscenes.functions";
import {
  adminListSplash,
  adminUpsertSplash,
  adminCreateSplashUploadUrl,
  adminDeleteSplashVideo,
} from "@/lib/splash.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — Narf Narf" },
      { name: "description", content: "Internal control room for Narf Narf staff — manage users, tickets, the coin ledger, audit log, and live analytics." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

type Tab = "users" | "tickets" | "ledger" | "audit" | "analytics" | "medusa" | "cutscenes" | "splash";

function AdminPage() {
  const { profile, loading } = useProfile();
  const [tab, setTab] = useState<Tab>("users");

  if (loading) return <Shell><div className="text-muted-foreground">Loading…</div></Shell>;
  if (!hasAnyRole(profile, ["admin", "moderator", "support"])) {
    return <Navigate to="/" />;
  }
  const isAdmin = hasAnyRole(profile, ["admin"]);

  return (
    <Shell>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#378ADD" }}>
            SIS · CONTROL ROOM
          </div>
          <h1 className="font-display text-3xl tracking-tight">ADMIN</h1>
        </div>
        <div className="text-right text-[11px] font-mono text-muted-foreground">
          {profile?.email}
          <div style={{ color: "#EF9F27" }}>{profile?.roles.join(" · ").toUpperCase()}</div>
        </div>
      </div>
      <Tabs tab={tab} setTab={setTab} />
      <div className="mt-5">
        {tab === "users" && (
          isAdmin ? (
            <UsersTab />
          ) : (
            <Panel>
              <div className="text-sm text-muted-foreground">
                User management is restricted to admins.
              </div>
            </Panel>
          )
        )}
        {tab === "tickets" && <TicketsTab />}
        {tab === "ledger" && <LedgerTab />}
        {tab === "audit" && <AuditTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "medusa" && <MedusaTab isAdmin={isAdmin} />}
        {tab === "cutscenes" && (
          isAdmin ? <CutscenesTab /> : (
            <Panel>
              <div className="text-sm text-muted-foreground">
                Cutscene management is restricted to admins.
              </div>
            </Panel>
          )
        )}
        {tab === "splash" && (
          isAdmin ? <SplashTab /> : (
            <Panel>
              <div className="text-sm text-muted-foreground">
                Splash video management is restricted to admins.
              </div>
            </Panel>
          )
        )}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #0a1e4a 0%, #050a1f 60%, #02040c 100%)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <Link to="/" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">← BACK</Link>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const list: { id: Tab; label: string }[] = [
    { id: "users", label: "USERS" },
    { id: "tickets", label: "TICKETS" },
    { id: "ledger", label: "LEDGER" },
    { id: "audit", label: "AUDIT" },
    { id: "analytics", label: "ANALYTICS" },
    { id: "medusa", label: "MEDUSA" },
    { id: "cutscenes", label: "CUTSCENES" },
    { id: "splash", label: "SPLASH" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {list.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className="rounded-lg px-3 py-1.5 font-mono text-[11px] tracking-[0.25em] transition"
          style={{
            background: tab === t.id ? "rgba(55,138,221,0.15)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${tab === t.id ? "rgba(55,138,221,0.7)" : "rgba(255,255,255,0.1)"}`,
            color: tab === t.id ? "#9cc6f5" : "#9aa3b8",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(8,16,40,0.6)",
        border: "1px solid rgba(55,138,221,0.25)",
        backdropFilter: "blur(10px)",
      }}
    >
      {children}
    </div>
  );
}

function UsersTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const grantCoinsFn = useServerFn(adminGrantCoins);
  const grantRoleFn = useServerFn(adminGrantRole);
  const setBanFn = useServerFn(adminSetBan);

  const load = async () => {
    let qy = supabase
      .from("profiles")
      .select("id,email,display_name,coins,bonus_multiplier,banned,prologue_choice")
      .order("created_at", { ascending: false })
      .limit(100);
    if (q) qy = qy.ilike("email", `%${q}%`);
    const { data } = await qy;
    setRows((data as any[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const grantCoins = async (uid: string, delta: number) => {
    const reason = prompt(`Reason for ${delta} coins?`, "manual_grant");
    if (!reason) return;
    setBusy(uid);
    try {
      await grantCoinsFn({ data: { targetUserId: uid, delta, reason } });
    } catch (e: any) {
      alert(e?.message ?? "failed");
    }
    setBusy(null);
    load();
  };

  const setRole = async (uid: string, role: "admin" | "moderator" | "support") => {
    if (!confirm(`Grant ${role.toUpperCase()} to this user?`)) return;
    try {
      await grantRoleFn({ data: { targetUserId: uid, role } });
      alert("Role granted");
    } catch (e: any) {
      alert(e?.message ?? "failed");
    }
  };

  const toggleBan = async (uid: string, banned: boolean) => {
    try {
      await setBanFn({ data: { targetUserId: uid, banned: !banned } });
    } catch (e: any) {
      alert(e?.message ?? "failed");
    }
    load();
  };

  return (
    <Panel>
      <div className="mb-3 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="search email…"
          className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
        <button
          onClick={load}
          className="rounded-lg px-3 py-2 font-mono text-[11px] tracking-[0.2em]"
          style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)", color: "#9cc6f5" }}
        >
          SEARCH
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead className="text-left font-mono text-[10px] tracking-widest text-muted-foreground">
            <tr>
              <th className="py-2 pr-2">EMAIL</th>
              <th className="py-2 pr-2">SIDE</th>
              <th className="py-2 pr-2 text-right">COINS</th>
              <th className="py-2 pr-2 text-right">BONUS</th>
              <th className="py-2 pr-2">STATUS</th>
              <th className="py-2 pr-2">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="py-2 pr-2">
                  <div>{r.email ?? "—"}</div>
                  <div className="text-[10px] text-muted-foreground">{r.display_name}</div>
                </td>
                <td className="py-2 pr-2 font-mono text-[10px] uppercase" style={{ color: "#EF9F27" }}>{r.prologue_choice ?? "—"}</td>
                <td className="py-2 pr-2 text-right">{r.coins}</td>
                <td className="py-2 pr-2 text-right">{Number(r.bonus_multiplier).toFixed(2)}×</td>
                <td className="py-2 pr-2">
                  {r.banned ? <span style={{ color: "#E24B4A" }}>BANNED</span> : <span className="text-emerald-400">OK</span>}
                </td>
                <td className="py-2 pr-2">
                  <div className="flex flex-wrap gap-1">
                    <Btn onClick={() => grantCoins(r.id, 100)} disabled={!!busy}>+100</Btn>
                    <Btn onClick={() => grantCoins(r.id, 1000)} disabled={!!busy}>+1k</Btn>
                    <Btn onClick={() => grantCoins(r.id, -100)} disabled={!!busy}>−100</Btn>
                    <Btn onClick={() => toggleBan(r.id, r.banned)} danger>{r.banned ? "UNBAN" : "BAN"}</Btn>
                    <Btn onClick={() => setRole(r.id, "support")}>+SUPPORT</Btn>
                    <Btn onClick={() => setRole(r.id, "moderator")}>+MOD</Btn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function Btn({ children, onClick, danger, disabled }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded px-2 py-1 font-mono text-[10px] tracking-widest disabled:opacity-40"
      style={{
        background: danger ? "rgba(226,75,74,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${danger ? "rgba(226,75,74,0.5)" : "rgba(255,255,255,0.15)"}`,
        color: danger ? "#E24B4A" : "#cdd5e6",
      }}
    >
      {children}
    </button>
  );
}

function TicketsTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("support_tickets")
      .select("id,subject,status,created_at,user_id")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, []);
  return (
    <Panel>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No tickets yet.</div>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((t) => (
            <li key={t.id} className="py-2 flex justify-between text-[12px]">
              <div>
                <div>{t.subject}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{t.user_id}</div>
              </div>
              <div className="font-mono text-[10px] tracking-widest" style={{ color: "#EF9F27" }}>{t.status.toUpperCase()}</div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function LedgerTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("coin_ledger")
      .select("id,user_id,delta,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, []);
  return (
    <Panel>
      <table className="w-full text-[12px]">
        <thead className="text-left font-mono text-[10px] tracking-widest text-muted-foreground">
          <tr>
            <th className="py-2 pr-2">WHEN</th>
            <th className="py-2 pr-2">USER</th>
            <th className="py-2 pr-2 text-right">DELTA</th>
            <th className="py-2 pr-2">REASON</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} className="border-t border-white/5">
              <td className="py-2 pr-2 font-mono text-[10px]">{new Date(l.created_at).toLocaleString()}</td>
              <td className="py-2 pr-2 font-mono text-[10px]">{l.user_id.slice(0, 8)}…</td>
              <td className="py-2 pr-2 text-right" style={{ color: l.delta >= 0 ? "#84e1bc" : "#E24B4A" }}>
                {l.delta > 0 ? "+" : ""}{l.delta}
              </td>
              <td className="py-2 pr-2">{l.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Panel>
  );
}

function AuditTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase
      .from("admin_audit_log")
      .select("id,actor_id,action,target_user,details,created_at")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => setRows((data as any[]) ?? []));
  }, []);
  return (
    <Panel>
      {rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No admin actions logged yet.</div>
      ) : (
        <ul className="divide-y divide-white/5 text-[12px]">
          {rows.map((a) => (
            <li key={a.id} className="py-2">
              <span className="font-mono text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              {" — "}
              <span style={{ color: "#EF9F27" }}>{a.action}</span>
              {a.target_user && <> · target <span className="font-mono text-[10px]">{a.target_user.slice(0, 8)}…</span></>}
              {a.details && Object.keys(a.details).length > 0 && (
                <span className="text-muted-foreground"> · {JSON.stringify(a.details)}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function AnalyticsTab() {
  const [stats, setStats] = useState<{ players: number; coins: number; openTickets: number; questsDone: number }>({
    players: 0,
    coins: 0,
    openTickets: 0,
    questsDone: 0,
  });
  useEffect(() => {
    (async () => {
      const [{ count: players }, { data: coins }, { count: openTickets }, { count: questsDone }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("coins"),
        supabase.from("support_tickets").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("player_quests").select("*", { count: "exact", head: true }).eq("status", "complete"),
      ]);
      const sumCoins = (coins as any[] | null)?.reduce((s, r) => s + (r.coins ?? 0), 0) ?? 0;
      setStats({ players: players ?? 0, coins: sumCoins, openTickets: openTickets ?? 0, questsDone: questsDone ?? 0 });
    })();
  }, []);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat label="PLAYERS" value={stats.players} />
      <Stat label="COINS IN ECONOMY" value={stats.coins} />
      <Stat label="OPEN TICKETS" value={stats.openTickets} accent="#E24B4A" />
      <Stat label="QUESTS COMPLETED" value={stats.questsDone} accent="#84e1bc" />
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(8,16,40,0.6)",
        border: "1px solid rgba(55,138,221,0.25)",
      }}
    >
      <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-3xl" style={{ color: accent ?? "#9cc6f5" }}>
        {value.toLocaleString()}
      </div>
    </div>
  );
}

function MedusaTab({ isAdmin }: { isAdmin: boolean }) {
  const listFn = useServerFn(listMedusaEvents);
  const sendFn = useServerFn(sendMedusaEvent);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [testMsg, setTestMsg] = useState("Test transmission from control room");
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listFn();
      setRows(data as any[]);
    } catch (e: any) {
      setErr(e?.message ?? "failed");
    }
    setLoading(false);
  };
  useEffect(() => {
    if (isAdmin) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Panel>
        <div className="text-sm text-muted-foreground">Medusa hub is restricted to admins.</div>
      </Panel>
    );
  }

  const sendTest = async () => {
    setTestStatus("sending…");
    try {
      const res: any = await sendFn({
        data: {
          event_type: "task_update",
          severity: "alert",
          message: testMsg,
          payload: {
            ai_name: "Narf Narf Console",
            message_type: "task",
            content: testMsg,
            priority: "yellow",
            assigned_to: null,
          },
        },
      });
      setTestStatus(`${res?.status ?? "done"}${res?.error ? ` · ${res.error}` : ""}`);
      load();
    } catch (e: any) {
      setTestStatus(e?.message ?? "failed");
    }
  };

  return (
    <Panel>
      <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
        <div className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground mb-2">
          OUTBOUND TEST
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={testMsg}
            onChange={(e) => setTestMsg(e.target.value)}
            className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm"
            maxLength={500}
          />
          <button
            onClick={sendTest}
            className="rounded-lg px-3 py-2 font-mono text-[11px] tracking-[0.2em]"
            style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)", color: "#9cc6f5" }}
          >
            SEND TO HUB
          </button>
          <button
            onClick={load}
            className="rounded-lg px-3 py-2 font-mono text-[11px] tracking-[0.2em]"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#cdd5e6" }}
          >
            REFRESH
          </button>
        </div>
        {testStatus && (
          <div className="mt-2 font-mono text-[10px]" style={{ color: "#EF9F27" }}>
            {testStatus}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : err ? (
        <div className="text-sm" style={{ color: "#E24B4A" }}>{err}</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">No hub events yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="text-left font-mono text-[10px] tracking-widest text-muted-foreground">
              <tr>
                <th className="py-2 pr-2">WHEN</th>
                <th className="py-2 pr-2">DIR</th>
                <th className="py-2 pr-2">TYPE</th>
                <th className="py-2 pr-2">SEV</th>
                <th className="py-2 pr-2">MESSAGE</th>
                <th className="py-2 pr-2">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-white/5 align-top">
                  <td className="py-2 pr-2 font-mono text-[10px] whitespace-nowrap">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-2 font-mono text-[10px]" style={{ color: r.direction === "inbound" ? "#84e1bc" : "#9cc6f5" }}>
                    {r.direction.toUpperCase()}
                  </td>
                  <td className="py-2 pr-2 font-mono text-[10px]">{r.event_type}</td>
                  <td className="py-2 pr-2 font-mono text-[10px]" style={{ color: "#EF9F27" }}>{r.severity}</td>
                  <td className="py-2 pr-2 max-w-md">
                    <div className="truncate" title={r.message}>{r.message}</div>
                    {r.error && <div className="text-[10px]" style={{ color: "#E24B4A" }}>{r.error}</div>}
                  </td>
                  <td className="py-2 pr-2 font-mono text-[10px]">{r.status ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
/* ─────────────────────────────────────────── CutscenesTab ─── */

const POWER_CATEGORIES = [
  "Fire",
  "Biological",
  "Electromagnetic",
  "Atmospheric",
  "Geological",
  "Hydrological",
  "Cosmic",
  "SlowBurn",
] as const;
type PowerCategory = (typeof POWER_CATEGORIES)[number];

type CutsceneRow = {
  powerCategory: PowerCategory;
  videoPath: string | null;
  durationSeconds: number;
  enabled: boolean;
  updatedAt: string | null;
};

function CutscenesTab() {
  const listFn = useServerFn(adminListCutscenes);
  const upsertFn = useServerFn(adminUpsertCutscene);
  const createUploadFn = useServerFn(adminCreateCutsceneUploadUrl);
  const deleteVideoFn = useServerFn(adminDeleteCutsceneVideo);

  const [rows, setRows] = useState<CutsceneRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await listFn();
      setRows(r as CutsceneRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load cutscenes");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#9cc6f5" }}>
            DISASTER CUTSCENES
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Upload an mp4 per disaster type. When that disaster activates in-game, the video plays
            fullscreen for the configured duration, then returns to the planet view. If no video is
            uploaded, the surface animation effect is shown instead.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          REFRESH
        </button>
      </div>

      {error && (
        <div className="mb-3 text-xs font-mono" style={{ color: "#E24B4A" }}>
          {error}
        </div>
      )}

      <div className="grid gap-2">
        {(rows ?? []).map((r) => (
          <CutsceneRowEditor
            key={r.powerCategory}
            row={r}
            busy={busy === r.powerCategory}
            onSave={async (patch) => {
              setBusy(r.powerCategory);
              setError(null);
              try {
                await upsertFn({
                  data: {
                    powerCategory: r.powerCategory,
                    durationSeconds: patch.durationSeconds,
                    enabled: patch.enabled,
                  },
                });
                await load();
              } catch (e: any) {
                setError(e?.message ?? "Save failed");
              } finally {
                setBusy(null);
              }
            }}
            onUpload={async (file) => {
              setBusy(r.powerCategory);
              setError(null);
              try {
                const ct = file.type === "video/quicktime" ? "video/quicktime"
                  : file.type === "video/webm" ? "video/webm"
                  : "video/mp4";
                const { uploadUrl, path } = await createUploadFn({
                  data: { powerCategory: r.powerCategory, contentType: ct },
                });
                const put = await fetch(uploadUrl, {
                  method: "PUT",
                  headers: { "Content-Type": ct },
                  body: file,
                });
                if (!put.ok) throw new Error(`Upload failed (${put.status})`);
                await upsertFn({
                  data: {
                    powerCategory: r.powerCategory,
                    videoPath: path,
                    durationSeconds: r.durationSeconds,
                    enabled: true,
                  },
                });
                await load();
              } catch (e: any) {
                setError(e?.message ?? "Upload failed");
              } finally {
                setBusy(null);
              }
            }}
            onDelete={async () => {
              setBusy(r.powerCategory);
              setError(null);
              try {
                await deleteVideoFn({ data: { powerCategory: r.powerCategory } });
                await load();
              } catch (e: any) {
                setError(e?.message ?? "Delete failed");
              } finally {
                setBusy(null);
              }
            }}
          />
        ))}
        {!rows && (
          <div className="text-sm text-muted-foreground py-6 text-center font-mono">
            LOADING…
          </div>
        )}
      </div>
    </Panel>
  );
}

function CutsceneRowEditor({
  row,
  busy,
  onSave,
  onUpload,
  onDelete,
}: {
  row: CutsceneRow;
  busy: boolean;
  onSave: (patch: { durationSeconds: number; enabled: boolean }) => void;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  const [duration, setDuration] = useState(row.durationSeconds);
  const [enabled, setEnabled] = useState(row.enabled);
  useEffect(() => {
    setDuration(row.durationSeconds);
    setEnabled(row.enabled);
  }, [row.durationSeconds, row.enabled]);

  const dirty = duration !== row.durationSeconds || enabled !== row.enabled;

  return (
    <div
      className="rounded-lg p-3 grid gap-2 sm:grid-cols-[140px_1fr_auto] items-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${row.videoPath ? "rgba(29,158,117,0.45)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div>
        <div className="font-mono text-[11px] tracking-[0.25em]" style={{ color: "#9cc6f5" }}>
          {row.powerCategory.toUpperCase()}
        </div>
        <div className="text-[10px] mt-0.5 font-mono" style={{ color: row.videoPath ? "#1D9E75" : "#888780" }}>
          {row.videoPath ? "VIDEO LOADED" : "NO VIDEO"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
          DURATION
          <input
            type="number"
            min={1}
            max={60}
            value={duration}
            onChange={(e) => setDuration(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-16 px-2 py-1 rounded font-mono text-xs bg-black/40 border border-white/10"
          />
          <span className="text-[10px]">s</span>
        </label>
        <label className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          ENABLED
        </label>
      </div>

      <div className="flex items-center gap-2 justify-end flex-wrap">
        {dirty && (
          <button
            onClick={() => onSave({ durationSeconds: duration, enabled })}
            disabled={busy}
            className="px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.25em] disabled:opacity-40"
            style={{ background: "#378ADD", color: "#03060F" }}
          >
            SAVE
          </button>
        )}
        <label
          className="px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.25em] cursor-pointer"
          style={{ background: "rgba(55,138,221,0.18)", border: "1px solid rgba(55,138,221,0.45)" }}
        >
          {row.videoPath ? "REPLACE" : "UPLOAD"} MP4
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {row.videoPath && (
          <button
            onClick={onDelete}
            disabled={busy}
            className="px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.25em] disabled:opacity-40"
            style={{ background: "rgba(226,75,74,0.15)", border: "1px solid rgba(226,75,74,0.5)", color: "#E24B4A" }}
          >
            REMOVE
          </button>
        )}
        {busy && (
          <span className="text-[10px] font-mono" style={{ color: "#EF9F27" }}>
            WORKING…
          </span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── SplashTab ─── */

type SplashRow = {
  slot: string;
  videoPath: string | null;
  enabled: boolean;
  updatedAt: string | null;
};

function SplashTab() {
  const listFn = useServerFn(adminListSplash);
  const upsertFn = useServerFn(adminUpsertSplash);
  const createUploadFn = useServerFn(adminCreateSplashUploadUrl);
  const deleteVideoFn = useServerFn(adminDeleteSplashVideo);

  const [rows, setRows] = useState<SplashRow[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const r = await listFn();
      setRows(r as SplashRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load splash videos");
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Panel>
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <div className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#9cc6f5" }}>
            LANDING SPLASH
          </div>
          <p className="text-[12px] text-muted-foreground mt-1">
            Upload the intro mp4 that plays once per device before the landing page. Disable to skip
            the splash entirely. If no video is uploaded, the bundled fallback is used.
          </p>
        </div>
        <button
          onClick={() => void load()}
          className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
          REFRESH
        </button>
      </div>

      {error && (
        <div className="mb-3 text-xs font-mono" style={{ color: "#E24B4A" }}>
          {error}
        </div>
      )}

      <div className="grid gap-2">
        {(rows ?? []).map((r) => (
          <SplashRowEditor
            key={r.slot}
            row={r}
            busy={busy === r.slot}
            onToggle={async (enabled) => {
              setBusy(r.slot);
              setError(null);
              try {
                await upsertFn({ data: { slot: r.slot as "intro", enabled } });
                await load();
              } catch (e: any) {
                setError(e?.message ?? "Save failed");
              } finally {
                setBusy(null);
              }
            }}
            onUpload={async (file) => {
              setBusy(r.slot);
              setError(null);
              try {
                const ct = file.type === "video/quicktime" ? "video/quicktime"
                  : file.type === "video/webm" ? "video/webm"
                  : "video/mp4";
                const { uploadUrl, path } = await createUploadFn({
                  data: { slot: r.slot as "intro", contentType: ct },
                });
                const put = await fetch(uploadUrl, {
                  method: "PUT",
                  headers: { "Content-Type": ct },
                  body: file,
                });
                if (!put.ok) throw new Error(`Upload failed (${put.status})`);
                await upsertFn({
                  data: { slot: r.slot as "intro", videoPath: path, enabled: true },
                });
                await load();
              } catch (e: any) {
                setError(e?.message ?? "Upload failed");
              } finally {
                setBusy(null);
              }
            }}
            onDelete={async () => {
              setBusy(r.slot);
              setError(null);
              try {
                await deleteVideoFn({ data: { slot: r.slot as "intro" } });
                await load();
              } catch (e: any) {
                setError(e?.message ?? "Delete failed");
              } finally {
                setBusy(null);
              }
            }}
          />
        ))}
        {!rows && (
          <div className="text-sm text-muted-foreground py-6 text-center font-mono">
            LOADING…
          </div>
        )}
      </div>
      <p className="mt-3 text-[11px] font-mono text-muted-foreground">
        Tip: the splash only shows once per device. Clear localStorage key
        <code className="mx-1 px-1 bg-black/40 rounded">narfnarf.intro.earthslasthope.seen</code>
        to preview again.
      </p>
    </Panel>
  );
}

function SplashRowEditor({
  row,
  busy,
  onToggle,
  onUpload,
  onDelete,
}: {
  row: SplashRow;
  busy: boolean;
  onToggle: (enabled: boolean) => void;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="rounded-lg p-3 grid gap-2 sm:grid-cols-[140px_1fr_auto] items-center"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${row.videoPath ? "rgba(29,158,117,0.45)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div>
        <div className="font-mono text-[11px] tracking-[0.25em]" style={{ color: "#9cc6f5" }}>
          {row.slot.toUpperCase()}
        </div>
        <div className="text-[10px] mt-0.5 font-mono" style={{ color: row.videoPath ? "#1D9E75" : "#888780" }}>
          {row.videoPath ? "VIDEO LOADED" : "USING FALLBACK"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-[11px] font-mono text-muted-foreground flex items-center gap-2">
          <input
            type="checkbox"
            checked={row.enabled}
            disabled={busy}
            onChange={(e) => onToggle(e.target.checked)}
          />
          ENABLED
        </label>
      </div>

      <div className="flex items-center gap-2 justify-end flex-wrap">
        <label
          className="px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.25em] cursor-pointer"
          style={{ background: "rgba(55,138,221,0.18)", border: "1px solid rgba(55,138,221,0.45)" }}
        >
          {row.videoPath ? "REPLACE" : "UPLOAD"} MP4
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {row.videoPath && (
          <button
            onClick={onDelete}
            disabled={busy}
            className="px-3 py-1.5 rounded font-mono text-[10px] tracking-[0.25em] disabled:opacity-40"
            style={{ background: "rgba(226,75,74,0.15)", border: "1px solid rgba(226,75,74,0.5)", color: "#E24B4A" }}
          >
            REMOVE
          </button>
        )}
        {busy && (
          <span className="text-[10px] font-mono" style={{ color: "#EF9F27" }}>
            WORKING…
          </span>
        )}
      </div>
    </div>
  );
}
