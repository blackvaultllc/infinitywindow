import { useGame } from "@/game/store";

const LEVEL_META = {
  1: { label: "WATCH", color: "var(--terra-green)" },
  2: { label: "ADVISORY", color: "var(--terra-blue)" },
  3: { label: "WARNING", color: "var(--terra-amber)" },
  4: { label: "CRITICAL", color: "var(--terra-crimson)" },
  5: { label: "EXTINCTION", color: "var(--terra-crimson)" },
} as const;

export function AlertHud() {
  const { alertLevel, planetaryHealth, panic, round, playerRole, shieldActive, actionsRemaining, phase } =
    useGame();
  const meta = LEVEL_META[alertLevel];
  const isTerra = playerRole === "Terra";
  const yourTurn =
    (isTerra && phase === "earth") || (!isTerra && phase === "humans");
  const phaseLabel =
    phase === "resolving"
      ? "BATTLE · RESOLVING"
      : phase === "humans"
      ? "HUMANS · PLANNING"
      : "EARTH · STRIKING";
  const phaseColor =
    phase === "resolving" ? "#EF9F27" : phase === "humans" ? "#52A0E8" : "#E24B4A";
  return (
    <div className="terra-panel rounded-lg px-3 py-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex sm:gap-6 sm:px-4 sm:py-3">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <div
          className="shrink-0 px-2 py-1 rounded font-display text-[10px] tracking-widest sm:px-3 sm:text-xs"
          style={{ backgroundColor: meta.color, color: "#0a0a0f" }}
        >
          L{alertLevel} · {meta.label}
        </div>
        <div className="hidden text-xs text-muted-foreground font-display tracking-widest sm:block">
          ROUND {String(round).padStart(2, "0")}
        </div>
        <div
          className="min-w-0 truncate px-2 py-1 rounded font-display text-[9px] tracking-widest sm:text-[10px]"
          style={{
            border: `1px solid ${phaseColor}`,
            color: phaseColor,
            background: `${phaseColor}1a`,
            boxShadow: yourTurn ? `0 0 14px ${phaseColor}66` : "none",
          }}
          title={yourTurn ? "Your turn" : "Waiting"}
        >
          {phaseLabel}
        </div>
      </div>
      <Meter label="PLANET" value={planetaryHealth} color="var(--terra-green)" warnAt={50} dangerAt={25} />
      <Meter label="PANIC" value={panic} color="var(--terra-amber)" inverse warnAt={50} dangerAt={75} />
      <div className="ml-auto flex shrink-0 items-center gap-1.5 text-[10px] font-display tracking-widest sm:gap-3 sm:text-xs">
        {shieldActive && (
          <span className="text-terra-blue terra-glow-blue rounded px-2 py-1">SHIELD ON</span>
        )}
        <span className="hidden text-muted-foreground sm:inline">ROLE</span>
        <span className="hidden text-foreground sm:inline">{playerRole}</span>
        <span className="text-muted-foreground">ACTIONS</span>
        <span className="text-foreground">{actionsRemaining}/2</span>
      </div>
    </div>
  );
}

function Meter({
  label,
  value,
  color,
  inverse,
  warnAt = 60,
  dangerAt = 30,
}: {
  label: string;
  value: number;
  color: string;
  inverse?: boolean;
  warnAt?: number;
  dangerAt?: number;
}) {
  const v = Math.max(0, Math.min(100, value));
  const bad = inverse ? v >= dangerAt : v <= dangerAt;
  const warn = inverse ? v >= warnAt : v <= warnAt;
  const c = bad ? "var(--terra-crimson)" : warn ? "var(--terra-amber)" : color;
  return (
    <div className="hidden min-w-0 flex-1 sm:block sm:min-w-40">
      <div className="flex justify-between text-[10px] font-display tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(v)}%</span>
      </div>
      <div className="h-1.5 mt-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${v}%`, backgroundColor: c, boxShadow: `0 0 10px ${c}` }}
        />
      </div>
    </div>
  );
}