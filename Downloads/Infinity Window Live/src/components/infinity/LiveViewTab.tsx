import { useCallback, useEffect, useRef, useState } from "react";
import { RoomMap } from "./RoomMap";
import {
  WALLS,
  WALL_LABELS,
  wallViewingAngle,
  useInfinity,
  type Wall,
} from "./store";

interface Pos {
  x: number;
  y: number;
}

const clamp01 = (n: number) => Math.max(0.04, Math.min(0.96, n));

export function LiveViewTab() {
  const { activeLocation, assignments } = useInfinity();
  const [pos, setPos] = useState<Pos>({ x: 0.5, y: 0.5 });
  const dotRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const updateFromClient = useCallback((clientX: number, clientY: number) => {
    const square = dotRef.current?.parentElement;
    if (!square) return;
    const rect = square.getBoundingClientRect();
    setPos({
      x: clamp01((clientX - rect.left) / rect.width),
      y: clamp01((clientY - rect.top) / rect.height),
    });
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (dragging.current) updateFromClient(e.clientX, e.clientY);
    };
    const touchMove = (e: TouchEvent) => {
      if (dragging.current && e.touches[0]) {
        e.preventDefault();
        updateFromClient(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const up = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", touchMove, { passive: false });
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", touchMove);
      window.removeEventListener("touchend", up);
    };
  }, [updateFromClient]);

  const assignedWalls = WALLS.filter((w) => assignments[w] !== "off");
  const angles = assignedWalls.map((w) => wallViewingAngle(w, pos.x, pos.y));
  const avgAngle = angles.length
    ? Math.round(angles.reduce((a, b) => a + b, 0) / angles.length)
    : 0;
  const primaryDir = assignedWalls.length
    ? assignments[assignedWalls[0]]
    : null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gold">
          Simulate Your View
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Drag the gold dot to see how each display's perspective shifts as you
          move.
        </p>
      </header>

      {!activeLocation && (
        <div className="rounded-lg border border-violet/30 bg-violet/10 px-4 py-3 text-sm text-muted-foreground">
          Select an active location and assign displays to simulate your view.
        </div>
      )}

      {/* Room viewer */}
      <div className="rounded-xl border border-gold/15 bg-card">
        <RoomMap assignments={assignments}>
          <div
            ref={dotRef}
            onMouseDown={(e) => {
              e.preventDefault();
              dragging.current = true;
            }}
            onTouchStart={() => {
              dragging.current = true;
            }}
            style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%` }}
            className="glow-gold absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none select-none items-center justify-center rounded-full bg-gold text-[9px] font-bold text-[#0a0a12] active:cursor-grabbing"
          >
            You
          </div>
        </RoomMap>
      </div>

      {/* Current perspective */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet">
          Current Perspective
        </h2>
        {assignedWalls.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No displays assigned yet — configure your room first.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assignedWalls.map((wall) => (
              <PerspectiveCard
                key={wall}
                wall={wall}
                dir={assignments[wall] as string}
                angle={wallViewingAngle(wall, pos.x, pos.y)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Simulated window frame */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-violet">
          Window Frame
        </h2>
        <div className="overflow-hidden rounded-2xl border-4 border-gold/70 bg-[#06060c] p-1 glow-gold">
          <div className="relative h-56 overflow-hidden rounded-xl">
            <div
              className="absolute inset-y-0 -left-1/4 w-[150%] transition-transform duration-200 ease-out"
              style={{
                transform: `translateX(${-(avgAngle / 45) * 18}%)`,
                background:
                  "linear-gradient(to bottom, #1b1740 0%, #3a2f6e 30%, #7f77dd 55%, #c9a84c 80%, #e8c98a 100%)",
              }}
            >
              <div
                className="absolute left-[20%] top-[22%] h-20 w-20 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, #ffe9b0 0%, #c9a84c 45%, transparent 70%)",
                }}
              />
              <div className="absolute bottom-0 h-1/3 w-full bg-[#0a0a12]/40 [mask-image:linear-gradient(to_top,black,transparent)]" />
            </div>
          </div>
        </div>
        <p className="mt-2 text-center text-sm text-gold">
          ∞ {activeLocation ? activeLocation.name : "No location"}
          {primaryDir ? ` · ${primaryDir} feed` : ""}
        </p>
      </section>
    </div>
  );
}

function PerspectiveCard({
  wall,
  dir,
  angle,
}: {
  wall: Wall;
  dir: string;
  angle: number;
}) {
  const pct = 50 + (angle / 45) * 50;
  return (
    <div className="rounded-xl border border-gold/15 bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">
          {WALL_LABELS[wall]}
        </span>
        <span className="text-xs font-medium text-violet">Viewing: {dir} feed</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Viewing angle:{" "}
        <span className="font-semibold text-gold">
          {angle > 0 ? "+" : ""}
          {angle}° offset
        </span>
      </p>
      <div className="relative mt-3 h-2 w-full rounded-full bg-[#1a1a26]">
        <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-muted-foreground/40" />
        <div
          className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-gold"
          style={{
            left: `${Math.min(50, pct)}%`,
            width: `${Math.abs(pct - 50)}%`,
          }}
        />
        <div
          className="glow-gold absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}
