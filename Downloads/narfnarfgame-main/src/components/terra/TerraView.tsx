import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { DISASTERS, REGIONS } from "@/game/data";
import type { DisasterCategory } from "@/game/types";
import {
  Wind,
  Mountain,
  Sparkles,
  Flame,
  Bug,
  Zap,
  Waves,
  Hourglass,
  X,
} from "lucide-react";
import { broadcastAbility, makeId } from "@/lib/comms";
import { FrequencyComms } from "./FrequencyComms";
import { Radio } from "lucide-react";
import { sfx, unlockAudio, startAmbientHum } from "@/lib/sfx";
import { EarthGlobe, type ActiveImpact } from "./EarthGlobe";
import { VideoCutscene } from "./VideoCutscene";

const CATS: {
  key: DisasterCategory;
  label: string;
  color: string;
  Icon: typeof Wind;
}[] = [
  { key: "Atmospheric", label: "Atmospheric", color: "#378ADD", Icon: Wind },
  { key: "Geological", label: "Geological", color: "#EF9F27", Icon: Mountain },
  { key: "Cosmic", label: "Cosmic", color: "#7F77DD", Icon: Sparkles },
  { key: "Fire", label: "Fire", color: "#E24B4A", Icon: Flame },
  { key: "Biological", label: "Biological", color: "#1D9E75", Icon: Bug },
  { key: "Electromagnetic", label: "EM", color: "#888780", Icon: Zap },
  { key: "Hydrological", label: "Hydrological", color: "#185FA5", Icon: Waves },
  { key: "SlowBurn", label: "Long-Term", color: "#5F5E5A", Icon: Hourglass },
];

const CAT_COLOR: Record<DisasterCategory, string> = CATS.reduce(
  (acc, c) => ({ ...acc, [c.key]: c.color }),
  {} as Record<DisasterCategory, string>,
);

// Country name per region — used by the on-globe affected-area highlight.
const REGION_COUNTRY: Record<string, string> = {
  "na-west": "United States",
  "na-gulf": "United States",
  "sa-amazon": "Brazil",
  "eu-west": "France",
  "af-sahel": "Niger",
  "me-gulf": "Saudi Arabia",
  "as-south": "India",
  "as-east": "China",
  "oc-aus": "Australia",
  "arc-north": "Arctic Shelf",
};

// NASA Blue Marble equirectangular surface texture (Wikimedia Commons).
const BLUE_MARBLE_URL =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Blue_Marble_2002.png/1280px-Blue_Marble_2002.png";

// Pick a soundtrack for a deployed power.
function playCategorySfx(cat: DisasterCategory) {
  switch (cat) {
    case "Fire":
      sfx.fire();
      break;
    case "Biological":
      sfx.bio();
      break;
    case "Electromagnetic":
      sfx.em();
      break;
    case "Geological":
      sfx.geo();
      break;
    case "Cosmic":
      sfx.cosmic();
      break;
    case "Atmospheric":
      sfx.atmo();
      break;
    case "Hydrological":
      sfx.hydro();
      break;
    case "SlowBurn":
      sfx.slow();
      break;
    default:
      sfx.deploy();
  }
}

function StarField() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d", { alpha: true })!;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let running = true;
    type Star = {
      x: number;
      y: number;
      size: number;
      o: number;
      sp: number;
      ph: number;
      tw: boolean;
    };
    let stars: Star[] = [];
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const build = () => {
      c.width = Math.floor(c.offsetWidth * dpr);
      c.height = Math.floor(c.offsetHeight * dpr);
      // Dense realistic starfield
      const target = Math.floor((c.width * c.height) / 8000);
      const n = Math.min(600, target);
      stars = new Array(n);
      for (let i = 0; i < n; i++) {
        const r = Math.random() * 1.6 * dpr + 0.3;
        stars[i] = {
          x: Math.random() * c.width,
          y: Math.random() * c.height,
          size: Math.max(1, Math.round(r)),
          o: 0.18 + Math.random() * 0.7,
          sp: 0.6 + Math.random() * 1.4,
          ph: Math.random() * Math.PI * 2,
          tw: Math.random() < 0.3,
        };
      }
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.fillStyle = "#fff";
      for (const s of stars) {
        ctx.globalAlpha = s.o;
        ctx.fillRect(s.x, s.y, s.size, s.size);
      }
      ctx.globalAlpha = 1;
    };

    // Throttle animation to ~30fps.
    const frameMs = 1000 / 30;
    let last = 0;
    const tick = (now: number) => {
      if (!running) return;
      if (now - last >= frameMs) {
        last = now;
        const t = now / 1000;
        ctx.clearRect(0, 0, c.width, c.height);
        ctx.fillStyle = "#fff";
        for (const s of stars) {
          const a = s.tw
            ? s.o * (0.55 + 0.45 * Math.sin(t * s.sp + s.ph))
            : s.o;
          ctx.globalAlpha = a;
          ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (raf) return;
      running = true;
      last = 0;
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    build();
    if (reduced) {
      drawStatic();
    } else {
      start();
    }

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        build();
        if (reduced) drawStatic();
      }, 150);
    };
    const onVis = () => {
      if (reduced) return;
      if (document.hidden) stop();
      else start();
    };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
  return (
    <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none" />
  );
}

function Nebula() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 18% 30%, rgba(120,60,180,0.18), transparent 60%)," +
          "radial-gradient(ellipse 50% 35% at 82% 70%, rgba(40,90,200,0.16), transparent 65%)," +
          "radial-gradient(ellipse 70% 50% at 55% 90%, rgba(190,70,80,0.10), transparent 70%)",
        mixBlendMode: "screen",
      }}
    />
  );
}

