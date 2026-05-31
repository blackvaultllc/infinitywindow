import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listNotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("notes")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    return { notes: data ?? [] };
  });

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().max(200).default("Untitled"),
  body: z.string().max(20000).default(""),
  x: z.number().default(80),
  y: z.number().default(80),
  w: z.number().min(160).max(2000).default(320),
  h: z.number().min(120).max(2000).default(240),
  z: z.number().default(1),
});

export const upsertNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => upsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = { ...data, user_id: userId, updated_at: new Date().toISOString() };
    if (data.id) {
      const { data: row, error } = await supabase
        .from("notes")
        .update(payload)
        .eq("id", data.id)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return { note: row };
    }
    const { data: row, error } = await supabase
      .from("notes")
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { note: row };
  });

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
