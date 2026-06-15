import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, X } from "lucide-react";

/**
 * Ambient public-domain spiritual ("Oh Freedom") served from /public/audio.
 * Autoplay starts muted (browser policy); the user can unmute or pause.
 * State persists across pages via sessionStorage.
 */
const SRC = "/audio/oh-freedom.mp3";
const STORAGE_KEY = "music-player-state-v1";

type Persisted = { playing: boolean; muted: boolean; dismissed: boolean };

function readState(): Persisted {
  if (typeof window === "undefined") return { playing: true, muted: true, dismissed: false };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { playing: true, muted: true, dismissed: false };
}

export function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const s = readState();
    setPlaying(s.playing);
    setMuted(s.muted);
    setDismissed(s.dismissed);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ playing, muted, dismissed }),
      );
    } catch {}
    const a = audioRef.current;
    if (!a) return;
    a.muted = muted;
    if (playing) {
      a.play().catch(() => {
        // Autoplay blocked — flip to paused so UI reflects reality
        setPlaying(false);
      });
    } else {
      a.pause();
    }
  }, [playing, muted, dismissed, mounted]);

  if (!mounted || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-gold/30 bg-background/85 backdrop-blur px-3 py-2 shadow-lg shadow-black/40"
      role="region"
      aria-label="Ambient music"
    >
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        autoPlay
        muted
        playsInline
      />
      <button
        type="button"
        onClick={() => setPlaying((p) => !p)}
        aria-label={playing ? "Pause music" : "Play music"}
        className="text-gold hover:text-foreground transition-colors"
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button
        type="button"
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="text-foreground/70 hover:text-gold transition-colors"
      >
        {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/60 pl-1 pr-2 hidden sm:inline">
        Oh Freedom · Spiritual
      </span>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Hide music player"
        className="text-foreground/40 hover:text-foreground transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
