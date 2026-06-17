import { useEffect, useMemo, useRef, useState } from "react";
import {
  FREQUENCIES,
  OWNER_FREQUENCY,
  getStoredIdentity,
  joinFrequencyChannel,
  makeId,
  sendChat,
  setStoredIdentity,
  type CommsPayload,
  type CommsSender,
} from "@/lib/comms";
import { supabase } from "@/integrations/supabase/client";
import { Radio, Send } from "lucide-react";
import type { RealtimeChannel } from "@supabase/supabase-js";

const OWNER_EMAILS = new Set(["blackhatterxvi@gmail.com", "x.xalgorithm@gmail.com"]);

const ROLE_COLOR: Record<CommsSender["role"], string> = {
  Terra: "#E24B4A",
  Commander: "#EF9F27",
  Diplomat: "#378ADD",
  Scientist: "#1D9E75",
  Engineer: "#7F77DD",
  Observer: "#888780",
};

export function FrequencyComms({
  role,
  defaultCallsign,
  compact = false,
  className = "",
}: {
  role: CommsSender["role"];
  defaultCallsign?: string;
  compact?: boolean;
  className?: string;
}) {
  const initial = useMemo(() => {
    const stored = getStoredIdentity();
    return {
      callsign: stored.callsign || defaultCallsign || `${role.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`,
      frequency: stored.frequency,
    };
  }, [defaultCallsign, role]);

  const [callsign, setCallsign] = useState(initial.callsign);
  const [frequency, setFrequency] = useState<number>(initial.frequency);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<CommsPayload[]>([]);
  const [connected, setConnected] = useState(false);
  const [isOwnerCircle, setIsOwnerCircle] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Determine whether this user is allowed on the owner's private frequency.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      const email = (data.user?.email ?? "").toLowerCase();
      if (!cancelled) setIsOwnerCircle(OWNER_EMAILS.has(email));
    });
    return () => { cancelled = true; };
  }, []);

  // Kick non-owners off the owner frequency.
  useEffect(() => {
    if (frequency === OWNER_FREQUENCY && !isOwnerCircle) {
      setFrequency(FREQUENCIES[0]);
    }
  }, [frequency, isOwnerCircle]);

  useEffect(() => {
    setStoredIdentity(callsign, frequency);
  }, [callsign, frequency]);

  useEffect(() => {
    setMessages([]);
    setConnected(false);
    const ch = joinFrequencyChannel(frequency, (p) => {
      setMessages((prev) => [...prev.slice(-99), p]);
    });
    channelRef.current = ch;
    const t = setTimeout(() => setConnected(true), 500);
    return () => {
      clearTimeout(t);
      void ch.unsubscribe();
      channelRef.current = null;
    };
  }, [frequency]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || !channelRef.current) return;
    await sendChat(channelRef.current, {
      kind: "chat",
      id: makeId(),
      sender: { callsign: callsign || "ANON", role },
      text,
      ts: Date.now(),
    });
    setDraft("");
  };

  const roleColor = ROLE_COLOR[role];

  return (
    <div
      className={`flex flex-col rounded-lg ${className}`}
      style={{
        background: "rgba(3,6,15,0.85)",
        border: "1px solid rgba(55,138,221,0.25)",
        boxShadow: "0 0 24px rgba(55,138,221,0.08)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header: tunable frequency */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10">
        <Radio size={14} style={{ color: roleColor }} />
        <span className="font-mono text-[10px] tracking-widest text-muted-foreground">FREQ</span>
        <select
          value={frequency}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (next === OWNER_FREQUENCY && !isOwnerCircle) {
              alert("This frequency is reserved for the owner's family circle.");
              return;
            }
            setFrequency(next);
          }}
          className="bg-transparent font-mono text-xs tracking-widest outline-none"
          style={{ color: roleColor }}
          title="Tune frequency. Earth ↔ humans use the same MHz to talk. Powers/abilities broadcast on ops globally."
        >
          {FREQUENCIES.map((f) => {
            const ownerLocked = f === OWNER_FREQUENCY && !isOwnerCircle;
            return (
              <option key={f} value={f} disabled={ownerLocked} className="bg-[#03060F]">
                {f === OWNER_FREQUENCY ? `👑 ${f.toFixed(1)} MHz · OWNER` : `${f.toFixed(1)} MHz`}
                {ownerLocked ? " (locked)" : ""}
              </option>
            );
          })}
        </select>
        <span
          className="ml-auto rounded-full"
          style={{
            width: 8,
            height: 8,
            background: connected ? "#1D9E75" : "#888780",
            boxShadow: connected ? "0 0 6px #1D9E75" : "none",
          }}
        />
        <input
          value={callsign}
          onChange={(e) => setCallsign(e.target.value.slice(0, 12).toUpperCase())}
          className="w-20 bg-transparent border-b border-white/10 font-mono text-[10px] tracking-widest text-right outline-none focus:border-white/40"
          placeholder="CALLSIGN"
        />
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto px-3 py-2 space-y-1.5 ${compact ? "max-h-48" : "min-h-0"}`}
      >
        {messages.length === 0 && (
          <div className="text-[11px] text-muted-foreground font-mono">
            ── tuned to {frequency.toFixed(1)} MHz · awaiting traffic ──
          </div>
        )}
        {messages.map((m) => {
          if (m.kind === "ability") {
            return (
              <div
                key={m.id}
                className="text-[11px] leading-snug font-mono px-2 py-1 rounded"
                style={{ background: "rgba(226,75,74,0.08)", border: "1px solid rgba(226,75,74,0.3)" }}
              >
                <span className="text-[#E24B4A] tracking-widest">▼ INBOUND</span>{" "}
                <span className="text-foreground/90">
                  {m.ability} → {m.targetRegionName} · L{m.intensity}
                </span>
              </div>
            );
          }
          const c = ROLE_COLOR[m.sender.role] ?? "#888";
          return (
            <div key={m.id} className="text-[12px] leading-snug">
              <span className="font-mono text-[10px] tracking-widest mr-1.5" style={{ color: c }}>
                {m.sender.callsign}
              </span>
              <span className="text-foreground/90">{m.text}</span>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
        className="flex items-center gap-2 px-2 py-2 border-t border-white/10"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Open channel…"
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          maxLength={240}
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="p-1.5 rounded disabled:opacity-30"
          style={{ background: `${roleColor}22`, border: `1px solid ${roleColor}66`, color: roleColor }}
          aria-label="Transmit"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}