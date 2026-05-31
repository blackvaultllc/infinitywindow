import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Quiet, client-side anti-cheat signal collector.
 * Streams weighted events to `record_suspicion(_event_type, _weight, _meta)`.
 *
 * The quieter you are, the more you can hear.
 */
export function useSuspicionTracker() {
  const queueRef = useRef<Array<{ type: string; weight: number; meta?: any }>>([]);
  const lastFlushRef = useRef<number>(0);
  const actionTimestampsRef = useRef<number[]>([]);

  // Flush queued events every 15s (and on unload)
  useEffect(() => {
    const flush = async () => {
      const q = queueRef.current.splice(0, queueRef.current.length);
      if (q.length === 0) return;
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) return;
      for (const e of q) {
        await supabase.rpc("record_suspicion", {
          _event_type: e.type,
          _weight: e.weight,
          _meta: e.meta ?? {},
        });
      }
      lastFlushRef.current = Date.now();
    };
    const id = window.setInterval(flush, 15_000);
    const onUnload = () => { void flush(); };
    window.addEventListener("beforeunload", onUnload);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("beforeunload", onUnload);
    };
  }, []);

  // One-time fingerprint signals on mount
  useEffect(() => {
    const signals: Array<{ type: string; weight: number; meta?: any }> = [];

    // Headless / automated browser
    if ((navigator as Navigator & { webdriver?: boolean }).webdriver === true) {
      signals.push({ type: "headless_browser", weight: 40, meta: { reason: "webdriver" } });
    }
    const ua = navigator.userAgent || "";
    if (/HeadlessChrome|Puppeteer|Playwright|Selenium|PhantomJS|bot|crawler/i.test(ua)) {
      signals.push({ type: "headless_browser", weight: 40, meta: { ua } });
    }

    // Devtools heuristic (height delta is unreliable; checked only as low weight)
    const dt = Math.abs(window.outerHeight - window.innerHeight);
    if (dt > 200 && window.outerHeight > 400) {
      signals.push({ type: "devtools_open", weight: 5, meta: { delta: dt } });
    }

    queueRef.current.push(...signals);
  }, []);

  // Listen for pastes (large pastes = bot/copy-paste cheats in chat)
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData("text") ?? "";
      if (text.length > 500) {
        queueRef.current.push({
          type: "paste_burst",
          weight: 10,
          meta: { length: text.length },
        });
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Hidden-tab win detection
  useEffect(() => {
    let hiddenSince = 0;
    const onVis = () => {
      if (document.hidden) hiddenSince = Date.now();
      else hiddenSince = 0;
    };
    document.addEventListener("visibilitychange", onVis);
    (window as any).__exodSuspicion = {
      reportBattle: (won: boolean, durationMs: number) => {
        // Battle win while tab was hidden the whole time
        if (won && hiddenSince > 0) {
          queueRef.current.push({
            type: "tab_hidden_win",
            weight: 30,
            meta: { durationMs },
          });
        }
        // Suspiciously fast win
        if (won && durationMs < 2000) {
          queueRef.current.push({
            type: "superhuman_speed",
            weight: 25,
            meta: { durationMs },
          });
        }
      },
      reportAction: () => {
        const now = performance.now();
        const arr = actionTimestampsRef.current;
        arr.push(now);
        // Keep last 30
        while (arr.length > 30) arr.shift();
        if (arr.length >= 15) {
          const intervals: number[] = [];
          for (let i = 1; i < arr.length; i++) intervals.push(arr[i] - arr[i - 1]);
          const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const variance =
            intervals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / intervals.length;
          const sd = Math.sqrt(variance);
          // Inhuman: standard deviation under 25ms means robotic timing
          if (sd < 25 && mean < 400) {
            queueRef.current.push({
              type: "inhuman_consistency",
              weight: 20,
              meta: { sd: Math.round(sd), mean: Math.round(mean) },
            });
            arr.length = 0;
          }
          // Superhuman APM > 300
          const apm = (60_000 / mean);
          if (apm > 300) {
            queueRef.current.push({
              type: "superhuman_apm",
              weight: 25,
              meta: { apm: Math.round(apm) },
            });
            arr.length = 0;
          }
        }
      },
    };
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);
}

/** Call from battle code: window.__exodSuspicion?.reportBattle(won, ms) */
export function reportBattleSignal(won: boolean, durationMs: number) {
  (window as any).__exodSuspicion?.reportBattle(won, durationMs);
}
export function reportActionSignal() {
  (window as any).__exodSuspicion?.reportAction();
}