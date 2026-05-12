import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { PawIcon } from "@/components/site/Logo";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({ mode: z.enum(["signup", "login"]).optional() });

export const Route = createFileRoute("/login")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Log in or sign up — JaxStay" },
      { name: "description", content: "Create your free JaxStay account or sign in to manage bookings, messages and your profile." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const nav = useNavigate();
  const { user, signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState<"signup" | "login">(search.mode === "signup" ? "signup" : "login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) {
      const seen = typeof window !== "undefined" && localStorage.getItem("jaxstay_tour_seen");
      nav({ to: seen ? "/dashboard" : "/welcome" });
    }
  }, [user, nav]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (fullName.trim().length < 2) {
          toast.error("Please enter your name.");
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          return;
        }
        const { error } = await signUp(email, password, fullName.trim());
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Account created! Check your email to confirm, then log in.");
        setMode("login");
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Welcome back!");
        const seen = typeof window !== "undefined" && localStorage.getItem("jaxstay_tour_seen");
        nav({ to: seen ? "/dashboard" : "/welcome" });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const { error } = await signInWithGoogle();
    if (error) toast.error(error);
    setBusy(false);
  };

  return (
    <SiteLayout>
      <section className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <div className="text-center">
          <PawIcon className="mx-auto h-10 w-10 text-accent" />
          <h1 className="mt-4 font-display text-4xl font-700">
            {mode === "signup" ? "Join JaxStay" : "Welcome back"}
          </h1>
          <p className="mt-2 text-foreground/70">
            {mode === "signup"
              ? "Free to sign up. Owners and sitters welcome."
              : "Log in to manage your profile, bookings, and messages."}
          </p>
        </div>

        <button
          onClick={handleGoogle}
          disabled={busy}
          className="mt-8 flex items-center justify-center gap-3 rounded-full border border-border bg-card py-3 text-sm font-600 hover:bg-muted disabled:opacity-50"
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or use email <span className="h-px flex-1 bg-border" />
        </div>

        <form className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <Field label="Full name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" required />
          )}
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-primary py-3 text-sm font-600 text-primary-foreground transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Log in"}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New to JaxStay?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              className="font-600 text-primary underline-offset-4 hover:underline"
            >
              {mode === "signup" ? "Log in" : "Create one"}
            </button>
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our{" "}
          <Link to="/terms" className="underline">Terms</Link> and{" "}
          <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </section>
    </SiteLayout>
  );
}

function Field({ label, ...rest }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-600">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-accent"
      />
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}
