import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Narf Narf — Planet vs Humans" },
      { name: "description", content: "Sign in or create your operator account for Narf Narf — the real-time Planet vs Humans crisis strategy game." },
      { property: "og:title", content: "Sign In — Narf Narf — Planet vs Humans" },
      { property: "og:description", content: "Sign in or create your operator account for Narf Narf." },
      { property: "og:url", content: "/auth" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/auth" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/onboarding" });
    });
  }, [navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/onboarding" },
        });
        if (error) throw error;
        toast.success("Account created. Check email if confirmation is required.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/onboarding" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

const handleGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin + "/onboarding",
    },
  });
  if (error) toast.error("Google sign-in failed");
};

const handleApple = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: {
      redirectTo: window.location.origin + "/onboarding",
    },
  });
  if (error) toast.error("Apple sign-in failed");
};

  return (
    <div
      className="fixed inset-0 overflow-y-auto flex items-center justify-center p-5"
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #0a1e4a 0%, #050a1f 55%, #02040c 100%)",
      }}
    >
      <Stars />
      <div
        className="relative w-full max-w-sm p-6 rounded-3xl"
        style={{
          background: "rgba(10,14,30,0.78)",
          border: "1px solid rgba(55,138,221,0.35)",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex flex-col items-center gap-2 mb-5">
          <MiniPlanet />
          <h1 className="font-display text-2xl tracking-tight mt-1" aria-label="Narf Narf — Planet vs Humans">
            NARF<span style={{ color: "#E24B4A" }}>·</span>NARF
            <span className="sr-only"> — Planet vs Humans</span>
          </h1>
          <p className="font-mono text-[10px] tracking-[0.3em]" style={{ color: "#378ADD" }}>
            {mode === "sign-in" ? "OPERATOR SIGN IN" : "CREATE OPERATOR"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={handleGoogle}
            className="py-2.5 rounded-xl font-mono text-[11px] tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-1.5"
            style={{
              background: "#fff",
              color: "#1f1f1f",
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            <GoogleG /> GOOGLE
          </button>
          <button
            type="button"
            onClick={handleApple}
            className="py-2.5 rounded-xl font-mono text-[11px] tracking-widest transition active:scale-[0.98] flex items-center justify-center gap-1.5"
            style={{
              background: "#000",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <AppleLogo /> APPLE
          </button>
        </div>

        <div className="my-3 flex items-center gap-2 text-[10px] text-muted-foreground tracking-widest">
          <div className="flex-1 h-px bg-border" /> OR EMAIL <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email" className="text-xs tracking-widest">EMAIL</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password" className="text-xs tracking-widest">PASSPHRASE</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full font-display tracking-[0.3em]"
            style={{
              background: "linear-gradient(180deg, #4a8fe8 0%, #1B4FA8 100%)",
              color: "#03060F",
            }}
          >
            {loading ? "Authenticating…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-[11px] tracking-widest text-muted-foreground hover:text-foreground font-mono"
          onClick={() => setMode((m) => (m === "sign-in" ? "sign-up" : "sign-in"))}
        >
          {mode === "sign-in" ? "NEED AN ACCOUNT? CREATE ONE" : "ALREADY HAVE ACCESS? SIGN IN"}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/" })}
          className="mt-2 w-full text-[10px] tracking-[0.3em] text-muted-foreground/70 hover:text-foreground font-mono"
        >
          ← BACK TO LANDING
        </button>
      </div>
    </div>
  );
}

function MiniPlanet() {
  return (
    <div
      className="rounded-full"
      style={{
        width: 64,
        height: 64,
        background:
          "radial-gradient(circle at 32% 28%, #4a8fe8 0%, #1B4FA8 38%, #0a2a66 75%, #051a44 100%)",
        boxShadow:
          "inset -8px -12px 22px rgba(0,0,0,0.5), 0 0 30px rgba(55,138,221,0.5)",
      }}
    />
  );
}

function GoogleG() {
  return (
    <svg width="14" height="14" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.6 39.7 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C40.8 35.7 44 30.3 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="12" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.5 12.5c0-2.8 2.3-4.2 2.4-4.2-1.3-1.9-3.4-2.2-4.1-2.2-1.7-.2-3.4 1-4.3 1-.9 0-2.3-1-3.8-1-1.9 0-3.7 1.1-4.7 2.9-2 3.5-.5 8.6 1.4 11.5.9 1.4 2 3 3.5 2.9 1.4-.1 1.9-.9 3.6-.9s2.2.9 3.7.9c1.5 0 2.5-1.4 3.4-2.8 1.1-1.6 1.5-3.2 1.5-3.3-.1 0-3-1.1-3-4.3zM14.7 4.6c.8-.9 1.3-2.2 1.1-3.5-1.1.1-2.4.8-3.2 1.7-.7.8-1.4 2.1-1.2 3.3 1.2.1 2.4-.6 3.3-1.5z"/>
    </svg>
  );
}

function Stars() {
  const stars = Array.from({ length: 50 }, (_, i) => ({
    x: (i * 73) % 100,
    y: (i * 137) % 100,
    s: ((i * 17) % 3) + 1,
    o: 0.3 + ((i * 11) % 7) / 10,
  }));
  return (
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((st, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, opacity: st.o }}
        />
      ))}
    </div>
  );
}