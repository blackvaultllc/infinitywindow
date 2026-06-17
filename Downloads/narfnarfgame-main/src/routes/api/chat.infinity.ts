import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createOpenAI } from "@ai-sdk/openai";
import { getInfinitySystemPrompt } from "@/lib/infinity-prompt.server";

export const Route = createFileRoute("/api/chat/infinity")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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

        const safeMessages = body.messages.filter(
          (m) => m.role === "user" || m.role === "assistant",
        );

        const key = process.env.OPENAI_API_KEY;
        if (!key) return new Response("Missing OPENAI_API_KEY", { status: 500 });

        const openai = createOpenAI({ apiKey: key });
        const result = streamText({
          model: openai("gpt-4o-mini"),
          system: getInfinitySystemPrompt(),
          messages: await convertToModelMessages(safeMessages),
        });

        return result.toUIMessageStreamResponse({ originalMessages: safeMessages });
      },
    },
  },
});