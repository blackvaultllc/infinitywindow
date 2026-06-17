import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

const InputSchema = z.object({
  event_type: z.string().min(1).max(120),
  severity: z.string().min(1).max(40).optional(),
  player_ref: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(4000),
  payload: z.record(z.string(), z.unknown()).optional(),
});

/** Send an event outward to the SIS LLC Medusa hub (auth required). */
export const sendMedusaEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const { dispatchMedusaEvent } = await import("@/lib/medusa.server");
    let host = "unknown";
    try {
      host = getRequestHost() ?? "unknown";
    } catch {
      /* ignore */
    }
    return dispatchMedusaEvent(data, `https://${host}`);
  });

/** Admin-only: list the recent Medusa hub events (inbound + outbound). */
export const listMedusaEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { data, error } = await supabaseAdmin
      .from("medusa_events")
      .select("id,direction,event_type,severity,player_ref,message,payload,source_ip,status,error,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });