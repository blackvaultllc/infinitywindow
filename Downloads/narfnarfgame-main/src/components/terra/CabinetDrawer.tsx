import { useState } from "react";
import { Menu, X, Map, Swords, Radio } from "lucide-react";
import { WorldMap } from "./WorldMap";
import { ActionPanel } from "./ActionPanel";
import { InboundFeed } from "./InboundFeed";
import { useGame } from "@/game/store";

type Tab = "atlas" | "attacks" | "intel";

/**
 * Slide-out cabinet drawer for the human-role HUDs (Diplomat, Commander,
 * Scientist, Engineer). One button opens a side sheet that holds the always-
 * available Atlas, the role's attack deck, and the live intel feed — so
 * mobile players don't have to scroll between stacked panels.
 */
export function CabinetDrawer() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("atlas");
  const { playerRole } = useGame();
  if (!playerRole || playerRole === "Terra") return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed z-40 rounded-full flex items-center justify-center shadow-lg"
        style={{
          left: 12,
          bottom: "calc(76px + env(safe-area-inset-bottom))",
          width: 48,
          height: 48,
          background: "rgba(3,6,15,0.92)",
          border: "1px solid #EF9F27",
          color: "#EF9F27",
          boxShadow: "0 0 22px rgba(239,159,39,0.5)",
        }}
        aria-label="Open cabinet"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-hidden
          />
          <aside
            onClick={(e) => e.stopPropagation()}
            className="relative ml-auto h-full w-[min(420px,92vw)] flex flex-col"
            style={{
              background: "linear-gradient(180deg, #050912, #03060f)",
              borderLeft: "1px solid rgba(239,159,39,0.4)",
              boxShadow: "-12px 0 40px rgba(0,0,0,0.6)",
              animation: "cabinet-slide 0.25s ease-out",
            }}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="font-display text-xs tracking-widest text-foreground">
                {playerRole.toUpperCase()} · CABINET
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-2 -m-2 text-muted-foreground hover:text-foreground"
                aria-label="Close cabinet"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex border-b border-white/10">
              {([
                { id: "atlas", label: "ATLAS", Icon: Map },
                { id: "attacks", label: "ATTACKS", Icon: Swords },
                { id: "intel", label: "INTEL", Icon: Radio },
              ] as { id: Tab; label: string; Icon: typeof Map }[]).map(
                ({ id, label, Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setTab(id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[11px] tracking-widest transition"
                      style={{
                        color: active ? "#EF9F27" : "rgba(200,200,210,0.6)",
                        background: active
                          ? "linear-gradient(180deg, rgba(239,159,39,0.12), transparent)"
                          : "transparent",
                        borderBottom: active
                          ? "2px solid #EF9F27"
                          : "2px solid transparent",
                      }}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  );
                },
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3">
              {tab === "atlas" && (
                <div className="aspect-[100/60]">
                  <WorldMap />
                </div>
              )}
              {tab === "attacks" && <ActionPanel />}
              {tab === "intel" && <InboundFeed />}
            </div>
          </aside>
          <style>{`
            @keyframes cabinet-slide {
              from { transform: translateX(100%); }
              to   { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
