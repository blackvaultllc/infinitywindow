import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Stars, OrbitControls, Sparkles, Html, Line } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import type { DisasterCategory } from "@/game/types";
import {
  loadCountryPolygons,
  REGION_ISO_NUMERIC,
  REGION_COUNTRY_NAME,
  regionLatLon,
} from "@/lib/geo/regionCountries";

const EARTH_RADIUS = 1;

const CAT_COLOR: Record<DisasterCategory, string> = {
  Atmospheric: "#378ADD",
  Geological: "#EF9F27",
  Cosmic: "#7F77DD",
  Fire: "#E24B4A",
  Biological: "#1D9E75",
  Electromagnetic: "#88BFFF",
  Hydrological: "#185FA5",
  SlowBurn: "#9aa3b8",
};

export interface ActiveImpact {
  id: string;
  regionId: string;
  category: DisasterCategory;
}

/* ────────────────────────────────────────────────────────────── helpers ─ */

function latLonToVec3(lat: number, lon: number, r: number): THREE.Vector3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

/* ─────────────────────────────────────────────────────────────── Earth ─ */

function createEarthCanvasTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;

  // Deep ocean base
  const ocean = ctx.createLinearGradient(0, 0, 0, canvas.height);
  ocean.addColorStop(0, "#0a2a5e");
  ocean.addColorStop(0.5, "#0d4f96");
  ocean.addColorStop(1, "#082555");
  ctx.fillStyle = ocean;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle ocean variation
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = i % 2 ? "#1668b8" : "#06214f";
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.ellipse(x, y, 80 + Math.random() * 200, 30 + Math.random() * 80, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const drawLand = (points: [number, number][], color: string) => {
    ctx.beginPath();
    points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };

  // Approximate real continents in equirectangular projection (2048x1024).
  // North America
  drawLand([[180,180],[300,150],[440,160],[520,210],[560,310],[500,400],[420,430],[330,420],[240,360],[180,280]], "#2d7a3a");
  // Central America
  drawLand([[470,440],[520,450],[540,490],[510,520],[475,495]], "#3a8a45");
  // South America
  drawLand([[540,520],[620,510],[660,580],[650,700],[600,820],[560,860],[520,780],[505,650]], "#2a7038");
  // Greenland
  drawLand([[640,120],[720,105],[760,160],[710,205],[650,180]], "#d8e4ee");
  // Europe
  drawLand([[960,220],[1080,205],[1130,240],[1100,290],[1020,300],[970,265]], "#3d8048");
  // Africa
  drawLand([[1000,330],[1130,320],[1200,420],[1180,560],[1100,690],[1030,700],[970,580],[970,440]], "#9a8a3e");
  // Middle East
  drawLand([[1140,300],[1230,295],[1260,360],[1210,395],[1150,370]], "#a89048");
  // Asia
  drawLand([[1130,180],[1380,160],[1620,180],[1740,230],[1720,330],[1600,390],[1440,400],[1280,360],[1180,280]], "#3a7d42");
  // SE Asia / Indonesia
  drawLand([[1560,440],[1660,430],[1720,470],[1680,510],[1580,495]], "#2f7838");
  // India
  drawLand([[1280,360],[1360,360],[1380,440],[1330,490],[1290,440]], "#7a8a3a");
  // Australia
  drawLand([[1640,640],[1800,635],[1850,710],[1780,780],[1660,770],[1610,700]], "#b08a40");
  // Antarctica — thin band only
  ctx.fillStyle = "#e8eef5";
  ctx.fillRect(0, 970, canvas.width, 54);

  // Sparse light cloud whisps
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < 25; i++) {
    const x = Math.random() * canvas.width;
    const y = 80 + Math.random() * (canvas.height - 200);
    ctx.beginPath();
    ctx.ellipse(x, y, 60 + Math.random() * 120, 10 + Math.random() * 18, Math.random() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // North polar ice fade
  const polar = ctx.createLinearGradient(0, 0, 0, 90);
  polar.addColorStop(0, "rgba(232,238,245,0.85)");
  polar.addColorStop(1, "rgba(232,238,245,0)");
  ctx.fillStyle = polar;
  ctx.fillRect(0, 0, canvas.width, 90);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

function EarthMesh() {
  // Build texture synchronously so the first paint already has the map.
  const texture = useMemo(
    () => (typeof document !== "undefined" ? createEarthCanvasTexture() : null),
    [],
  );

  useEffect(() => {
    return () => {
      texture?.dispose();
    };
  }, [texture]);

  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS, 96, 96]} />
      <meshBasicMaterial
        map={texture ?? undefined}
        color={texture ? "#ffffff" : "#0d4f96"}
        toneMapped={false}
      />
    </mesh>
  );
}

