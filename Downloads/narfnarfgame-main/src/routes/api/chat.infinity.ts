import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getInfinitySystemPrompt } from "@/lib/infinity-prompt.server";

export const Route = createFileRoute("/api/chat/infinity")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require a valid Supabase session — block anonymous AI usage
        const authHeader = request.headers.get("authorization") ?? "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (!token) return new Response("Unauthorized", { status: 401 });
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabasePk = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabasePk) {
          return new Response("Server misconfigured", { status: 500 });
        }
        const sb = createClient(supabaseUrl, supabasePk, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
        const { data: claims, error: authErr } = await sb.auth.getClaims(token);
        if (authErr || !claims?.claims?.sub) {
          return new Response("Unauthorized", { status: 401 });
        }

        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        // Defense-in-depth: never replay any system-role messages from history
        const safeMessages = body.messages.filter(
          (m) => m.role === "user" || m.role === "assistant",
        );
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("google/gemini-3-flash-preview"),
          system: getInfinitySystemPrompt(),
          messages: await convertToModelMessages(safeMessages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: safeMessages });
      },
    },
  },
});