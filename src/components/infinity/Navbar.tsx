import { Settings } from "lucide-react";

export type TabKey = "locations" | "room" | "live";

const TABS: { key: TabKey; label: string }[] = [
  { key: "room", label: "My Room" },
  { key: "locations", label: "Locations" },
  { key: "live", label: "Live View" },
];

export function Navbar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-gold/15 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-1.5 text-lg font-bold tracking-tight text-gold">
          <span className="text-2xl leading-none">∞</span>
          <span>Infinity Window</span>
        </div>

        <nav className="flex items-center gap-1 sm:gap-3">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => onChange(t.key)}
              className={`relative px-2 py-1 text-sm font-medium transition sm:px-3 ${
                active === t.key
                  ? "text-gold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {active === t.key && (
                <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-gold" />
              )}
            </button>
          ))}
          <button
            type="button"
            aria-label="Settings"
            className="ml-1 text-muted-foreground transition hover:text-gold"
          >
            <Settings size={18} />
          </button>
        </nav>
      </div>
    </header>
  );
}
