import { useGame } from "@/game/store";

export function PlanetRing() {
  const { planetaryHealth, alertLevel } = useGame();
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const offset = circ * (1 - planetaryHealth / 100);
  const color =
    planetaryHealth > 60
      ? "var(--terra-green)"
      : planetaryHealth > 30
      ? "var(--terra-amber)"
      : "var(--terra-crimson)";
  // crack lines as health drops
  const cracks = planetaryHealth < 60 ? 3 : planetaryHealth < 30 ? 6 : 0;
  return (
    <div className="terra-panel rounded-lg p-4 flex flex-col items-center">
      <div className="font-display text-xs tracking-widest text-muted-foreground mb-2">
        PLANETARY HEALTH
      </div>
      <div className="relative w-44 h-44">
        <svg viewBox="0 0 180 180" className="w-full h-full">
          {/* planet body */}
          <defs>
            <radialGradient id="planet" cx="40%" cy="40%">
              <stop offset="0%" stopColor="oklch(0.42 0.12 250)" />
              <stop offset="100%" stopColor="oklch(0.14 0.04 280)" />
            </radialGradient>
          </defs>
          <circle cx="90" cy="90" r="52" fill="url(#planet)" />
          {/* cracks */}
          {Array.from({ length: cracks }).map((_, i) => {
            const a = (i / cracks) * Math.PI * 2;
            const x = 90 + Math.cos(a) * 30;
            const y = 90 + Math.sin(a) * 30;
            const x2 = 90 + Math.cos(a) * 50;
            const y2 = 90 + Math.sin(a) * 50;
            return (
              <line
                key={i}
                x1={x}
                y1={y}
                x2={x2}
                y2={y2}
                stroke="var(--terra-crimson)"
                strokeWidth="1.2"
                opacity="0.7"
              />
            );
          })}
          {/* ring background */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="oklch(0.30 0.03 260)"
            strokeWidth="6"
          />
          {/* ring fill — no outer drop-shadow pulse; beacon lives INSIDE */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 90 90)"
            style={{ color, transition: "stroke-dashoffset 0.6s" }}
          />
          {/* INNER BEACON — pulses inside the planet, not outside the ring */}
          {alertLevel >= 3 && (
            <circle
              cx="90"
              cy="90"
              r="6"
              fill={color}
              className="terra-pulse"
              style={{ filter: `drop-shadow(0 0 8px ${color})` }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="font-display text-3xl" style={{ color }}>{Math.round(planetaryHealth)}%</div>
          <div className="text-[10px] tracking-widest text-muted-foreground font-display">
            LEVEL {alertLevel}
          </div>
        </div>
      </div>
    </div>
  );
}