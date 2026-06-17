import { useEffect } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import type { ProfileSummary } from "@/lib/useProfile";

/**
 * Single source of truth for "where should this operator be right now?".
 * Returns the canonical path for the current onboarding stage, or null
 * if the profile is fully set up (free to roam).
 */
export function nextOnboardingPath(profile: ProfileSummary | null | undefined): string | null {
  if (!profile) return null;
  // Callsign first — operators need a name before they can take the oath
  // or be visible to anyone else in the theater.
  if (!profile.username) return "/onboarding-profile";
  // Then the story oath. After that they're free to roam.
  if (!profile.prologue_choice) return "/onboarding";
  return null;
}

/**
 * Redirect to the canonical onboarding step IF we aren't already there.
 * Skipping the no-op `navigate` call is what kills the flicker between
 * /select and /onboarding/* when multiple effects fire on the same tick.
 */
export function useOnboardingRedirect(
  profile: ProfileSummary | null | undefined,
  loading: boolean,
  opts: { allowHere?: string[]; fallback?: string } = {},
) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading || !profile) return;
    const target = nextOnboardingPath(profile);
    // Profile fully complete — go to fallback (e.g. /select) only when asked.
    if (!target) {
      if (opts.fallback && pathname !== opts.fallback) {
        navigate({ to: opts.fallback, replace: true });
      }
      return;
    }
    // We're already on the canonical step (or an explicitly allowed page).
    if (pathname === target) return;
    if (opts.allowHere?.includes(pathname)) return;
    navigate({ to: target, replace: true });
  }, [loading, profile, pathname, navigate, opts.allowHere, opts.fallback]);
}
