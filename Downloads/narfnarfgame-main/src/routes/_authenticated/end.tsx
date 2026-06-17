import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { ActionCutscene, STABILITY_COLLAPSE_CUTSCENE } from "@/components/terra/ActionCutscene";

export const Route = createFileRoute("/_authenticated/end")({
  head: () => ({
    meta: [
      { title: "Outcome — Narf Narf" },
      { name: "description", content: "Mission outcome — review planetary health, the operator action log, and the final winner of this Narf Narf run." },
      { property: "og:title", content: "Outcome — Narf Narf" },
      { property: "og:description", content: "Mission outcome and after-action review." },
      { property: "og:url", content: "/end" },
    ],
    links: [{ rel: "canonical", href: "/end" }],
  }),
  component: EndPage,
});

function EndPage() {
  const { outcome, round, planetaryHealth, actionsLog, reset } = useGame();
  const navigate = useNavigate();
  const [showCollapse, setShowCollapse] = useState(outcome?.winner === "Terra");

  // Lore progression: each completed match bumps clearance.
  // 1 match → Act II, 5 → Act III, 10 → Act IV.
  useEffect(() => {
    if (!outcome) return;
    try {
      const completed = parseInt(localStorage.getItem("narf.lore.matchesCompleted") ?? "0", 10) + 1;
      localStorage.setItem("narf.lore.matchesCompleted", String(completed));
      const maxAct = completed >= 10 ? 4 : completed >= 5 ? 3 : completed >= 1 ? 2 : 1;
      const prev = parseInt(localStorage.getItem("narf.lore.maxAct") ?? "1", 10);
      if (maxAct > prev) localStorage.setItem("narf.lore.maxAct", String(maxAct));
    } catch {}
  }, [outcome]);

  const winnerColor =
    outcome?.winner === "Terra"
      ? "#E24B4A"
      : outcome?.winner === "Humans"
      ? "#2E7D32"
      : "#EF9F27";

  return (
    <div
      className="fixed inset-0 overflow-y-auto flex flex-col items-center justify-center p-6"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
        {showCollapse && (
          <ActionCutscene
            src={STABILITY_COLLAPSE_CUTSCENE}
            onDone={() => setShowCollapse(false)}
          />
        )}
      <div
        className="rounded-3xl p-8 max-w-md w-full text-center"
        style={{
          background: "rgba(10,14,30,0.78)",
          border: "1px solid rgba(55,138,221,0.35)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="font-display text-xs tracking-[0.4em] text-muted-foreground mb-4">
          TRANSMISSION ENDED
        </div>
        <div
          className="font-display text-4xl md:text-5xl mb-4"
          style={{ color: winnerColor }}
        >
          {outcome ? `${outcome.winner} WINS` : "INCOMPLETE"}
        </div>
        <p className="text-muted-foreground text-sm max-w-md mx-auto">
          {outcome?.summary ?? "Session ended early."}
        </p>
        <div className="grid grid-cols-3 gap-2 mt-6 text-left">
          <Stat label="ROUNDS" value={String(round)} />
          <Stat label="PLANET" value={`${Math.round(planetaryHealth)}%`} />
          <Stat label="ACTIONS" value={String(actionsLog.length)} />
        </div>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={() => {
              reset();
              navigate({ to: "/" });
            }}
            className="font-display tracking-[0.3em] text-xs px-6 py-3 rounded-2xl"
            style={{
              background: "linear-gradient(180deg, #4a8fe8 0%, #1B4FA8 100%)",
              color: "#03060F",
              boxShadow: "0 8px 24px rgba(55,138,221,0.4)",
            }}
          >
            PLAY AGAIN
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ border: "1px solid rgba(55,138,221,0.3)", background: "rgba(0,0,0,0.3)" }}
    >
      <div className="text-[10px] font-display tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-xl">{value}</div>
    </div>
  );
}