function SolarSystem() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Sun */}
      <div
        className="absolute"
        style={{
          left: "-80px",
          top: "30%",
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #FFD27A, #EF9F27 50%, #7a4a10 90%)",
          boxShadow:
            "0 0 80px rgba(239,159,39,0.5), 0 0 160px rgba(239,159,39,0.25), 0 0 240px rgba(239,159,39,0.12)",
        }}
      />
      {/* Venus */}
      <div
        className="absolute"
        style={{
          left: "22%",
          top: "12%",
          width: 26,
          height: 26,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #E8E5DA, #B4B2A9 70%, #5a584f)",
          boxShadow: "0 0 14px rgba(180,178,169,0.4)",
        }}
      />
      {/* Moon */}
      <div
        className="absolute"
        style={{
          right: "26%",
          top: "16%",
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #c8c6bd, #888780 70%, #3a3936)",
          boxShadow: "0 0 16px rgba(136,135,128,0.35)",
        }}
      >
        <span
          className="absolute rounded-full"
          style={{ width: 6, height: 6, background: "#5a5953", top: 8, left: 10, opacity: 0.7 }}
        />
        <span
          className="absolute rounded-full"
          style={{ width: 4, height: 4, background: "#5a5953", top: 22, left: 22, opacity: 0.7 }}
        />
        <span
          className="absolute rounded-full"
          style={{ width: 3, height: 3, background: "#5a5953", top: 16, left: 28, opacity: 0.7 }}
        />
      </div>
      {/* Mars */}
      <div
        className="absolute"
        style={{
          right: "10%",
          top: "44%",
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #f06453, #C0392B 60%, #5a1a12)",
          boxShadow: "0 0 14px rgba(192,57,43,0.4)",
        }}
      />
      {/* Saturn */}
      <div className="absolute" style={{ right: "-60px", top: "60%" }}>
        <div style={{ position: "relative", width: 110, height: 110 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "radial-gradient(circle at 35% 35%, #e8b86a, #BA7517 60%, #4a2e08)",
              boxShadow: "0 0 30px rgba(186,117,23,0.4)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "-30%",
              top: "40%",
              width: "160%",
              height: "20%",
              border: "2px solid rgba(186,117,23,0.7)",
              borderRadius: "50%",
              transform: "rotate(-18deg)",
              boxShadow: "0 0 18px rgba(186,117,23,0.3)",
            }}
          />
        </div>
      </div>
      {/* Asteroid */}
      <div
        className="absolute flex items-center gap-2"
        style={{ left: "40%", top: "6%" }}
      >
        <span
          className="block rounded-full"
          style={{ width: 6, height: 6, background: "#6b7785", boxShadow: "0 0 6px #6b7785" }}
        />
        <span
          className="font-mono text-[10px]"
          style={{ color: "rgba(180,200,230,0.4)", letterSpacing: "0.15em" }}
        >
          asteroid
        </span>
      </div>
    </div>
  );
}

function Earth({
  size,
  activeRegions,
}: {
  size: number;
  activeRegions: {
    x: number;
    y: number;
    cat: DisasterCategory;
    regionId: string;
    country: string;
  }[];
}) {
  // Rotation in degrees (0..360). Auto-advances unless the user is dragging.
  const [rot, setRot] = useState(0);
  const dragRef = useRef<{ x: number; rot0: number; active: boolean }>({
    x: 0,
    rot0: 0,
    active: false,
  });
  const lastAutoRef = useRef(performance.now());

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - lastAutoRef.current) / 1000;
      lastAutoRef.current = now;
      if (!dragRef.current.active && !document.hidden) {
        // ~6°/s — slow, planetary feel
        setRot((r) => (r + dt * 6) % 360);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { x: e.clientX, rot0: rot, active: true };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.x;
    // 1px ≈ 0.4° — sensitive but controllable
    setRot((dragRef.current.rot0 - dx * 0.4 + 360) % 360);
    lastAutoRef.current = performance.now();
  };
  const onUp = (e: React.PointerEvent) => {
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    dragRef.current.active = false;
  };

  // Map rotation to a horizontal scroll offset in SVG viewBox units (0..100)
  const off = (rot / 360) * 100;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* axial tilt: rotate the entire sphere ~23.5° */}
      <div
        className="absolute inset-0"
        style={{ transform: "rotate(-23.5deg)", transformOrigin: "center" }}
      >
        {/* outer halos */}
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "0.5px solid rgba(55,138,221,0.08)", transform: "scale(1.18)" }}
        />
        <div
          className="absolute inset-0 rounded-full"
          style={{ border: "1px solid rgba(55,138,221,0.22)", transform: "scale(1.07)" }}
        />
        {/* atmosphere bloom */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            transform: "scale(1.16)",
            background:
              "radial-gradient(circle, transparent 56%, rgba(120,180,255,0.28) 64%, rgba(55,138,221,0.12) 76%, transparent 90%)",
          }}
        />
        {/* sphere — pointer target for drag */}
        <div
          className="absolute inset-0 rounded-full overflow-hidden cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{
            background:
              "radial-gradient(circle at 30% 28%, #4a8fe8 0%, #1B4FA8 36%, #0a2a66 75%, #051a44 100%)",
            boxShadow:
              "inset -22px -30px 60px rgba(0,0,0,0.6), inset 22px 22px 42px rgba(150,200,255,0.18), 0 0 50px rgba(55,138,221,0.3)",
          }}
        >
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <clipPath id="earth-clip">
                <circle cx="50" cy="50" r="50" />
              </clipPath>
              <radialGradient id="cloud-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
              <radialGradient id="ocean-depth" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="rgba(74,143,232,0.0)" />
                <stop offset="80%" stopColor="rgba(5,26,68,0.45)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0.7)" />
              </radialGradient>
            </defs>
            <g clipPath="url(#earth-clip)">
              {/* graticule */}
              <g stroke="rgba(180,210,255,0.1)" strokeWidth={0.2} fill="none">
                {[20, 35, 50, 65, 80].map((cy) => (
                  <ellipse
                    key={`la${cy}`}
                    cx={50}
                    cy={cy}
                    rx={50}
                    ry={cy === 50 ? 50 : (50 - Math.abs(50 - cy)) * 0.95}
                  />
                ))}
              </g>
              {/* NASA Blue Marble equirectangular texture — drawn twice for seamless wrap */}
              <g transform={`translate(${-off} 0)`}>
                <image
                  href={BLUE_MARBLE_URL}
                  x={0}
                  y={0}
                  width={100}
                  height={100}
                  preserveAspectRatio="none"
                  crossOrigin="anonymous"
                />
                <image
                  href={BLUE_MARBLE_URL}
                  x={100}
                  y={0}
                  width={100}
                  height={100}
                  preserveAspectRatio="none"
                  crossOrigin="anonymous"
                />
              </g>
              {/* COUNTRY HIGHLIGHT — colored fill at the affected area, drifts with rotation */}
              {activeRegions.map((r, i) => {
                const lon = (r.x - off + 100) % 100;
                if (lon < 6 || lon > 94) return null;
                const visible = Math.sin((lon / 100) * Math.PI);
                const fill = CAT_COLOR[r.cat];
                return (
                  <g key={`hi-${i}`} opacity={Math.max(0, visible)}>
                    <ellipse
                      cx={lon}
                      cy={r.y * 0.95}
                      rx={6}
                      ry={4}
                      fill={fill}
                      opacity={0.35}
                    />
                    <ellipse
                      cx={lon}
                      cy={r.y * 0.95}
                      rx={4}
                      ry={2.6}
                      fill={fill}
                      opacity={0.55}
                    />
                    <ellipse
                      cx={lon}
                      cy={r.y * 0.95}
                      rx={6}
                      ry={4}
                      fill="none"
                      stroke={fill}
                      strokeWidth={0.35}
                      opacity={0.9}
                    />
                  </g>
                );
              })}
              {/* cloud bands — drift slightly faster than the surface */}
              <g opacity={0.55} transform={`translate(${-off * 1.15} 0)`}>
                <CloudStrip />
                <g transform="translate(100 0)">
                  <CloudStrip />
                </g>
              </g>
              {/* subtle limb darkening */}
              <rect x={0} y={0} width={100} height={100} fill="url(#ocean-depth)" opacity={0.55} />
              {/* specular highlight */}
              <ellipse cx={30} cy={28} rx={20} ry={11} fill="rgba(255,255,255,0.1)" />
            </g>
          </svg>
          {/* SURFACE IMPACT EFFECTS — fire glow, bio wave, EM arc, generic pulse.
              Anchored to lat/long; hidden when the impact rotates to the dark side. */}
          {activeRegions.map((r, i) => {
            const lon = (r.x - off + 100) % 100;
            if (lon < 8 || lon > 92) return null;
            const opacity = Math.min(1, Math.sin((lon / 100) * Math.PI) * 1.2);
            return (
              <SurfaceEffect
                key={`fx-${r.regionId}-${i}`}
                lon={lon}
                lat={r.y * 0.95}
                cat={r.cat}
                country={r.country}
                opacity={opacity}
              />
            );
          })}
          {/* day/night terminator (kept relative to lighting, not tilt) */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                "linear-gradient(105deg, transparent 42%, rgba(0,0,0,0.5) 72%, rgba(0,0,0,0.75) 100%)",
            }}
          />
        </div>
      </div>
      {/* Orbiting satellites (no tilt — sit outside the planet) */}
      <Satellites size={size} />
    </div>
  );
}

