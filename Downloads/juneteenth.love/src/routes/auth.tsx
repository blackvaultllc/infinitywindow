import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { SiteNav } from "@/components/SiteNav";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Sign Up — Share Your Story | Juneteenth.Love" },
      {
        name: "description",
        content:
          "Create a free account to publish your story — lived experiences, family history, and the truth that needs to be told.",
      },
      { property: "og:title", content: "Sign In or Sign Up — Juneteenth.Love" },
      {
        property: "og:description",
        content:
          "Join the community. Share your experience, your family history, your truth.",
      },
      { property: "og:url", content: "/auth" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/stories" });
    });
  }, [navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/stories`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        navigate({ to: "/stories" });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const onOAuth = async (provider: "google" | "apple") => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: `${window.location.origin}/stories`,
    });
    if (result.error) {
      const label = provider === "apple" ? "Apple" : "Google";
      const msg = `${label} sign-in failed. ${result.error.message ?? ""}`.trim();
      setError(msg);
      toast.error(msg);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/stories" });
  };


  return (
    <main className="bg-background text-foreground font-sans min-h-screen">
      <SiteNav />
      <section className="px-6 py-20">
        <div className="max-w-md mx-auto">
          <span className="block text-gold text-xs uppercase tracking-[0.32em] mb-4 text-center">
            Join the Community
          </span>
          <h1 className="font-serif text-4xl md:text-5xl font-medium text-center mb-3 text-balance">
            {mode === "signup" ? "Share your story" : "Welcome back"}
          </h1>
          <p className="text-muted-foreground text-center mb-10 text-pretty">
            {mode === "signup"
              ? "A free account lets you publish your truth — lived experience, family history, the story only you can tell."
              : "Sign in to publish a new story or update your own."}
          </p>

          <button
            type="button"
            onClick={() => onOAuth("google")}
            disabled={busy}
            className="w-full bg-foreground text-background py-3 rounded-sm font-medium text-sm tracking-wide mb-3 hover:bg-foreground/90 transition-colors disabled:opacity-60"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => onOAuth("apple")}
            disabled={busy}
            className="w-full bg-black text-white py-3 rounded-sm font-medium text-sm tracking-wide mb-6 hover:bg-black/85 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.43 2.23-1.21 3.04-.77.82-2.04 1.46-3.1 1.37-.13-1.11.43-2.27 1.16-3.02.8-.83 2.18-1.45 3.15-1.39zM20.5 17.35c-.55 1.28-.82 1.85-1.53 2.98-.99 1.58-2.39 3.55-4.12 3.57-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.8-4.04-3.38C.04 16.86-.27 12.12 1.46 9.49c1.23-1.87 3.17-2.97 4.99-2.97 1.85 0 3.02 1.02 4.55 1.02 1.49 0 2.39-1.02 4.54-1.02 1.62 0 3.34.88 4.57 2.4-4.02 2.2-3.36 7.95.39 8.43z"/>
            </svg>
            Continue with Apple
          </button>

          {error && (
            <div
              role="alert"
              className="mb-5 border border-destructive/40 bg-destructive/10 text-destructive text-sm rounded-sm px-4 py-3"
            >
              {error}
            </div>
          )}

          <div className="flex items-center gap-4 mb-6">
            <span className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/40">
              or with email
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>


          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-foreground/60 block mb-2">
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={60}
                  className="w-full bg-card border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
                  placeholder="How readers will see you"
                />
              </div>
            )}
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-foreground/60 block mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="w-full bg-card border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.2em] text-foreground/60 block mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border rounded-sm px-3 py-2.5 text-sm focus:outline-none focus:border-gold/60"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gold text-primary-foreground py-3 rounded-sm font-medium text-sm tracking-wide hover:-translate-y-0.5 transition-transform disabled:opacity-60"
            >
              {busy
                ? "Please wait…"
                : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              className="text-gold hover:underline cursor-pointer"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
          <p className="text-center text-xs text-foreground/40 mt-10">
            <Link to="/" className="hover:text-gold">
              ← Back to the tribute
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
