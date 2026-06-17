import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Pings touch_presence() periodically while the tab is open and a user is signed in.
 * Respects the user's show_online preference — the RPC only updates last_seen_at;
 * UI hides last_seen_at when show_online is false.
 */
export function PresencePinger() {
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = async () => {
      if (document.hidden) return;
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      await supabase.rpc("touch_presence" as any);
    };

    const start = () => {
      if (cancelled || timer) return;
      void ping();
      timer = setInterval(() => void ping(), 60_000);
    };
    const stop = () => {
      if (timer) { clearInterval(timer); timer = null; }
    };

    start();
    const onVisibility = () => {
      if (document.hidden) stop(); else start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void ping();
    });

    return () => {
      cancelled = true;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      sub.subscription.unsubscribe();
    };
  }, []);

  return null;
}