function CloudStrip() {
  return (
    <g>
      <ellipse cx="18" cy="20" rx="10" ry="2.5" fill="url(#cloud-grad)" />
      <ellipse cx="34" cy="24" rx="8" ry="2" fill="url(#cloud-grad)" />
      <ellipse cx="60" cy="18" rx="14" ry="2.5" fill="url(#cloud-grad)" />
      <ellipse cx="80" cy="22" rx="9" ry="2" fill="url(#cloud-grad)" />
      <ellipse cx="28" cy="42" rx="14" ry="3" fill="url(#cloud-grad)" />
      <ellipse cx="56" cy="46" rx="16" ry="2.8" fill="url(#cloud-grad)" />
      <ellipse cx="80" cy="54" rx="12" ry="2.8" fill="url(#cloud-grad)" />
      <ellipse cx="14" cy="64" rx="14" ry="3" fill="url(#cloud-grad)" />
      <ellipse cx="44" cy="70" rx="18" ry="3.2" fill="url(#cloud-grad)" />
      <ellipse cx="74" cy="74" rx="14" ry="3" fill="url(#cloud-grad)" />
      <ellipse cx="30" cy="82" rx="12" ry="2.4" fill="url(#cloud-grad)" />
      <ellipse cx="64" cy="84" rx="14" ry="2.6" fill="url(#cloud-grad)" />
    </g>
  );
}

