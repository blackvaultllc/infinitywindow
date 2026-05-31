import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { registerScene, type SceneAction } from "@/lib/scene-bus";

type Marker = { id: string; lat: number; lng: number; label: string; color: string };
type Satellite = { id: string; name: string; phase: number; radius: number; tilt: number };

function latLngToVec3(lat: number, lng: number, r = 1.02) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

function EarthMesh({
  rotationSpeed,
  layer,
}: {
  rotationSpeed: number;
  layer: "day" | "night" | "wireframe";
}) {
  const ref = useRef<THREE.Mesh>(null);
  const atmoRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * rotationSpeed;
    if (atmoRef.current) atmoRef.current.rotation.y += delta * rotationSpeed * 0.6;
  });

  const color = layer === "night" ? "#0a1a3a" : layer === "wireframe" ? "#00ffff" : "#1e4d8b";
  const emissive = layer === "night" ? "#00ffff" : "#0a1a3a";

  return (
    <group>
      {/* Earth core */}
      <mesh ref={ref}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={layer === "night" ? 0.4 : 0.15}
          wireframe={layer === "wireframe"}
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      {/* Continent dot pattern using icosahedron wireframe */}
      <mesh>
        <icosahedronGeometry args={[1.005, 4]} />
        <meshBasicMaterial
          color="#00f0ff"
          wireframe
          transparent
          opacity={layer === "wireframe" ? 0 : 0.18}
        />
      </mesh>
      {/* Atmosphere */}
      <mesh ref={atmoRef} scale={1.12}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#4cc9ff"
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Outer glow */}
      <mesh scale={1.25}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#7a5cff"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function MarkerPin({ marker }: { marker: Marker }) {
  const base = useMemo(() => latLngToVec3(marker.lat, marker.lng, 1.0), [marker]);
  const dir = useMemo(() => base.clone().normalize(), [base]);
  const groupRef = useRef<THREE.Group>(null);
  const beamRef = useRef<THREE.Mesh>(null);

  // Orient the spike outward from the Earth's surface
  const quaternion = useMemo(() => {
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return q;
  }, [dir]);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    const dist = camera.position.distanceTo(base);
    // Scale spike length with distance so it stays visible when zoomed out
    const s = THREE.MathUtils.clamp(dist * 0.08, 0.04, 6);
    groupRef.current.scale.set(1, s, 1);
    if (beamRef.current) {
      const bs = THREE.MathUtils.clamp(dist * 0.004, 0.01, 0.3);
      beamRef.current.scale.set(bs, 1, bs);
    }
  });

  return (
    <group position={base} quaternion={quaternion}>
      {/* Spike that sticks straight out of the surface */}
      <group ref={groupRef}>
        <mesh ref={beamRef} position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
          <meshBasicMaterial color={marker.color} transparent opacity={0.9} />
        </mesh>
      </group>
      {/* Glowing pin head */}
      <mesh position={dir.clone().multiplyScalar(0.05)}>
        <sphereGeometry args={[0.025, 16, 16]} />
        <meshBasicMaterial color={marker.color} />
      </mesh>
      <Html distanceFactor={8} center position={dir.clone().multiplyScalar(0.12)}>
        <div className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan whitespace-nowrap pointer-events-none drop-shadow-[0_0_4px_rgba(0,240,255,0.8)]">
          {marker.label}
        </div>
      </Html>
    </group>
  );
}

function SatelliteBody({ sat }: { sat: Satellite }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.elapsedTime * 0.4 + sat.phase;
    ref.current.position.set(
      Math.cos(t) * sat.radius,
      Math.sin(t * 0.6) * sat.tilt,
      Math.sin(t) * sat.radius,
    );
  });
  return (
    <group ref={ref}>
      <mesh>
        <boxGeometry args={[0.04, 0.04, 0.04]} />
        <meshBasicMaterial color="#ffd166" />
      </mesh>
      <Html distanceFactor={8} center>
        <div className="font-mono text-[9px] uppercase text-neon-gold whitespace-nowrap pointer-events-none">
          ◇ {sat.name}
        </div>
      </Html>
    </group>
  );
}

function CameraDirector({ target }: { target: THREE.Vector3 | null }) {
  const { camera } = useThree();
  useFrame(() => {
    if (!target) return;
    camera.position.lerp(target, 0.04);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export interface EarthSceneProps {
  interactive?: boolean;
  className?: string;
  initialRotationSpeed?: number;
}

export function EarthScene({
  interactive = true,
  className,
  initialRotationSpeed = 0.05,
}: EarthSceneProps) {
  const [rotationSpeed, setRotationSpeed] = useState(initialRotationSpeed);
  const [layer, setLayer] = useState<"day" | "night" | "wireframe">("day");
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [sats, setSats] = useState<Satellite[]>([]);
  const [camTarget, setCamTarget] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    return registerScene((action: SceneAction) => {
      switch (action.type) {
        case "rotate":
          setRotationSpeed(action.speed);
          break;
        case "marker":
          setMarkers((m) => [
            ...m,
            {
              id: crypto.randomUUID(),
              lat: action.lat,
              lng: action.lng,
              label: action.label,
              color: action.color ?? "#00f0ff",
            },
          ]);
          break;
        case "focus": {
          const target = latLngToVec3(action.lat, action.lng, 3).multiplyScalar(1);
          setCamTarget(target);
          break;
        }
        case "layer":
          setLayer(action.mode);
          break;
        case "satellite":
          setSats((s) => [
            ...s,
            {
              id: crypto.randomUUID(),
              name: action.name,
              phase: Math.random() * Math.PI * 2,
              radius: 1.6 + Math.random() * 0.6,
              tilt: (Math.random() - 0.5) * 0.6,
            },
          ]);
          break;
        case "clear":
          setMarkers([]);
          setSats([]);
          setCamTarget(null);
          break;
        case "zoom":
          setCamTarget(new THREE.Vector3(0, 0, action.distance));
          break;
      }
    });
  }, []);

  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }} dpr={[1, 2]}>
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 3, 5]} intensity={1.2} color="#bcd9ff" />
        <pointLight position={[-4, -2, -3]} intensity={0.6} color="#a070ff" />

        <Suspense fallback={null}>
          <Stars radius={80} depth={40} count={4000} factor={4} fade speed={0.5} />
          <EarthMesh rotationSpeed={rotationSpeed} layer={layer} />
          {markers.map((m) => (
            <MarkerPin key={m.id} marker={m} />
          ))}
          {sats.map((s) => (
            <SatelliteBody key={s.id} sat={s} />
          ))}
        </Suspense>

        <CameraDirector target={camTarget} />
        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={1.15}
            maxDistance={200}
            autoRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
}
