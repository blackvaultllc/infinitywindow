import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const FALLBACK_AI_REPLY =
  "Thank you for reaching out — your message has been received. Please wait here; the owner will respond in this window as soon as possible. You'll see a notification when they reply.";

async function generateAiReply(userMessage: string): Promise<string> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return FALLBACK_AI_REPLY;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You are the front-desk assistant for Juneteenth.Love. The owner, Domenick, personally answers every chat. Your only job is to warmly acknowledge the visitor's message in 1-2 short sentences, reassure them their message was received, and tell them to please wait here — the owner will reply in this same window as soon as he sees it. Never promise a specific time. Never answer their question yourself. Keep it human, brief, and respectful. No emojis.",
          },
          { role: "user", content: userMessage.slice(0, 1000) },
        ],
        max_tokens: 120,
      }),
    });
    if (!res.ok) return FALLBACK_AI_REPLY;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    return text && text.length > 0 ? text : FALLBACK_AI_REPLY;
  } catch {
    return FALLBACK_AI_REPLY;
  }
}

export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        content: z.string().trim().min(1).max(4000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Get or create conversation
    let convoId: string | null = null;
    let ownerJoined = false;
    {
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id, owner_joined")
        .eq("user_id", userId)
        .maybeSingle();
      if (existing) {
        convoId = existing.id;
        ownerJoined = existing.owner_joined;
      } else {
        const { data: created, error: cErr } = await supabase
          .from("chat_conversations")
          .insert({ user_id: userId })
          .select("id, owner_joined")
          .single();
        if (cErr || !created) throw new Error(cErr?.message ?? "Could not start conversation");
        convoId = created.id;
        ownerJoined = created.owner_joined;
      }
    }

    // Insert user message
    const { error: uErr } = await supabase.from("chat_messages").insert({
      conversation_id: convoId,
      sender: "user",
      content: data.content,
    });
    if (uErr) throw new Error(uErr.message);

    // AI auto-reply only if owner hasn't joined this conversation yet
    if (!ownerJoined) {
      const aiReply = await generateAiReply(data.content);
      // Use service role to insert AI message (RLS doesn't allow sender='ai' for normal users)
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("chat_messages").insert({
        conversation_id: convoId,
        sender: "ai",
        content: aiReply,
      });
    }

    return { conversationId: convoId };
  });
