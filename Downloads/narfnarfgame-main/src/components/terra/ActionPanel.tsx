import { useState } from "react";
import { ROLE_ACTIONS } from "@/game/data";
import { useGame } from "@/game/store";
import type { Alignment, HumanRole } from "@/game/types";
import { ACTION_CUTSCENES, ActionCutscene } from "./ActionCutscene";
import { X } from "lucide-react";

type PendingAction = { name: string; desc: string; alignment: Alignment };

export function ActionPanel() {
  const { playerRole, performAction, actionsRemaining, endPhase, outcome, phase } = useGame();
  const isTerra = playerRole === "Terra";
  const yourTurn =
    (isTerra && phase === "earth") || (!isTerra && phase === "humans");
  const phaseBtnLabel =
    phase === "resolving"
      ? "RESOLVING…"
      : yourTurn
      ? "END PHASE →"
      : isTerra
      ? "HUMANS PLANNING…"
      : "EARTH STRIKING…";
  const [alignment, setAlignment] = useState<Alignment>("light");
  const [cutscene, setCutscene] = useState<{ src: string; name: string; alignment: Alignment } | null>(null);
  // Preview-first: tapping a card opens a static detail sheet. Cutscene + action
  // only fire when the player explicitly confirms DEPLOY.
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [deckOpen, setDeckOpen] = useState(true);

  const confirmDeploy = () => {
    if (!pending) return;
    const src = ACTION_CUTSCENES[pending.name];
    const p = pending;
    setPending(null);
    if (src) {
      setCutscene({ src, name: p.name, alignment: p.alignment });
    } else {
      performAction(p.name, p.alignment);
    }
  };

  if (!playerRole) return null;

  const DetailSheet = ({ accent }: { accent: string }) => {
    if (!pending) return null;
    const disabled = actionsRemaining <= 0 || !!outcome || !yourTurn;
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-3" onClick={() => setPending(null)}>
        <div
          className="terra-panel rounded-lg p-4 w-full max-w-md"
          style={{ borderColor: accent }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                {pending.alignment === "light" ? "LIGHT ACTION" : "SHADOW ACTION"}
              </div>
              <div className="font-display text-lg" style={{ color: accent }}>{pending.name}</div>
            </div>
            <button onClick={() => setPending(null)} className="text-muted-foreground hover:text-foreground p-2 -m-2" aria-label="Close">
              <X size={18} />
            </button>
          </div>
          <p className="mt-3 text-sm text-foreground/85 leading-relaxed">{pending.desc}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => setPending(null)}
              className="py-3 rounded font-mono text-xs tracking-widest border border-border text-muted-foreground hover:text-foreground min-h-[44px]"
            >
              CANCEL
            </button>
            <button
              onClick={confirmDeploy}
              disabled={disabled}
              className="py-3 rounded font-mono text-xs tracking-widest disabled:opacity-40 min-h-[44px]"
              style={{ background: accent, color: "#03060F", boxShadow: `0 0 18px ${accent}66` }}
            >
              DEPLOY →
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Terra player path
  if (playerRole === "Terra") {
    return (
      <div className="terra-panel rounded-lg p-4">
        <div className="font-display text-xs tracking-widest text-muted-foreground mb-3">
          TERRA · DISASTER DECK
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { name: "Escalate Event", desc: "Intensity +2. Planetary -6." },
            { name: "Trigger Chain", desc: "Chain risk +30%." },
            { name: "New Disaster", desc: "Spawn fresh crisis." },
          ].map((a) => (
            <button
              key={a.name}
              disabled={actionsRemaining <= 0 || !!outcome || !yourTurn}
              onClick={() => setPending({ name: a.name, desc: a.desc, alignment: "shadow" })}
              className="text-left border border-terra-crimson/60 rounded p-3 min-h-[60px] hover:bg-terra-crimson/10 active:scale-[0.98] disabled:opacity-40 transition"
            >
              <div className="font-display text-sm">{a.name}</div>
              <div className="text-[11px] text-muted-foreground">{a.desc}</div>
            </button>
          ))}
        </div>
        <button
          onClick={endPhase}
          disabled={!!outcome || !yourTurn}
          className="mt-3 w-full font-display tracking-widest text-xs py-3 min-h-[44px] rounded bg-terra-crimson text-background terra-glow-red disabled:opacity-40"
        >
          {phaseBtnLabel}
        </button>
        <DetailSheet accent="#E24B4A" />
        {cutscene && (
          <ActionCutscene
            src={cutscene.src}
            onDone={() => {
              const c = cutscene;
              setCutscene(null);
              performAction(c.name, c.alignment);
            }}
          />
        )}
      </div>
    );
  }

  const actions = ROLE_ACTIONS[playerRole as HumanRole][alignment];
  const accent = alignment === "light" ? "#378ADD" : "#E24B4A";
  return (
    <div className="terra-panel rounded-lg p-3 sm:p-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <button
          type="button"
          onClick={() => setDeckOpen((v) => !v)}
          className="min-w-0 text-left"
          aria-expanded={deckOpen}
        >
        <div className="font-display text-xs tracking-widest text-muted-foreground">
          {playerRole.toUpperCase()} · ACTION DECK {deckOpen ? "▲" : "▼"}
        </div>
        </button>
        <div className="flex border border-border rounded overflow-hidden text-[11px] font-display tracking-widest">
          <button
            onClick={() => setAlignment("light")}
            className={`px-3 py-2 min-h-[36px] ${
              alignment === "light" ? "bg-terra-blue text-background" : "text-muted-foreground"
            }`}
          >
            LIGHT
          </button>
          <button
            onClick={() => setAlignment("shadow")}
            className={`px-3 py-2 min-h-[36px] ${
              alignment === "shadow" ? "bg-terra-crimson text-background" : "text-muted-foreground"
            }`}
          >
            SHADOW
          </button>
        </div>
      </div>

      {deckOpen && <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {actions.map((a) => (
          <button
            key={a.name}
            disabled={actionsRemaining <= 0 || !!outcome || !yourTurn}
            onClick={() => setPending({ name: a.name, desc: a.desc, alignment })}
            className={`text-left border rounded p-3 min-h-[64px] disabled:opacity-40 transition active:scale-[0.98] ${
              alignment === "light"
                ? "border-terra-blue/60 hover:bg-terra-blue/10"
                : "border-terra-crimson/60 hover:bg-terra-crimson/10"
            }`}
          >
            <div className="font-display text-sm">{a.name}</div>
            <div className="text-[11px] text-muted-foreground line-clamp-2">{a.desc}</div>
          </button>
        ))}
      </div>}

      <button
        onClick={endPhase}
        disabled={!!outcome || !yourTurn}
        className="mt-3 w-full font-display tracking-widest text-xs py-3 min-h-[44px] rounded bg-primary text-primary-foreground terra-glow-blue disabled:opacity-40"
      >
        {phaseBtnLabel}
      </button>
      <DetailSheet accent={accent} />
      {cutscene && (
        <ActionCutscene
          src={cutscene.src}
          onDone={() => {
            const c = cutscene;
            setCutscene(null);
            performAction(c.name, c.alignment);
          }}
        />
      )}
    </div>
  );
}
