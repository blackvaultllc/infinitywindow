import { useEffect, useState } from "react";
import { listAudit, subscribeAudit, type AuditEvent } from "@/lib/governance/audit";
import { listEntities } from "@/lib/exodia/registry";

export function DiagnosticsPanel() {
  const [events, setEvents] = useState<AuditEvent[]>(listAudit());
  const [tab, setTab] = useState<"audit" | "registry">("audit");

  useEffect(() => subscribeAudit(setEvents), []);

  const entities = listEntities();

  return (
    <div className="h-full flex flex-col font-mono text-xs text-foreground">
      <div className="flex border-b border-neon-cyan/20">
        {(["audit", "registry"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 uppercase tracking-widest text-[10px] ${
              tab === t
                ? "text-neon-cyan border-b border-neon-cyan"
                : "text-muted-foreground hover:text-neon-cyan/70"
            }`}
          >
            {t}
          </button>
        ))}
        <div className="ml-auto px-3 py-1.5 text-[10px] text-muted-foreground">
          {tab === "audit" ? `${events.length} events` : `${entities.length} entities`}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {tab === "audit" &&
          (events.length === 0 ? (
            <div className="text-muted-foreground">// no audit events yet</div>
          ) : (
            events.map((e) => (
              <div key={e.id} className="grid grid-cols-[80px_70px_1fr] gap-2">
                <span className="text-muted-foreground">
                  {new Date(e.at).toLocaleTimeString()}
                </span>
                <span
                  className={
                    e.status === "error"
                      ? "text-neon-crimson"
                      : e.status === "info"
                        ? "text-neon-gold"
                        : "text-neon-cyan"
                  }
                >
                  {e.action}
                </span>
                <span className="text-foreground/80 truncate">
                  {e.target ?? ""}
                  {e.payload ? ` ${JSON.stringify(e.payload)}` : ""}
                </span>
              </div>
            ))
          ))}
        {tab === "registry" &&
          (entities.length === 0 ? (
            <div className="text-muted-foreground">// registry empty</div>
          ) : (
            entities.map((e) => (
              <div key={e.id} className="grid grid-cols-[160px_90px_1fr] gap-2">
                <span className="text-neon-purple">{e.id}</span>
                <span className="text-neon-cyan">{e.type}</span>
                <span className="text-foreground/70 truncate">
                  {e.descriptors.join(",") || "-"} @ {e.lat?.toFixed(2)},{e.lng?.toFixed(2)}
                </span>
              </div>
            ))
          ))}
      </div>
    </div>
  );
}
