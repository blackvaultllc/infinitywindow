import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const createSupportTicket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      subject: z.string().min(3).max(200),
      category: z.enum(["bug", "payment", "wager_dispute", "account", "general"]).default("general"),
      message: z.string().min(5).max(4000),
      transcript: z.string().max(8000).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const initial = data.transcript
      ? `${data.message}\n\n---\nChat transcript:\n${data.transcript}`
      : data.message;
    const { data: ticket, error } = await supabase
      .from("support_tickets")
      .insert({
        user_id: userId,
        subject: data.subject,
        category: data.category,
        initial_message: initial,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: userId,
      sender_role: "user",
      body: initial,
    });
    return { id: ticket.id };
  });