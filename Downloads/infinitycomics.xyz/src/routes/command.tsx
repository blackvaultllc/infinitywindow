import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { MetatronsCube } from "@/components/MetatronsCube";
import { ELEMENTS } from "@/lib/elements";
import { infinityEncrypt, infinityDecrypt, INFINITY_SEQUENCE } from "@/lib/infinity-cipher";
import {
  getOwnerStats, getMintLog, getStaff, grantRoleByEmail, revokeRole,
  getRoleRequests, approveRoleRequest, rejectRoleRequest,
} from "@/lib/command.functions";

export const Route = createFileRoute("/command")({
  component: CommandCenter,
  head: () => ({ meta: [{ title: "Command Center — Mr. Infinity" }] }),
});

type Tab = "overview" | "governance" | "broadcast" | "vault" | "cipher" | "mintlog" | "certificates" | "careers";
const TABS: Tab[] = ["overview", "governance", "broadcast", "mintlog", "certificates", "careers", "vault", "cipher"];

function CommandCenter() {
  const { user, loading: authLoading } = useAuth();
  const { isOwner, isAdmin, loading: roleLoading } = useRole();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!authLoading && !roleLoading && user && isAdmin && !isOwner) {
      navigate({ to: "/admin/library" });
    }
  }, [authLoading, roleLoading, user, isAdmin, isOwner, navigate]);

  if (authLoading || roleLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gold/60 text-xs tracking-[0.4em] uppercase">Verifying authority…</div>;
  }
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-[0.6rem] tracking-[0.45em] uppercase text-gold/70">Sealed</p>
          <h1 className="mt-3 font-display text-3xl text-gold">Sign in required</h1>
          <Link to="/login" className="mt-6 inline-block bg-gold text-primary-foreground px-8 py-3 tracking-[0.35em] text-xs uppercase" style={{ backgroundColor: "var(--gold)" }}>
            Enter
          </Link>
        </div>
      </div>
    );
  }
  if (!isOwner) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6 text-center">
        <div className="max-w-sm">
          <p className="text-[0.6rem] tracking-[0.45em] uppercase text-gold/70">Forbidden</p>
          <h1 className="mt-3 font-display text-3xl text-gold">Architect Only</h1>
          <p className="mt-4 font-serif italic text-foreground/70 text-sm">
            This chamber answers only to Mr. Infinity. Medusa is watching.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-16 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-8 relative">
          <div className="absolute inset-0 flex items-center justify-center text-gold/10 pointer-events-none">
            <MetatronsCube size={320} animate />
          </div>
          <div className="relative">
            <p className="text-[0.6rem] tracking-[0.5em] uppercase text-gold/70">Architect</p>
            <h1 className="mt-3 font-display text-4xl sm:text-5xl text-gold glow-gold">Command Portal</h1>
            <p className="mt-3 font-serif italic text-foreground/70 text-sm">"All powers are yours. The realm answers to you."</p>
            <div className="mt-5">
              <Link
                to="/sandbox"
                search={{ godmode: 1 } as never}
                className="inline-block bg-gold text-primary-foreground px-7 py-3 tracking-[0.35em] text-xs uppercase ring-gold"
                style={{ backgroundColor: "var(--gold)" }}
              >
                Enter World as Architect →
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 text-[0.6rem] tracking-[0.35em] uppercase border transition-all ${
                tab === t ? "border-gold bg-gold/15 text-gold" : "border-gold/25 text-foreground/60 hover:border-gold/50"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" && <OverviewPanel />}
        {tab === "governance" && <GovernancePanel />}
        {tab === "broadcast" && <BroadcastPanel />}
        {tab === "mintlog" && <MintLogPanel />}
        {tab === "certificates" && <CertificatesPanel />}
        {tab === "careers" && <CareersPanel />}
        {tab === "vault" && <VaultPanel />}
        {tab === "cipher" && <CipherPanel />}
      </div>
    </div>
  );
}

