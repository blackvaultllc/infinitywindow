import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { useGame } from "@/game/store";
import trackAsset1 from "@/assets/iron-root-protocol.mp3.asset.json";
import trackAsset2 from "@/assets/iron-root-protocol-2.mp3.asset.json";

const TRACKS = [trackAsset1.url, trackAsset2.url];

const ON_KEY = "terra.music.enabled";
const VOL_KEY = "terra.music.vol";

function clampVolume(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0.32;
}

export function AmbientMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(true);
  const volumeRef = useRef(0.32);
  const intensityRef = useRef(0);
  const [playing, setPlaying] = useState(false);

  // Effective volume = base * (0.85 + intensity*0.45), capped at 1
  const applyVolume = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const v = clampVolume(volumeRef.current) * (0.85 + intensityRef.current * 0.45);
    el.volume = Math.min(1, Math.max(0, v));
  }, []);

  const stopMusic = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.pause();
    } catch {
      // ignore
    }
    setPlaying(false);
  }, []);

  const startMusic = useCallback(async () => {
    if (typeof window === "undefined" || !enabledRef.current) return;
    let el = audioRef.current;
    if (!el) {
      const url = TRACKS[Math.floor(Math.random() * TRACKS.length)];
      el = new Audio(url);
      el.loop = true;
      el.preload = "auto";
      el.crossOrigin = "anonymous";
      audioRef.current = el;
      const seekRandom = () => {
        const d = el!.duration;
        if (Number.isFinite(d) && d > 0) {
          try {
            el!.currentTime = Math.random() * Math.max(0, d - 1);
          } catch {
            // ignore
          }
        }
      };
      if (Number.isFinite(el.duration) && el.duration > 0) seekRandom();
      el.addEventListener("loadedmetadata", seekRandom, {
        once: true,
      });
      el.addEventListener("ended", () => {
        const next = TRACKS[Math.floor(Math.random() * TRACKS.length)];
        el!.src = next;
        el!.addEventListener(
          "loadedmetadata",
          () => {
            try {
              el!.currentTime = Math.random() * Math.max(0, el!.duration - 1);
            } catch {
              // ignore
            }
            void el!.play();
          },
          { once: true },
        );
      });
      el.loop = false; // we handle next-track manually for variety
    }
    applyVolume();
    try {
      await el.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }, [applyVolume]);

  // Adaptive: intensity from active disasters
  useEffect(() => {
    const update = (state: ReturnType<typeof useGame.getState>) => {
      const live = state.disasters.filter((d) => !d.resolved).length;
      intensityRef.current = Math.min(1, live / 4);
      applyVolume();
    };
    update(useGame.getState());
    const unsub = useGame.subscribe(update);
    return () => unsub();
  }, [applyVolume]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    enabledRef.current = localStorage.getItem(ON_KEY) !== "0";
    volumeRef.current = clampVolume(parseFloat(localStorage.getItem(VOL_KEY) ?? "0.32"));

    const onGesture = () => {
      void startMusic();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ON_KEY) {
        enabledRef.current = e.newValue !== "0";
        if (enabledRef.current) {
          void startMusic();
        } else {
          stopMusic();
        }
      }
      if (e.key === VOL_KEY && e.newValue) {
        volumeRef.current = clampVolume(parseFloat(e.newValue));
        applyVolume();
      }
    };
    const onCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail as { vol?: number; on?: boolean } | undefined;
      if (detail?.vol !== undefined) {
        volumeRef.current = clampVolume(detail.vol);
        applyVolume();
      }
      if (detail?.on === true) {
        enabledRef.current = true;
        void startMusic();
      }
      if (detail?.on === false) {
        enabledRef.current = false;
        stopMusic();
      }
    };

    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("storage", onStorage);
    window.addEventListener("terra:music", onCustom as EventListener);
    void startMusic();

    return () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("terra:music", onCustom as EventListener);
      stopMusic();
    };
  }, [startMusic, stopMusic, applyVolume]);

  if (playing) return null;

  return (
    <button
      type="button"
      onClick={() => {
        localStorage.setItem(ON_KEY, "1");
        enabledRef.current = true;
        void startMusic();
      }}
      className="fixed left-2 z-20 flex min-h-11 items-center gap-2 rounded-full border px-3 font-display text-[10px] tracking-[0.25em] shadow-2xl backdrop-blur-md pointer-events-auto"
      style={{
        bottom: "calc(82px + env(safe-area-inset-bottom))",
        borderColor: "rgba(239,159,39,0.75)",
        background: "rgba(3,6,15,0.9)",
        color: "#EF9F27",
        boxShadow: "0 0 22px rgba(239,159,39,0.35)",
      }}
      aria-label="Start music"
    >
      <Volume2 className="h-4 w-4" aria-hidden="true" />
      MUSIC
    </button>
  );
}
