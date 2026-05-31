import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

/**
 * EXODIA5 Rubik's cube scene.
 * A 3×3×3 cube of beveled cubies, centered in the viewport,
 * camera pulled back so the cube floats in space.
 */
function Cubie({ position }: { position: [number, number, number] }) {
  // Color faces only on the outer side; inner faces stay dark.
  const [x, y, z] = position;
  const faces = useMemo(() => {
    // order: +x, -x, +y, -y, +z, -z
    const inner = "#0a0a14";
    const right = x === 1 ? "#dc2626" : inner; // red
    const left = x === -1 ? "#ea580c" : inner; // orange
    const top = y === 1 ? "#f5f5f5" : inner; // white
    const bottom = y === -1 ? "#e8b84a" : inner; // gold (yellow)
    const front = z === 1 ? "#22d3ee" : inner; // cyan (blue)
    const back = z === -1 ? "#10b981" : inner; // green
    return [right, left, top, bottom, front, back];
  }, [x, y, z]);

  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[0.96, 0.96, 0.96]} />
      {faces.map((color, i) => (
        <meshStandardMaterial
          key={i}
          attach={`material-${i}`}
          color={color}
          roughness={0.35}
          metalness={0.25}
          emissive={color}
          emissiveIntensity={color === "#0a0a14" ? 0 : 0.08}
        />
      ))}
    </mesh>
  );
}

function RubikCube() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.18;
    groupRef.current.rotation.x += delta * 0.06;
  });

  const cubies: [number, number, number][] = [];
  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        cubies.push([x, y, z]);
      }
    }
  }

  return (
    <group ref={groupRef}>
      {cubies.map((p, i) => (
        <Cubie key={i} position={p} />
      ))}
      {/* subtle outer halo */}
      <mesh scale={2.4}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

export interface RubikSceneProps {
  interactive?: boolean;
  className?: string;
}

export function RubikScene({ interactive = true, className }: RubikSceneProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [5.5, 4, 7], fov: 38 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 8, 5]} intensity={1.1} color="#ffffff" />
        <pointLight position={[-5, -3, -4]} intensity={0.5} color="#a070ff" />

        <Suspense fallback={null}>
          <Stars radius={80} depth={40} count={2500} factor={3} fade speed={0.4} />
          <RubikCube />
        </Suspense>

        {interactive && (
          <OrbitControls
            enablePan={false}
            enableZoom
            minDistance={5}
            maxDistance={18}
            autoRotate={false}
          />
        )}
      </Canvas>
    </div>
  );
}
