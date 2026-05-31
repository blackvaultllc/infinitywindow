import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { provisionHeir, backfillHeirCollection } from "@/lib/heir.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function HeirConsole() {
  const provision = useServerFn(provisionHeir);
  const backfill = useServerFn(backfillHeirCollection);
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);

  const handleProvision = async () => {
    if (pw.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await provision({ data: { password: pw } });
      toast.success(`Khadija's account is ready. User ID: ${(res as { userId: string }).userId.slice(0, 8)}…`);
      setPw("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackfill = async () => {
    setBackfillLoading(true);
    try {
      const res = (await backfill({})) as { ok: boolean; cards_copied?: number; reason?: string };
      if (res.ok) toast.success(`Copied ${res.cards_copied ?? 0} card stacks to Khadija.`);
      else toast.error(res.reason ?? "Backfill failed");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBackfillLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gold/40 bg-card/60 p-5">
      <div className="text-[10px] uppercase tracking-[0.3em] text-gold">Heir of the Dynasty</div>
      <h2 className="mt-1 font-display text-2xl">Set up Khadija's account</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Provisions <span className="font-mono">khadijahall0325x@gmail.com</span> as the heir.
        She inherits read-only access to every owner dashboard, mirrors all your card pulls,
        and plays the game like any other duelist — but cannot toggle settings, edit roles,
        or mutate the economy.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[220px]">
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Heir password
          </label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="re-enter the 'become the cup' password"
            className="mt-1"
            autoComplete="new-password"
          />
        </div>
        <Button
          onClick={handleProvision}
          disabled={loading}
          className="bg-gold text-gold-foreground hover:bg-gold/90"
        >
          {loading ? "Provisioning…" : "Set up Khadija's account"}
        </Button>
        <Button
          variant="outline"
          onClick={handleBackfill}
          disabled={backfillLoading}
        >
          {backfillLoading ? "Copying…" : "Backfill my collection → heir"}
        </Button>
      </div>
      <p className="mt-3 text-[10px] text-muted-foreground">
        Password is sent securely and stored only as a hash in the auth system — never written to code or logs.
        Re-running with a new password resets her credential.
      </p>
    </div>
  );
}