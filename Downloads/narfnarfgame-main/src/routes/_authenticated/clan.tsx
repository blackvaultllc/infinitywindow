import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Crown, Shield, Star, User as UserIcon, X, ChevronUp, ChevronDown, Check, Send, Megaphone, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { OnlineDot, isOnline } from "@/components/OnlineDot";

export const Route = createFileRoute("/_authenticated/clan")({
  head: () => ({
    meta: [
      { title: "Clan — Narf Narf" },
      { name: "description", content: "Manage your clan: ranks, recruitment, join requests." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ClanPage,
});

type Clan = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  country: string | null;
  description: string | null;
  recruitment: "open" | "closed" | "invite_only";
};

type Member = { user_id: string; role: string; created_at: string; display_name?: string | null; username?: string | null; show_online?: boolean | null; last_seen_at?: string | null };
type JoinRequest = { id: string; user_id: string; message: string | null; created_at: string; display_name?: string | null; username?: string | null };

const RANK_LABEL: Record<string, string> = { owner: "Owner", co_leader: "Co-Leader", elder: "Elder", member: "Member" };
const RANK_VALUE: Record<string, number> = { owner: 4, co_leader: 3, elder: 2, member: 1 };

function RankBadge({ role }: { role: string }) {
  const cfg: Record<string, { icon: any; color: string }> = {
    owner: { icon: Crown, color: "#EF9F27" },
    co_leader: { icon: Shield, color: "#9cc6f5" },
    elder: { icon: Star, color: "#bdf2dc" },
    member: { icon: UserIcon, color: "#8f98ad" },
  };
  const { icon: Icon, color } = cfg[role] ?? cfg.member;
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-background/70 px-2 py-0.5 text-[10px] font-display uppercase tracking-widest" style={{ color }}>
      <Icon className="h-3 w-3" /> {RANK_LABEL[role] ?? role}
    </span>
  );
}

function ClanPage() {
  const { profile } = useProfile();
  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: mine } = await supabase.from("clan_members").select("clan_id,role").eq("user_id", profile.id).maybeSingle();
    if (!mine?.clan_id) { setClan(null); setMembers([]); setRequests([]); setMyRole(null); return; }
    setMyRole(mine.role);

    const [{ data: c }, { data: m }, { data: r }] = await Promise.all([
      supabase.from("clans").select("id,name,slug,owner_id,country,description,recruitment").eq("id", mine.clan_id).maybeSingle(),
      supabase.from("clan_members").select("user_id,role,created_at").eq("clan_id", mine.clan_id),
      supabase.from("clan_join_requests" as any).select("id,user_id,message,created_at").eq("clan_id", mine.clan_id).eq("status", "pending"),
    ]);
    setClan((c as Clan) ?? null);

    const userIds = [...new Set([...((m as any[]) ?? []).map(x => x.user_id), ...((r as any[]) ?? []).map(x => x.user_id)])];
    const { data: profiles } = await supabase.from("profiles").select("id,display_name,username,show_online,last_seen_at").in("id", userIds);
    const map = new Map<string, any>(((profiles as any[]) ?? []).map(p => [p.id, p]));

    setMembers(((m as any[]) ?? []).map(x => ({ ...x, display_name: map.get(x.user_id)?.display_name, username: map.get(x.user_id)?.username, show_online: map.get(x.user_id)?.show_online, last_seen_at: map.get(x.user_id)?.last_seen_at })).sort((a, b) => (RANK_VALUE[b.role] ?? 0) - (RANK_VALUE[a.role] ?? 0)));
    setRequests(((r as any[]) ?? []).map(x => ({ ...x, display_name: map.get(x.user_id)?.display_name, username: map.get(x.user_id)?.username })));
  }, [profile]);

  useEffect(() => { void load(); }, [load]);

  const canManage = myRole === "owner" || myRole === "co_leader" || myRole === "elder";
  const isOwner = myRole === "owner";

  const setRecruitment = async (mode: string) => {
    if (!clan) return;
    setBusy(true);
    const { error } = await supabase.rpc("set_clan_recruitment" as any, { _clan_id: clan.id, _mode: mode });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`Recruitment: ${mode.replace("_", " ")}`);
    await load();
  };

  const setRole = async (target: Member, newRole: string) => {
    if (!clan) return;
    setBusy(true);
    const { error } = await supabase.rpc("set_clan_member_role" as any, { _clan_id: clan.id, _target_user: target.user_id, _new_role: newRole });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${target.display_name || "Member"} → ${RANK_LABEL[newRole]}`);
    await load();
  };

  const kick = async (target: Member) => {
    if (!clan) return;
    if (!confirm(`Kick ${target.display_name || target.username || "this member"}?`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("kick_clan_member" as any, { _clan_id: clan.id, _target_user: target.user_id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Member kicked");
    await load();
  };

  const transfer = async (target: Member) => {
    if (!clan) return;
    if (!confirm(`Transfer ownership to ${target.display_name || target.username}? You will become Co-Leader.`)) return;
    setBusy(true);
    const { error } = await supabase.rpc("transfer_clan_ownership" as any, { _clan_id: clan.id, _new_owner: target.user_id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Ownership transferred");
    await load();
  };

  const decide = async (req: JoinRequest, accept: boolean) => {
    setBusy(true);
    const { error } = await supabase.rpc("decide_join_request" as any, { _request_id: req.id, _accept: accept });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(accept ? "Approved" : "Rejected");
    await load();
  };

  const leave = async () => {
    if (!clan) return;
    if (isOwner) return toast.error("Transfer ownership before leaving.");
    if (!confirm("Leave the clan?")) return;
    setBusy(true);
    const { error } = await supabase.rpc("leave_clan" as any, { _clan_id: clan.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Left clan");
    setClan(null);
  };

  if (!profile) return null;

  if (!clan) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-bold">Clan</h1>
        <p className="mt-2 text-muted-foreground">You're not in a clan yet.</p>
        <Link to="/play" className="mt-4 inline-block text-[#9cc6f5] underline">Find or create one in the Community Hub →</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <header className="rounded-2xl border border-white/10 bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Clan</div>
            <h1 className="text-2xl font-bold">{clan.name}</h1>
            <div className="text-xs text-muted-foreground">{clan.country || "Global"} · {members.length} member{members.length === 1 ? "" : "s"}</div>
            {clan.description && <p className="mt-2 text-sm leading-relaxed text-foreground/80">{clan.description}</p>}
          </div>
          <RankBadge role={myRole ?? "member"} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-display uppercase tracking-widest text-muted-foreground">Recruitment</span>
          {(["open", "invite_only", "closed"] as const).map(mode => (
            <button
              key={mode}
              disabled={!isOwner || busy}
              onClick={() => void setRecruitment(mode)}
              className="rounded-md border px-2 py-1 text-[11px] font-display uppercase tracking-widest transition disabled:opacity-50"
              style={{
                background: clan.recruitment === mode ? "rgba(55,138,221,0.22)" : "transparent",
                borderColor: clan.recruitment === mode ? "#378ADD" : "rgba(255,255,255,0.1)",
                color: clan.recruitment === mode ? "#9cc6f5" : "#8f98ad",
              }}
            >
              {mode.replace("_", " ")}
            </button>
          ))}
          {!isOwner && <span className="text-[10px] text-muted-foreground">(owner only)</span>}
        </div>

        <div className="mt-3">
          <Button variant="outline" onClick={() => void leave()} disabled={busy || isOwner} className="text-xs">Leave clan</Button>
        </div>
      </header>

      {canManage && requests.length > 0 && (
        <section className="rounded-2xl border border-white/10 bg-card p-5">
          <h2 className="font-display text-sm uppercase tracking-[0.3em] text-[#EF9F27]">Pending Join Requests · {requests.length}</h2>
          <ul className="mt-3 space-y-2">
            {requests.map(req => (
              <li key={req.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-background/60 p-3">
                <div className="min-w-0">
                  <div className="font-semibold text-sm">{req.display_name || req.username || "operator"}</div>
                  {req.message && <p className="text-xs text-muted-foreground line-clamp-2">{req.message}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => void decide(req, true)} disabled={busy}><Check className="h-3 w-3 mr-1" />Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => void decide(req, false)} disabled={busy}><X className="h-3 w-3" /></Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-card p-5">
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-muted-foreground">Members</h2>
        <ul className="mt-3 divide-y divide-white/5">
          {members.map(m => {
            const isMe = m.user_id === profile.id;
            const myRank = RANK_VALUE[myRole ?? "member"] ?? 0;
            const theirRank = RANK_VALUE[m.role] ?? 0;
            const canActOnThem = canManage && !isMe && myRank > theirRank;
            const canPromote = canActOnThem && theirRank + 1 < myRank && m.role !== "co_leader";
            const canDemote = canActOnThem && theirRank > 1;
            const canKick = (myRole === "owner" || myRole === "co_leader") && !isMe && myRank > theirRank;
            const canTransfer = isOwner && !isMe;

            const promoteTo = m.role === "member" ? "elder" : m.role === "elder" ? "co_leader" : null;
            const demoteTo = m.role === "co_leader" ? "elder" : m.role === "elder" ? "member" : null;

            return (
              <li key={m.user_id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <OnlineDot showOnline={m.show_online} lastSeenAt={m.last_seen_at} />
                    {m.username ? (
                      <Link to="/profile/$username" params={{ username: m.username }} className="font-semibold hover:text-[#9cc6f5]">@{m.username}</Link>
                    ) : (
                      <span className="font-semibold">{m.display_name || "operator"}</span>
                    )}
                    {isMe && <span className="text-[10px] text-muted-foreground">(you)</span>}
                    {isOnline(m.show_online, m.last_seen_at) && <span className="text-[9px] uppercase tracking-widest text-emerald-400">online</span>}
                  </div>
                  <RankBadge role={m.role} />
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  {canPromote && promoteTo && (
                    <button onClick={() => void setRole(m, promoteTo)} disabled={busy} title={`Promote to ${RANK_LABEL[promoteTo]}`} className="rounded border border-white/10 p-1 text-[#bdf2dc] hover:bg-white/5"><ChevronUp className="h-3 w-3" /></button>
                  )}
                  {canDemote && demoteTo && (
                    <button onClick={() => void setRole(m, demoteTo)} disabled={busy} title={`Demote to ${RANK_LABEL[demoteTo]}`} className="rounded border border-white/10 p-1 text-[#EF9F27] hover:bg-white/5"><ChevronDown className="h-3 w-3" /></button>
                  )}
                  {canKick && (
                    <button onClick={() => void kick(m)} disabled={busy} title="Kick" className="rounded border border-white/10 p-1 text-[#E24B4A] hover:bg-white/5"><X className="h-3 w-3" /></button>
                  )}
                  {canTransfer && (
                    <button onClick={() => void transfer(m)} disabled={busy} title="Transfer ownership" className="rounded border border-white/10 p-1 text-[#EF9F27] hover:bg-white/5"><Crown className="h-3 w-3" /></button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {(isOwner || myRole === "co_leader") && (
        <ClanEditCard clan={clan} onSaved={load} />
      )}

      <ClanChat clanId={clan.id} clanName={clan.name} myUserId={profile.id} canAnnounce={isOwner || myRole === "co_leader"} />
    </main>
  );
}

// ---------- Clan edit (owner + co-leader) ----------
function ClanEditCard({ clan, onSaved }: { clan: Clan; onSaved: () => void | Promise<void> }) {
  const [description, setDescription] = useState(clan.description ?? "");
  const [country, setCountry] = useState(clan.country ?? "");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("update_clan_meta" as any, {
      _clan_id: clan.id, _description: description, _country: country,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Clan updated");
    await onSaved();
  };
  return (
    <section className="rounded-2xl border border-white/10 bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-sm uppercase tracking-[0.3em] text-[#9cc6f5]">
        <Pencil className="h-3 w-3" /> Edit Clan
      </h2>
      <div className="mt-3 space-y-2">
        <label className="block text-[11px] font-display uppercase tracking-widest text-muted-foreground">Country / Region</label>
        <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={64} className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm" />
        <label className="block text-[11px] font-display uppercase tracking-widest text-muted-foreground">Description (max 240)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={240} rows={3} className="w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm" />
        <div className="flex justify-end">
          <Button size="sm" onClick={() => void save()} disabled={busy}>Save</Button>
        </div>
      </div>
    </section>
  );
}

// ---------- Clan chat ----------
type ClanMsg = {
  id: string; user_id: string; display_name: string | null; body: string; created_at: string; is_hidden?: boolean;
};

function ClanChat({ clanId, clanName, myUserId, canAnnounce }: { clanId: string; clanName: string; myUserId: string; canAnnounce: boolean }) {
  const [messages, setMessages] = useState<ClanMsg[]>([]);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [announceMode, setAnnounceMode] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("id,user_id,display_name,body,created_at,is_hidden")
      .eq("channel", "clan")
      .eq("clan_id", clanId)
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) return;
    setMessages((((data as any[]) ?? []) as ClanMsg[]).reverse());
  }, [clanId]);

  useEffect(() => {
    void load();
    const t = window.setInterval(() => void load(), 7000);
    return () => window.clearInterval(t);
  }, [load]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const post = async () => {
    const text = body.trim();
    if (text.length < 1 || text.length > 500) return toast.error("Message must be 1–500 characters.");
    setBusy(true);
    const rpc = announceMode
      ? supabase.rpc("post_clan_announcement" as any, { _clan_id: clanId, _body: text })
      : supabase.rpc("send_chat_message" as any, { _channel: "clan", _body: text, _clan_id: clanId, _friend_id: null, _country: null });
    const { error } = await rpc;
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    setAnnounceMode(false);
    await load();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm uppercase tracking-[0.3em] text-[#bdf2dc]">Clan Chat · {clanName}</h2>
        <span className="font-display text-[10px] uppercase tracking-widest text-muted-foreground">Members only</span>
      </div>

      <div ref={listRef} className="mt-3 h-[320px] overflow-y-auto rounded-xl border border-white/10 bg-background/70 p-3">
        {messages.length === 0 ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">No clan messages yet. Say hello to your crew.</div>
        ) : (
          <ul className="space-y-2">
            {messages.map((m) => {
              const mine = m.user_id === myUserId;
              const isAnnouncement = m.body.startsWith("📣 ");
              if (m.is_hidden && !mine) {
                return <li key={m.id} className="text-center text-[11px] italic text-muted-foreground">— removed by a moderator —</li>;
              }
              return (
                <li key={m.id} className={`rounded-xl border p-2.5 text-sm ${isAnnouncement ? "border-[#EF9F2755] bg-[#EF9F2710]" : mine ? "ml-8 border-[#378ADD55] bg-[#378ADD12]" : "mr-8 border-white/10 bg-card"}`}>
                  <div className="mb-0.5 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
                    <span className="font-semibold">{m.display_name || "operator"}</span>
                    <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{m.body}</div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {canAnnounce && (
          <label className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <input type="checkbox" checked={announceMode} onChange={(e) => setAnnounceMode(e.target.checked)} />
            <Megaphone className="h-3 w-3 text-[#EF9F27]" />
            Post as clan announcement
          </label>
        )}
        <div className="flex gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void post(); } }}
            maxLength={500}
            placeholder={announceMode ? "Broadcast to all clan members…" : "Message your clan…"}
            className="flex-1 rounded-lg border border-white/10 bg-background px-3 py-2 text-sm"
          />
          <Button onClick={() => void post()} disabled={busy} size="sm">
            <Send className="h-3 w-3 mr-1" /> Send
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground">Clan chat is moderated. Be kind. Owners and co-leaders can broadcast announcements.</p>
      </div>
    </section>
  );
}
