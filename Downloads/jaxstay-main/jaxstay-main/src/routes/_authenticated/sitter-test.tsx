import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/sitter-test")({
  head: () => ({ meta: [{ title: "Sitter Qualification Test — JaxStay" }] }),
  component: SitterTest,
});

// Questions only — answers are graded server-side in the grade-sitter-test edge function
const QUESTIONS = [
  { q: "A dog suddenly collapses on a walk. First action?", options: ["Carry them to shade and call the owner & emergency vet", "Give water and continue walking", "Wait 30 min and see"] },
  { q: "Two dogs in your care start growling stiffly at each other. You should…", options: ["Yell loudly to stop them", "Calmly separate them into different rooms", "Let them work it out"] },
  { q: "Safe chocolate dose for a dog?", options: ["A small piece is fine", "None — chocolate is toxic", "Only milk chocolate"] },
  { q: "Owner gives medication instructions. You should…", options: ["Skip if dog refuses", "Follow exactly and log every dose", "Adjust dose to your judgment"] },
  { q: "Off-leash in a public, non-designated area is…", options: ["Fine if dog is friendly", "Never acceptable on JaxStay bookings", "Up to the sitter"] },
  { q: "Dog eats a sock. You should…", options: ["Wait to see if it passes", "Call owner & vet immediately", "Induce vomiting yourself"] },
  { q: "Required JaxStay safety practice?", options: ["Daily owner update with photo", "Weekly summary only", "No updates needed"] },
  { q: "Heat stroke signs include…", options: ["Heavy panting, drooling, weakness", "Cold paws", "Excess sleeping"] },
];

function SitterTest() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(-1));
  const [result, setResult] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (answers.some((a) => a < 0)) return toast.error("Answer every question");
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-sitter-test", {
        body: { answers },
      });
      if (error) throw error;
      setResult(data as { score: number; total: number; passed: boolean });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (result) return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-16 text-center">
        <CheckCircle2 className={`mx-auto h-14 w-14 ${result.passed ? "text-accent" : "text-muted-foreground"}`} />
        <h1 className="mt-4 font-display text-3xl font-700">{result.passed ? "You passed!" : "Not quite — try again"}</h1>
        <p className="mt-2 text-muted-foreground">Score: {result.score}/{result.total} — passing is 7/8.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/dashboard" className="rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground">Go to dashboard</Link>
          {!result.passed && <button onClick={() => { setResult(null); setAnswers(Array(QUESTIONS.length).fill(-1)); }} className="rounded-full border border-border px-5 py-2.5 text-sm font-600">Retry</button>}
        </div>
      </section>
    </SiteLayout>
  );

  return (
    <SiteLayout>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-700">Sitter Qualification Test</h1>
        <p className="mt-2 text-muted-foreground">Pass 7 of 8 to unlock your public listing and reviews.</p>
        <ol className="mt-8 space-y-6">
          {QUESTIONS.map((q, i) => (
            <li key={i} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-600">{i + 1}. {q.q}</p>
              <div className="mt-3 space-y-2">
                {q.options.map((opt, j) => (
                  <label key={j} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary">
                    <input type="radio" name={`q${i}`} checked={answers[i] === j} onChange={() => { const next = [...answers]; next[i] = j; setAnswers(next); }} />
                    {opt}
                  </label>
                ))}
              </div>
            </li>
          ))}
        </ol>
        <button onClick={submit} disabled={submitting} className="mt-8 w-full rounded-full bg-primary px-5 py-3 text-sm font-600 text-primary-foreground disabled:opacity-50">{submitting ? "Submitting…" : "Submit test"}</button>
      </section>
    </SiteLayout>
  );
}
