import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import introAsset from "@/assets/splash/earths-last-hope.mp4.asset.json";
import { getSplashPlayback } from "@/lib/splash.functions";

// Persist across sessions so the intro only plays once per device.
const SEEN_KEY = "narfnarf.intro.earthslasthope.seen";

export function SplashScreen() {
  const fetchSplash = useServerFn(getSplashPlayback);
  const [visible, setVisible] = useState(false);
  const [phase, setPhase] = useState<"video" | "fade">("video");
  const [src, setSrc] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVisible(localStorage.getItem(SEEN_KEY) !== "1");
  }, []);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchSplash({ data: { slot: "intro" } });
        if (cancelled) return;
        setSrc(res?.signedUrl || introAsset.url);
      } catch {
        if (!cancelled) setSrc(introAsset.url);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, fetchSplash]);

  useEffect(() => {
    if (!visible || !src) return;
    const v = videoRef.current;
    if (v) {
      v.play().catch(() => {
        setTimeout(dismiss, 3500);
      });
    }
    const failsafe = setTimeout(dismiss, 60000);
    return () => clearTimeout(failsafe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, src]);

  function dismiss() {
    setPhase("fade");
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem(SEEN_KEY, "1");
      }
      setVisible(false);
    }, 600);
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black transition-opacity duration-700 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Intro"
    >
      {src && (
        <video
          ref={videoRef}
          src={src}
          muted
          playsInline
          autoPlay
          onEnded={dismiss}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-20 z-10 px-6 text-center">
        <div className="mx-auto max-w-2xl rounded-md bg-black/40 px-4 py-3 backdrop-blur">
          <div className="font-display text-[10px] uppercase tracking-[0.4em] text-red-400">
            Global Defense Council
          </div>
          <p className="mt-1 text-sm text-white/90 sm:text-base">
            The Earth is fighting back. Four people. Every nation.
            <br className="hidden sm:block" />
            One choice — save the planet, or let it burn.
          </p>
        </div>
      </div>

      <button
        onClick={dismiss}
        className="absolute bottom-6 right-6 z-20 rounded-md border border-white/30 bg-black/40 px-3 py-1.5 text-xs uppercase tracking-widest text-white/80 backdrop-blur transition hover:bg-white/10"
      >
        Skip →
      </button>
    </div>
  );
}
