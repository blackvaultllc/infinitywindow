import { useState } from "react";
import { X } from "lucide-react";
import { RoomMap } from "./RoomMap";
import {
  DIRECTIONS,
  WALLS,
  WALL_LABELS,
  useInfinity,
  type Direction,
  type Wall,
} from "./store";

export function MyRoomTab() {
  const {
    activeLocation,
    assignments,
    setWallAssignment,
    assignedCount,
  } = useInfinity();
  const [pickerWall, setPickerWall] = useState<Wall | null>(null);

  const available = activeLocation?.directions ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gold">
          Configure Your Room
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {activeLocation
            ? `Mapping feeds from ${activeLocation.name}.`
            : "Select an active location first to enable directional feeds."}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Room map */}
        <div className="rounded-xl border border-gold/15 bg-card">
          <RoomMap
            assignments={assignments}
            onSlotClick={activeLocation ? setPickerWall : undefined}
          />
          <p className="px-6 pb-5 text-center text-xs text-muted-foreground">
            Click a wall display slot to assign a directional feed.
          </p>
        </div>

        {/* Assignment list */}
        <div className="flex flex-col rounded-xl border border-gold/15 bg-card p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-violet">
            Display Assignment
          </h2>
          <div className="mt-4 space-y-3">
            {WALLS.map((wall) => (
              <div
                key={wall}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-[#0e0e18] px-4 py-3"
              >
                <span className="text-sm font-medium text-foreground">
                  {WALL_LABELS[wall]}
                </span>
                <select
                  value={assignments[wall]}
                  disabled={!activeLocation}
                  onChange={(e) =>
                    setWallAssignment(
                      wall,
                      e.target.value as Direction | "off",
                    )
                  }
                  className="rounded-md border border-gold/30 bg-[#15151f] px-3 py-1.5 text-sm text-foreground outline-none focus:border-gold disabled:opacity-50"
                >
                  <option value="off">Off</option>
                  {DIRECTIONS.map((d) => (
                    <option key={d} value={d} disabled={!available.includes(d)}>
                      {d}
                      {available.includes(d) ? "" : " (unavailable)"}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <p className="mt-4 text-sm font-semibold text-violet">
            Assigned displays: {assignedCount} / 4
          </p>

          <p className="mt-auto pt-6 text-xs italic leading-relaxed text-muted-foreground">
            Each display renders the feed from that compass direction at your
            selected remote location. Your view updates as you move through the
            room.
          </p>
        </div>
      </div>

      {/* Direction picker modal */}
      {pickerWall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPickerWall(null)}
        >
          <div
            className="animate-tab-in w-full max-w-sm rounded-xl border border-gold/30 bg-card p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gold">
                {WALL_LABELS[pickerWall]}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerWall(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick a directional feed for this wall.
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setWallAssignment(pickerWall, "off");
                  setPickerWall(null);
                }}
                className="col-span-4 rounded-md border border-border bg-[#15151f] py-2 text-sm text-muted-foreground hover:border-gold/40"
              >
                Off
              </button>
              {DIRECTIONS.map((d) => {
                const ok = available.includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={!ok}
                    onClick={() => {
                      setWallAssignment(pickerWall, d);
                      setPickerWall(null);
                    }}
                    className={`rounded-md py-2 text-sm font-semibold transition ${
                      ok
                        ? "bg-gold text-[#0a0a12] hover:bg-gold/90"
                        : "cursor-not-allowed bg-[#1a1a26] text-muted-foreground/40"
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
