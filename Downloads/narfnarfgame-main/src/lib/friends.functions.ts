import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Send a friend request by username. */
export const sendFriendRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ username: z.string().regex(/^[A-Za-z0-9_]{3,20}$/) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: target, error } = await supabaseAdmin
      .from("profiles")
      .select("id,username")
      .ilike("username", data.username)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!target) throw new Error("User not found");
    if (target.id === userId) throw new Error("You cannot friend yourself");

    // If a row already exists either direction, surface a useful error.
    const { data: existing } = await supabase
      .from("friends")
      .select("id,status,requester_id,addressee_id")
      .or(
        `and(requester_id.eq.${userId},addressee_id.eq.${target.id}),and(requester_id.eq.${target.id},addressee_id.eq.${userId})`,
      )
      .maybeSingle();
    if (existing) {
      if (existing.status === "blocked") throw new Error("Blocked");
      if (existing.status === "accepted") throw new Error("Already friends");
      throw new Error("Request already pending");
    }

    const { error: insErr } = await supabase
      .from("friends")
      .insert({ requester_id: userId, addressee_id: target.id, status: "pending" });
    if (insErr) throw new Error(insErr.message);
    return { ok: true };
  });