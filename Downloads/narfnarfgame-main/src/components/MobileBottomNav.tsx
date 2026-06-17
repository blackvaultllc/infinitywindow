import { Link, useRouterState } from "@tanstack/react-router";
import { Gamepad2, MessageCircle, User, Users, Shield } from "lucide-react";

const ITEMS = [
  { to: "/select", label: "Play", icon: Gamepad2 },
  { to: "/clan", label: "Clan", icon: Shield },
  { to: "/forums", label: "Chat", icon: MessageCircle },
  { to: "/friends", label: "Friends", icon: Users },
  { to: "/profile", label: "Me", icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide nav inside the active match theater (HUD owns the screen) AND on
  // every onboarding step — those pages are fixed-inset, full-bleed flows
  // whose primary CTA sits at the bottom of the viewport.
  if (
    pathname === "/play" ||
    pathname === "/end" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/")
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-md"
      style={{
        background: "rgba(5,10,31,0.92)",
        borderColor: "rgba(55,138,221,0.25)",
        bottom: "max(12px, env(safe-area-inset-bottom))",
      }}
    >
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ to, label, icon: Icon }) => {
          const active =
            to === "/profile"
              ? pathname === "/profile" || pathname.startsWith("/profile/")
              : pathname === to;
          return (
            <li key={to}>
              <Link
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className="flex flex-col items-center justify-center gap-1 min-h-12 py-2 text-[10px] font-display tracking-[0.18em] transition-colors"
                style={{
                  color: active ? "#EF9F27" : "#9aa3b8",
                }}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{label.toUpperCase()}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
