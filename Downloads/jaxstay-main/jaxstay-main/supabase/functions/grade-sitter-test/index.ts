// Server-side grading for sitter qualification test
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Authoritative answer key — never sent to client
const ANSWER_KEY = [0, 1, 1, 1, 1, 1, 0, 0];
const TOTAL = ANSWER_KEY.length;
const PASS_THRESHOLD = 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const userResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    });
    if (!userResp.ok) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = await userResp.json();

    const { answers } = await req.json();
    if (!Array.isArray(answers) || answers.length !== TOTAL) {
      return new Response(JSON.stringify({ error: "Invalid answers" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const score = answers.reduce(
      (s: number, a: unknown, i: number) => s + (a === ANSWER_KEY[i] ? 1 : 0),
      0,
    );
    const passed = score >= PASS_THRESHOLD;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    await admin.from("sitter_test_results").insert({
      sitter_id: user.id, score, total: TOTAL, passed,
    });
    if (passed) {
      await admin.from("profiles").update({
        sitter_test_passed_at: new Date().toISOString(),
        is_sitter: true,
      }).eq("id", user.id);
    }

    return new Response(JSON.stringify({ score, total: TOTAL, passed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
