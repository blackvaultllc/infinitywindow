import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import { sfx } from "@/lib/sfx";
import { AlertTriangle, X } from "lucide-react";

/**
 * Full-width Red Alert banner. Flashes across every player's HUD the moment
 * planetary alertLevel crosses into CRITICAL (4) or EXTINCTION (5). The
 * shared game store drives this, so every connected player sees it
 * simultaneously without any separate broadcast plumbing.
 */
export function RedAlertBanner() {
  const { alertLevel, disasters, playerRole } = useGame();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const prevLevel = useRef(alertLevel);
  const lastShownAt = useRef(0);

  useEffect(() => {
    // Only fire on a transition UP into RED ALERT territory
    if (alertLevel >= 4 && prevLevel.current < 4) {
      const now = Date.now();
      // Debounce: don't re-flash within 8s
      if (now - lastShownAt.current > 8000) {
        lastShownAt.current = now;
        setVisible(true);
        setDismissed(false);
        try { sfx.warn?.(); } catch {}
        // Auto-hide after 6s
        const t = setTimeout(() => setVisible(false), 6000);
        return () => clearTimeout(t);
      }
    }
    prevLevel.current = alertLevel;
  }, [alertLevel]);

  if (!visible || dismissed) return null;

  const latest = disasters.filter((d) => !d.resolved).slice(-1)[0];
  const headline =
    alertLevel >= 5 ? "EXTINCTION EVENT" : "CRITICAL — RED ALERT";
  const subhead = latest
    ? `${latest.name.toUpperCase()} — ${latest.region.replace(/-/g, " ").toUpperCase()}`
    : playerRole === "Terra"
    ? "PLANETARY THRESHOLD BREACHED"
    : "ALL OPERATORS RESPOND";

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
      role="alert"
      aria-live="assertive"
    >
      <div
        className="pointer-events-auto flex items-center gap-3 px-4 py-3 sm:py-4"
        style={{
          background:
            "linear-gradient(90deg, rgba(226,75,74,0.95), rgba(160,30,30,0.95), rgba(226,75,74,0.95))",
          borderBottom: "2px solid #fff",
          boxShadow: "0 0 40px rgba(226,75,74,0.9), 0 4px 16px rgba(0,0,0,0.5)",
          animation: "redalert-flash 0.9s ease-in-out infinite alternate",
        }}
      >
        <AlertTriangle size={24} className="shrink-0 text-white drop-shadow" />
        <div className="min-w-0 flex-1">
          <div className="font-display text-sm sm:text-lg tracking-widest text-white drop-shadow">
            {headline}
          </div>
          <div className="text-[11px] sm:text-xs font-mono tracking-wider text-white/90 truncate">
            {subhead}
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 p-2 -m-2 text-white/80 hover:text-white"
          aria-label="Dismiss red alert"
        >
          <X size={20} />
        </button>
      </div>
      <style>{`
        @keyframes redalert-flash {
          from { filter: brightness(1); }
          to   { filter: brightness(1.35); }
        }
      `}</style>
    </div>
  );
}
