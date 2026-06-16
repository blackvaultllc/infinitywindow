import { DIRECTIONS, LOCATIONS, useInfinity } from "./store";

export function LocationsTab() {
  const { activeLocation, activeLocationId, setActiveLocation } = useInfinity();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-gold">
          Choose Your View
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a remote location to stream its directional feeds into your room.
        </p>
      </header>

      {activeLocation && (
        <div className="glow-gold animate-tab-in rounded-lg border border-gold/40 bg-gold/10 px-4 py-3 text-sm">
          <span className="font-semibold text-gold">∞ Active Feed:</span>{" "}
          <span className="text-foreground">{activeLocation.name}</span>{" "}
          <span className="text-muted-foreground">
            — {activeLocation.directions.length} directional streams available
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {LOCATIONS.map((loc) => {
          const isActive = loc.id === activeLocationId;
          return (
            <article
              key={loc.id}
              className={`relative flex flex-col rounded-xl border bg-card p-5 transition ${
                isActive ? "border-gold/60 glow-gold" : "border-gold/15"
              }`}
            >
              {isActive && (
                <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-xs font-bold text-[#0a0a12]">
                  Active
                </span>
              )}
              <h2 className="pr-16 text-xl font-semibold text-foreground">
                {loc.name}
              </h2>
              <span className="mt-1 text-xs font-medium uppercase tracking-wider text-violet">
                {loc.region}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {loc.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {DIRECTIONS.map((d) => {
                  const available = loc.directions.includes(d);
                  return (
                    <span
                      key={d}
                      title={available ? "Feed available" : "Unavailable"}
                      className={`flex h-7 w-9 items-center justify-center rounded-md text-xs font-semibold ${
                        available
                          ? "bg-gold text-[#0a0a12]"
                          : "bg-[#1a1a26] text-muted-foreground/50"
                      }`}
                    >
                      {d}
                    </span>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setActiveLocation(loc.id)}
                className={`mt-5 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "border border-gold/50 bg-transparent text-gold"
                    : "bg-gold text-[#0a0a12] hover:bg-gold/90"
                }`}
              >
                {isActive ? "Active Window ✓" : "Set as Active Window"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
