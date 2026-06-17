import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const RequestSchema = z.object({
  kind: z.enum(["purchase", "setting_change", "other"]),
  payload: z.record(z.string(), z.unknown()).default({}),
});

/** Child files a pending approval request and we fan out notifications. */
export const fileParentalRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RequestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: id, error } = await supabase.rpc("request_parental_approval", {
      _kind: data.kind,
      _payload: data.payload as never,
    });
    if (error) throw new Error(error.message);

    // Fire-and-forget: notify Medusa hub + queue parent email.
    try {
      const { dispatchMedusaEvent } = await import("@/lib/medusa.server");
      await dispatchMedusaEvent(
        {
          event_type: "child_safety",
          severity: "warn",
          player_ref: userId,
          message: `Child requested ${data.kind} approval`,
          payload: { request_id: id, ...data.payload },
        },
        "narfnarf.xyz",
      );
    } catch {
      /* never break the user flow over telemetry */
    }

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: child } = await supabaseAdmin
        .from("profiles")
        .select("display_name, parent_email, parent_user_id")
        .eq("id", userId)
        .maybeSingle();
      let parentEmail = child?.parent_email ?? null;
      if (!parentEmail && child?.parent_user_id) {
        const { data: parent } = await supabaseAdmin
          .from("profiles")
          .select("email")
          .eq("id", child.parent_user_id)
          .maybeSingle();
        parentEmail = (parent as { email?: string } | null)?.email ?? null;
      }
      if (parentEmail) {
        await supabaseAdmin.rpc("enqueue_email" as never, {
          queue_name: "transactional_emails",
          payload: {
            templateName: "parental-approval",
            recipientEmail: parentEmail,
            idempotencyKey: `parental-${id}`,
            templateData: {
              child_name: child?.display_name ?? "Your child",
              kind: data.kind,
              payload: data.payload,
              request_id: id,
            },
          },
        } as never);
      }
    } catch {
      /* email infra not ready yet — request still queued in-app */
    }

    return { id };
  });
