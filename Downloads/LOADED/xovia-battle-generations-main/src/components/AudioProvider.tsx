import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

// Royalty-free Egyptian / Middle-Eastern ambient tracks (Pixabay CDN, free for commercial use).
// Multiple tracks so users can change the vibe; first one is the default.
export interface TrackOption { id: string; label: string; url: string }
export const MUSIC_TRACKS: TrackOption[] = [
  { id: "pharaoh",  label: "Pharaoh's Court",   url: "https://cdn.pixabay.com/download/audio/2022/10/18/audio_31c2730e64.mp3?filename=arabian-nightfall-122363.mp3" },
  { id: "desert",   label: "Desert Mirage",     url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_5b1f3f5f4f.mp3?filename=middle-eastern-118280.mp3" },
  { id: "nile",     label: "Nile at Dusk",      url: "https://cdn.pixabay.com/download/audio/2023/06/06/audio_5c8df9a99c.mp3?filename=arabian-mystery-152199.mp3" },
  { id: "temple",   label: "Temple of Anubis",  url: "https://cdn.pixabay.com/download/audio/2024/02/19/audio_3a2c2b9c8a.mp3?filename=egyptian-mystery-192478.mp3" },
];

type SfxKind = "card" | "magic" | "relic" | "win" | "click";

interface AudioCtx {
  musicOn: boolean;
  sfxOn: boolean;
  toggleMusic: () => void;
  toggleSfx: () => void;
  playSfx: (kind: SfxKind) => void;
  musicReady: boolean;
  tracks: TrackOption[];
  currentTrackId: string;
  setTrack: (id: string) => void;
}

const Ctx = createContext<AudioCtx>({
  musicOn: true,
  sfxOn: true,
  toggleMusic: () => {},
  toggleSfx: () => {},
  playSfx: () => {},
  musicReady: false,
  tracks: MUSIC_TRACKS,
  currentTrackId: MUSIC_TRACKS[0].id,
  setTrack: () => {},
});

export function AudioProvider({ children }: { children: ReactNode }) {
  const [musicOn, setMusicOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("exo-music") !== "0";
  });
  const [sfxOn, setSfxOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("exo-sfx") !== "0";
  });
  const [musicReady, setMusicReady] = useState(false);
  const [currentTrackId, setCurrentTrackId] = useState<string>(() => {
    if (typeof window === "undefined") return MUSIC_TRACKS[0].id;
    return localStorage.getItem("exo-track") || MUSIC_TRACKS[0].id;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const acRef = useRef<AudioContext | null>(null);

  const currentTrack = useMemo(
    () => MUSIC_TRACKS.find((t) => t.id === currentTrackId) ?? MUSIC_TRACKS[0],
    [currentTrackId],
  );

  // Mount audio element once
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = new Audio(currentTrack.url);
    el.loop = true;
    el.volume = 0.25;
    el.preload = "auto";
    el.crossOrigin = "anonymous";
    audioRef.current = el;
    setMusicReady(true);

    // Require first user gesture to start (autoplay policy).
    const tryPlay = () => {
      if (musicOn) el.play().catch(() => {});
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
    window.addEventListener("pointerdown", tryPlay, { once: true });
    window.addEventListener("keydown", tryPlay, { once: true });
    return () => {
      el.pause();
      audioRef.current = null;
      window.removeEventListener("pointerdown", tryPlay);
      window.removeEventListener("keydown", tryPlay);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap audio source when the user picks a different track.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.src = currentTrack.url;
    el.load();
    if (musicOn) el.play().catch(() => {});
    localStorage.setItem("exo-track", currentTrack.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack.url]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (musicOn) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
    localStorage.setItem("exo-music", musicOn ? "1" : "0");
  }, [musicOn]);

  useEffect(() => {
    localStorage.setItem("exo-sfx", sfxOn ? "1" : "0");
  }, [sfxOn]);

  const playSfx = useCallback(
    (kind: SfxKind) => {
      if (!sfxOn || typeof window === "undefined") return;
      if (!acRef.current) {
        const Cls = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
        if (!Cls) return;
        acRef.current = new Cls();
      }
      const ac = acRef.current;
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain); gain.connect(ac.destination);
      const presets: Record<SfxKind, { type: OscillatorType; f: number; f2: number; d: number; vol: number }> = {
        card:  { type: "triangle", f: 520, f2: 320, d: 0.18, vol: 0.18 },
        magic: { type: "sine",     f: 880, f2: 1320, d: 0.45, vol: 0.15 },
        relic: { type: "sawtooth", f: 110, f2: 55,  d: 1.4,  vol: 0.22 },
        win:   { type: "square",   f: 660, f2: 990, d: 0.9,  vol: 0.18 },
        click: { type: "sine",     f: 720, f2: 720, d: 0.06, vol: 0.10 },
      };
      const p = presets[kind];
      osc.type = p.type;
      osc.frequency.setValueAtTime(p.f, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, p.f2), now + p.d);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(p.vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
      osc.start(now);
      osc.stop(now + p.d + 0.05);
    },
    [sfxOn],
  );

  return (
    <Ctx.Provider value={{
      musicOn, sfxOn,
      toggleMusic: () => setMusicOn(v => !v),
      toggleSfx: () => setSfxOn(v => !v),
      playSfx, musicReady,
      tracks: MUSIC_TRACKS,
      currentTrackId,
      setTrack: (id) => setCurrentTrackId(id),
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAudio() { return useContext(Ctx); }