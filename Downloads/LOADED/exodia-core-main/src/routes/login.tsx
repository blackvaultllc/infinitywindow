import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { ParticlesBg } from "@/components/particles-bg";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Authenticate — EXODIA5" },
      {
        name: "description",
        content: "Sign in or create your EXODIA5 operator identity to enter the Exodia gaming ecosystem.",
      },
      { property: "og:title", content: "Authenticate — EXODIA5" },
      {
        property: "og:description",
        content: "Sign in or create your EXODIA5 operator identity.",
      },
      { property: "og:url", content: "https://augi.space/login" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "https://augi.space/login" }],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/workspace" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created. Check your inbox to verify.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Access granted.");
        navigate({ to: "/workspace" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/workspace" });
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
      <ParticlesBg density={60} />
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative glass glow-cyan z-10 w-full max-w-md p-8 rounded-lg border border-neon-cyan/40"
      >
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/70 hover:text-neon-cyan"
          >
            ◂ back
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-neon-gold">
            ● secure channel
          </span>
        </div>
        <h1 className="font-display text-3xl text-neon-cyan text-glow-cyan">
          {mode === "signin" ? "AUTHENTICATE" : "REGISTER"}
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {mode === "signin" ? "Identify yourself, operator." : "Forge a new identity."}
        </p>

        <form onSubmit={handleEmail} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/70"
            >
              email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-input/60 border border-neon-cyan/30 px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-neon-cyan focus:shadow-[0_0_0_2px_oklch(0.85_0.2_200/30%)]"
            />
          </div>
          <div>
            <label
              htmlFor="login-passkey"
              className="font-mono text-[10px] uppercase tracking-widest text-neon-cyan/70"
            >
              passkey
            </label>
            <input
              id="login-passkey"
              name="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-input/60 border border-neon-cyan/30 px-3 py-2 font-mono text-sm text-foreground focus:outline-none focus:border-neon-cyan"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full bg-neon-cyan/10 border border-neon-cyan text-neon-cyan font-display text-sm uppercase tracking-[0.3em] py-3 hover:bg-neon-cyan/20 transition disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "▶ enter" : "▶ create"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-neon-cyan/20" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            or
          </span>
          <div className="h-px flex-1 bg-neon-cyan/20" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="w-full border border-neon-purple/50 text-neon-purple font-mono text-xs uppercase tracking-[0.3em] py-3 hover:bg-neon-purple/10 transition disabled:opacity-50"
        >
          ◇ continue with google
        </button>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center font-mono text-[10px] uppercase tracking-widest text-muted-foreground hover:text-neon-cyan transition"
        >
          {mode === "signin"
            ? "no identity? // register"
            : "already in the grid? // sign in"}
        </button>
      </motion.div>
    </main>
  );
}
