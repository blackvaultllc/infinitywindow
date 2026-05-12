import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/sitters", label: "Find a Sitter" },
  { to: "/become-a-sitter", label: "Become a Sitter" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-500 text-foreground/80 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-600" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-500 text-foreground/80 hover:text-foreground">
                Log in
              </Link>
              <Link
                to="/login"
                search={{ mode: "signup" }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
        <button
          className="md:hidden rounded-full p-2 text-foreground"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background">
          <div className="flex flex-col px-4 py-4">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="py-3 text-base font-500">
                {n.label}
              </Link>
            ))}
            {!loading && user ? (
              <Link
                to="/dashboard"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-600 text-primary-foreground"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-full bg-primary px-5 py-3 text-center text-sm font-600 text-primary-foreground"
              >
                Log in / Sign up
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
