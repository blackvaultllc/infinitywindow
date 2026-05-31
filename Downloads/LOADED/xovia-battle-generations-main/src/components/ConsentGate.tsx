import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CONSENT_HIGHLIGHTS, CONSENT_VERSION } from "@/lib/consent";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScrollText } from "lucide-react";

export function ConsentGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [needsConsent, setNeedsConsent] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { setNeedsConsent(false); return; }
    supabase
      .from("profiles")
      .select("consent_accepted_at, consent_version")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const accepted =
          !!data?.consent_accepted_at && (data?.consent_version ?? 0) >= CONSENT_VERSION;
        setNeedsConsent(!accepted);
      });
  }, [user, loading]);

  const onAccept = async () => {
    setBusy(true);
    const { error } = await supabase.rpc("accept_consent", { _version: CONSENT_VERSION });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setNeedsConsent(false);
    toast.success("Welcome to the dynasty.");
  };

  return (
    <>
      {children}
      {needsConsent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-gold/40 bg-card shadow-[0_0_60px_-10px_var(--gold)]">
            <div className="border-b border-border/60 px-6 py-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-accent">
                <ScrollText className="h-4 w-4" /> Consent Required
              </div>
              <h2 className="mt-1 font-display text-2xl text-gradient-gold">
                Read & Accept Before Entering
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Quick scroll is fine — but each item below is binding. Full text is in the{" "}
                <Link to="/terms" target="_blank" className="text-gold underline">Terms & Conditions</Link>.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <ol className="space-y-3">
                {CONSENT_HIGHLIGHTS.map((h, i) => (
                  <li key={i} className="rounded border border-border/60 bg-background/40 p-3">
                    <div className="font-display text-sm text-foreground">
                      {i + 1}. {h.title}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{h.body}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="border-t border-border/60 bg-background/60 px-6 py-4">
              <Button
                onClick={onAccept}
                disabled={busy}
                className="w-full bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-wider"
              >
                {busy ? "…" : "I have read & accept all the above"}
              </Button>
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                By accepting you agree to be bound by the Terms & Conditions v{CONSENT_VERSION}.
                You can sign out anytime to revoke access.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}