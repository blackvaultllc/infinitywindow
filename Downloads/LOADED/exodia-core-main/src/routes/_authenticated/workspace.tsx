import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { RubikScene } from "@/components/rubik-scene";
import { dispatchScene, type SceneAction } from "@/lib/scene-bus";
import {
  sendCommand,
  loadHistory,
  saveKnowledge,
} from "@/lib/terminal.functions";
import { listNotes, upsertNote, deleteNote } from "@/lib/notes.functions";
import { supabase } from "@/integrations/supabase/client";
import { runExodia } from "@/lib/exodia/simulator";
import { FloatingWindow } from "@/components/window/floating-window";
import { DiagnosticsPanel } from "@/components/diagnostics-panel";
import { audit } from "@/lib/governance/audit";
import { useIsMobile } from "@/hooks/use-mobile";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: WorkspacePage,
  head: () => ({
    meta: [
      { title: "Workspace — EXODIA5 Reality Engine" },
      {
        name: "description",
        content: "EXODIA5 operator workspace: interactive Earth scene, command terminal, and diagnostics for the reality engine.",
      },
      { property: "og:title", content: "Workspace — EXODIA5 Reality Engine" },
      {
        property: "og:description",
        content: "Operate the EXODIA reality engine from a governed spatial workspace.",
      },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type Msg = { id: string; role: "user" | "assistant"; content: string };
type Note = {
  id: string;
  title: string;
  body: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
};

function WorkspacePage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [diagOpen, setDiagOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const termScrollRef = useRef<HTMLDivElement>(null);

  const send = useServerFn(sendCommand);
  const load = useServerFn(loadHistory);
  const save = useServerFn(saveKnowledge);
  const list = useServerFn(listNotes);
  const upsert = useServerFn(upsertNote);
  const del = useServerFn(deleteNote);

  // Try fullscreen on mount (desktop only — phones reject it)
  useEffect(() => {
    if (isMobile) return;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }, [isMobile]);

  // Capture the signed-in user for the "private room" badge.
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  // Load history + notes
  useEffect(() => {
    load()
      .then((r) => {
        setMessages(
          (r.messages as Msg[]).filter(
            (m) => m.role === "user" || m.role === "assistant",
          ),
        );
      })
      .catch(() => {});
    list()
      .then((r) => setNotes(r.notes as Note[]))
      .catch(() => {});
  }, [load, list]);

  useEffect(() => {
    termScrollRef.current?.scrollTo({
      top: termScrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const runSlash = (raw: string): boolean => {
    const [cmd, ...rest] = raw.trim().slice(1).split(/\s+/);
    const args = rest.join(" ");
    const append = (content: string) =>
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content },
      ]);

    switch (cmd) {
      case "help":
        append(
          "Commands: /rotate <speed> · /marker <lat> <lng> <label> · /focus <lat> <lng> · /layer <day|night|wireframe> · /satellite <name> · /clear · /zoom <distance> · /note <text> · /define <topic> · /wiki <topic> · /search <query>",
        );
        return true;
      case "rotate":
        dispatchScene({ type: "rotate", speed: Number(rest[0]) || 0.05 });
        append(`◇ Rotation speed ⇒ ${rest[0]}`);
        return true;
      case "marker": {
        const [lat, lng, ...label] = rest;
        dispatchScene({
          type: "marker",
          lat: Number(lat),
          lng: Number(lng),
          label: label.join(" ") || "MARKER",
        });
        append(`◇ Marker dropped @ ${lat},${lng}`);
        return true;
      }
      case "focus":
        dispatchScene({
          type: "focus",
          lat: Number(rest[0]),
          lng: Number(rest[1]),
        });
        append(`◇ Focusing on ${rest[0]},${rest[1]}`);
        return true;
      case "layer":
        dispatchScene({
          type: "layer",
          mode: (rest[0] as "day" | "night" | "wireframe") || "day",
        });
        append(`◇ Layer ⇒ ${rest[0]}`);
        return true;
      case "satellite":
        dispatchScene({ type: "satellite", name: args || "SAT" });
        append(`◇ Satellite ${args} in orbit`);
        return true;
      case "clear":
        dispatchScene({ type: "clear" });
        append("◇ Scene purged");
        return true;
      case "zoom":
        dispatchScene({ type: "zoom", distance: Number(rest[0]) || 3 });
        append(`◇ Zoom ⇒ ${rest[0]}`);
        return true;
      case "note":
        spawnNote(args || "New note").catch(() => {});
        append(`◇ Note materialized`);
        return true;
      default:
        return false; // fall through to AI
    }
  };

  const spawnNote = async (title: string) => {
    const r = await upsert({
      data: {
        title,
        body: "",
        x: 80 + Math.random() * 200,
        y: 120 + Math.random() * 100,
        w: 320,
        h: 240,
        z: notes.length + 1,
      },
    });
    setNotes((n) => [...n, r.note as Note]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");

    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "user", content: text },
    ]);

    // EXODIA reality engine takes precedence with `//` prefix
    if (text.startsWith("//")) {
      const r = runExodia(text);
      audit("command", {
        target: text.split(/\s+/)[0],
        status: r.kind === "error" ? "error" : "ok",
        payload: { input: text },
      });
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: r.display },
      ]);
      return;
    }

    if (text.startsWith("/") && runSlash(text)) {
      audit("scene", { target: text.split(/\s+/)[0], payload: { input: text } });
      return;
    }

    setBusy(true);
    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));
      const res = await send({ data: { prompt: text, history } });
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: res.text },
      ]);
      try {
        const actions = JSON.parse(res.actionsJson) as SceneAction[];
        actions.forEach(dispatchScene);
      } catch {
        /* ignore */
      }
      // Persist knowledge for knowledge-style prompts
      if (/^(\/define|\/wiki|\/search|\/load)/i.test(text)) {
        const [, source, ...topic] = text.match(/^\/(\w+)\s+(.*)/) || [];
        if (source) {
          await save({
            data: {
              source: `/${source}`,
              topic: topic.join(" ").slice(0, 200),
              content: res.text,
            },
          }).catch(() => {});
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI link error");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const terminalBody = (
    <div className="h-full flex flex-col">
      <div
        ref={termScrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs space-y-2"
      >
        {messages.length === 0 && (
          <div className="text-muted-foreground space-y-2 leading-relaxed">
            <div className="text-neon-cyan">
              👋 Hi! I'm EXODIA — your guide.
            </div>
            <div>Type something in plain words. Try one of these:</div>
            <ul className="list-disc list-inside space-y-0.5 opacity-90">
              <li>"Show me Paris on the cube"</li>
              <li>"Spin the cube faster"</li>
              <li>"Drop a pin on Tokyo"</li>
              <li>"Tell me a fun fact about whales"</li>
            </ul>
            <div className="opacity-60 text-[10px] uppercase tracking-widest pt-1">
              Tip: I'll always tell you what I just did, in one short sentence.
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user"
                ? "text-neon-purple"
                : "text-neon-cyan whitespace-pre-wrap"
            }
          >
            <span className="opacity-60">
              {m.role === "user" ? "▸ " : "◇ "}
            </span>
            {m.content}
          </div>
        ))}
        {busy && (
          <div className="text-neon-cyan/70">
            ◇ <span className="animate-blink">▮</span>
          </div>
        )}
      </div>
      <div className="flex items-center border-t border-neon-cyan/20 px-3">
        <span className="font-mono text-xs text-neon-gold mr-2">▸</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="enter command or query…"
          aria-label="Terminal command input"
          className="flex-1 bg-transparent py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={busy}
          className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan border border-neon-cyan/40 px-3 py-1.5 hover:bg-neon-cyan/10 disabled:opacity-40"
        >
          send
        </button>
      </div>
    </div>
  );

  return (
    <main className="fixed inset-0 bg-background overflow-hidden">
      {/* Rubik's cube fills the entire viewport */}
      <div className="absolute inset-0 z-0">
        <RubikScene className="h-full w-full" />
      </div>

      <div className="absolute inset-0 cyber-grid opacity-10 pointer-events-none z-[1]" />

      {/* Top HUD */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between gap-2 p-3 sm:p-4 pointer-events-none">
        <div className="pointer-events-auto min-w-0">
          <h1 className="font-display text-base sm:text-lg text-neon-cyan text-glow-cyan truncate">
            EXODIA<span className="text-neon-purple">5</span>
            <span className="hidden sm:inline font-mono text-[10px] ml-3 text-muted-foreground tracking-widest uppercase">
              // cube view
            </span>
          </h1>
          <div className="font-mono text-[9px] uppercase tracking-widest text-neon-gold/70 truncate">
            ◆ private room — locked to {userEmail ?? "you"}
          </div>
        </div>
        <div className="flex items-center gap-2 pointer-events-auto flex-shrink-0">
          {!isMobile && (
            <>
              <button
                onClick={() => spawnNote("New Note")}
                className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/80 border border-neon-cyan/40 px-3 py-1.5 hover:bg-neon-cyan/10"
              >
                + note
              </button>
              <button
                onClick={() => setDiagOpen((v) => !v)}
                className="font-mono text-[10px] uppercase tracking-widest text-neon-gold/80 border border-neon-gold/40 px-3 py-1.5 hover:bg-neon-gold/10"
              >
                {diagOpen ? "▾ diag" : "▸ diag"}
              </button>
            </>
          )}
          <Link
            to="/games"
            className="font-mono text-[10px] uppercase tracking-widest text-neon-gold/80 border border-neon-gold/40 px-2.5 py-1.5 hover:bg-neon-gold/10"
          >
            🎮 {isMobile ? "" : "games"}
          </Link>
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="font-mono text-[10px] uppercase tracking-widest text-neon-crimson/80 border border-neon-crimson/40 px-2.5 py-1.5 hover:bg-neon-crimson/10"
          >
            ◂ {isMobile ? "out" : "logout"}
          </button>
        </div>
      </header>

      {/* Notes layer — desktop only (drag windows don't work well on touch) */}
      {!isMobile &&
        notes.map((n) => (
          <NoteWindow
            key={n.id}
            note={n}
            onChange={async (patch) => {
              setNotes((arr) =>
                arr.map((x) => (x.id === n.id ? { ...x, ...patch } : x)),
              );
              try {
                await upsert({ data: { ...n, ...patch, id: n.id } });
              } catch {
                /* ignore */
              }
            }}
            onClose={async () => {
              setNotes((arr) => arr.filter((x) => x.id !== n.id));
              await del({ data: { id: n.id } }).catch(() => {});
            }}
          />
        ))}

      {/* Terminal — desktop: floating window; mobile: bottom sheet */}
      {!isMobile && terminalOpen && (
        <FloatingWindow
          id="terminal"
          title={`EXODIA TERMINAL  ${busy ? "◌ processing" : "● ready"}`}
          accent="cyan"
          defaultX={typeof window !== "undefined" ? Math.max(16, window.innerWidth / 2 - 360) : 200}
          defaultY={typeof window !== "undefined" ? Math.max(80, window.innerHeight - 420) : 300}
          defaultW={720}
          defaultH={360}
          onClose={() => setTerminalOpen(false)}
        >
          {terminalBody}
        </FloatingWindow>
      )}

      {isMobile && (
        <AnimatePresence>
          {terminalOpen && (
            <motion.div
              key="mobile-terminal"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed bottom-0 left-0 right-0 z-40 h-[65vh] glass border-t border-neon-cyan/40 shadow-[0_-10px_40px_rgba(34,211,238,0.25)] flex flex-col"
            >
              <div className="flex items-center justify-between px-3 py-2 border-b border-neon-cyan/20 flex-shrink-0">
                <div className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan">
                  ● terminal {busy ? "◌ processing" : ""}
                </div>
                <button
                  onClick={() => setTerminalOpen(false)}
                  aria-label="Close terminal"
                  className="font-mono text-xs text-neon-crimson px-2"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 min-h-0">{terminalBody}</div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Floating action dock — bottom-right, out of the way, always reachable */}
      <div className="fixed bottom-4 right-4 z-30 flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={() => setTerminalOpen((v) => !v)}
          aria-label="Toggle terminal"
          className="w-12 h-12 rounded-full glass glow-cyan border border-neon-cyan/60 text-neon-cyan font-mono text-lg flex items-center justify-center hover:bg-neon-cyan/10"
        >
          {terminalOpen ? "▾" : "▸_"}
        </button>
        {isMobile && (
          <button
            onClick={() => spawnNote("New Note")}
            aria-label="New note"
            className="w-12 h-12 rounded-full glass border border-neon-purple/60 text-neon-purple font-mono text-lg flex items-center justify-center hover:bg-neon-purple/10"
          >
            +
          </button>
        )}
      </div>

      {/* Diagnostics */}
      {!isMobile && diagOpen && (
        <FloatingWindow
          id="diagnostics"
          title="DIAGNOSTICS // audit + registry"
          accent="gold"
          defaultX={24}
          defaultY={80}
          defaultW={520}
          defaultH={420}
          onClose={() => setDiagOpen(false)}
        >
          <DiagnosticsPanel />
        </FloatingWindow>
      )}
    </main>
  );
}

function NoteWindow({
  note,
  onChange,
  onClose,
}: {
  note: Note;
  onChange: (patch: Partial<Note>) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ x: note.x, y: note.y, opacity: 0 }}
      animate={{ x: note.x, y: note.y, opacity: 1 }}
      style={{ width: note.w, height: note.h, zIndex: 20 + note.z }}
      className="absolute glass border border-neon-purple/40 rounded-md overflow-hidden shadow-[0_0_30px_oklch(0.65_0.28_300/30%)]"
    >
      <div className="flex items-center justify-between px-2 py-1 border-b border-neon-purple/30 cursor-grab active:cursor-grabbing">
        <input
          value={note.title}
          onChange={(e) => onChange({ title: e.target.value })}
          aria-label="Note title"
          className="bg-transparent font-mono text-[11px] uppercase tracking-widest text-neon-purple focus:outline-none flex-1"
        />
        <button
          onClick={onClose}
          aria-label="Close note"
          className="font-mono text-[10px] text-neon-crimson hover:text-neon-crimson/70 px-1"
        >
          ✕
        </button>
      </div>
      <textarea
        value={note.body}
        onChange={(e) => onChange({ body: e.target.value })}
        placeholder="// scratchpad"
        aria-label="Note body"
        className="w-full h-[calc(100%-28px)] bg-transparent p-2 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none resize-none"
      />
    </motion.div>
  );
}
