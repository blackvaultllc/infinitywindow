import { useMemo } from "react";
import { geoNaturalEarth1, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { FeatureCollection, Geometry, Feature } from "geojson";
import worldTopo from "world-atlas/countries-110m.json";
import { REGIONS } from "@/game/data";
import { useGame } from "@/game/store";
import { REGION_LATLON, REGION_ISO_NUMERIC } from "@/lib/geo/regionCountries";
import { InboundTrajectoryLayer } from "./InboundFeed";

const WIDTH = 100;
const HEIGHT = 60;

function useWorldPaths() {
  return useMemo(() => {
    const land = feature(
      worldTopo as any,
      (worldTopo as any).objects.countries,
    ) as unknown as FeatureCollection<Geometry>;
    const projection = geoNaturalEarth1().fitExtent(
      [
        [0, 0],
        [WIDTH, HEIGHT],
      ],
      land,
    );
    const path = geoPath(projection);
    const countries = land.features
      .map((f) => ({ id: String((f as any).id ?? "").padStart(3, "0"), d: path(f as Feature) }))
      .filter((c): c is { id: string; d: string } => Boolean(c.d));
    for (const f of land.features) {
      const id = String((f as any).id ?? "").padStart(3, "0");
      try {
      } catch {
        /* skip */
      }
    }
    const graticule = path(geoGraticule10()) ?? "";
    const regionXY: Record<string, { x: number; y: number }> = {};
    for (const r of REGIONS) {
      const ll = REGION_LATLON[r.id];
      const p = ll ? projection([ll.lon, ll.lat]) : null;
      regionXY[r.id] = p ? { x: p[0], y: p[1] } : { x: r.x, y: r.y };
    }
    return { countries, graticule, regionXY };
  }, []);
}

export function WorldMap() {
  const { disasters, selectedDisasterId, selectDisaster } = useGame();
  const { countries, graticule, regionXY } = useWorldPaths();
  const activeCount = disasters.filter((d) => !d.resolved).length;
  const now = new Date().toISOString().slice(11, 19) + "Z";

  // Always show the full world map — just highlight the selected disaster's country
  const selected = disasters.find((d) => d.id === selectedDisasterId && !d.resolved);
  const selectedCountryId = selected ? (REGION_ISO_NUMERIC[selected.region] ?? null) : null;
  const viewBox = `0 0 ${WIDTH} ${HEIGHT}`;
  const mapAspectRatio = WIDTH / HEIGHT;

  return (
    <div
      className="terra-panel rounded-xl p-3 sm:p-4 relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 0%, rgba(55,138,221,0.15) 0%, rgba(2,4,12,0.95) 70%)",
        border: "1px solid rgba(55,138,221,0.35)",
        boxShadow: "inset 0 0 60px rgba(55,138,221,0.08), 0 0 24px rgba(0,0,0,0.6)",
      }}
    >
      {/* Command bar */}
      <div className="flex items-center justify-between mb-2 relative z-10">
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full animate-pulse"
            style={{ background: "#E24B4A", boxShadow: "0 0 8px #E24B4A" }}
          />
          <div className="font-display text-[10px] sm:text-xs tracking-[0.3em]" style={{ color: "#9cc6f5" }}>
            GLOBAL THEATER · LIVE FEED
          </div>
        </div>
        <div className="text-[9px] sm:text-[10px] font-mono tracking-widest" style={{ color: "#9cc6f5" }}>
          {activeCount} ACTIVE · {now}
        </div>
      </div>

      {/* Map */}
      <div className="relative w-full" style={{ aspectRatio: String(mapAspectRatio) }}>
        {/* Corner brackets */}
        <Bracket pos="tl" />
        <Bracket pos="tr" />
        <Bracket pos="bl" />
        <Bracket pos="br" />

        <svg
          viewBox={viewBox}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ transition: "all 700ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        >
          <defs>
            <radialGradient id="ocean" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#0a2452" />
              <stop offset="100%" stopColor="#020714" />
            </radialGradient>
            <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(82,160,232,0.55)" />
              <stop offset="100%" stopColor="rgba(27,79,168,0.65)" />
            </linearGradient>
            <pattern id="hud-grid" width="5" height="5" patternUnits="userSpaceOnUse">
              <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(156,198,245,0.08)" strokeWidth="0.08" />
            </pattern>
            <filter id="glow">
              <feGaussianBlur stdDeviation="0.6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Ocean + grid */}
          <rect width={WIDTH} height={HEIGHT} fill="url(#ocean)" />
          <rect width={WIDTH} height={HEIGHT} fill="url(#hud-grid)" />

          {/* Graticule (lat/long lines) */}
          <path d={graticule} fill="none" stroke="rgba(156,198,245,0.12)" strokeWidth="0.08" />

          {/* Real continents — highlight the selected disaster's country */}
          {countries.map((c, i) => {
            const isFocus = selectedCountryId === c.id;
            return (
              <path
                key={i}
                d={c.d}
                fill={isFocus ? "rgba(226,75,74,0.45)" : "url(#land)"}
                stroke={isFocus ? "#E24B4A" : "rgba(156,198,245,0.55)"}
                strokeWidth={isFocus ? 0.25 : 0.12}
              />
            );
          })}

          {/* Region labels — positioned at the actual country location */}
          {REGIONS.map((r) => {
            const p = regionXY[r.id] ?? { x: r.x, y: r.y };
            return (
              <g key={r.id}>
                <circle cx={p.x} cy={p.y} r={0.5} fill="rgba(255,255,255,0.6)" />
                <text
                  x={p.x + 1.2}
                  y={p.y + 0.4}
                  fontSize="1.4"
                  fill="rgba(180,210,245,0.9)"
                  fontFamily="ui-monospace, monospace"
                  style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
                >
                  {r.name}
                </text>
              </g>
            );
          })}

          {/* Active disaster pulses — anchored to projected country coords */}
          {disasters
            .filter((d) => !d.resolved)
            .map((d) => {
              const p = regionXY[d.region];
              if (!p) return null;
              const color = d.alertLevel >= 4 ? "#E24B4A" : d.alertLevel === 3 ? "#EF9F27" : "#52A0E8";
              const selected = d.id === selectedDisasterId;
              return (
                <g key={d.id} onClick={() => selectDisaster(d.id)} style={{ cursor: "pointer" }} filter="url(#glow)">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={d.intensity * 0.35 + 1.4}
                    fill={color}
                    opacity={0.22}
                    className="terra-pulse"
                  />
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={1.1}
                    fill={color}
                    stroke={selected ? "#fff" : "rgba(255,255,255,0.4)"}
                    strokeWidth={selected ? 0.25 : 0.12}
                  />
                </g>
              );
            })}
          <InboundTrajectoryLayer embedded />
        </svg>

        {/* Scanline overlay */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay"
          style={{
            background: "repeating-linear-gradient(to bottom, rgba(156,198,245,0.05) 0 1px, transparent 1px 3px)",
          }}
        />
      </div>
    </div>
  );
}

function Bracket({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const map = {
    tl: "top-1 left-1 border-t border-l",
    tr: "top-1 right-1 border-t border-r",
    bl: "bottom-1 left-1 border-b border-l",
    br: "bottom-1 right-1 border-b border-r",
  } as const;
  return (
    <span
      aria-hidden
      className={`absolute z-10 h-3 w-3 ${map[pos]}`}
      style={{ borderColor: "rgba(156,198,245,0.6)" }}
    />
  );
}