function Satellites({ size }: { size: number }) {
  // Three orbital rings at different tilts/speeds with a satellite dish on each.
  const orbits = [
    { scale: 1.22, tilt: 18, speed: 26, color: "rgba(55,138,221,0.35)" },
    { scale: 1.34, tilt: -28, speed: 38, color: "rgba(125,180,255,0.28)" },
    { scale: 1.46, tilt: 64, speed: 52, color: "rgba(239,159,39,0.3)" },
  ];
  return (
    <div className="absolute inset-0 pointer-events-none">
      {orbits.map((o, i) => (
        <div
          key={i}
          className="absolute inset-0 rounded-full"
          style={{
            border: `0.5px dashed ${o.color}`,
            transform: `scale(${o.scale}) rotate(${o.tilt}deg)`,
          }}
        >
          <div
            className="terra-orbit absolute left-1/2 top-1/2"
            style={
              {
                width: 0,
                height: 0,
                "--orbit-r": `${size * o.scale * 0.5}px`,
                animationDuration: `${o.speed}s`,
              } as React.CSSProperties
            }
          >
            <Satellite color={o.color.replace(/[\d.]+\)$/, "0.95)")} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Satellite({ color }: { color: string }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" style={{ transform: "translate(-9px, -9px)" }}>
      {/* body */}
      <rect x={10} y={10} width={4} height={4} fill={color} />
      {/* solar panels */}
      <rect x={2} y={11} width={7} height={2} fill={color} opacity={0.7} />
      <rect x={15} y={11} width={7} height={2} fill={color} opacity={0.7} />
      {/* dish */}
      <circle cx={12} cy={8} r={2} fill="none" stroke={color} strokeWidth={0.8} />
    </svg>
  );
}

function HealthRing({ size, health, alert }: { size: number; health: number; alert: number }) {
  const stroke = 4;
  const r = size / 2 - stroke;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - health / 100);
  const color = health > 60 ? "#1D9E75" : health > 30 ? "#EF9F27" : "#E24B4A";
  return (
    <svg
      width={size}
      height={size}
      className="absolute pointer-events-none"
      style={{ inset: 0, transform: "scale(1.28)", transformOrigin: "center" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className={alert >= 4 ? "terra-ring-pulse" : ""}
        style={{ color, transition: "stroke-dashoffset 0.6s", filter: `drop-shadow(0 0 8px ${color})` }}
      />
    </svg>
  );
}

const LEVEL_META: Record<number, { label: string; color: string }> = {
  1: { label: "WATCH", color: "#1D9E75" },
  2: { label: "ADVISORY", color: "#378ADD" },
  3: { label: "WARNING", color: "#EF9F27" },
  4: { label: "CRITICAL", color: "#E24B4A" },
  5: { label: "EXTINCTION", color: "#E24B4A" },
};

export function TerraView() {
  const {
    planetaryHealth,
    alertLevel,
    panic,
    disasters,
    round,
    actionsRemaining,
    endRound,
    abandonGame,
    deployDisaster,
    outcome,
  } = useGame();

  const [openCat, setOpenCat] = useState<DisasterCategory | null>(null);
  const [pickName, setPickName] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [pickRegion, setPickRegion] = useState<string | null>(null);
  const [tick, setTick] = useState(15);
  const [commsOpen, setCommsOpen] = useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const prevAlertRef = useRef(alertLevel);
  useEffect(() => {
    if (alertLevel > prevAlertRef.current) sfx.warn();
    prevAlertRef.current = alertLevel;
  }, [alertLevel]);
  const [viewW, setViewW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
  const [viewH, setViewH] = useState(() => (typeof window !== "undefined" ? window.innerHeight : 768));
  useEffect(() => {
    const i = setInterval(() => setTick((t) => (t <= 1 ? 15 : t - 1)), 1000);
    return () => clearInterval(i);
  }, []);
  // Ambient deep-space hum while Terra view is mounted.
  useEffect(() => {
    const stop = startAmbientHum();
    return () => stop();
  }, []);
  useEffect(() => {
    const onR = () => {
      setViewW(window.innerWidth);
      setViewH(window.innerHeight);
    };
    window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  // Earth scales to viewport but stays framed as a globe with visible space.
  const isMobile = viewW < 768;
  const isTablet = viewW >= 768 && viewW < 1024;
  const hudEarthSize = isMobile ? 280 : isTablet ? 420 : 520;

  const active = disasters.filter((d) => !d.resolved);
  const activeRegions = active.map((d) => {
    const reg = REGIONS.find((r) => r.id === d.region)!;
    return {
      x: reg.x,
      y: reg.y + 20,
      cat: d.category,
      regionId: reg.id,
      country: REGION_COUNTRY[reg.id] ?? reg.name,
    };
  });

  // When a new disaster appears, play the alert + the category-specific
  // sound effect. No camera zoom — the planet stays at wide framing.
  const prevActiveCount = useRef(active.length);
  const [cutscene, setCutscene] = useState<{ id: string; cat: DisasterCategory } | null>(null);
  const [focusRegionId, setFocusRegionId] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (active.length > prevActiveCount.current) {
      const latest = active[active.length - 1];
      const reg = REGIONS.find((r) => r.id === latest.region);
      if (reg) {
        sfx.alert();
        setTimeout(() => playCategorySfx(latest.category), 500);
        setFocusRegionId(latest.region);
        window.setTimeout(() => setFocusRegionId(undefined), 6500);
        window.setTimeout(() => setCutscene({ id: latest.id, cat: latest.category }), 950);
        prevActiveCount.current = active.length;
        return;
      }
    }
    prevActiveCount.current = active.length;
  }, [active.length]);

  const impacts: ActiveImpact[] = active.map((d) => ({
    id: d.id,
    regionId: d.region,
    category: d.category,
  }));

  // Keep Earth wide by default; new attacks briefly zoom into the target country.
  const lastImpactIdRef = useRef<string | null>(null);
  useEffect(() => {
    const latest = impacts[impacts.length - 1];
    if (!latest || latest.id === lastImpactIdRef.current) return;
    lastImpactIdRef.current = latest.id;
  }, [impacts]);




  const casualties = active.reduce((a, d) => a + d.casualties, 0);
  const infraAvg =
    active.length === 0
      ? 100
      : Math.round(active.reduce((a, d) => a + d.infrastructureIntact, 0) / active.length);
  const chainRisk =
    active.length === 0
      ? 0
      : Math.round(active.reduce((a, d) => a + d.chainRisk, 0) / active.length);

  const meta = LEVEL_META[alertLevel];
  const healthColor =
    planetaryHealth > 60 ? "#1D9E75" : planetaryHealth > 30 ? "#EF9F27" : "#E24B4A";

  const pickDisasters = useMemo(
    () => (openCat ? DISASTERS.filter((d) => d.category === openCat) : []),
    [openCat],
  );

  const latest = active[active.length - 1];
  const latestRegion = latest ? REGIONS.find((r) => r.id === latest.region) : null;

  const confirmDeploy = () => {
    if (!pickName || !pickRegion) return;
    const reg = REGIONS.find((r) => r.id === pickRegion);
    const def = DISASTERS.find((d) => d.name === pickName);
    unlockAudio();
    if (def) playCategorySfx(def.category);
    else sfx.deploy();
    deployDisaster(pickName, intensity, pickRegion);
    // Broadcast to all commanders on the ops channel.
    if (reg && def) {
      void broadcastAbility({
        kind: "ability",
        id: makeId(),
        sender: { callsign: "TERRA-PRIME", role: "Terra" },
        ability: def.name,
        category: def.category,
        intensity,
        targetRegion: reg.id,
        targetRegionName: reg.name,
        ts: Date.now(),
        vector: {
          fromX: Math.max(2, reg.x - 20 + Math.random() * 10),
          fromY: -5,
          toX: reg.x,
          toY: reg.y,
        },
      });
    }
    setOpenCat(null);
    setPickName(null);
    setPickRegion(null);
    setIntensity(5);
  };

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#03060F" }}
    >
      {alertLevel >= 5 && (
        <div
          className="absolute inset-0 pointer-events-none terra-ring-pulse"
          style={{ boxShadow: "inset 0 0 80px rgba(226,75,74,0.6)" }}
        />
      )}
      <StarField />
      <Nebula />
      <div className="absolute inset-0 z-10 touch-none">
        <EarthGlobe impacts={impacts} focusRegionId={focusRegionId} />
      </div>

      {/* EVE-style scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
          mixBlendMode: "overlay",
        }}
      />

      {/* CUTSCENE — plays uploaded mp4 (per disaster type), then falls through. */}
      {cutscene && (
        <VideoCutscene
          key={cutscene.id}
          powerCategory={cutscene.cat}
          onDone={() => setCutscene(null)}
        />
      )}

      {/* TOP HUD */}
      <div
        className="absolute top-0 left-0 right-0 grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-1.5 px-2 py-2 z-20 md:flex md:justify-between md:px-6 md:py-3"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(3,6,15,0.55)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div className="min-w-0 truncate font-mono text-[10px] tracking-widest md:text-xs" style={{ color: "#378ADD" }}>
          TERRA // PLANET MODE
        </div>
        <button
          onClick={() => {
            if (window.confirm("Leave this match? This counts as a loss and gives the other side the win.")) {
              abandonGame();
            }
          }}
          className="md:hidden shrink-0 rounded border px-2 py-1 font-mono text-[9px] tracking-widest"
          style={{ borderColor: "rgba(226,75,74,0.55)", color: "#E24B4A", background: "rgba(226,75,74,0.12)" }}
        >
          EXIT
        </button>
        <div
          className="flex shrink-0 items-center gap-2 px-2 py-1 rounded font-mono text-[10px] tracking-widest md:px-3 md:text-xs"
          style={{
            background: `${meta.color}22`,
            border: `1px solid ${meta.color}`,
            color: meta.color,
          }}
        >
          {alertLevel >= 3 && (
            <span
              className="terra-pulse rounded-full"
              style={{ width: 8, height: 8, background: meta.color }}
            />
          )}
          L{alertLevel} · {meta.label}
        </div>
        <div className="hidden md:block">
          <ShieldArc value={planetaryHealth} color={healthColor} />
        </div>
      </div>

      {/* LEFT STATS */}
      <div className="absolute left-4 top-20 w-56 space-y-2 z-20 hidden md:block">
        <StatChip label="PANIC" value={`${Math.round(panic)}%`} pct={panic} color="#EF9F27" />
        <StatChip
          label="ACTIVE DISASTERS"
          value={String(active.length)}
          valueColor={active.length > 0 ? "#E24B4A" : undefined}
        />
        <StatChip
          label="CHAIN RISK"
          value={`${chainRisk}%`}
          pct={chainRisk}
          color="#7F77DD"
        />
        <StatChip label="ROUND" value={String(round).padStart(2, "0")} />
        <StatChip label="ACTIONS" value={`${actionsRemaining}/2`} />
      </div>

      {/* RIGHT STATS */}
      <div className="absolute right-4 top-20 w-56 space-y-2 z-20 hidden md:block">
        <StatChip label="CASUALTIES" value={casualties.toLocaleString()} valueColor="#E24B4A" />
        <StatChip
          label="INFRASTRUCTURE"
          value={`${infraAvg}%`}
          pct={infraAvg}
          color="#BA7517"
        />
        <StatChip
          label="HUMAN RESPONSE"
          value={active.length > 0 ? "ACTIVE" : "DORMANT"}
          valueColor={active.length > 0 ? "#1D9E75" : "#888780"}
        />
        <StatChip label="NEXT TICK" value={`00:${String(tick).padStart(2, "0")}`} />
      </div>

      {/* MOBILE STATUS — one compact row, details only when opened */}
      <div
        className="md:hidden absolute top-[45px] left-2 right-2 z-20 rounded-lg"
        style={{
          background: "rgba(3,6,15,0.82)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <button
          type="button"
          onClick={() => setMobileStatsOpen((v) => !v)}
          className="flex min-h-[38px] w-full items-center justify-between gap-2 px-3 font-mono text-[10px] tracking-widest"
          style={{ color: healthColor }}
          aria-expanded={mobileStatsOpen}
        >
          <span>HP {Math.round(planetaryHealth)}%</span>
          <span style={{ color: active.length > 0 ? "#E24B4A" : "#1D9E75" }}>
            {active.length} EVENT{active.length === 1 ? "" : "S"}
          </span>
          <span style={{ color: "#EF9F27" }}>R{String(round).padStart(2, "0")}</span>
        </button>
        {mobileStatsOpen && (
          <div className="grid grid-cols-4 gap-1.5 px-2 pb-2">
            <MiniStat label="PANIC" value={`${Math.round(panic)}`} color="#EF9F27" />
            <MiniStat label="CHAIN" value={`${chainRisk}`} color="#7F77DD" />
            <MiniStat label="ACT" value={`${actionsRemaining}/2`} color="#378ADD" />
            <MiniStat label="TICK" value={`:${String(tick).padStart(2, "0")}`} color="#888780" />
          </div>
        )}
      </div>

      {/* MOBILE ACTIVE EVENT — compact chip, leaves the planet visible */}
      {latest && latestRegion && (
        <div
          className="md:hidden absolute left-2 right-2 z-20 rounded-lg px-3 py-2"
          style={{
            top: mobileStatsOpen ? 132 : 90,
            background: "rgba(3,6,15,0.84)",
            border: "1px solid rgba(226,75,74,0.5)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
          }}
        >
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="terra-pulse shrink-0 rounded-full" style={{ width: 7, height: 7, background: "#E24B4A" }} />
              <span className="truncate font-display text-[11px]" style={{ color: "#E24B4A" }}>{latest.name}</span>
            </div>
            <div className="shrink-0 font-mono text-[9px] text-muted-foreground">
              {latestRegion.name} · {Math.round(latest.structuralDamage)}%
            </div>
          </div>
        </div>
      )}


      {/* ACTIVE EVENT POPUP */}
      {latest && latestRegion && (
        <div
          className="absolute right-4 z-20 w-72 p-3 rounded hidden md:block"
          style={{
            top: 64,
            background: "rgba(3,6,15,0.85)",
            border: "0.5px solid rgba(226,75,74,0.4)",
            boxShadow: "0 0 24px rgba(226,75,74,0.2)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
              ACTIVE EVENT
            </div>
            <span
              className="terra-pulse rounded-full"
              style={{ width: 8, height: 8, background: "#E24B4A" }}
            />
          </div>
          <div className="font-display text-sm mt-1" style={{ color: "#E24B4A" }}>
            {latest.name}
          </div>
          <div className="text-[11px] text-foreground/70 mb-2">{latestRegion.name}</div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>DAMAGE</span>
            <span>{Math.round(latest.structuralDamage)}%</span>
          </div>
          <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full terra-pulse"
              style={{
                width: `${latest.structuralDamage}%`,
                background: "#E24B4A",
                boxShadow: "0 0 10px #E24B4A",
              }}
            />
          </div>
          <div className="mt-2 text-[11px] text-foreground/70">
            Population affected: {latest.populationAffected.toLocaleString()}
          </div>
        </div>
      )}

      {/* MOBILE ACTIONS — compact controls above the power dock */}
      <div
        className="md:hidden absolute left-2 right-2 z-20 grid grid-cols-2 gap-2"
        style={{ bottom: "calc(114px + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={() => setCommsOpen((v) => !v)}
          className="min-h-[34px] rounded-lg border font-mono text-[10px] tracking-widest"
          style={{ borderColor: "#378ADD", color: commsOpen ? "#03060F" : "#378ADD", background: commsOpen ? "#378ADD" : "rgba(3,6,15,0.85)" }}
        >
          FREQ
        </button>
        <button
          onClick={endRound}
          disabled={!!outcome}
          className="min-h-[34px] rounded-lg border font-mono text-[10px] tracking-widest disabled:opacity-40"
          style={{ borderColor: "#E24B4A", color: "#03060F", background: "#E24B4A" }}
        >
          END
        </button>
      </div>

      {/* Health ring removed — keep Earth clean with stars/satellites only. */}


      {/* FLOATING COMMS BUTTON — bottom-left to avoid the END ROUND corner */}
      <button
        onClick={() => setCommsOpen((v) => !v)}
        className="hidden md:flex absolute z-30 rounded-full items-center justify-center transition-all"
        style={{
          left: 12,
          bottom: "calc(100px + env(safe-area-inset-bottom))",
          width: 48,
          height: 48,
          background: commsOpen ? "#378ADD" : "rgba(3,6,15,0.85)",
          border: "1px solid #378ADD",
          color: commsOpen ? "#03060F" : "#378ADD",
          boxShadow: "0 0 20px rgba(55,138,221,0.4)",
        }}
        aria-label="Toggle comms"
      >
        <Radio size={18} />
      </button>

      {/* COMMS PANEL */}
      {commsOpen && (
        <div
          className="absolute z-30"
          style={{
            left: isMobile ? 8 : 12,
            right: isMobile ? 8 : undefined,
            bottom: isMobile ? undefined : "calc(160px + env(safe-area-inset-bottom))",
            width: isMobile ? "auto" : 360,
            height: isMobile ? "min(44vh, 320px)" : 380,
            ...(isMobile
              ? { bottom: "calc(154px + env(safe-area-inset-bottom))" }
              : {}),
          }}
        >
          <FrequencyComms role="Terra" defaultCallsign="TERRA-PRIME" className="h-full" />
        </div>
      )}


      {/* DEPLOY SUB-PANEL */}
      {openCat && (
        <div
          className="absolute left-1/2 z-30 w-[min(720px,92vw)] overflow-y-auto rounded-lg p-3 md:p-4"
          style={{
            bottom: isMobile ? "calc(154px + env(safe-area-inset-bottom))" : 130,
            maxHeight: isMobile ? "min(46vh, 360px)" : undefined,
            transform: "translateX(-50%)",
            background: "rgba(3,6,15,0.92)",
            border: `1px solid ${CAT_COLOR[openCat]}66`,
            boxShadow: `0 0 40px ${CAT_COLOR[openCat]}33`,
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div
              className="font-mono text-xs tracking-widest"
              style={{ color: CAT_COLOR[openCat] }}
            >
              {openCat.toUpperCase()} ARSENAL
            </div>
            <button
              onClick={() => {
                setOpenCat(null);
                setPickName(null);
                setPickRegion(null);
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 max-h-40 overflow-y-auto">
            {pickDisasters.map((d) => (
              <button
                key={d.name}
                onClick={() => setPickName(d.name)}
                className="text-left p-2 rounded text-xs"
                style={{
                  background:
                    pickName === d.name ? `${CAT_COLOR[openCat]}22` : "rgba(255,255,255,0.03)",
                  border: `1px solid ${pickName === d.name ? CAT_COLOR[openCat] : "rgba(255,255,255,0.08)"}`,
                }}
              >
                <div className="font-display">{d.name}</div>
                <div className="text-[10px] text-muted-foreground">
                  Base {d.baseIntensity}{d.chain ? ` · chains → ${d.chain}` : ""}
                </div>
              </button>
            ))}
          </div>

          {pickName && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground">
                  INTENSITY
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensity}
                  onChange={(e) => setIntensity(Number(e.target.value))}
                  className="flex-1 accent-current"
                  style={{ accentColor: CAT_COLOR[openCat] }}
                />
                <div
                  className="font-display text-lg w-8 text-right"
                  style={{ color: CAT_COLOR[openCat] }}
                >
                  {intensity}
                </div>
              </div>
              <div className="mb-3">
                <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1">
                  TARGET REGION
                </div>
                <div className="flex flex-wrap gap-1">
                  {REGIONS.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setPickRegion(r.id)}
                      className="px-2 py-1 rounded text-[11px]"
                      style={{
                        background:
                          pickRegion === r.id
                            ? `${CAT_COLOR[openCat]}33`
                            : "rgba(255,255,255,0.04)",
                        border: `1px solid ${pickRegion === r.id ? CAT_COLOR[openCat] : "rgba(255,255,255,0.08)"}`,
                        color: pickRegion === r.id ? CAT_COLOR[openCat] : "inherit",
                      }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={confirmDeploy}
                disabled={!pickRegion || actionsRemaining <= 0 || !!outcome}
                className="w-full py-2 rounded font-mono text-xs tracking-widest disabled:opacity-40"
                style={{
                  background: CAT_COLOR[openCat],
                  color: "#03060F",
                  boxShadow: `0 0 18px ${CAT_COLOR[openCat]}88`,
                }}
              >
                CONFIRM DEPLOYMENT →
              </button>
            </>
          )}
        </div>
      )}

      {/* FLOATING END ROUND — pinned bottom-right, sits above the power dock */}
      <button
        onClick={endRound}
        disabled={!!outcome}
        className="hidden md:block absolute z-30 px-3 py-2 min-h-[42px] rounded-lg font-mono text-[11px] tracking-widest disabled:opacity-40 font-semibold md:px-4 md:py-3 md:min-h-[48px] md:text-[12px]"
        style={{
          right: 12,
          bottom: isMobile ? "calc(84px + env(safe-area-inset-bottom))" : "calc(96px + env(safe-area-inset-bottom))",
          background: "#E24B4A",
          color: "#03060F",
          boxShadow: "0 0 22px rgba(226,75,74,0.65), 0 6px 16px rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        END ROUND →
      </button>

      {/* BOTTOM DOCK — compact icon grid on mobile, full labels on desktop */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-[env(safe-area-inset-bottom)]">
        <div
          className="grid grid-cols-4 gap-1 px-2 py-2 md:flex md:items-stretch md:justify-center md:gap-3 md:px-4 md:py-4"
          style={{
            background: "linear-gradient(to top, rgba(3,6,15,0.96), rgba(3,6,15,0.78))",
            borderTop: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(14px)",
          }}
        >
          {CATS.map(({ key, label, color, Icon }) => {
            const isOpen = openCat === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setOpenCat(isOpen ? null : key);
                  setPickName(null);
                  setPickRegion(null);
                }}
                className="flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 min-h-[42px] rounded-lg transition-all active:scale-95 md:gap-1 md:px-2 md:py-2 md:min-h-[56px]"
                style={{
                  background: isOpen ? `${color}22` : "rgba(255,255,255,0.04)",
                  border: `1px solid ${color}${isOpen ? "" : "55"}`,
                  color,
                  opacity: isOpen ? 1 : 0.9,
                  boxShadow: isOpen ? `0 0 18px ${color}66` : "none",
                }}
              >
                <Icon size={isMobile ? 18 : 20} />
                <span className="font-mono text-[8px] tracking-wider leading-none truncate w-full text-center md:text-[10px]">
                  {isMobile ? label.slice(0, 4).toUpperCase() : label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}

function StatChip({
  label,
  value,
  pct,
  color,
  valueColor,
}: {
  label: string;
  value: string;
  pct?: number;
  color?: string;
  valueColor?: string;
}) {
  return (
    <div
      className="px-3 py-2 rounded"
      style={{
        background: "rgba(3,6,15,0.85)",
        border: "0.5px solid rgba(255,255,255,0.1)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className="font-mono text-xs"
          style={{ color: valueColor ?? "var(--foreground)" }}
        >
          {value}
        </span>
      </div>
      {pct !== undefined && color && (
        <div className="mt-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full transition-all"
            style={{
              width: `${Math.max(0, Math.min(100, pct))}%`,
              background: color,
              boxShadow: `0 0 8px ${color}`,
            }}
          />
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      className="min-w-0 rounded px-1 py-1.5 font-mono flex flex-col items-center leading-tight"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span className="max-w-full truncate text-muted-foreground tracking-widest text-[8px]">{label}</span>
      <span className="max-w-full truncate text-[12px] font-semibold" style={{ color: color ?? "var(--foreground)" }}>{value}</span>
    </div>
  );
}

/**
 * EVE-style shield arc indicator for PLANETARY HEALTH. Renders a 180° arc
 * with tick marks and the % readout inside; color tracks the health zone.
 */
function ShieldArc({ value, color }: { value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const W = 168;
  const H = 56;
  const cx = W / 2;
  const cy = H - 4;
  const r = 56;
  // 180° arc from (cx-r, cy) to (cx+r, cy)
  const pathD = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const total = Math.PI * r; // length of the half-circle
  const dash = (pct / 100) * total;
  return (
    <div className="relative" style={{ width: W, height: H }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* tick marks */}
        <g stroke="rgba(255,255,255,0.18)" strokeWidth={1}>
          {Array.from({ length: 11 }).map((_, i) => {
            const a = Math.PI - (i / 10) * Math.PI;
            const x1 = cx + Math.cos(a) * (r + 2);
            const y1 = cy - Math.sin(a) * (r + 2);
            const x2 = cx + Math.cos(a) * (r + (i % 5 === 0 ? 8 : 5));
            const y2 = cy - Math.sin(a) * (r + (i % 5 === 0 ? 8 : 5));
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
          })}
        </g>
        {/* track */}
        <path d={pathD} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
        {/* value */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${total}`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dasharray 0.6s" }}
        />
      </svg>
      <div
        className="absolute inset-x-0 bottom-1 text-center font-mono"
        style={{ color, letterSpacing: "0.2em" }}
      >
        <span className="text-[10px] opacity-70">SHIELD</span>{" "}
        <span className="text-[13px] font-semibold">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

// ============================================================
// SurfaceEffect — category-specific visual rendered on the globe
// at the disaster's lat/long. Includes country label above the hit.
// ============================================================
function SurfaceEffect({
  lon,
  lat,
  cat,
  country,
  opacity,
}: {
  lon: number;
  lat: number;
  cat: DisasterCategory;
  country: string;
  opacity: number;
}) {
  const color = CAT_COLOR[cat];
  const common: React.CSSProperties = {
    position: "absolute",
    left: `${lon}%`,
    top: `${lat}%`,
    pointerEvents: "none",
    opacity,
  };

  if (cat === "Fire") {
    return (
      <>
        {/* spreading ember glow */}
        <span
          style={{
            ...common,
            width: 70,
            height: 70,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,180,60,0.85) 0%, rgba(226,75,74,0.65) 35%, rgba(120,20,10,0.2) 70%, transparent 100%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
          className="terra-fire-flicker"
        />
        {/* expanding shockwave ring */}
        <span
          style={{
            ...common,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            boxShadow: `0 0 16px ${color}`,
          }}
          className="terra-ripple"
        />
        <span
          style={{
            ...common,
            width: 26,
            height: 26,
            borderRadius: "50%",
            border: `1.5px solid ${color}`,
            animationDelay: "0.7s",
          }}
          className="terra-ripple"
        />
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "Biological") {
    return (
      <>
        {/* contamination wash */}
        <span
          style={{
            ...common,
            width: 80,
            height: 80,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(29,158,117,0.6) 0%, rgba(29,158,117,0.25) 45%, transparent 80%)",
            filter: "blur(3px)",
            mixBlendMode: "screen",
          }}
        />
        {/* slow expanding wave */}
        <span
          style={{
            ...common,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            boxShadow: `0 0 12px ${color}`,
          }}
          className="terra-bio-wave"
        />
        <span
          style={{
            ...common,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `1.5px solid ${color}`,
            animationDelay: "1.2s",
          }}
          className="terra-bio-wave"
        />
        <span
          style={{
            ...common,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: `1px solid ${color}`,
            animationDelay: "2.4s",
          }}
          className="terra-bio-wave"
        />
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "Electromagnetic") {
    return (
      <>
        {/* electric flash */}
        <span
          style={{
            ...common,
            width: 60,
            height: 60,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(120,200,255,0.95) 0%, rgba(55,138,221,0.6) 30%, rgba(20,50,140,0.15) 60%, transparent 100%)",
            filter: "blur(1px)",
            mixBlendMode: "screen",
          }}
          className="terra-em-flash"
        />
        {/* rotating arc cross */}
        <svg
          width={60}
          height={60}
          viewBox="0 0 60 60"
          className="terra-em-arc"
          style={{ ...common }}
        >
          <g
            stroke={color}
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          >
            <path d="M30,4 L26,18 L34,22 L28,34 L36,38 L30,56" />
            <path d="M4,30 L18,26 L22,34 L34,28 L38,36 L56,30" opacity={0.7} />
          </g>
        </svg>
        {/* outer ripple */}
        <span
          style={{
            ...common,
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px solid ${color}`,
          }}
          className="terra-ripple"
        />
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "Geological") {
    return (
      <>
        {/* shockwave cracks */}
        <svg
          width={70}
          height={70}
          viewBox="-35 -35 70 70"
          style={{ ...common, transform: "translate(-50%, -50%)" }}
        >
          <g stroke="#3a2b1a" strokeWidth={1.2} fill="none" opacity={0.85}>
            <path d="M0 0 L14 -8 L20 -2 L28 -12" />
            <path d="M0 0 L-12 6 L-22 4 L-30 14" />
            <path d="M0 0 L8 14 L4 22 L14 28" />
            <path d="M0 0 L-10 -12 L-6 -22 L-16 -28" />
          </g>
          <circle r={6} fill={color} opacity={0.7} />
        </svg>
        <span
          style={{
            ...common,
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: `2px solid ${color}`,
            boxShadow: `0 0 14px ${color}`,
          }}
          className="terra-ripple"
        />
        <span
          style={{ ...common, width: 22, height: 22, borderRadius: "50%", border: `1.5px solid ${color}`, animationDelay: "0.6s" }}
          className="terra-ripple"
        />
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "Atmospheric") {
    return (
      <>
        {/* white swirling storm */}
        <svg
          width={80}
          height={80}
          viewBox="-40 -40 80 80"
          className="terra-em-arc"
          style={{ ...common }}
        >
          <g fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={1.4} strokeLinecap="round">
            <path d="M0,-22 a22,22 0 0,1 19,11" />
            <path d="M19,11 a22,22 0 0,1 -19,11" opacity={0.7} />
            <path d="M0,22 a22,22 0 0,1 -19,-11" opacity={0.55} />
            <path d="M-12,-6 a14,14 0 0,1 12,-8" opacity={0.7} />
            <path d="M12,6 a14,14 0 0,1 -12,8" opacity={0.55} />
          </g>
          <circle r={3} fill="white" opacity={0.9} />
        </svg>
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "Cosmic") {
    return (
      <>
        {/* bright flash */}
        <span
          style={{
            ...common,
            width: 90,
            height: 90,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,180,255,0.55) 30%, rgba(60,40,90,0.2) 60%, transparent 100%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
          className="terra-em-flash"
        />
        {/* dark crater */}
        <span
          style={{
            ...common,
            width: 18,
            height: 18,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.7)",
            boxShadow: `inset 0 0 8px ${color}, 0 0 10px rgba(0,0,0,0.9)`,
          }}
        />
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "Hydrological") {
    return (
      <>
        {/* flood wave */}
        <span
          style={{
            ...common,
            width: 80,
            height: 80,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(60,140,220,0.7) 0%, rgba(24,95,165,0.35) 50%, transparent 85%)",
            filter: "blur(2px)",
            mixBlendMode: "screen",
          }}
        />
        {[0, 0.7, 1.4].map((d, i) => (
          <span
            key={i}
            style={{
              ...common,
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: `2px solid ${color}`,
              boxShadow: i === 0 ? `0 0 12px ${color}` : undefined,
              animationDelay: `${d}s`,
            }}
            className="terra-bio-wave"
          />
        ))}
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  if (cat === "SlowBurn") {
    return (
      <>
        {/* slow desaturation creep */}
        <span
          style={{
            ...common,
            width: 100,
            height: 100,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(150,150,150,0.45) 0%, rgba(80,80,80,0.25) 50%, transparent 80%)",
            filter: "blur(4px) grayscale(1)",
            mixBlendMode: "multiply",
          }}
        />
        <span
          style={{
            ...common,
            width: 18,
            height: 18,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            border: `1.5px dashed ${color}`,
          }}
          className="terra-pulse"
        />
        <CountryLabel lon={lon} lat={lat} color={color} country={country} />
      </>
    );
  }

  // Fallback colored pulse.
  return (
    <>
      <span
        style={{
          ...common,
          width: 14,
          height: 14,
          marginLeft: -7,
          marginTop: -7,
          borderRadius: "50%",
          border: `2px solid ${color}`,
          background: `${color}55`,
          boxShadow: `0 0 14px ${color}`,
        }}
        className="terra-pulse"
      />
      <CountryLabel lon={lon} lat={lat} color={color} country={country} />
    </>
  );
}

function CountryLabel({
  lon,
  lat,
  color,
  country,
}: {
  lon: number;
  lat: number;
  color: string;
  country: string;
}) {
  return (
    <span
      className="absolute font-mono text-[9px] tracking-widest whitespace-nowrap"
      style={{
        left: `${lon}%`,
        top: `calc(${lat}% - 22px)`,
        transform: "translateX(-50%)",
        color,
        textShadow: "0 0 6px rgba(0,0,0,0.9)",
        pointerEvents: "none",
      }}
    >
      {country.toUpperCase()}
    </span>
  );
}
