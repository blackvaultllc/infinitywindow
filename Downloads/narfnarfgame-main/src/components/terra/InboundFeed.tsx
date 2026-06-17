import { useEffect, useMemo, useState } from "react";
import { joinOpsChannel, type CommsAbilityPayload } from "@/lib/comms";
import { AlertTriangle } from "lucide-react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry } from "geojson";
import worldTopo from "world-atlas/countries-110m.json";
import { REGIONS } from "@/game/data";
import { REGION_LATLON } from "@/lib/geo/regionCountries";

function useRegionXY() {
  return useMemo(() => {
    const land = feature(
      worldTopo as any,
      (worldTopo as any).objects.countries,
    ) as unknown as FeatureCollection<Geometry>;
    const projection = geoNaturalEarth1().fitSize([100, 60], land);
    geoPath(projection);
    const regionXY: Record<string, { x: number; y: number }> = {};
    for (const r of REGIONS) {
      const ll = REGION_LATLON[r.id];
      const p = ll ? projection([ll.lon, ll.lat]) : null;
      regionXY[r.id] = p ? { x: p[0], y: p[1] } : { x: r.x, y: r.y };
    }
    return regionXY;
  }, []);
}

// Listens for Terra's ability broadcasts and renders an overlay of inbound
// trajectories (commander-side situational awareness).
export function InboundFeed({ className = "" }: { className?: string }) {
  const [events, setEvents] = useState<CommsAbilityPayload[]>([]);

  useEffect(() => {
    const ch = joinOpsChannel((p) => {
      setEvents((prev) => [...prev.slice(-4), p]);
      // auto-fade after 12s
      setTimeout(() => {
        setEvents((prev) => prev.filter((e) => e.id !== p.id));
      }, 12000);
    });
    return () => {
      void ch.unsubscribe();
    };
  }, []);

  if (events.length === 0) return null;

  return (
    <div className={`pointer-events-none flex flex-col gap-2 ${className}`}>
      {events.map((e) => (
        <div
          key={e.id}
          className="rounded-lg px-3 py-2 animate-fade-in"
          style={{
            background: "rgba(226,75,74,0.12)",
            border: "1px solid rgba(226,75,74,0.5)",
            boxShadow: "0 0 24px rgba(226,75,74,0.3)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-terra-crimson terra-pulse" />
            <span className="font-mono text-[10px] tracking-widest text-terra-crimson">
              INBOUND · {e.sender.callsign}
            </span>
          </div>
          <div className="font-display text-sm mt-0.5">{e.ability}</div>
          <div className="text-[11px] text-foreground/80">
            Target: <span className="text-terra-amber">{e.targetRegionName}</span> · Intensity L
            {e.intensity}
          </div>
        </div>
      ))}
    </div>
  );
}

// Renders inbound trajectory lines on top of the commander world map (SVG overlay
// at 100x60 viewBox). Listens to ops channel and animates a streak from above
// the canvas down to the target region.
export function InboundTrajectoryLayer({ embedded = false }: { embedded?: boolean } = {}) {
  const [events, setEvents] = useState<CommsAbilityPayload[]>([]);
  const regionXY = useRegionXY();
  useEffect(() => {
    const ch = joinOpsChannel((p) => {
      setEvents((prev) => [...prev.slice(-3), p]);
      setTimeout(() => setEvents((prev) => prev.filter((e) => e.id !== p.id)), 8000);
    });
    return () => {
      void ch.unsubscribe();
    };
  }, []);
  const content = (
    <>
      {events.map((e) => {
        const target = regionXY[e.targetRegion];
        const tx = target?.x ?? e.vector?.toX ?? 50;
        const ty = target?.y ?? e.vector?.toY ?? 30;
        const fx = Math.max(2, Math.min(98, tx - 18));
        const fy = Math.max(2, ty - 18);
        return (
          <g key={e.id}>
            <line
              x1={fx}
              y1={fy}
              x2={tx}
              y2={ty}
              stroke="#E24B4A"
              strokeWidth={0.3}
              strokeDasharray="1 1"
              opacity={0.85}
            />
            <circle cx={tx} cy={ty} r={2.4} fill="none" stroke="#E24B4A" strokeWidth={0.25} className="terra-pulse" />
            <circle cx={tx} cy={ty} r={4.2} fill="none" stroke="#E24B4A" strokeWidth={0.15} opacity={0.5} className="terra-pulse" />
          </g>
        );
      })}
    </>
  );

  if (embedded) return content;

  return (
    <svg viewBox="0 0 100 60" className="absolute inset-0 w-full h-full pointer-events-none">
      {content}
    </svg>
  );
}