import { motion, useDragControls } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type WindowMode = "mini" | "standard" | "fullscreen";

type Props = {
  id: string;
  title: string;
  children: ReactNode;
  defaultX?: number;
  defaultY?: number;
  defaultW?: number;
  defaultH?: number;
  accent?: "cyan" | "purple" | "gold";
  onClose?: () => void;
  initialMode?: WindowMode;
};

const accentMap = {
  cyan: {
    border: "border-neon-cyan/40",
    text: "text-neon-cyan",
    glow: "glow-cyan",
    btn: "hover:bg-neon-cyan/10",
  },
  purple: {
    border: "border-neon-purple/40",
    text: "text-neon-purple",
    glow: "",
    btn: "hover:bg-neon-purple/10",
  },
  gold: {
    border: "border-neon-gold/40",
    text: "text-neon-gold",
    glow: "",
    btn: "hover:bg-neon-gold/10",
  },
};

let TOP_Z = 50;

export function FloatingWindow({
  id,
  title,
  children,
  defaultX = 80,
  defaultY = 80,
  defaultW = 640,
  defaultH = 360,
  accent = "cyan",
  onClose,
  initialMode = "standard",
}: Props) {
  const storageKey = `exodia.win.${id}`;
  const [mode, setMode] = useState<WindowMode>(initialMode);
  const [size, setSize] = useState({ w: defaultW, h: defaultH });
  const [z, setZ] = useState(() => ++TOP_Z);
  const drag = useDragControls();
  const ref = useRef<HTMLDivElement>(null);
  const a = accentMap[accent];

  // Restore persisted position/size
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.x != null) setPos({ x: s.x, y: s.y });
        if (s.w != null) setSize({ w: s.w, h: s.h });
        if (s.mode) setMode(s.mode);
      }
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  const persist = (patch: Partial<{ x: number; y: number; w: number; h: number; mode: WindowMode }>) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const prev = raw ? JSON.parse(raw) : {};
      localStorage.setItem(storageKey, JSON.stringify({ ...prev, ...patch }));
    } catch {
      /* ignore */
    }
  };

  const bringFront = () => setZ(++TOP_Z);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = size.w;
    const startH = size.h;
    const move = (ev: PointerEvent) => {
      const w = Math.max(280, startW + (ev.clientX - startX));
      const h = Math.max(160, startH + (ev.clientY - startY));
      setSize({ w, h });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      persist(size);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const isFs = mode === "fullscreen";
  const isMini = mode === "mini";

  return (
    <motion.div
      ref={ref}
      drag={!isFs}
      dragControls={drag}
      dragListener={false}
      dragMomentum={false}
      onDragEnd={(_, info) => {
        const next = { x: pos.x + info.offset.x, y: pos.y + info.offset.y };
        setPos(next);
        persist(next);
      }}
      onPointerDown={bringFront}
      animate={isFs ? { x: 0, y: 0 } : { x: pos.x, y: pos.y }}
      style={{
        width: isFs ? "100vw" : size.w,
        height: isFs ? "100vh" : isMini ? 32 : size.h,
        zIndex: z,
        top: 0,
        left: 0,
      }}
      className={`absolute glass ${a.glow} rounded-md border ${a.border} overflow-hidden flex flex-col`}
    >
      <div
        onPointerDown={(e) => {
          if (!isFs) drag.start(e);
        }}
        className={`flex items-center justify-between px-3 h-8 border-b ${a.border} bg-background/40 select-none ${isFs ? "" : "cursor-grab active:cursor-grabbing"}`}
      >
        <div className={`font-mono text-[10px] uppercase tracking-widest ${a.text}`}>
          ◆ {title}
        </div>
        <div className="flex items-center gap-1">
          <button
            title="collapse"
            aria-label={isMini ? `Expand ${title}` : `Collapse ${title}`}
            onClick={() => {
              const next: WindowMode = isMini ? "standard" : "mini";
              setMode(next);
              persist({ mode: next });
            }}
            className={`font-mono text-[10px] ${a.text} ${a.btn} px-1.5`}
          >
            —
          </button>
          <button
            title="expand"
            aria-label={isFs ? `Restore ${title}` : `Maximize ${title}`}
            onClick={() => {
              const next: WindowMode = isFs ? "standard" : "fullscreen";
              setMode(next);
              persist({ mode: next });
            }}
            className={`font-mono text-[10px] ${a.text} ${a.btn} px-1.5`}
          >
            □
          </button>
          {onClose && (
            <button
              title="close"
              aria-label={`Close ${title}`}
              onClick={onClose}
              className="font-mono text-[10px] text-neon-crimson hover:bg-neon-crimson/10 px-1.5"
            >
              ✕
            </button>
          )}
        </div>
      </div>
      {!isMini && <div className="flex-1 overflow-hidden">{children}</div>}
      {!isFs && !isMini && (
        <div
          onPointerDown={startResize}
          className="absolute bottom-0 right-0 w-3 h-3 cursor-nwse-resize opacity-60"
          style={{
            background: `linear-gradient(135deg, transparent 50%, currentColor 50%)`,
          }}
        />
      )}
    </motion.div>
  );
}
