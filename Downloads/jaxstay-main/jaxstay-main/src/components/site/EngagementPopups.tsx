import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { X, Search, MessageSquare, PawPrint } from "lucide-react";

type PopupId = "welcome" | "exit" | "booking";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

const seenKey = (id: PopupId) => `jaxstay_popup_${id}_seen`;
const VIEWED_SITTERS_KEY = "jaxstay_viewed_sitters";

function recentlyShown(id: PopupId) {
  try {
    const v = localStorage.getItem(seenKey(id));
    if (!v) return false;
    return Date.now() - Number(v) < COOLDOWN_MS;
  } catch { return false; }
}
function markShown(id: PopupId) {
  try { localStorage.setItem(seenKey(id), String(Date.now())); } catch { /* ignore */ }
}

function isFieldFocused() {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function EngagementPopups() {
  const location = useLocation();
  const [active, setActive] = useState<PopupId | null>(null);

  // Track sitter profile views for booking nudge
  useEffect(() => {
    const m = location.pathname.match(/^\/sitters\/([^/]+)$/);
    if (!m) return;
    try {
      const raw = localStorage.getItem(VIEWED_SITTERS_KEY);
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      set.add(m[1]);
      localStorage.setItem(VIEWED_SITTERS_KEY, JSON.stringify([...set]));
    } catch { /* ignore */ }
  }, [location.pathname]);

  const tryShow = (id: PopupId) => {
    if (active) return;
    if (recentlyShown(id)) return;
    if (isFieldFocused()) return;
    setActive(id);
    markShown(id);
  };

  // Popup A: welcome — only on home, after 15s OR 50% scroll
  useEffect(() => {
    if (location.pathname !== "/") return;
    const timer = window.setTimeout(() => tryShow("welcome"), 15000);
    const onScroll = () => {
      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total > 0 && scrolled / total >= 0.5) tryShow("welcome");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener("scroll", onScroll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Popup B: exit intent — desktop mouseleave from top
  useEffect(() => {
    const onMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget) tryShow("exit");
    };
    document.addEventListener("mouseout", onMouseOut);
    return () => document.removeEventListener("mouseout", onMouseOut);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  // Popup C: booking nudge — 2+ sitter profiles viewed, not on profile page
  useEffect(() => {
    if (location.pathname.startsWith("/sitters/")) return;
    try {
      const raw = localStorage.getItem(VIEWED_SITTERS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (list.length >= 2) {
        const t = window.setTimeout(() => tryShow("booking"), 4000);
        return () => clearTimeout(t);
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  if (!active) return null;

  const close = () => setActive(null);

  const content = {
    welcome: {
      icon: <PawPrint className="h-6 w-6 text-accent" />,
      title: "Need a sitter today?",
      body: "Book a trusted, vetted sitter in under 60 seconds.",
      cta: { label: "Find a Sitter", to: "/sitters" as const, icon: <Search className="h-4 w-4" /> },
    },
    exit: {
      icon: <PawPrint className="h-6 w-6 text-accent" />,
      title: "Before you go —",
      body: "Get connected with a trusted sitter near you in just a few clicks.",
      cta: { label: "Browse Sitters", to: "/sitters" as const, icon: <Search className="h-4 w-4" /> },
    },
    booking: {
      icon: <MessageSquare className="h-6 w-6 text-accent" />,
      title: "Still deciding?",
      body: "Message sitters instantly and compare availability.",
      cta: { label: "Message a Sitter", to: "/messages" as const, icon: <MessageSquare className="h-4 w-4" /> },
    },
  }[active];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-card p-6 shadow-warm sm:p-8"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15">
          {content.icon}
        </div>
        <h2 className="mt-4 font-display text-2xl font-700">{content.title}</h2>
        <p className="mt-2 text-foreground/75">{content.body}</p>
        <Link
          to={content.cta.to}
          onClick={close}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground shadow-soft transition hover:scale-[1.01]"
        >
          {content.cta.icon} {content.cta.label}
        </Link>
        <button
          onClick={close}
          className="mt-2 w-full rounded-full px-5 py-2 text-xs font-500 text-muted-foreground hover:text-foreground"
        >
          No thanks
        </button>
      </div>
    </div>
  );
}