function VisibleContinents() {
  const land = [
    { position: [-0.38, 0.22, 0.925], scale: [0.28, 0.44, 1], rotation: 0.35, color: "#28a85a" },
    { position: [-0.12, -0.2, 0.97], scale: [0.18, 0.34, 1], rotation: -0.35, color: "#42bd61" },
    { position: [0.25, 0.12, 0.96], scale: [0.33, 0.2, 1], rotation: -0.1, color: "#72a84b" },
    { position: [0.42, -0.18, 0.89], scale: [0.18, 0.3, 1], rotation: 0.2, color: "#b39a45" },
    { position: [0.02, -0.58, 0.8], scale: [0.55, 0.12, 1], rotation: 0.02, color: "#e7eef8" },
  ];

  return (
    <group>
      {land.map((shape, index) => (
        <mesh
          key={index}
          position={shape.position as [number, number, number]}
          scale={shape.scale as [number, number, number]}
          rotation={[0, 0, shape.rotation]}
        >
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color={shape.color} transparent opacity={0.9} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function EarthTerminator() {
  return (
    <mesh scale={1.006} rotation={[0, 0.35, 0]}>
      <sphereGeometry args={[EARTH_RADIUS, 96, 96, 0, Math.PI * 2, 0, Math.PI]} />
      <meshBasicMaterial
        color="#02040a"
        transparent
        opacity={0.32}
        side={THREE.FrontSide}
        blending={THREE.MultiplyBlending}
        premultipliedAlpha
        depthWrite={false}
      />
    </mesh>
  );
}

function Atmosphere() {
  return (
    <mesh scale={1.05}>
      <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
      <meshBasicMaterial
        color="#5AA9FF"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ─────────────────────────────────────────────────────── Country borders ─ */

function CountryBorders({ iso, color }: { iso: string; color: string }) {
  const [rings, setRings] = useState<THREE.Vector3[][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCountryPolygons().then((polys) => {
      if (cancelled) return;
      const polyRings = polys.get(iso);
      if (!polyRings) return;
      const r = EARTH_RADIUS * 1.005;
      const vec3Rings = polyRings.map((ring) =>
        ring.map(([lon, lat]) => latLonToVec3(lat, lon, r)),
      );
      setRings(vec3Rings);
    });
    return () => {
      cancelled = true;
    };
  }, [iso]);

  if (!rings) return null;

  return (
    <group>
      {rings.map((points, i) => (
        <Line key={i} points={points} color={color} lineWidth={2} transparent opacity={0.95} />
      ))}
    </group>
  );
}

/** Draws every country outline once, NASA-Earth style. */
function AllCountryBorders() {
  const [rings, setRings] = useState<THREE.Vector3[][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadCountryPolygons().then((polys) => {
      if (cancelled) return;
      const r = EARTH_RADIUS * 1.002;
      const all: THREE.Vector3[][] = [];
      polys.forEach((polyRings) => {
        for (const ring of polyRings) {
          all.push(ring.map(([lon, lat]) => latLonToVec3(lat, lon, r)));
        }
      });
      setRings(all);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!rings) return null;

  return (
    <group>
      {rings.map((points, i) => (
        <Line
          key={i}
          points={points}
          color="#9ed3ff"
          lineWidth={0.4}
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      ))}
    </group>
  );
}

/* ────────────────────────────────────────────────── Surface impact FX ──── */

function FireEffect({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const s = 1 + 0.18 * Math.sin(t * 4);
    groupRef.current.scale.set(s, s, s);
  });
  return (
    <group ref={groupRef}>
      {/* glow disc tangent to surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
        <circleGeometry args={[0.12, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
        <ringGeometry args={[0.13, 0.18, 32]} />
        <meshBasicMaterial
          color="#FF7A33"
          transparent
          opacity={0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* ember sparks */}
      <Sparkles
        count={28}
        size={3}
        scale={[0.25, 0.08, 0.25]}
        speed={0.5}
        opacity={0.9}
        color="#FFB060"
      />
    </group>
  );
}

function BioEffect({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const s = 1 + 0.1 * Math.sin(t * 1.6);
    groupRef.current.scale.set(s, s, s);
  });
  return (
    <group ref={groupRef}>
      {/* contamination dome */}
      <mesh position={[0, 0, 0.05]}>
        <sphereGeometry args={[0.13, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* contamination rings */}
      {[0.14, 0.2, 0.27].map((r, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.001 + i * 0.0005]}>
          <ringGeometry args={[r, r + 0.012, 48]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.6 - i * 0.18}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function EMEffect({ color }: { color: string }) {
  const flashRef = useRef<THREE.Mesh>(null);
  const arcRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const flicker = Math.sin(t * 22) > 0.4 ? 1 : 0.25;
    if (flashRef.current) {
      (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.4 + 0.5 * flicker;
    }
    if (arcRef.current) arcRef.current.rotation.z = t * 4;
  });
  return (
    <group>
      {/* central electric flash */}
      <mesh ref={flashRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* expanding ripple ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
        <ringGeometry args={[0.16, 0.18, 64]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {/* rotating arc bolts */}
      <group ref={arcRef}>
        {[0, 1, 2].map((i) => {
          const angle = (i * Math.PI * 2) / 3;
          const pts = makeArcPoints(angle);
          return (
            <Line key={i} points={pts} color={color} lineWidth={2} transparent opacity={0.9} />
          );
        })}
      </group>
    </group>
  );
}

function makeArcPoints(baseAngle: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  const segs = 7;
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const r = 0.04 + 0.18 * t;
    const a = baseAngle + Math.sin(t * Math.PI * 3) * 0.4;
    pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.002));
  }
  return pts;
}

/* ──────────────────────────────────────────────── Per-impact composite ─── */

function ImpactMarker({ impact }: { impact: ActiveImpact }) {
  const { lat, lon } = regionLatLon(impact.regionId);
  const position = useMemo(
    () => latLonToVec3(lat, lon, EARTH_RADIUS * 1.001).toArray(),
    [lat, lon],
  );
  // Orient so the local +Z axis points outward (the "surface up").
  const quaternion = useMemo(() => {
    const normal = new THREE.Vector3(...position).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  }, [position]);

  const color = CAT_COLOR[impact.category];
  const iso = REGION_ISO_NUMERIC[impact.regionId];
  const countryName = REGION_COUNTRY_NAME[impact.regionId] ?? "";

  return (
    <>
      {iso && <CountryBorders iso={iso} color={color} />}
      <group position={position as [number, number, number]} quaternion={quaternion}>
        {impact.category === "Fire" && <FireEffect color={color} />}
        {impact.category === "Biological" && <BioEffect color={color} />}
        {impact.category === "Electromagnetic" && <EMEffect color={color} />}
        {impact.category !== "Fire" &&
          impact.category !== "Biological" &&
          impact.category !== "Electromagnetic" && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.001]}>
              <ringGeometry args={[0.06, 0.08, 32]} />
              <meshBasicMaterial
                color={color}
                transparent
                opacity={0.85}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          )}
        <Html position={[0, 0, 0.08]} center style={{ pointerEvents: "none" }} distanceFactor={3}>
          <div
            className="font-mono text-[10px] tracking-[0.25em] whitespace-nowrap px-2 py-0.5 rounded"
            style={{
              color,
              background: "rgba(3,6,15,0.7)",
              border: `1px solid ${color}80`,
              textShadow: "0 0 6px rgba(0,0,0,0.85)",
            }}
          >
            {countryName.toUpperCase()}
          </div>
        </Html>
      </group>
    </>
  );
}

/* ─────────────────────────────────────────────────────── Distant planets ─ */

function DistantPlanets() {
  return (
    <>
      {/* Sun — lives in the same full-screen 3D scene so no separate square layer is visible. */}
      <mesh position={[-7.5, 1.6, -8]}>
        <sphereGeometry args={[0.72, 48, 48]} />
        <meshBasicMaterial color="#ffb84d" toneMapped={false} />
      </mesh>
      <pointLight position={[-7.5, 1.6, -8]} intensity={0.8} color="#ffb84d" />
      {/* Mars-tone */}
      <mesh position={[-8, 1.5, -10]}>
        <sphereGeometry args={[0.35, 24, 24]} />
        <meshStandardMaterial color="#C0392B" roughness={1} />
      </mesh>
      {/* Saturn-tone with ring */}
      <group position={[10, -2, -14]} rotation={[0.4, 0.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.55, 24, 24]} />
          <meshStandardMaterial color="#BA7517" roughness={1} />
        </mesh>
        <mesh rotation={[Math.PI / 2.2, 0, 0]}>
          <ringGeometry args={[0.7, 1.0, 64]} />
          <meshBasicMaterial color="#d2a05a" transparent opacity={0.55} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Distant moon */}
      <mesh position={[6, 4, -12]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#cfcbb6" roughness={1} />
      </mesh>
    </>
  );
}

/* ───────────────────────────────────────────────────────────── Satellites ─ */

function Satellite({
  radius,
  speed,
  tilt,
  phase,
  color,
}: {
  radius: number;
  speed: number;
  tilt: number;
  phase: number;
  color: string;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + phase;
    ref.current.position.set(
      Math.cos(t) * radius,
      Math.sin(t * 0.5) * Math.sin(tilt) * radius,
      Math.sin(t) * radius * Math.cos(tilt),
    );
    ref.current.rotation.y = -t;
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshStandardMaterial
          color="#dddddd"
          metalness={0.85}
          roughness={0.2}
          emissive={new THREE.Color(color)}
          emissiveIntensity={0.4}
        />
      </mesh>
      {/* solar panels */}
      <mesh position={[0.08, 0, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.06]} />
        <meshStandardMaterial color="#1e2a55" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[-0.08, 0, 0]}>
        <boxGeometry args={[0.1, 0.005, 0.06]} />
        <meshStandardMaterial color="#1e2a55" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

/* ──────────────────────────────────────────────────── Camera focus ─── */

// God-view: camera pulled back so the whole sphere floats in a sea of space.
const DEFAULT_CAM = new THREE.Vector3(0, 0.28, 8.9);
const COMPACT_CAM = new THREE.Vector3(0, 0.28, 5.2);
const FOCUS_DISTANCE = 2.85;

function CameraFocus({
  focusRegionId,
  controlsRef,
  spinRef,
  compact,
}: {
  focusRegionId?: string;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  spinRef: React.MutableRefObject<number>;
  compact?: boolean;
}) {
  const { camera, size } = useThree();
  const baseCam = compact ? COMPACT_CAM : DEFAULT_CAM;
  const target = useRef(new THREE.Vector3().copy(baseCam));
  const tilt = -0.41;
  const viewportCam = useMemo(() => {
    const aspect = size.width / Math.max(1, size.height);
    return aspect < 0.75 ? new THREE.Vector3(0, 0.18, compact ? 6.8 : 11.4) : baseCam;
  }, [size.width, size.height, compact, baseCam]);

  useEffect(() => {
    if (!focusRegionId) {
      target.current.copy(viewportCam);
      return;
    }
    // Focus target is recalculated every frame so it follows the rotating Earth.
  }, [focusRegionId, viewportCam]);

  useFrame(() => {
    if (focusRegionId) {
      const { lat, lon } = regionLatLon(focusRegionId);
      const v = latLonToVec3(lat, lon, FOCUS_DISTANCE);
      v.applyAxisAngle(new THREE.Vector3(0, 1, 0), spinRef.current);
      v.applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
      target.current.copy(v);
    }
    camera.position.lerp(target.current, 0.06);
    camera.lookAt(0, 0, 0);
    const c = controlsRef.current;
    if (c) {
      c.target.set(0, 0, 0);
      c.autoRotate = !focusRegionId;
      c.update();
    }
  });

  return null;
}

/* ──────────────────────────────────────────────────────── Main component ── */

function SpinningEarthGroup({
  impacts,
  spinRef,
}: {
  impacts: ActiveImpact[];
  spinRef: React.MutableRefObject<number>;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, dt) => {
    spinRef.current += dt * 0.06;
    if (groupRef.current) groupRef.current.rotation.y = spinRef.current;
  });

  return (
    <group ref={groupRef} rotation={[0, 0, -0.41]}>
      <EarthMesh />
      <EarthTerminator />
      <AllCountryBorders />
      <Atmosphere />
      {impacts.map((imp) => (
        <ImpactMarker key={imp.id} impact={imp} />
      ))}
    </group>
  );
}

export function EarthGlobe({
  impacts,
  focusRegionId,
  compact = false,
}: {
  impacts: ActiveImpact[];
  focusRegionId?: string;
  /** When true, hide the in-canvas starfield, distant planets, and satellites
   *  so the globe sits cleanly over the page's own background. */
  compact?: boolean;
}) {
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const spinRef = useRef(0);

  const isMobile =
    typeof window !== "undefined" && window.matchMedia?.("(max-width: 768px)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0.28, 11.4], fov: 35 }}
      dpr={isMobile ? [1, 1.5] : [1, 2]}
      gl={{ antialias: !isMobile, alpha: true, powerPreference: "high-performance" }}
      style={{ background: "transparent", width: "100%", height: "100%", display: "block" }}
    >
      <ambientLight intensity={0.22} />
      <directionalLight position={[5, 3, 5]} intensity={0.55} color="#fff4e3" />
      <directionalLight position={[-6, -2, -3]} intensity={0.16} color="#2f73ff" />

      {!compact && (
        <Stars radius={60} depth={40} count={4500} factor={3.5} fade speed={reduced ? 0 : 0.5} />
      )}

      {!compact && (
        <Suspense fallback={null}>
          <DistantPlanets />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <SpinningEarthGroup impacts={impacts} spinRef={spinRef} />
      </Suspense>

      {!compact && (
        <>
          <Satellite radius={1.32} speed={0.35} tilt={0.4} phase={0} color="#9cc6f5" />
          <Satellite radius={1.5} speed={0.22} tilt={-0.6} phase={2.1} color="#EF9F27" />
          <Satellite radius={1.7} speed={0.16} tilt={1.0} phase={4.3} color="#bdf2dc" />
        </>
      )}

      <CameraFocus focusRegionId={focusRegionId} controlsRef={controlsRef} spinRef={spinRef} compact={compact} />

      <OrbitControls
        ref={controlsRef as unknown as React.Ref<OrbitControlsImpl>}
        enablePan={false}
        enableZoom={false}
        autoRotate={!reduced && !focusRegionId}
        autoRotateSpeed={0.55}
        rotateSpeed={0.6}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI - Math.PI / 6}
      />
    </Canvas>
  );
}
