import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/useProfile";
import { sendFriendRequest } from "@/lib/friends.functions";
import { getPublicProfileByUsername } from "@/lib/publicProfiles.functions";
import { Shell, ProfileHeader } from "./profile";

export const Route = createFileRoute("/_authenticated/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `@${params.username} — Narf Narf` },
      { name: "description", content: `Narf Narf operator profile for @${params.username}.` },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: OtherProfilePage,
});

function OtherProfilePage() {
  const { username } = Route.useParams();
  const { profile: me } = useProfile();
  const [target, setTarget] = useState<any | null | undefined>(undefined);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sendReq = useServerFn(sendFriendRequest);
  const fetchPublic = useServerFn(getPublicProfileByUsername);

  useEffect(() => {
    (async () => {
      try {
        const { profile: data } = await fetchPublic({ data: { username } });
        setTarget(data ?? null);
      } catch {
        setTarget(null);
      }
    })();
  }, [username]);

  if (target === undefined) return null;
  if (target === null) return <Shell><div className="text-muted-foreground">Operator not found.</div></Shell>;
  if (me && target.id === me.id) return <Navigate to="/profile" />;

  const addFriend = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await sendReq({ data: { username: target.username } });
      setStatus("Friend request sent.");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const block = async () => {
    if (!me) return;
    setBusy(true);
    setStatus(null);
    try {
      // Upsert as blocked from me → target
      await supabase.from("friends").delete().or(
        `and(requester_id.eq.${me.id},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${me.id})`,
      );
      const { error } = await supabase.from("friends").insert({
        requester_id: me.id,
        addressee_id: target.id,
        status: "blocked",
      });
      if (error) throw error;
      setStatus("Player blocked.");
    } catch (e: any) {
      setStatus(e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  const clan = target.clan as { id: string; name: string; slug: string; role: string } | null;
  const roleLabel: Record<string, string> = { owner: "Owner", co_leader: "Co-Leader", elder: "Elder", member: "Member" };

  return (
    <Shell>
      <ProfileHeader
        avatar={target.avatar_url}
        username={target.username}
        displayName={target.display_name}
        region={target.region}
        bio={target.bio}
      />
      {clan && (
        <div className="mt-3 flex items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground">CLAN</span>
          <span
            className="rounded px-2 py-1 font-display text-[10px] uppercase tracking-widest"
            style={{ background: "rgba(239,159,39,0.12)", border: "1px solid rgba(239,159,39,0.4)", color: "#EF9F27" }}
          >
            [{clan.name} · {roleLabel[clan.role] ?? clan.role}]
          </span>
        </div>
      )}
      <div className="mt-4 flex gap-2 flex-wrap">
        <button
          onClick={addFriend}
          disabled={busy}
          className="font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg disabled:opacity-40"
          style={{ background: "rgba(55,138,221,0.2)", border: "1px solid rgba(55,138,221,0.6)" }}
        >
          SEND FRIEND REQUEST
        </button>
        <button
          onClick={block}
          disabled={busy}
          className="font-mono text-[10px] tracking-[0.3em] px-4 py-2 rounded-lg disabled:opacity-40"
          style={{ background: "rgba(226,75,74,0.15)", border: "1px solid rgba(226,75,74,0.5)", color: "#E24B4A" }}
        >
          BLOCK PLAYER
        </button>
      </div>
      {status && (
        <div className="mt-3 font-mono text-[11px]" style={{ color: "#EF9F27" }}>{status}</div>
      )}
    </Shell>
  );
}