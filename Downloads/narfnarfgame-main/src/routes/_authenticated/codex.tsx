import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/codex")({
  head: () => ({
    meta: [
      { title: "Codex — Narf Narf" },
      { name: "description", content: "Lore archive for the Narf Narf universe — unlocked entries, faction history, and the canon behind the Planet vs Humans war." },
      { property: "og:title", content: "Codex — Narf Narf" },
      { property: "og:description", content: "Lore archive for the Narf Narf universe." },
      { property: "og:url", content: "/codex" },
      { property: "og:type", content: "article" },
    ],
    links: [{ rel: "canonical", href: "/codex" }],
  }),
  component: CodexPage,
});

function CodexPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from("codex_entries").select("*").order("sort"),
        auth.user
          ? supabase.from("player_codex").select("entry_slug").eq("user_id", auth.user.id)
          : Promise.resolve({ data: [] } as any),
      ]);
      setEntries((all as any[]) ?? []);
      setUnlocked(new Set(((mine as any[]) ?? []).map((m) => m.entry_slug)));
      const first = ((all as any[]) ?? []).find((e) => unlocked.has(e.slug))?.slug ?? ((all as any[]) ?? [])[0]?.slug;
      setSel(first ?? null);
    })();
  }, []);

  const selected = entries.find((e) => e.slug === sel);

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-8"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0a1e4a 0%, #050a1f 60%, #02040c 100%)" }}
    >
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="font-mono text-[10px] tracking-[0.3em] text-muted-foreground hover:text-foreground">← BACK</Link>
        <div className="mt-3 mb-5">
          <div className="font-mono text-[10px] tracking-[0.35em]" style={{ color: "#378ADD" }}>SIS · ARCHIVE</div>
          <h1 className="font-display text-3xl tracking-tight">CODEX</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-[220px_1fr]">
          <ul className="space-y-1">
            {entries.map((e) => {
              const got = unlocked.has(e.slug);
              return (
                <li key={e.slug}>
                  <button
                    onClick={() => got && setSel(e.slug)}
                    disabled={!got}
                    className="w-full text-left rounded-lg px-3 py-2 text-[12px] transition disabled:opacity-40"
                    style={{
                      background: sel === e.slug ? "rgba(55,138,221,0.15)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${sel === e.slug ? "rgba(55,138,221,0.6)" : "rgba(255,255,255,0.08)"}`,
                    }}
                  >
                    <div className="font-mono text-[9px] tracking-widest text-muted-foreground">{e.category.toUpperCase()}</div>
                    <div>{got ? e.title : "🔒 LOCKED"}</div>
                  </button>
                </li>
              );
            })}
          </ul>
          <div
            className="rounded-2xl p-5"
            style={{ background: "rgba(8,16,40,0.6)", border: "1px solid rgba(55,138,221,0.25)" }}
          >
            {selected && unlocked.has(selected.slug) ? (
              <>
                <div className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#EF9F27" }}>{selected.category.toUpperCase()}</div>
                <h2 className="mt-1 font-display text-2xl">{selected.title}</h2>
                <p className="mt-4 text-foreground/80 leading-relaxed">{selected.body}</p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Unlock entries by progressing the story.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}