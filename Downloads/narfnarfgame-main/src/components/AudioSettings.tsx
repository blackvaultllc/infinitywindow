import { useEffect, useState } from "react";
import { isSfxEnabled, onSfxChange, setSfxEnabled, sfx, unlockAudio } from "@/lib/sfx";

const STORAGE_KEY = "terra.music.enabled";
const VOL_KEY = "terra.music.vol";

export function AudioSettings() {
  const [musicOn, setMusicOn] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(STORAGE_KEY) !== "0";
  });
  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 0.35;
    const v = parseFloat(localStorage.getItem(VOL_KEY) ?? "0.35");
    return Number.isFinite(v) ? v : 0.35;
  });
  const [sfxOn, setSfxOnState] = useState(() => isSfxEnabled());

  useEffect(() => {
    const off = onSfxChange(setSfxOnState);
    return () => {
      off();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(VOL_KEY, String(volume));
    window.dispatchEvent(new CustomEvent("terra:music", { detail: { vol: volume, on: musicOn } }));
  }, [volume]);

  const toggleMusic = () => {
    unlockAudio();
    sfx.click();
    if (musicOn) {
      setMusicOn(false);
      localStorage.setItem(STORAGE_KEY, "0");
      window.dispatchEvent(new CustomEvent("terra:music", { detail: { vol: volume, on: false } }));
    } else {
      setMusicOn(true);
      localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new CustomEvent("terra:music", { detail: { vol: volume, on: true } }));
    }
  };

  const toggleSfx = () => {
    const next = !sfxOn;
    setSfxEnabled(next);
    setSfxOnState(next);
    if (next) sfx.unlock();
  };

  return (
    <section aria-labelledby="audio-heading" className="terra-panel rounded-2xl p-5 mt-4">
      <h2 id="audio-heading" className="font-display tracking-[0.25em] text-sm mb-1">
        AUDIO
      </h2>
      <p className="text-[12px] text-muted-foreground mb-4">
        Toggle the soundtrack and tactical sound effects. Music volume saves between sessions.
      </p>

      <div className="flex items-center justify-between gap-3 py-2">
        <div>
          <div className="font-display tracking-[0.2em] text-xs">MUSIC</div>
          <div className="text-[11px] text-muted-foreground">
            {musicOn ? "Playing across the game" : "Muted"}
          </div>
        </div>
        <button
          type="button"
          onClick={toggleMusic}
          aria-pressed={musicOn}
          className="font-mono text-[10px] tracking-[0.3em] min-h-11 px-4 rounded-lg"
          style={{
            border: `1px solid ${musicOn ? "#EF9F27" : "rgba(255,255,255,0.15)"}`,
            color: musicOn ? "#EF9F27" : "#9aa3b8",
            background: musicOn ? "rgba(239,159,39,0.1)" : "rgba(255,255,255,0.02)",
          }}
        >
          {musicOn ? "ON" : "OFF"}
        </button>
      </div>

      <div className="py-2">
        <label className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground mb-1">
          <span className="font-display tracking-[0.2em] text-xs text-foreground">VOLUME</span>
          <span className="font-mono">{Math.round(volume * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full accent-[#EF9F27]"
          aria-label="Music volume"
        />
      </div>

      <div className="flex items-center justify-between gap-3 py-2">
        <div>
          <div className="font-display tracking-[0.2em] text-xs">SOUND EFFECTS</div>
          <div className="text-[11px] text-muted-foreground">
            Clicks, alerts, and tactical cues.
          </div>
        </div>
        <button
          type="button"
          onClick={toggleSfx}
          aria-pressed={sfxOn}
          className="font-mono text-[10px] tracking-[0.3em] min-h-11 px-4 rounded-lg"
          style={{
            border: `1px solid ${sfxOn ? "#E24B4A" : "rgba(255,255,255,0.15)"}`,
            color: sfxOn ? "#E24B4A" : "#9aa3b8",
            background: sfxOn ? "rgba(226,75,74,0.1)" : "rgba(255,255,255,0.02)",
          }}
        >
          {sfxOn ? "ON" : "OFF"}
        </button>
      </div>
    </section>
  );
}