import { REGIONS } from "@/game/data";
import { useGame } from "@/game/store";

const ALERT_COLOR: Record<number, string> = {
  1: "var(--terra-green)",
  2: "var(--terra-blue)",
  3: "var(--terra-amber)",
  4: "var(--terra-crimson)",
  5: "var(--terra-crimson)",
};

export function DamagePanel() {
  const { disasters, selectedDisasterId, playerRole, performAction, actionsRemaining } = useGame();
  const dz = disasters.find((d) => d.id === selectedDisasterId);
  if (!dz) {
    return (
      <div className="terra-panel rounded-lg p-4 text-sm text-muted-foreground">
        Select an active event on the map to inspect damage intel.
      </div>
    );
  }
  const region = REGIONS.find((r) => r.id === dz.region);
  const recs = {
    Diplomat: "Issue evacuation order",
    Commander: "Deploy rescue ops",
    Scientist: "Model storm path",
    Engineer: "Activate shields",
  } as const;

  return (
    <div className="terra-panel rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg tracking-wide">{dz.name}</div>
          <div className="text-xs text-muted-foreground">
            {region?.name} · Intensity {dz.intensity}/10 · {dz.category}
          </div>
        </div>
        <div
          className="px-2 py-1 rounded font-display text-[10px] tracking-widest"
          style={{ backgroundColor: ALERT_COLOR[dz.alertLevel], color: "#0a0a0f" }}
        >
          L{dz.alertLevel}
        </div>
      </div>

      <Stat label="Structural Damage" value={dz.structuralDamage} color="var(--terra-crimson)" />
      <Stat label="Infrastructure Intact" value={dz.infrastructureIntact} color="var(--terra-green)" />
      <Stat label="Panic Meter" value={dz.panic} color="var(--terra-amber)" />
      <Stat label="Chain Event Risk" value={dz.chainRisk} color="var(--terra-blue)" />

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Cell label="Population Affected" value={dz.populationAffected.toLocaleString()} />
        <Cell label="Casualties" value={dz.casualties.toLocaleString()} />
        <Cell label="Chain Predicted" value={dz.chainPredicted ?? "—"} />
        <Cell label="Planet Impact" value={`-${Math.round((dz.intensity / 10) * dz.alertLevel * 2)}`} />
      </div>

      <div>
        <div className="font-display text-[10px] tracking-widest text-muted-foreground mb-1">
          ROLE RECOMMENDATIONS
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(recs) as (keyof typeof recs)[]).map((r) => {
            const isYou = playerRole === r;
            return (
              <button
                key={r}
                disabled={!isYou || actionsRemaining <= 0}
                onClick={() => {
                  if (!isYou) return;
                  // map first light action of that role
                  const map: Record<string, string> = {
                    Diplomat: "Evacuate Population",
                    Commander: "Deploy Rescue Ops",
                    Scientist: "Model Storm Path",
                    Engineer: "Activate Shields",
                  };
                  performAction(map[r], "light", dz.region);
                }}
                className={`text-[11px] px-2 py-1 rounded border transition ${
                  isYou
                    ? "border-primary text-foreground hover:bg-primary/20"
                    : "border-border text-muted-foreground"
                }`}
              >
                <span className="opacity-60">{r}:</span> {recs[r]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex justify-between text-[10px] font-display tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span>{Math.round(v)}%</span>
      </div>
      <div className="h-1.5 mt-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full transition-all"
          style={{ width: `${v}%`, backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 rounded px-2 py-1.5">
      <div className="text-[9px] font-display tracking-widest text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}