// ───────── OVERVIEW ─────────
function OverviewPanel() {
  const fetchStats = useServerFn(getOwnerStats);
  const [stats, setStats] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    fetchStats({ data: undefined as never }).then(setStats).catch((e) => setErr(e.message));
  }, [fetchStats]);

  const cards: Array<[string, string, number | undefined]> = [
    ["Players total", "players_total", stats?.players_total],
    ["New today", "players_today", stats?.players_today],
    ["Forges total", "forges_total", stats?.forges_total],
    ["Forges today", "forges_today", stats?.forges_today],
    ["∞-mark drops", "infinitum_drops", stats?.infinitum_drops],
    ["Open tickets", "open_tickets", stats?.open_tickets],
    ["Pending staff apps", "pending_role_requests", stats?.pending_role_requests],
  ];

  return (
    <div>
      {err && <p className="text-destructive text-xs mb-4">{err}</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map(([label, key, value]) => (
          <div key={key} className="border border-gold/25 bg-card/40 p-5">
            <div className="text-[0.55rem] tracking-[0.35em] uppercase text-gold/55">{label}</div>
            <div className="mt-2 font-display text-4xl text-gold glow-gold">
              {value === undefined ? "—" : value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────── GOVERNANCE ─────────
type Staff = { user_id: string; email: string; display_name: string | null; role: string };
type RoleRequest = { id: string; user_id: string; display_name: string; body: string; created_at: string };

function GovernancePanel() {
  const fetchStaff = useServerFn(getStaff);
  const fetchReq = useServerFn(getRoleRequests);
  const grant = useServerFn(grantRoleByEmail);
  const revoke = useServerFn(revokeRole);
  const approve = useServerFn(approveRoleRequest);
  const reject = useServerFn(rejectRoleRequest);

  const [staff, setStaff] = useState<Staff[]>([]);
  const [reqs, setReqs] = useState<RoleRequest[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"moderator" | "admin" | "player">("moderator");
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    try {
      const [s, r] = await Promise.all([
        fetchStaff({ data: undefined as never }),
        fetchReq({ data: undefined as never }),
      ]);
      setStaff(s as Staff[]);
      setReqs(r as RoleRequest[]);
    } catch (e) { setMsg((e as Error).message); }
  }
  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function onGrant(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      await grant({ data: { email: email.trim(), role } });
      setEmail("");
      setMsg(`Granted ${role} to ${email}`);
      reload();
    } catch (err) { setMsg((err as Error).message); }
  }

  return (
    <div className="space-y-8">
      {/* Direct grant */}
      <div className="bg-card/60 border border-gold/30 p-5 ring-gold">
        <h3 className="font-display text-lg text-gold mb-3">Promote by email</h3>
        <form onSubmit={onGrant} className="flex flex-col sm:flex-row gap-2">
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
            placeholder="player@example.com"
            className="flex-1 bg-background/60 border border-gold/30 focus:border-gold/70 focus:outline-none px-3 py-2 text-sm font-mono" />
          <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}
            className="bg-background/60 border border-gold/30 px-3 py-2 text-sm uppercase tracking-[0.2em]">
            <option value="moderator">moderator</option>
            <option value="admin">admin</option>
            <option value="player">player</option>
          </select>
          <button type="submit" className="bg-gold text-primary-foreground px-5 py-2 tracking-[0.3em] text-xs uppercase" style={{ backgroundColor: "var(--gold)" }}>
            Grant
          </button>
        </form>
        {msg && <p className="mt-3 text-xs text-gold/80 font-serif italic">{msg}</p>}
      </div>

      {/* Pending requests */}
      <div className="bg-card/40 border border-gold/20 p-5">
        <h3 className="font-display text-lg text-gold mb-3">Pending applications · {reqs.length}</h3>
        {reqs.length === 0 && <p className="text-xs text-foreground/50 italic">No-one is petitioning for a seat.</p>}
        <ul className="space-y-3">
          {reqs.map((r) => {
            let parsed: { requested_role?: string; pitch?: string } = {};
            try { parsed = JSON.parse(r.body); } catch { parsed = { pitch: r.body }; }
            const requested = (parsed.requested_role as "moderator" | "admin") ?? "moderator";
            return (
              <li key={r.id} className="border border-gold/20 p-3 text-xs">
                <div className="flex justify-between text-[0.55rem] tracking-[0.3em] uppercase">
                  <span className="text-gold/70">{r.display_name} · wants {requested}</span>
                  <span className="text-foreground/40">{new Date(r.created_at).toLocaleString()}</span>
                </div>
                <p className="mt-2 font-serif italic text-foreground/80">"{parsed.pitch}"</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      try { await approve({ data: { ticketId: r.id, userId: r.user_id, role: requested } }); reload(); }
                      catch (e) { setMsg((e as Error).message); }
                    }}
                    className="bg-gold text-primary-foreground px-3 py-1 tracking-[0.25em] text-[0.55rem] uppercase"
                    style={{ backgroundColor: "var(--gold)" }}
                  >
                    Approve as {requested}
                  </button>
                  <button
                    onClick={async () => {
                      try { await reject({ data: { ticketId: r.id } }); reload(); }
                      catch (e) { setMsg((e as Error).message); }
                    }}
                    className="border border-gold/30 text-foreground/70 px-3 py-1 tracking-[0.25em] text-[0.55rem] uppercase"
                  >
                    Reject
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Active staff */}
      <div className="bg-card/40 border border-gold/20 p-5">
        <h3 className="font-display text-lg text-gold mb-3">Active staff · {staff.length}</h3>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full text-xs">
            <thead className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/50">
              <tr><th className="text-left py-2">Email</th><th className="text-left">Name</th><th className="text-left">Role</th><th></th></tr>
            </thead>
            <tbody>
              {staff.map((s) => (
                <tr key={`${s.user_id}-${s.role}`} className="border-t border-gold/10">
                  <td className="py-2 font-mono text-foreground/85 break-all">{s.email}</td>
                  <td className="text-foreground/70">{s.display_name ?? "—"}</td>
                  <td className="text-gold uppercase tracking-[0.3em]">{s.role}</td>
                  <td className="text-right">
                    <button
                      onClick={async () => {
                        if (!confirm(`Revoke ${s.role} from ${s.email}?`)) return;
                        try { await revoke({ data: { userId: s.user_id, role: s.role as "moderator" | "admin" | "owner" | "player" } }); reload(); }
                        catch (e) { setMsg((e as Error).message); }
                      }}
                      className="text-[0.55rem] tracking-[0.3em] uppercase text-foreground/50 hover:text-destructive border border-gold/15 px-2 py-1"
                    >
                      revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="md:hidden space-y-3">
          {staff.map((s) => (
            <li key={`${s.user_id}-${s.role}-m`} className="border border-gold/15 p-3 bg-background/40">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.55rem] tracking-[0.3em] uppercase text-gold">{s.role}</span>
                <button
                  onClick={async () => {
                    if (!confirm(`Revoke ${s.role} from ${s.email}?`)) return;
                    try { await revoke({ data: { userId: s.user_id, role: s.role as "moderator" | "admin" | "owner" | "player" } }); reload(); }
                    catch (e) { setMsg((e as Error).message); }
                  }}
                  className="text-[0.55rem] tracking-[0.3em] uppercase text-foreground/50 hover:text-destructive border border-gold/15 px-2 py-1"
                >
                  revoke
                </button>
              </div>
              <p className="mt-2 text-sm text-foreground/85">{s.display_name ?? "—"}</p>
              <p className="mt-1 font-mono text-[0.7rem] text-foreground/60 break-all">{s.email}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────── MINT LOG ─────────
type MintRow = { id: string; user_id: string; display_name: string | null; player_name: string | null; rarity_tier: string | null; rarity_score: number | null; elements: unknown; created_at: string };
function MintLogPanel() {
  const fetchLog = useServerFn(getMintLog);
  const [rows, setRows] = useState<MintRow[]>([]);
  useEffect(() => {
    fetchLog({ data: { limit: 200 } }).then((r) => setRows(r as MintRow[])).catch(() => {});
  }, [fetchLog]);
  return (
    <div className="bg-card/40 border border-gold/20 p-5">
      <h3 className="font-display text-lg text-gold mb-4">Mint Log · {rows.length}</h3>
      {rows.length === 0 && <p className="text-xs text-foreground/50 italic">No power generations recorded yet.</p>}
      <ul className="space-y-2 max-h-[65vh] overflow-y-auto">
        {rows.map((r) => (
          <li key={r.id} className="border border-gold/20 p-3 text-xs">
            <div className="flex justify-between text-[0.55rem] tracking-[0.3em] uppercase">
              <span className="text-gold/70">{r.display_name ?? r.player_name ?? "(anon)"}</span>
              <span className="text-foreground/40">{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-1 font-display text-gold">{r.rarity_tier ?? "—"} · {r.rarity_score ?? 0}</div>
            <div className="mt-1 text-foreground/60 font-mono break-all">{JSON.stringify(r.elements)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ───────── VAULT (unchanged) ─────────
type VaultKey = { id: string; title: string; value: string; notes: string | null; created_at: string };
function VaultPanel() {
  const { user } = useAuth();
  const [items, setItems] = useState<VaultKey[]>([]);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from("vault_keys").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as VaultKey[]);
  }
  useEffect(() => { load(); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !value.trim()) return;
    setSaving(true);
    await supabase.from("vault_keys").insert({
      owner_id: user.id, title: title.trim(), value: value.trim(), notes: notes.trim() || null,
    });
    setTitle(""); setValue(""); setNotes(""); setSaving(false); load();
  }
  async function remove(id: string) {
    if (!confirm("Burn this key from the vault?")) return;
    await supabase.from("vault_keys").delete().eq("id", id); load();
  }
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={save} className="bg-card/60 border border-gold/30 p-5 space-y-4 ring-gold">
        <h3 className="font-display text-lg text-gold">Architect Vault</h3>
        <p className="text-[0.6rem] tracking-[0.3em] uppercase text-gold/50">Owner-only storage · RLS-sealed</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 font-display text-sm" />
        <input value={value} onChange={(e) => setValue(e.target.value)} type="password" placeholder="Key / token value"
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm font-mono" />
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Notes (optional)"
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm font-serif resize-none" />
        <button type="submit" disabled={saving || !title.trim() || !value.trim()}
          className="w-full bg-gold text-primary-foreground px-6 py-3 tracking-[0.3em] text-xs uppercase disabled:opacity-40"
          style={{ backgroundColor: "var(--gold)" }}>
          {saving ? "Sealing…" : "Seal into Vault"}
        </button>
      </form>
      <div className="bg-card/40 border border-gold/20 p-5 max-h-[70vh] overflow-y-auto">
        <h3 className="font-display text-lg text-gold mb-3">Sealed Keys · {items.length}</h3>
        {items.length === 0 && <p className="text-xs text-foreground/50 italic">The vault is empty.</p>}
        <ul className="space-y-3">
          {items.map((k) => (
            <li key={k.id} className="border border-gold/20 p-3">
              <div className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/70">{k.title}</div>
              <div className="mt-2 font-mono text-xs text-foreground/85 break-all">
                {revealed[k.id] ? k.value : "•".repeat(Math.min(k.value.length, 32))}
              </div>
              {k.notes && <div className="mt-1 text-[0.65rem] text-foreground/50 italic">{k.notes}</div>}
              <div className="mt-2 flex gap-2">
                <button onClick={() => setRevealed((r) => ({ ...r, [k.id]: !r[k.id] }))} className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/70 border border-gold/20 px-2 py-1">{revealed[k.id] ? "hide" : "reveal"}</button>
                <button onClick={() => navigator.clipboard.writeText(k.value)} className="text-[0.55rem] tracking-[0.3em] uppercase text-gold/70 border border-gold/20 px-2 py-1">copy</button>
                <button onClick={() => remove(k.id)} className="text-[0.55rem] tracking-[0.3em] uppercase text-foreground/40 hover:text-destructive border border-gold/15 px-2 py-1 ml-auto">burn</button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────── CIPHER (unchanged) ─────────
function CipherPanel() {
  const [seed, setSeed] = useState("4448888");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");
  const [input, setInput] = useState("");
  const output = useMemo(() => {
    if (!input) return "";
    return mode === "encrypt" ? infinityEncrypt(input, seed) : infinityDecrypt(input, seed);
  }, [input, mode, seed]);
  return (
    <div className="space-y-6">
      <div className="bg-card/40 border border-gold/20 p-5">
        <h3 className="font-display text-lg text-gold mb-3">Periodic Lattice · {ELEMENTS.length} known + 1 unknown</h3>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
          {ELEMENTS.map((el) => (
            <div key={el.symbol} title={`${el.name} · ${el.power}`}
              className="aspect-square border border-gold/25 bg-gradient-to-br from-background/60 to-card/60 flex flex-col items-center justify-center p-1 text-center">
              <div className="text-[0.5rem] text-gold/50 leading-none">{el.number}</div>
              <div className="font-display text-gold text-sm leading-none mt-0.5">{el.symbol}</div>
            </div>
          ))}
          <div className="aspect-square border-2 border-gold flex flex-col items-center justify-center p-1 text-center" style={{ background: "linear-gradient(135deg, #1a1428, #0a0a0f)" }}>
            <div className="text-[0.5rem] text-gold/70 leading-none">119</div>
            <div className="font-display text-gold text-sm leading-none mt-0.5 glow-gold">∞</div>
          </div>
        </div>
      </div>
      <div className="bg-card/60 border border-gold/30 p-5 ring-gold space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-display text-lg text-gold">Infinity Code</h3>
          <div className="text-[0.6rem] tracking-[0.4em] uppercase text-gold/60 font-mono">seq · {INFINITY_SEQUENCE.join("-")}</div>
        </div>
        <div className="flex gap-2">
          {(["encrypt", "decrypt"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 px-3 py-2 text-[0.6rem] tracking-[0.3em] uppercase border ${mode === m ? "border-gold bg-gold/15 text-gold" : "border-gold/25 text-foreground/60"}`}>
              {m}
            </button>
          ))}
        </div>
        <input value={seed} onChange={(e) => setSeed(e.target.value)}
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 font-mono text-sm" />
        <textarea value={input} onChange={(e) => setInput(e.target.value)} rows={4}
          placeholder={mode === "encrypt" ? "Type the message…" : "Paste the cipher…"}
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm font-mono resize-none" />
        <div className="bg-background/80 border border-gold/40 px-3 py-3 min-h-[5rem] font-mono text-sm text-gold/90 break-words whitespace-pre-wrap">
          {output || <span className="text-foreground/30 italic">—</span>}
        </div>
      </div>
    </div>
  );
}

// ───────── BROADCAST ─────────
type Announcement = { id: string; title: string; body: string; kind: string; created_at: string };
function BroadcastPanel() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"general" | "secret-rare" | "release">("general");
  const [items, setItems] = useState<Announcement[]>([]);
  const [sending, setSending] = useState(false);

  async function load() {
    const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false }).limit(20);
    setItems((data ?? []) as Announcement[]);
  }
  useEffect(() => { load(); }, []);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !title.trim() || !body.trim()) return;
    setSending(true);
    const { error } = await supabase.from("announcements").insert({
      author_id: user.id, title: title.trim(), body: body.trim(), kind,
    });
    setSending(false);
    if (!error) { setTitle(""); setBody(""); setKind("general"); load(); }
  }
  async function remove(id: string) {
    await supabase.from("announcements").delete().eq("id", id); load();
  }
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <form onSubmit={send} className="bg-card/60 border border-gold/30 p-5 space-y-4 ring-gold">
        <h3 className="font-display text-lg text-gold">Push a Broadcast</h3>
        <div className="flex gap-2">
          {(["general", "secret-rare", "release"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)}
              className={`flex-1 px-2 py-2 text-[0.55rem] tracking-[0.25em] uppercase border ${kind === k ? "border-gold bg-gold/15 text-gold" : "border-gold/25 text-foreground/60"}`}>{k}</button>
          ))}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title"
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 font-display text-sm" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" rows={4}
          className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm font-serif resize-none" />
        <button type="submit" disabled={sending || !title.trim() || !body.trim()}
          className="w-full bg-gold text-primary-foreground px-6 py-3 tracking-[0.3em] text-xs uppercase disabled:opacity-40"
          style={{ backgroundColor: "var(--gold)" }}>
          {sending ? "Sending…" : "Push"}
        </button>
      </form>
      <div className="bg-card/40 border border-gold/20 p-5 max-h-[70vh] overflow-y-auto">
        <h3 className="font-display text-lg text-gold mb-3">Recent · {items.length}</h3>
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id} className="border border-gold/20 p-3 text-xs">
              <div className="flex justify-between text-[0.55rem] tracking-[0.3em] uppercase text-gold/60">
                <span>{a.kind}</span>
                <span className="text-foreground/40">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              <div className="font-display text-gold mt-1">{a.title}</div>
              <p className="mt-1 font-serif italic text-foreground/75">{a.body}</p>
              <button onClick={() => remove(a.id)} className="mt-2 text-[0.55rem] tracking-[0.3em] uppercase text-foreground/40 hover:text-destructive border border-gold/15 px-2 py-1">delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ───────── CERTIFICATES ─────────
type CertProfile = { id: string; display_name: string | null; nickname: string | null };
type Cert = { id: string; recipient_user_id: string; recipient_name: string; achievement: string; notes: string | null; signature_name: string; issued_at: string };

function CertificatesPanel() {
  const [people, setPeople] = useState<CertProfile[]>([]);
  const [recent, setRecent] = useState<Cert[]>([]);
  const [recipientId, setRecipientId] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [achievement, setAchievement] = useState("");
  const [notes, setNotes] = useState("");
  const [signature, setSignature] = useState("Domenick A. Hall");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [{ data: pp }, { data: cc }] = await Promise.all([
      supabase.from("profiles").select("id,display_name,nickname").order("display_name", { ascending: true }).limit(500),
      supabase.from("certificates").select("id,recipient_user_id,recipient_name,achievement,notes,signature_name,issued_at").order("issued_at", { ascending: false }).limit(50),
    ]);
    setPeople((pp ?? []) as CertProfile[]);
    setRecent((cc ?? []) as Cert[]);
  }
  useEffect(() => { void load(); }, []);

  function pickRecipient(id: string) {
    setRecipientId(id);
    const p = people.find((x) => x.id === id);
    if (p && !recipientName) setRecipientName(p.nickname || p.display_name || "");
  }

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    setErr(null); setMsg(null);
    if (!recipientId || !recipientName.trim() || !achievement.trim() || !signature.trim()) {
      setErr("Pick a recipient and fill in name, achievement, signature.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("certificates").insert({
      recipient_user_id: recipientId,
      recipient_name: recipientName.trim().slice(0, 200),
      achievement: achievement.trim().slice(0, 500),
      notes: notes.trim().slice(0, 1000) || null,
      signature_name: signature.trim().slice(0, 120),
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setMsg("Certificate issued — it now appears on their profile.");
    setAchievement(""); setNotes("");
    void load();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={issue} className="border border-gold/25 bg-card/40 p-5 space-y-4">
        <h3 className="font-display text-gold text-xl">Issue a Certificate</h3>
        <label className="block">
          <span className="block text-[0.55rem] tracking-[0.35em] uppercase text-gold/60 mb-1">Recipient</span>
          <select value={recipientId} onChange={(e) => pickRecipient(e.target.value)}
            className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm">
            <option value="">— select a player —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.nickname || p.display_name || p.id.slice(0,8)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[0.55rem] tracking-[0.35em] uppercase text-gold/60 mb-1">Recipient name (printed on cert)</span>
          <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={200}
            className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="block text-[0.55rem] tracking-[0.35em] uppercase text-gold/60 mb-1">Achievement</span>
          <input value={achievement} onChange={(e) => setAchievement(e.target.value)} maxLength={500}
            placeholder="e.g. Mastery of Calculus I"
            className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm" />
        </label>
        <label className="block">
          <span className="block text-[0.55rem] tracking-[0.35em] uppercase text-gold/60 mb-1">Notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000}
            className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm resize-none" />
        </label>
        <label className="block">
          <span className="block text-[0.55rem] tracking-[0.35em] uppercase text-gold/60 mb-1">Signature</span>
          <input value={signature} onChange={(e) => setSignature(e.target.value)} maxLength={120}
            className="w-full bg-background/60 border border-gold/30 px-3 py-2 text-sm font-serif italic" />
        </label>
        {msg && <p className="text-xs text-gold/90 font-serif italic">{msg}</p>}
        {err && <p className="text-xs text-destructive">{err}</p>}
        <button type="submit" disabled={busy}
          className="bg-gold text-primary-foreground px-7 py-2 tracking-[0.35em] text-xs uppercase disabled:opacity-40"
          style={{ backgroundColor: "var(--gold)" }}>
          {busy ? "Issuing…" : "Issue Certificate"}
        </button>
      </form>

      <div className="border border-gold/25 bg-card/40 p-5">
        <h3 className="font-display text-gold text-xl mb-3">Recent Certificates</h3>
        {recent.length === 0 ? (
          <p className="text-xs text-foreground/50 italic">None issued yet.</p>
        ) : (
          <ul className="space-y-3 max-h-[520px] overflow-y-auto pr-2">
            {recent.map((c) => (
              <li key={c.id} className="border border-gold/20 p-3 text-xs">
                <p className="font-display text-gold text-sm">{c.recipient_name}</p>
                <p className="text-foreground/80 mt-1">{c.achievement}</p>
                {c.notes && <p className="text-foreground/50 italic mt-1">{c.notes}</p>}
                <p className="text-[0.6rem] tracking-[0.3em] uppercase text-gold/50 mt-2">
                  Signed {c.signature_name} · {new Date(c.issued_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ───────── CAREERS REVIEW ─────────
type Application = {
  id: string; user_id: string | null; role_kind: string; subject: string;
  full_name: string; email: string; website: string | null; resume_url: string | null;
  brief: string; detailed: string; status: string; created_at: string;
};

function CareersPanel() {
  const [apps, setApps] = useState<Application[]>([]);
  const [filter, setFilter] = useState<"pending" | "accepted" | "rejected" | "all">("pending");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    let q = supabase.from("careers_applications").select("*").order("created_at", { ascending: false }).limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    setApps((data ?? []) as Application[]);
    setLoading(false);
  }
  useEffect(() => { void load(); }, [filter]);

  async function setStatus(id: string, status: "accepted" | "rejected" | "reviewed" | "pending") {
    await supabase.from("careers_applications").update({ status }).eq("id", id);
    void load();
  }
  async function viewResume(path: string) {
    const { data, error } = await supabase.storage.from("resumes").createSignedUrl(path, 60 * 10);
    if (error || !data) { alert(error?.message ?? "Could not load resume"); return; }
    window.open(data.signedUrl, "_blank", "noopener");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["pending","accepted","rejected","all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-[0.55rem] tracking-[0.35em] uppercase border ${filter===f ? "border-gold bg-gold/15 text-gold" : "border-gold/25 text-foreground/60"}`}>
            {f}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-xs text-foreground/50">Loading applications…</p>
      ) : apps.length === 0 ? (
        <p className="text-xs text-foreground/50 italic">No applications in this view.</p>
      ) : (
        <ul className="space-y-4">
          {apps.map((a) => (
            <li key={a.id} className="border border-gold/25 bg-card/40 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-display text-gold text-lg">{a.full_name}</p>
                  <p className="text-[0.6rem] tracking-[0.3em] uppercase text-gold/60">
                    {a.role_kind} · {a.subject} · {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`text-[0.55rem] tracking-[0.35em] uppercase px-2 py-1 border ${
                  a.status==="accepted" ? "border-green-500/60 text-green-400" :
                  a.status==="rejected" ? "border-red-500/60 text-red-400" :
                  "border-gold/40 text-gold/80"}`}>{a.status}</span>
              </div>
              <p className="mt-2 text-xs text-foreground/80"><span className="text-gold/60">Email:</span> {a.email}</p>
              {a.website && <p className="text-xs text-foreground/80"><span className="text-gold/60">Site:</span> <a href={a.website} target="_blank" rel="noreferrer" className="underline">{a.website}</a></p>}
              <p className="mt-3 text-sm text-foreground/90 font-serif italic">{a.brief}</p>
              <details className="mt-2">
                <summary className="cursor-pointer text-[0.6rem] tracking-[0.35em] uppercase text-gold/70">Full statement</summary>
                <p className="mt-2 text-xs text-foreground/75 whitespace-pre-wrap">{a.detailed}</p>
              </details>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.resume_url && (
                  <button onClick={() => viewResume(a.resume_url!)}
                    className="border border-gold/40 text-gold px-4 py-1.5 text-[0.55rem] tracking-[0.35em] uppercase hover:bg-gold/10">
                    View Resume
                  </button>
                )}
                <button onClick={() => setStatus(a.id, "accepted")}
                  className="border border-green-500/60 text-green-400 px-4 py-1.5 text-[0.55rem] tracking-[0.35em] uppercase hover:bg-green-500/10">
                  Approve
                </button>
                <button onClick={() => setStatus(a.id, "rejected")}
                  className="border border-red-500/60 text-red-400 px-4 py-1.5 text-[0.55rem] tracking-[0.35em] uppercase hover:bg-red-500/10">
                  Reject
                </button>
                {a.status !== "pending" && (
                  <button onClick={() => setStatus(a.id, "pending")}
                    className="border border-gold/30 text-foreground/60 px-4 py-1.5 text-[0.55rem] tracking-[0.35em] uppercase">
                    Reset
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
