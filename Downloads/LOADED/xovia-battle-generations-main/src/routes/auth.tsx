import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import logo from "@/assets/logo-exodius.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Exodia NFT Battle" },
      { name: "description", content: "Join the Exodia dynasty. Claim your free Pharaoh's Vault Pack and 200 EXOD on signup." },
    ],
  }),
});

function AuthPage() {
  const nav = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referral, setReferral] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("ref") ?? "";
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) nav({ to: "/wallet" });
  }, [loading, user, nav]);

  const onEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "sign-up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: displayName || email.split("@")[0],
              ...(referral ? { referral_code: referral } : {}),
            },
          },
        });
        if (error) throw error;
        toast.success("Account created — check your email to confirm.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back, duelist.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/wallet" });
    if (result.error) toast.error(result.error.message ?? "Google sign-in failed");
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="container mx-auto flex max-w-md flex-col items-center px-4 py-14">
        <img src={logo} alt="" className="h-14 w-14" />
        <h1 className="mt-4 font-display text-3xl text-gradient-gold">
          {mode === "sign-in" ? "Enter the Dynasty" : "Forge Your Pharaoh"}
        </h1>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          {mode === "sign-up"
            ? "New duelists receive 200 EXOD + a free Pharaoh's Vault Pack."
            : "Continue your ascension."}
        </p>

        <Button onClick={onGoogle} className="mt-6 w-full bg-foreground text-background hover:bg-foreground/90">
          Continue with Google
        </Button>

        <div className="my-4 flex w-full items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> or <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={onEmail} className="w-full space-y-3">
          {mode === "sign-up" && (
            <div>
              <Label htmlFor="dn">Display name</Label>
              <Input id="dn" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Pharaoh Khufu" />
            </div>
          )}
          <div>
            <Label htmlFor="em">Email</Label>
            <Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="pw">Password</Label>
            <Input id="pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {mode === "sign-up" && (
            <div>
              <Label htmlFor="ref">Referral code (optional)</Label>
              <Input id="ref" value={referral} onChange={(e) => setReferral(e.target.value.toUpperCase())} placeholder="ABCD1234" />
            </div>
          )}
          <Button type="submit" disabled={busy} className="w-full bg-gold text-gold-foreground hover:bg-gold/90">
            {busy ? "…" : mode === "sign-in" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <button onClick={() => setMode(m => m === "sign-in" ? "sign-up" : "sign-in")} className="mt-4 text-xs text-muted-foreground hover:text-foreground">
          {mode === "sign-in" ? "No account? Create one →" : "Already a duelist? Sign in →"}
        </button>
      </div>
    </div>
  );
}