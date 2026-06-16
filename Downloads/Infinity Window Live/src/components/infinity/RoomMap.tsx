import type { ReactNode } from "react";
import {
  WALLS,
  WALL_LABELS,
  type Assignments,
  type Wall,
} from "./store";

interface RoomMapProps {
  assignments: Assignments;
  onSlotClick?: (wall: Wall) => void;
  children?: ReactNode;
}

const SLOT_POSITION: Record<Wall, string> = {
  north: "left-1/2 top-2 -translate-x-1/2",
  south: "left-1/2 bottom-2 -translate-x-1/2",
  east: "right-2 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]",
  west: "left-2 top-1/2 -translate-y-1/2 [writing-mode:vertical-rl]",
};

const WALL_TAG: Record<Wall, string> = {
  north: "left-1/2 -top-6 -translate-x-1/2",
  south: "left-1/2 -bottom-6 -translate-x-1/2",
  east: "-right-1 top-1/2 -translate-y-1/2 translate-x-full pl-2",
  west: "-left-1 top-1/2 -translate-y-1/2 -translate-x-full pr-2",
};

export function RoomMap({ assignments, onSlotClick, children }: RoomMapProps) {
  return (
    <div className="mx-auto w-full max-w-sm px-7 py-8">
      <div className="relative aspect-square w-full rounded-xl border border-gold/20 bg-[#0c0c16] [background-image:linear-gradient(to_right,#c9a84c0a_1px,transparent_1px),linear-gradient(to_bottom,#c9a84c0a_1px,transparent_1px)] [background-size:24px_24px]">
        {WALLS.map((wall) => {
          const dir = assignments[wall];
          const assigned = dir !== "off";
          return (
            <div key={wall}>
              <span
                className={`pointer-events-none absolute text-[10px] font-medium uppercase tracking-widest text-muted-foreground ${WALL_TAG[wall]}`}
              >
                {wall}
              </span>
              <button
                type="button"
                disabled={!onSlotClick}
                onClick={() => onSlotClick?.(wall)}
                aria-label={`${WALL_LABELS[wall]} display`}
                className={`absolute flex min-h-9 min-w-9 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold transition ${
                  SLOT_POSITION[wall]
                } ${
                  assigned
                    ? "glow-gold border-gold bg-gold/15 text-gold"
                    : "border-border bg-[#15151f] text-muted-foreground"
                } ${onSlotClick ? "cursor-pointer hover:border-gold/60" : "cursor-default"}`}
              >
                {assigned ? dir : "—"}
              </button>
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}
