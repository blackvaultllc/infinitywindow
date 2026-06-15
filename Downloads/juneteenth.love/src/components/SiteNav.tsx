import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DONATE_URL } from "@/lib/donate";


export function SiteNav() {
  const [signedIn, setSignedIn] = useState(false);
  const [isMod, setIsMod] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = async (userId: string | undefined) => {
      if (!userId) {
        setIsMod(false);
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      setIsMod(!!data?.some((r) => r.role === "admin" || r.role === "moderator"));
    };
    supabase.auth.getSession().then(({ data }) => {
      setSignedIn(!!data.session);
      refresh(data.session?.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      refresh(session?.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const links = (
    <>
      <Link to="/" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Home
      </Link>
      <Link to="/history" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Black History
      </Link>
      <Link to="/origins" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Origin
      </Link>
      <Link to="/solidarity" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Solidarity
      </Link>
      <Link to="/calendar" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Calendar
      </Link>
      <Link to="/stories" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Stories
      </Link>
      <Link to="/about" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        About
      </Link>
      <Link to="/contact" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
        Contact
      </Link>
      {signedIn && (
        <Link to="/settings" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
          Profile
        </Link>
      )}
      {isMod && (
        <Link to="/moderation" onClick={() => setOpen(false)} className="hover:text-gold transition-colors">
          Moderate
        </Link>
      )}
      {signedIn ? (
        <button
          onClick={async () => {
            setOpen(false);
            await supabase.auth.signOut();
          }}
          className="hover:text-gold transition-colors cursor-pointer text-left"
        >
          Sign Out
        </button>
      ) : (
        <Link to="/auth" onClick={() => setOpen(false)} className="text-gold hover:text-foreground transition-colors">
          Sign In
        </Link>
      )}
      <a
        href={DONATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => setOpen(false)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-gold/15 text-gold ring-1 ring-gold/40 hover:bg-gold hover:text-primary-foreground transition-colors"
      >
        <Heart size={11} /> Donate
      </a>
    </>

  );

  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          to="/"
          className="font-serif text-base tracking-wide text-foreground hover:text-gold transition-colors"
        >
          Juneteenth<span className="text-gold">.</span>Love
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-[0.28em] text-foreground/70">
          {links}
        </nav>
        <button
          onClick={() => setOpen((v) => !v)}
          className="md:hidden p-2 -mr-2 text-foreground/80 hover:text-gold"
          aria-label="Menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="px-6 py-5 flex flex-col gap-4 text-xs uppercase tracking-[0.28em] text-foreground/80">
            {links}
          </div>
        </nav>
      )}
    </header>
  );
}
