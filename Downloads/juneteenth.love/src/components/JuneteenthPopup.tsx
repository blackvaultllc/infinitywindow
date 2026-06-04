import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DISMISS_KEY = "j19_popup_dismissed_v1";

function daysUntilJuneteenth() {
  const now = new Date();
  const year = now.getFullYear();
  let next = new Date(year, 5, 19);
  if (now > next) next = new Date(year + 1, 5, 19);
  return {
    days: Math.ceil((next.getTime() - now.getTime()) / 86_400_000),
    year: next.getFullYear(),
  };
}

export function JuneteenthPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { days, year } = daysUntilJuneteenth();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(DISMISS_KEY)) return;
    const min = 3000;
    const max = 10000;
    let t: any;

    const tryOpen = () => {
      try {
        const active = localStorage.getItem("popup_active");
        if (!active) {
          setOpen(true);
          try {
            localStorage.setItem("popup_active", "juneteenth");
          } catch {}
        } else {
          // another popup is active — retry after a short random delay
          t = setTimeout(tryOpen, 2000 + Math.random() * 4000);
        }
      } catch {
        setOpen(true);
        try {
          localStorage.setItem("popup_active", "juneteenth");
        } catch {}
      }
    };

    const initialDelay = Math.floor(min + Math.random() * (max - min));
    t = setTimeout(tryOpen, initialDelay);
    return () => clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
      localStorage.removeItem("popup_active");
    } catch {}
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setBusy(true);
    const { data: sess } = await supabase.auth.getSession();
    const { error } = await supabase.from("juneteenth_subscribers").insert({
      email: email.trim().toLowerCase().slice(0, 255),
      name: name.trim().slice(0, 100) || null,
      user_id: sess.session?.user.id ?? null,
    });
    setBusy(false);
    if (error && !error.message.toLowerCase().includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    toast.success("You're on the list. We'll remind you before June 19.");
    close();
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Juneteenth reminder signup"
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={close}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-card border border-gold/30 rounded-sm p-7 sm:p-9 shadow-[0_30px_80px_-30px_rgba(212,175,55,0.4)]"
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 text-foreground/50 hover:text-gold p-1.5 cursor-pointer"
        >
          <X size={18} />
        </button>
        <span className="block text-gold text-[10px] uppercase tracking-[0.32em] mb-3">
          Juneteenth {year} · {days} {days === 1 ? "day" : "days"} away
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium leading-tight mb-3 text-balance">
          Get a quiet reminder before <span className="italic text-gold">June 19</span>.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-5 text-pretty">
          We'll email you a few times before Juneteenth — never spam, never sold.
          If you've ever been profiled, harassed, or treated like less than human,
          this is also your invitation to{" "}
          <Link to="/stories" onClick={close} className="text-gold underline-offset-4 hover:underline">
            tell your story
          </Link>
          . We're tired of being treated like trash. Let's get the word out together.
        </p>
        <form onSubmit={subscribe} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name (optional)"
            maxLength={100}
            className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            maxLength={255}
            className="w-full bg-background border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gold text-primary-foreground py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-60"
          >
            {busy ? "Adding you…" : "Remind Me About Juneteenth"}
          </button>
        </form>
        <p className="text-[10px] uppercase tracking-[0.28em] text-foreground/40 mt-4 text-center">
          One people · One future
        </p>
      </div>
    </div>
  );
}
