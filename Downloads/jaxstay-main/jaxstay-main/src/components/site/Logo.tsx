import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span
        className={`grid h-9 w-9 place-items-center rounded-full ${
          light ? "bg-accent text-accent-foreground" : "bg-primary text-primary-foreground"
        } transition-transform group-hover:rotate-12`}
        aria-hidden
      >
        <PawIcon className="h-5 w-5" />
      </span>
      <span className={`font-display text-2xl font-700 tracking-tight ${light ? "text-primary-foreground" : "text-foreground"}`}>
        Jax<span className="text-accent">Stay</span>
      </span>
    </Link>
  );
}

export function PawIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <ellipse cx="6" cy="9" rx="2" ry="2.6" />
      <ellipse cx="10" cy="6" rx="2" ry="2.6" />
      <ellipse cx="14" cy="6" rx="2" ry="2.6" />
      <ellipse cx="18" cy="9" rx="2" ry="2.6" />
      <path d="M12 11.5c-3.2 0-5.8 2.4-5.8 5.2 0 1.7 1.3 2.8 3 2.8 1.1 0 1.8-.5 2.8-.5s1.7.5 2.8.5c1.7 0 3-1.1 3-2.8 0-2.8-2.6-5.2-5.8-5.2z" />
    </svg>
  );
}
