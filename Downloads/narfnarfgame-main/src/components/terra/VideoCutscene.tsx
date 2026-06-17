import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getCutscenePlayback } from "@/lib/cutscenes.functions";
import type { DisasterCategory } from "@/game/types";
import {
  CUTSCENE_FALLBACK_URLS,
  CUTSCENE_FALLBACK_DURATION,
} from "@/lib/cutsceneFallbacks";

/**
 * Fullscreen video overlay. Fetches a signed URL for the given power's
 * cutscene; if one exists & is enabled, plays it muted for the configured
 * duration (or until `ended`), whichever is first, then calls `onDone()`.
 * If no cutscene is configured, returns null and calls `onDone()` immediately
 * so the caller can fall back to surface animations.
 */
export function VideoCutscene({
  powerCategory,
  onDone,
}: {
  powerCategory: DisasterCategory;
  onDone: () => void;
}) {
  const fetchPlayback = useServerFn(getCutscenePlayback);
  const [url, setUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [resolved, setResolved] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchPlayback({ data: { powerCategory } });
        if (cancelled) return;
        if (res?.signedUrl) {
          setUrl(res.signedUrl);
          setDuration(res.durationSeconds || 5);
        } else {
          // Fallback: use bundled per-category effect video.
          const fb = CUTSCENE_FALLBACK_URLS[powerCategory];
          if (fb) {
            setUrl(fb);
            setDuration(CUTSCENE_FALLBACK_DURATION);
          }
        }
      } catch {
        // Network/server fail — still try the bundled fallback.
        if (cancelled) return;
        const fb = CUTSCENE_FALLBACK_URLS[powerCategory];
        if (fb) {
          setUrl(fb);
          setDuration(CUTSCENE_FALLBACK_DURATION);
        }
      } finally {
        if (!cancelled) setResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [powerCategory, fetchPlayback]);

  // If resolution finished and no URL → immediately fall through.
  useEffect(() => {
    if (resolved && !url) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolved, url]);

  // Hard duration cap once the video starts.
  useEffect(() => {
    if (!url || !duration) return;
    const t = setTimeout(finish, duration * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, duration]);

  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
      onClick={finish}
      role="dialog"
      aria-label="Cinematic"
    >
      <video
        ref={videoRef}
        src={url}
        autoPlay
        muted
        playsInline
        onEnded={finish}
        className="w-full h-full object-cover"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          finish();
        }}
        className="absolute top-4 right-4 font-mono text-[10px] tracking-[0.3em] text-white/70 hover:text-white px-3 py-2 rounded bg-black/40 backdrop-blur"
      >
        SKIP →
      </button>
    </div>
  );
}