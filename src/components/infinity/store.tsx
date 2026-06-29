import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Direction = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
export const DIRECTIONS: Direction[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export type Wall = "north" | "south" | "east" | "west";
export const WALLS: Wall[] = ["north", "south", "east", "west"];
export const WALL_LABELS: Record<Wall, string> = {
  north: "North Wall",
  south: "South Wall",
  east: "East Wall",
  west: "West Wall",
};

export interface InfinityLocation {
  id: string;
  name: string;
  region: string;
  description: string;
  directions: Direction[];
}

export const LOCATIONS: InfinityLocation[] = [
  {
    id: "waimea",
    name: "Waimea Bay, Hawaii",
    region: "Pacific · Hawaii",
    description:
      "Crystal-clear surf breaks over volcanic black sand as trade winds carry the scent of plumeria.",
    directions: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  },
  {
    id: "denali",
    name: "Denali Base Camp, Alaska",
    region: "Arctic · Alaska",
    description:
      "Glacial silence at 14,000 feet; aurora borealis visible after 9pm.",
    directions: ["N", "NE", "NW", "W"],
  },
  {
    id: "sahara",
    name: "Sahara Desert, Morocco",
    region: "North Africa · Morocco",
    description:
      "Endless amber dunes shift under a sky so clear the Milky Way is visible at noon.",
    directions: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  },
  {
    id: "shibuya",
    name: "Shibuya Crossing, Tokyo",
    region: "East Asia · Japan",
    description:
      "10,000 people cross simultaneously every 90 seconds in a choreographed urban ballet.",
    directions: ["E", "SE", "S", "SW"],
  },
  {
    id: "moher",
    name: "Cliffs of Moher, Ireland",
    region: "Atlantic · Ireland",
    description:
      "Atlantic swells crash 700 feet below as sea birds ride the thermal columns.",
    directions: ["N", "NW", "W", "SW"],
  },
  {
    id: "amazon",
    name: "Amazon Canopy, Brazil",
    region: "South America · Brazil",
    description:
      "A living ceiling of 200-foot trees filters light into shafts of gold and green.",
    directions: ["N", "NE", "E", "SE", "S", "SW", "W", "NW"],
  },
];

export type Assignment = Direction | "off";
export type Assignments = Record<Wall, Assignment>;

interface InfinityContextValue {
  activeLocationId: string | null;
  activeLocation: InfinityLocation | null;
  setActiveLocation: (id: string) => void;
  assignments: Assignments;
  setWallAssignment: (wall: Wall, dir: Assignment) => void;
  assignedCount: number;
}

const InfinityContext = createContext<InfinityContextValue | null>(null);

const DEFAULT_ASSIGNMENTS: Assignments = {
  north: "off",
  south: "off",
  east: "off",
  west: "off",
};

export function InfinityProvider({ children }: { children: ReactNode }) {
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignments>(DEFAULT_ASSIGNMENTS);

  const value = useMemo<InfinityContextValue>(() => {
    const activeLocation =
      LOCATIONS.find((l) => l.id === activeLocationId) ?? null;

    const setActiveLocation = (id: string) => {
      setActiveLocationId(id);
      const loc = LOCATIONS.find((l) => l.id === id);
      // Clear assignments that the new location can't provide.
      if (loc) {
        setAssignments((prev) => {
          const next: Assignments = { ...prev };
          (Object.keys(next) as Wall[]).forEach((wall) => {
            const cur = next[wall];
            if (cur !== "off" && !loc.directions.includes(cur)) {
              next[wall] = "off";
            }
          });
          return next;
        });
      }
    };

    const setWallAssignment = (wall: Wall, dir: Assignment) =>
      setAssignments((prev) => ({ ...prev, [wall]: dir }));

    const assignedCount = WALLS.filter((w) => assignments[w] !== "off").length;

    return {
      activeLocationId,
      activeLocation,
      setActiveLocation,
      assignments,
      setWallAssignment,
      assignedCount,
    };
  }, [activeLocationId, assignments]);

  return (
    <InfinityContext.Provider value={value}>{children}</InfinityContext.Provider>
  );
}

export function useInfinity() {
  const ctx = useContext(InfinityContext);
  if (!ctx) throw new Error("useInfinity must be used within InfinityProvider");
  return ctx;
}

/**
 * Compute the viewing-angle offset (degrees, clamped to ±45) for a wall given
 * the normalized viewer position (x, y in 0..1, origin top-left).
 * Negative = viewer is to the left of the wall center, positive = right.
 */
export function wallViewingAngle(wall: Wall, x: number, y: number): number {
  let raw = 0;
  const eps = 0.02;
  switch (wall) {
    case "north":
      raw = Math.atan2(x - 0.5, Math.max(y, eps));
      break;
    case "south":
      raw = Math.atan2(0.5 - x, Math.max(1 - y, eps));
      break;
    case "east":
      raw = Math.atan2(y - 0.5, Math.max(1 - x, eps));
      break;
    case "west":
      raw = Math.atan2(0.5 - y, Math.max(x, eps));
      break;
  }
  const deg = (raw * 180) / Math.PI;
  return Math.max(-45, Math.min(45, Math.round(deg)));
}
