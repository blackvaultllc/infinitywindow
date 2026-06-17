import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestHost } from "@tanstack/react-start/server";
import { z } from "zod";

export const listThreads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("infinity_threads")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ title: z.string().min(1).max(120).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: row, error } = await context.supabase
      .from("infinity_threads")
      .insert({ user_id: context.userId, title: data.title ?? "New transmission" })
      .select("id,title,updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("infinity_threads")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const loadMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ threadId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("infinity_messages")
      .select("id,role,parts,created_at")
      .eq("thread_id", data.threadId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };
    return (rows ?? [])
      .filter((r) => r.role === "user" || r.role === "assistant")
      .map((r) => ({
        id: r.id as string,
        role: r.role as "user" | "assistant",
        parts: (r.parts ?? []) as JsonValue,
      }));
  });

export const appendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        threadId: z.string().uuid(),
        role: z.enum(["user", "assistant", "system"]),
        parts: z.array(z.any()),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("infinity_messages").insert({
      thread_id: data.threadId,
      user_id: context.userId,
      role: data.role,
      parts: data.parts,
    });
    if (error) throw new Error(error.message);
    // Fire-and-forget: mirror to SIS LLC Medusa hub
    try {
      const { dispatchMedusaEvent } = await import("@/lib/medusa.server");
      let host = "unknown";
      try {
        host = getRequestHost() ?? "unknown";
      } catch {
        /* ignore */
      }
      const textPreview = data.parts
        .map((p: unknown) => {
          if (p && typeof p === "object" && "text" in (p as Record<string, unknown>)) {
            return String((p as { text?: unknown }).text ?? "");
          }
          return "";
        })
        .join(" ")
        .slice(0, 500);
      await dispatchMedusaEvent(
        {
          event_type: "chat_message",
          severity: "info",
          message: `${data.role}: ${textPreview || "(non-text content)"}`,
          payload: {
            ai_name: "Infinity",
            message_type: "report",
            content: textPreview,
            priority: "green",
            assigned_to: null,
            thread_id: data.threadId,
            role: data.role,
            user_id: context.userId,
          },
        },
        `https://${host}`,
      );
    } catch {
      /* never block message append */
    }
    return { ok: true };
  });

export const renameThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), title: z.string().min(1).max(120) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("infinity_threads")
      .update({ title: data.title })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });