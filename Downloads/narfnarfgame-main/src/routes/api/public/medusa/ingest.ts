import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const PayloadSchema = z.object({
  event_type: z.string().min(1).max(120),
  severity: z.string().min(1).max(40).optional(),
  player_ref: z.string().min(1).max(200).optional(),
  message: z.string().min(1).max(4000),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export const Route = createFileRoute("/api/public/medusa/ingest")({
  server: {
    handlers: {
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Medusa-Key",
          },
        }),
      POST: async ({ request }) => {
        const { verifyIngestKey } = await import("@/lib/medusa.server");
        const provided = request.headers.get("x-medusa-key");
        if (!verifyIngestKey(provided)) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "invalid json" }), { status: 400 });
        }

        const parsed = PayloadSchema.safeParse(json);
        if (!parsed.success) {
          return new Response(
            JSON.stringify({ error: "invalid payload", details: parsed.error.flatten() }),
            { status: 400, headers: { "Content-Type": "application/json" } },
          );
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const sourceIp =
          request.headers.get("cf-connecting-ip") ??
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          null;

        const { error } = await supabaseAdmin.from("medusa_events").insert({
          direction: "inbound",
          event_type: parsed.data.event_type,
          severity: parsed.data.severity ?? "info",
          player_ref: parsed.data.player_ref ?? null,
          message: parsed.data.message,
          payload: (parsed.data.payload ?? {}) as never,
          source_ip: sourceIp,
          status: "received",
        });

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
    },
  },
});