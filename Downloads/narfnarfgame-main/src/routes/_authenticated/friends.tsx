import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { sendFriendRequest } from "@/lib/friends.functions";
import { getPublicProfilesByIds } from "@/lib/publicProfiles.functions";
import { FinishOnboardingCard } from "./profile";
import { OnlineDot } from "@/components/OnlineDot";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends — Narf Narf" },
      { name: "description", content: "Your operator network — friend requests, friends list, and blocks." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: FriendsPage,
});

type FriendRow = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted" | "blocked";
  other: { id: string; username: string | null; avatar_url: string | null; display_name: string | null; show_online?: boolean | null; last_seen_at?: string | null };
};

function FriendsPage() {
  const { profile, loading } = useProfile();
  const [rows, setRows] = useState<FriendRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newUsername, setNewUsername] = useState("");
  const sendReq = useServerFn(sendFriendRequest);
  const fetchPublic = useServerFn(getPublicProfilesByIds);

  const load = useCallback(async () => {
    if (!profile) return;
    setBusy(true);
    setError(null);
    try {
      const { data } = await supabase
        .from("friends")
        .select("id,requester_id,addressee_id,status")
        .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);
      const otherIds = (data ?? []).map((r: any) =>
        r.requester_id === profile.id ? r.addressee_id : r.requester_id,
      );
      let profMap: Record<string, any> = {};
      if (otherIds.length) {
        const { profiles: profs } = await fetchPublic({ data: { ids: otherIds } });
        profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]));
      }
      setRows(
        (data ?? []).map((r: any): FriendRow => ({
          id: r.id,
          requester_id: r.requester_id,
          addressee_id: r.addressee_id,
          status: r.status,
          other: profMap[r.requester_id === profile.id ? r.addressee_id : r.requester_id] ?? {
            id: "?", username: null, avatar_url: null, display_name: null,
          },
        })),
      );
    } finally {
      setBusy(false);
    }
  }, [profile]);

  useEffect(() => { void load(); }, [load]);

  if (loading && !profile) return null;
  if (!profile) return <Navigate to="/auth" />;
  if (!profile.username) {
    return (
      <div
        className="min-h-screen px-4 py-6 sm:px-8"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, #0a1e4a 0%, #050a1f 60%, #02040c 100%)",
        }}
      >
        <div className="mx-auto max-w-3xl">
          <Link to="/select" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">
            ← BACK
          </Link>
          <h1 className="font-display text-3xl tracking-tight mt-3 mb-5">FRIENDS</h1>
          <FinishOnboardingCard
            to="/onboarding-profile"
            title="PICK A CALLSIGN FIRST"
            body="Other operators find you by your @username, so you need one before you can send or accept friend requests."
            cta="SET CALLSIGN →"
          />
        </div>
      </div>
    );
  }

  const incoming = rows.filter(
    (r) => r.status === "pending" && r.addressee_id === profile.id,
  );
  const outgoing = rows.filter(
    (r) => r.status === "pending" && r.requester_id === profile.id,
  );
  const friends = rows.filter((r) => r.status === "accepted");
  const blocked = rows.filter(
    (r) => r.status === "blocked" && r.requester_id === profile.id,
  );

  const respond = async (id: string, status: "accepted" | "deleted") => {
    setBusy(true);
    try {
      if (status === "deleted") await supabase.from("friends").delete().eq("id", id);
      else await supabase.from("friends").update({ status: "accepted" } as any).eq("id", id);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const sendNew = async () => {
    setError(null);
    if (!/^[A-Za-z0-9_]{3,20}$/.test(newUsername.trim())) {
      setError("Username must be 3–20 chars, letters/numbers/underscore.");
      return;
    }
    setBusy(true);
    try {
      await sendReq({ data: { username: newUsername.trim() } });
      setNewUsername("");
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #0a1e4a 0%, #050a1f 60%, #02040c 100%)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <Link to="/select" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">
          ← BACK
        </Link>
        <h1 className="font-display text-3xl tracking-tight mt-3">FRIENDS</h1>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
          <div className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground mb-2">
            SEND REQUEST BY USERNAME
          </div>
          <div className="flex gap-2">
            <input
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.trim())}
              placeholder="username"
              className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:border-[#378ADD]"
            />
            <button
              onClick={sendNew}
              disabled={busy || !newUsername}
              className="font-mono text-[10px] tracking-[0.3em] px-4 rounded-lg disabled:opacity-40"
              style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)" }}
            >
              SEND
            </button>
          </div>
          {error && (
            <div className="mt-2 text-xs font-mono" style={{ color: "#E24B4A" }}>{error}</div>
          )}
        </div>

        <Section title={`INCOMING (${incoming.length})`}>
          {incoming.length === 0 && <Empty label="No incoming requests." />}
          {incoming.map((r) => (
            <RowCard key={r.id} row={r}>
              <button
                onClick={() => respond(r.id, "accepted")}
                disabled={busy}
                className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)" }}
              >
                ACCEPT
              </button>
              <button
                onClick={() => respond(r.id, "deleted")}
                disabled={busy}
                className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                DECLINE
              </button>
            </RowCard>
          ))}
        </Section>

        <Section title={`OUTGOING (${outgoing.length})`}>
          {outgoing.length === 0 && <Empty label="No outgoing requests." />}
          {outgoing.map((r) => (
            <RowCard key={r.id} row={r}>
              <button
                onClick={() => respond(r.id, "deleted")}
                disabled={busy}
                className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                CANCEL
              </button>
            </RowCard>
          ))}
        </Section>

        <Section title={`FRIENDS (${friends.length})`}>
          {friends.length === 0 && <Empty label="No friends yet. Send a request above." />}
          {friends.map((r) => (
            <RowCard key={r.id} row={r}>
              <button
                onClick={() => respond(r.id, "deleted")}
                disabled={busy}
                className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(226,75,74,0.15)", border: "1px solid rgba(226,75,74,0.5)", color: "#E24B4A" }}
              >
                REMOVE
              </button>
            </RowCard>
          ))}
        </Section>

        <Section title={`BLOCKED (${blocked.length})`}>
          {blocked.length === 0 && <Empty label="No blocked players." />}
          {blocked.map((r) => (
            <RowCard key={r.id} row={r}>
              <button
                onClick={() => respond(r.id, "deleted")}
                disabled={busy}
                className="font-mono text-[10px] tracking-[0.3em] px-3 py-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                UNBLOCK
              </button>
            </RowCard>
          ))}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <div className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#9cc6f5" }}>
        {title}
      </div>
      <div className="mt-2 grid gap-2">{children}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/20 p-3 text-xs font-mono text-muted-foreground">
      {label}
    </div>
  );
}

function RowCard({ row, children }: { row: FriendRow; children: React.ReactNode }) {
  const u = row.other.username;
  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-3 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl shrink-0"
        style={{ background: "rgba(55,138,221,0.15)", border: "1px solid rgba(55,138,221,0.4)" }}
      >
        {row.other.avatar_url || "🛰️"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <OnlineDot showOnline={row.other.show_online} lastSeenAt={row.other.last_seen_at} />
          <div className="font-display text-sm truncate">{row.other.display_name || u || "—"}</div>
        </div>
        {u && (
          <Link
            to="/profile/$username"
            params={{ username: u }}
            className="font-mono text-[10px] tracking-[0.25em] text-muted-foreground hover:text-foreground"
          >
            @{u}
          </Link>
        )}
      </div>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}