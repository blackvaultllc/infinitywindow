import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, ExternalLink, Upload, Loader2, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type VerificationStatus = "not_started" | "uploaded" | "approved" | "rejected";

export function VerificationCard({ userId }: { userId: string }) {
  const [status, setStatus] = useState<VerificationStatus>("not_started");
  const [docPath, setDocPath] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.rpc("get_my_profile");
    if (data) {
      const d = data as { verification_status?: VerificationStatus; verification_doc_path?: string | null; verification_notes?: string | null };
      setStatus((d.verification_status ?? "not_started") as VerificationStatus);
      setDocPath(d.verification_doc_path ?? null);
      setNotes(d.verification_notes ?? null);
    }
  };

  useEffect(() => {
    void load();
  }, [userId]);

  useEffect(() => {
    if (!docPath) { setSignedUrl(null); return; }
    void supabase.storage.from("background-checks").createSignedUrl(docPath, 60 * 30).then(({ data }) => {
      setSignedUrl(data?.signedUrl ?? null);
    });
  }, [docPath]);

  const upload = async (file: File) => {
    if (!file.type.includes("pdf") && !file.type.startsWith("image/")) {
      return toast.error("Upload a PDF or image of your background check");
    }
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10 MB");
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const path = `${userId}/bg-check.${ext}`;
      const { error } = await supabase.storage.from("background-checks").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ verification_doc_path: path, verification_status: "uploaded" } as never)
        .eq("id", userId);
      if (pErr) throw pErr;
      toast.success("Background check uploaded — admin will review shortly");
      void load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const badge = () => {
    if (status === "approved")
      return <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-xs font-700 text-amber-700 dark:text-amber-300">🛡️ Verified</span>;
    if (status === "uploaded")
      return <span className="rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-600 text-blue-700 dark:text-blue-300">Pending review</span>;
    if (status === "rejected")
      return <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-600 text-destructive">Rejected — please re-upload</span>;
    return <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-600 text-muted-foreground">Not verified (Qualified)</span>;
  };

  return (
    <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-2xl font-600">
            <ShieldCheck className="h-5 w-5 text-accent" /> Background Verification
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Earn the gold-shield <span className="font-600">Verified</span> badge so owners trust you faster. Sitters who haven't completed this stay listed as <span className="font-600">Qualified</span>.
          </p>
        </div>
        {badge()}
      </div>

      <ol className="mt-4 grid gap-2 rounded-2xl bg-muted/40 p-4 text-sm">
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-700 text-primary-foreground">1</span>
          <div>
            <p className="font-600">Run your background check via Checkr</p>
            <p className="text-xs text-muted-foreground">$25–$35 self-serve. Results take 1–3 business days.</p>
            <a href="https://checkr.com/individuals" target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-600 text-primary hover:underline">
              Open Checkr <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-700 text-primary-foreground">2</span>
          <div>
            <p className="font-600">Download your completed report (PDF)</p>
            <p className="text-xs text-muted-foreground">Checkr emails it to you when finished.</p>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-700 text-primary-foreground">3</span>
          <div>
            <p className="font-600">Upload it below</p>
            <p className="text-xs text-muted-foreground">Stored privately. Only you and JaxStay admins can view it.</p>
          </div>
        </li>
      </ol>

      {status === "rejected" && notes && (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">
          <ShieldAlert className="h-4 w-4 shrink-0" /> <span>Reason: {notes}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-600 text-primary-foreground">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {docPath ? "Re-upload report" : "Upload report"}
          <input type="file" accept="application/pdf,image/*" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        </label>
        {signedUrl && (
          <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted">
            <FileText className="h-4 w-4" /> View uploaded report
          </a>
        )}
      </div>
    </div>
  );
}
