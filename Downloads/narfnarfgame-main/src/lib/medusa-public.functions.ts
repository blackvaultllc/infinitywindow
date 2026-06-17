import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const ChatFlagSchema = z.object({
  message_id: z.string().uuid(),
  severity: z.number().int().min(1).max(3),
  body_excerpt: z.string().max(500),
  channel: z.string().max(40),
});

/** Forwarded by the chat UI when the filter flags a message (sev>=2). */
export const forwardChatFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChatFlagSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { dispatchMedusaEvent } = await import("@/lib/medusa.server");
    return dispatchMedusaEvent(
      {
        event_type: "chat_flag",
        severity: data.severity >= 3 ? "alert" : "warn",
        player_ref: context.userId,
        message: `Chat flag (sev ${data.severity}) in ${data.channel}`,
        payload: {
          message_id: data.message_id,
          excerpt: data.body_excerpt,
          channel: data.channel,
        },
      },
      "narfnarf.xyz",
    );
  });
