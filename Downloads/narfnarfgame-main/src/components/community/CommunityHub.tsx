import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { MessageCircle, RefreshCcw, Shield, UserPlus, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { sendFriendRequest } from "@/lib/friends.functions";
import { getPublicProfilesByIds } from "@/lib/publicProfiles.functions";
import { useProfile } from "@/lib/useProfile";

type ChatTab = "general" | "country" | "direct" | "clan";

type ChatMessage = {
  id: string;
  channel: ChatTab;
  user_id: string;
  display_name: string | null;
  body: string;
  country: string | null;
  friend_id: string | null;
  clan_id: string | null;
  created_at: string;
  is_hidden?: boolean;
  flagged?: boolean;
};


type PublicProfile = {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  region: string | null;
};

type FriendOption = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type Clan = {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  country: string | null;
  description: string | null;
  recruitment?: "open" | "closed" | "invite_only";
};


const COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "Brazil",
  "United Kingdom",
  "France",
  "Germany",
  "Nigeria",
  "South Africa",
  "India",
  "China",
  "Japan",
  "Philippines",
  "Australia",
  "Global",
];

const TABS: { id: ChatTab; label: string; icon: typeof MessageCircle }[] = [
  { id: "general", label: "General", icon: MessageCircle },
  { id: "country", label: "Country", icon: Shield },
  { id: "direct", label: "Friends", icon: UserPlus },
];

type AuthorClanInfo = { clan_id: string; clan_name: string; clan_slug: string; role: string };

export function CommunityHub() {
  const { profile } = useProfile();
  const fetchPublic = useServerFn(getPublicProfilesByIds);
  const sendReq = useServerFn(sendFriendRequest);
  const [tab, setTab] = useState<ChatTab>("general");
  const [country, setCountry] = useState(profile?.region || "United States");
  const [friends, setFriends] = useState<FriendOption[]>([]);
  const [selectedFriend, setSelectedFriend] = useState("");
  const [myClan, setMyClan] = useState<Clan | null>(null);
  const [clans, setClans] = useState<Clan[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [authors, setAuthors] = useState<Record<string, PublicProfile>>({});
  const [authorClans, setAuthorClans] = useState<Record<string, AuthorClanInfo>>({});
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [clanName, setClanName] = useState("");
  const [clanDescription, setClanDescription] = useState("");

  const isStaff = !!profile?.roles && (profile.roles.includes("admin") || profile.roles.includes("moderator"));

  useEffect(() => {
    if (profile?.region) setCountry(profile.region);
  }, [profile?.region]);

  const loadRoster = useCallback(async () => {
    if (!profile) return;

    const [{ data: friendRows }, { data: memberRows }, { data: allClans }] = await Promise.all([
      supabase
        .from("friends")
        .select("requester_id,addressee_id,status")
        .eq("status", "accepted")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`),
      supabase.from("clan_members").select("clan_id,role").eq("user_id", profile.id).limit(1),
      supabase.from("clans").select("id,name,slug,owner_id,country,description,recruitment").order("created_at", { ascending: false }).limit(20),
    ]);

    const otherIds = ((friendRows as any[]) ?? []).map((r) =>
      r.requester_id === profile.id ? r.addressee_id : r.requester_id,
    );
    const publicRows = otherIds.length ? (await fetchPublic({ data: { ids: otherIds } })).profiles : [];
    const friendList = ((publicRows as PublicProfile[]) ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
    }));
    setFriends(friendList);
    if (!selectedFriend && friendList[0]) setSelectedFriend(friendList[0].id);

    const member = ((memberRows as any[]) ?? [])[0];
    if (member?.clan_id) {
      const { data: clan } = await supabase
        .from("clans")
        .select("id,name,slug,owner_id,country,description,recruitment")
        .eq("id", member.clan_id)
        .maybeSingle();
      setMyClan((clan as Clan) ?? null);
    } else {
      setMyClan(null);
    }
    setClans(((allClans as Clan[]) ?? []));
  }, [fetchPublic, profile, selectedFriend]);

  const loadMessages = useCallback(async () => {
    if (!profile) return;
    let query = supabase.from("chat_messages").select("*").order("created_at", { ascending: false }).limit(50);
    if (tab === "general") query = query.eq("channel", "general");
    if (tab === "country") query = query.eq("channel", "country").eq("country", country);
    if (tab === "direct") {
      if (!selectedFriend) {
        setMessages([]);
        return;
      }
      query = query
        .eq("channel", "direct")
        .or(`and(user_id.eq.${profile.id},friend_id.eq.${selectedFriend}),and(user_id.eq.${selectedFriend},friend_id.eq.${profile.id})`);
    }
    if (tab === "clan") {
      if (!myClan) {
        setMessages([]);
        return;
      }
      query = query.eq("channel", "clan").eq("clan_id", myClan.id);
    }

    const { data, error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    const next = (((data as any[]) ?? []) as ChatMessage[]).reverse();
    setMessages(next);
    const ids = Array.from(new Set(next.map((m) => m.user_id))).filter(Boolean);
    if (ids.length) {
      const [{ profiles }, { data: cmRows }] = await Promise.all([
        fetchPublic({ data: { ids } }),
        supabase
          .from("clan_members")
          .select("user_id,role,clan_id,clans(name,slug)")
          .in("user_id", ids),
      ]);
      setAuthors(Object.fromEntries(((profiles as PublicProfile[]) ?? []).map((p) => [p.id, p])));
      const clanMap: Record<string, AuthorClanInfo> = {};
      for (const row of ((cmRows as any[]) ?? [])) {
        const c = row.clans;
        if (!c) continue;
        clanMap[row.user_id] = {
          clan_id: row.clan_id,
          clan_name: c.name,
          clan_slug: c.slug,
          role: row.role,
        };
      }
      setAuthorClans(clanMap);
    }
  }, [country, fetchPublic, myClan, profile, selectedFriend, tab]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 8000);
    return () => window.clearInterval(timer);
  }, [loadMessages]);

  const currentTarget = useMemo(() => friends.find((f) => f.id === selectedFriend), [friends, selectedFriend]);

  const post = async () => {
    if (!profile) return;
    const text = body.trim();
    if (text.length < 1 || text.length > 500) {
      toast.error("Message must be 1–500 characters.");
      return;
    }
    if (tab === "direct" && !selectedFriend) return toast.error("Pick a friend first.");
    if (tab === "clan" && !myClan) return toast.error("Create or join a clan first.");

    setBusy(true);
    const { data: msgId, error } = await supabase.rpc("send_chat_message" as any, {
      _channel: tab,
      _body: text,
      _clan_id: tab === "clan" ? myClan?.id ?? null : null,
      _friend_id: tab === "direct" ? selectedFriend : null,
      _country: tab === "country" ? country : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setBody("");
    // Fire-and-forget: forward flagged messages to Medusa hub for review.
    try {
      const lower = text.toLowerCase();
      const HEAVY = ["kill yourself", "kys", "groom", "child porn", "cp ", "self harm"];
      const MED = ["fuck", "shit", "bitch", "asshole", "slut"];
      let sev = 0;
      if (HEAVY.some((w) => lower.includes(w))) sev = 3;
      else if (MED.some((w) => lower.includes(w))) sev = 2;
      if (sev >= 2 && msgId) {
        const { forwardChatFlag } = await import("@/lib/medusa-public.functions");
        forwardChatFlag({ data: { message_id: String(msgId), severity: sev, body_excerpt: text.slice(0, 200), channel: tab } }).catch(() => {});
      }
    } catch {
      /* optional telemetry */
    }
    await loadMessages();
  };

  const reportMessage = async (msgId: string) => {
    const reason = window.prompt("Why are you reporting this message? (optional)");
    if (reason === null) return;
    const { error } = await supabase.rpc("report_chat_message" as any, { _message_id: msgId, _reason: reason || null });
    if (error) return toast.error(error.message);
    toast.success("Reported. Moderators will review.");
  };

  const deleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message permanently?")) return;
    const { error } = await supabase.from("chat_messages").delete().eq("id", msgId);
    if (error) return toast.error(error.message);
    toast.success("Message deleted");
    await loadMessages();
  };


  const addFriend = async (author?: PublicProfile) => {
    if (!author?.username || author.id === profile?.id) return;
    try {
      await sendReq({ data: { username: author.username } });
      toast.success("Friend request sent.");
      await loadRoster();
    } catch (e: any) {
      toast(e?.message ?? "Could not send request.");
    }
  };

  const slugify = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40);

  const createClan = async () => {
    if (!profile) return;
    if (myClan) return toast.error("You already belong to a clan.");
    const name = clanName.trim();
    const slug = slugify(name);
    if (name.length < 3 || name.length > 32 || slug.length < 3) {
      toast.error("Clan name must be 3–32 characters.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.rpc("create_clan" as any, {
      _name: name,
      _slug: slug,
      _country: country ?? null,
      _description: clanDescription.trim().slice(0, 240) || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    setClanName("");
    setClanDescription("");
    setTab("clan");
    await loadRoster();
    toast.success("Clan created. 5,000 coins spent.");
  };

  const joinClan = async (clan: Clan) => {
    if (!profile || myClan) return;
    setBusy(true);
    const recruitment = (clan as any).recruitment ?? "closed";
    if (recruitment === "closed") {
      setBusy(false);
      return toast.error("This clan is closed to new members.");
    }
    const rpc = recruitment === "open" ? "join_clan" : "request_join_clan";
    const { error } = await supabase.rpc(rpc as any, { _clan_id: clan.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (recruitment === "open") {
      setTab("clan");
      await loadRoster();
      toast.success(`Joined ${clan.name}`);
    } else {
      toast.success("Join request sent to clan officers.");
    }
  };


  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-card">
      <div className="border-b border-white/10 px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-display text-[10px] uppercase tracking-[0.35em] text-muted-foreground">Live Chat</div>
            <h2 className="text-xl font-bold">Council Comms</h2>
          </div>
          <button onClick={() => void loadMessages()} className="rounded-lg border border-white/10 p-2 text-muted-foreground hover:text-foreground">
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-white/10 bg-background/60 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[9px] font-display uppercase tracking-widest transition"
              style={{ background: tab === id ? "rgba(55,138,221,0.22)" : "transparent", color: tab === id ? "#9cc6f5" : "#8f98ad" }}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
        {myClan && (
          <Link
            to="/clan"
            className="mt-2 flex items-center justify-between gap-2 rounded-md border border-[#EF9F2755] bg-[#EF9F2710] px-3 py-2 text-[11px] font-display uppercase tracking-widest text-[#EF9F27] hover:bg-[#EF9F2720]"
          >
            <span className="inline-flex items-center gap-2"><Users className="h-3 w-3" /> Clan Chat — {myClan.name}</span>
            <span>Open →</span>
          </Link>
        )}
        <p className="mt-3 rounded-md border border-[#EF9F2755] bg-[#EF9F2710] px-3 py-2 text-[10px] leading-snug text-[#EF9F27]">
          🛡 Safe Chat — kids play here too. No personal info, no slurs, no harassment. Messages are logged and moderated. By posting you agree to our <Link to="/privacy" className="underline">privacy & community rules</Link>.
        </p>
      </div>

      <div className="grid gap-4 px-4 py-4 sm:px-5 md:grid-cols-[1fr_240px]">
        <div className="min-w-0">
          {tab === "country" && (
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="mb-3 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm">
              {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          )}
          {tab === "direct" && (
            <select value={selectedFriend} onChange={(e) => setSelectedFriend(e.target.value)} className="mb-3 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm">
              {friends.length === 0 && <option value="">No friends yet</option>}
              {friends.map((f) => <option key={f.id} value={f.id}>{f.display_name || f.username || "operator"}</option>)}
            </select>
          )}
          {tab === "clan" && myClan && (
            <div className="mb-3 flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-background/70 px-3 py-2 text-sm">
              <div><span className="text-muted-foreground">Clan:</span> <span className="font-semibold">{myClan.name}</span></div>
              <Link to="/clan" className="text-[11px] font-display uppercase tracking-widest text-[#9cc6f5] hover:text-foreground">Manage →</Link>
            </div>
          )}

          <div className="h-[320px] overflow-y-auto rounded-xl border border-white/10 bg-background/70 p-3">
            {messages.length === 0 ? (
              <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
                {tab === "clan" && !myClan ? "Create or join a clan to open clan chat." : "No messages yet."}
              </div>
            ) : (
              <ul className="space-y-3">
                {messages.map((m) => {
                  const mine = m.user_id === profile?.id;
                  const author = authors[m.user_id];
                  if (m.is_hidden && !mine) {
                    return (
                      <li key={m.id} className="rounded-xl border border-white/10 bg-card/40 p-3 text-center text-[11px] italic text-muted-foreground">
                        — message removed by a moderator —
                      </li>
                    );
                  }
                  const clanInfo = authorClans[m.user_id];
                  const roleLabel = clanInfo ? ({ owner: "Owner", co_leader: "Co-Leader", elder: "Elder", member: "Member" } as Record<string, string>)[clanInfo.role] ?? clanInfo.role : null;
                  return (
                    <li key={m.id} className={`rounded-xl border p-3 ${mine ? "ml-8 border-[#378ADD55] bg-[#378ADD12]" : "mr-8 border-white/10 bg-card"} ${m.is_hidden ? "opacity-50" : ""}`}>
                      <div className="mb-1 flex min-w-0 items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                          {author && (author as any).is_minor === false && (
                            <span
                              title="Verified adult player (18+)"
                              aria-label="Adult player"
                              className="inline-flex items-center gap-0.5 rounded border border-[#45C49055] bg-[#45C49015] px-1 py-[1px] font-display text-[9px] uppercase tracking-widest text-[#45C490]"
                            >
                              <span aria-hidden>🛡</span> 18+
                            </span>
                          )}
                          {author && (author as any).is_minor === true && (
                            <span
                              title="Minor — watched by moderators and parental controls"
                              aria-label="Minor player"
                              className="inline-flex items-center gap-0.5 rounded border border-[#7F77DD55] bg-[#7F77DD15] px-1 py-[1px] font-display text-[9px] uppercase tracking-widest text-[#9c95ff]"
                            >
                              <span aria-hidden>★</span> JR
                            </span>
                          )}
                          {clanInfo && (
                            <span
                              title={`${clanInfo.clan_name} · ${roleLabel}`}
                              className="rounded border border-[#EF9F2755] bg-[#EF9F2715] px-1.5 py-[1px] font-display text-[9px] uppercase tracking-widest text-[#EF9F27]"
                            >
                              [{clanInfo.clan_name} · {roleLabel}]
                            </span>
                          )}
                          {author?.username ? (
                            <Link to="/profile/$username" params={{ username: author.username }} className="font-semibold hover:text-foreground">@{author.username}</Link>
                          ) : (
                            <span>{m.display_name || "operator"}</span>
                          )}
                        </div>
                        <time className="shrink-0">{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.body}</p>
                      {m.is_hidden && mine && <p className="mt-1 text-[10px] italic text-[#E24B4A]">(hidden by moderator)</p>}
                      <div className="mt-2 flex gap-3 text-[10px] font-display uppercase tracking-widest text-muted-foreground">
                        {!mine && author?.username && (
                          <button onClick={() => void addFriend(author)} className="hover:text-foreground">Add friend</button>
                        )}
                        {!mine && (
                          <button onClick={() => void reportMessage(m.id)} className="hover:text-[#E24B4A]">Report</button>
                        )}
                        {(mine || isStaff) && (
                          <button onClick={() => void deleteMessage(m.id)} className="ml-auto hover:text-[#E24B4A]">Delete</button>
                        )}
                      </div>
                    </li>

                  );
                })}
              </ul>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 500))}
              placeholder={tab === "direct" ? `Message ${currentTarget?.display_name || currentTarget?.username || "friend"}…` : "Send message…"}
              rows={2}
              className="min-w-0 flex-1 resize-none rounded-lg border border-white/10 bg-background px-3 py-2 text-sm outline-none focus:border-[#378ADD]"
            />
            <Button onClick={post} disabled={busy || !body.trim()} className="self-stretch px-4">Send</Button>
          </div>
        </div>

        <aside className="space-y-3">
          {myClan ? (
            <div className="rounded-xl border border-white/10 bg-background/70 p-3">
              <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Your Clan</div>
              <div className="mt-1 font-semibold">{myClan.name}</div>
              <div className="text-xs text-muted-foreground">{myClan.country || "Global"}</div>
              {myClan.description && <p className="mt-2 text-xs leading-relaxed text-foreground/75">{myClan.description}</p>}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-background/70 p-3">
              <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Create Clan</div>
              <input value={clanName} onChange={(e) => setClanName(e.target.value)} placeholder="Clan name" maxLength={32} className="mt-2 w-full rounded-lg border border-white/10 bg-card px-3 py-2 text-sm" />
              <textarea value={clanDescription} onChange={(e) => setClanDescription(e.target.value)} placeholder="Clan description" maxLength={240} rows={3} className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-card px-3 py-2 text-sm" />
              <p className="mt-2 text-[11px] text-muted-foreground">Costs <span className="text-[#EF9F27] font-semibold">5,000 coins</span>. One clan per account.</p>
              <Button onClick={createClan} disabled={busy || clanName.trim().length < 3} className="mt-2 w-full">Make Clan — 5,000 ⊙</Button>
            </div>
          )}

          {!myClan && (
            <div className="rounded-xl border border-white/10 bg-background/70 p-3">
              <div className="font-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Open Clans</div>
              <div className="mt-2 space-y-2">
                {clans.length === 0 && <div className="text-xs text-muted-foreground">No clans yet.</div>}
                {clans.slice(0, 5).map((clan) => (
                  <div key={clan.id} className="rounded-lg border border-white/10 bg-card p-2">
                    <div className="text-sm font-semibold">{clan.name}</div>
                    <div className="text-[11px] text-muted-foreground">{clan.country || "Global"}</div>
                    <button onClick={() => void joinClan(clan)} disabled={busy} className="mt-1 text-[10px] font-display uppercase tracking-widest text-[#9cc6f5]">Join</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}