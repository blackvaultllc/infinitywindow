import { useEffect, useRef } from "react";
import { useGame } from "@/game/store";
import type { Role } from "@/game/types";

const COLOR: Record<Role | "System", string> = {
  Diplomat: "var(--terra-blue)",
  Commander: "var(--terra-amber)",
  Scientist: "var(--terra-green)",
  Engineer: "var(--terra-blue)",
  Terra: "var(--terra-crimson)",
  System: "var(--muted-foreground)",
};

export function ChatPanel() {
  const chat = useGame((s) => s.chat);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);
  return (
    <div className="terra-panel rounded-lg p-3 h-full flex flex-col">
      <div className="font-display text-xs tracking-widest text-muted-foreground mb-2">
        DIPLOMATIC CHANNEL
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto space-y-2 pr-1">
        {chat.map((m) => (
          <div key={m.id} className="text-[12px] leading-snug">
            <span
              className="font-display tracking-widest text-[10px] mr-1"
              style={{ color: COLOR[m.role] }}
            >
              R{m.round} ·
            </span>
            <span className="text-foreground/90">{m.text}</span>
          </div>
        ))}
        {chat.length === 0 && (
          <div className="text-xs text-muted-foreground">Channel open. No transmissions yet.</div>
        )}
      </div>
    </div>
  );
}