import { useState } from "react";
import { ChevronLeft, ChevronRight, X, MapPin, Calendar as CalIcon, Dog, Cat, Search, Loader2, Crosshair } from "lucide-react";
import { SERVICE_TYPES, DOG_SIZES, type ServiceKey, type DogSize } from "@/data/city-coords";
import { ALL_CITIES } from "@/data/cities";

export type SearchCriteria = {
  service: ServiceKey;
  location: { label: string; lat: number; lng: number } | null;
  startDate: string;
  endDate: string;
  numDogs: number;
  numPuppies: number;
  numCats: number;
  dogSize: DogSize;
  goodWithDogs: boolean;
  goodWithCats: boolean;
};

export const DEFAULT_CRITERIA: SearchCriteria = {
  service: "boarding",
  location: null,
  startDate: "",
  endDate: "",
  numDogs: 1,
  numPuppies: 0,
  numCats: 0,
  dogSize: "medium",
  goodWithDogs: false,
  goodWithCats: false,
};

export function SearchWizard({
  open, onClose, onApply, initial,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (c: SearchCriteria) => void;
  initial?: SearchCriteria;
}) {
  const [step, setStep] = useState(1);
  const [c, setC] = useState<SearchCriteria>(initial ?? DEFAULT_CRITERIA);
  const TOTAL = 6;

  if (!open) return null;

  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const finish = () => { onApply(c); onClose(); };

  const update = <K extends keyof SearchCriteria>(k: K, v: SearchCriteria[K]) => setC((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="relative flex w-full max-w-xl flex-col rounded-t-3xl bg-card shadow-warm sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="text-sm font-600 text-muted-foreground">Step {step} of {TOTAL}</p>
          <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* progress */}
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(step / TOTAL) * 100}%` }} />
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-6 sm:py-8">
          {step === 1 && <StepService value={c.service} onChange={(v) => update("service", v)} />}
          {step === 2 && <StepLocation value={c.location} onChange={(v) => update("location", v)} />}
          {step === 3 && <StepDates start={c.startDate} end={c.endDate} onChange={(s, e) => { update("startDate", s); update("endDate", e); }} service={c.service} />}
          {step === 4 && <StepPetCount c={c} update={update} />}
          {step === 5 && <StepDogSize value={c.dogSize} onChange={(v) => update("dogSize", v)} />}
          {step === 6 && <StepBehavior c={c} update={update} />}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4">
          {step > 1 ? (
            <button onClick={back} className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-600 hover:bg-muted">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : <span />}
          {step < TOTAL ? (
            <button onClick={next} className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-600 text-primary-foreground">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={finish} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-600 text-primary-foreground">
              <Search className="h-4 w-4" /> Show sitters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StepHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl font-700">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StepService({ value, onChange }: { value: ServiceKey; onChange: (v: ServiceKey) => void }) {
  return (
    <>
      <StepHeader title="What service do you need?" sub="You can change this later." />
      <div className="grid gap-2 sm:grid-cols-2">
        {SERVICE_TYPES.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`rounded-2xl border p-4 text-left transition-all ${value === s.key ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
          >
            <p className="font-600">{s.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.desc}</p>
          </button>
        ))}
      </div>
    </>
  );
}

function StepLocation({ value, onChange }: { value: SearchCriteria["location"]; onChange: (v: SearchCriteria["location"]) => void }) {
  const [q, setQ] = useState(value?.label ?? "");
  const [busy, setBusy] = useState<"geo" | "search" | null>(null);
  const [results, setResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);

  const useCurrent = () => {
    if (!navigator.geolocation) return;
    setBusy("geo");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ label: "Current location", lat: pos.coords.latitude, lng: pos.coords.longitude });
        setQ("Current location");
        setResults([]);
        setBusy(null);
      },
      () => setBusy(null),
      { timeout: 10000 }
    );
  };

  const search = async () => {
    if (!q.trim()) return;
    // Try local cities first
    const local = ALL_CITIES.filter((c) => `${c.city}, ${c.state}`.toLowerCase().includes(q.toLowerCase())).slice(0, 5);
    if (local.length) {
      // Use Nominatim for precise coords on the first match
    }
    setBusy("search");
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=us&q=${encodeURIComponent(q)}`);
      const json = (await res.json()) as { display_name: string; lat: string; lon: string }[];
      setResults(json);
    } catch {
      setResults([]);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <StepHeader title="Where are you?" sub="So we can show sitters nearby." />
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <label className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
            <MapPin className="h-4 w-4 text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="ZIP, city, or address"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <button onClick={search} disabled={busy === "search"} className="rounded-xl bg-primary px-4 text-sm font-600 text-primary-foreground">
            {busy === "search" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Find"}
          </button>
        </div>
        <button onClick={useCurrent} disabled={busy === "geo"} className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-600 hover:bg-muted">
          <Crosshair className="h-3.5 w-3.5" /> {busy === "geo" ? "Locating…" : "Use my current location"}
        </button>

        {value && results.length === 0 && (
          <div className="rounded-xl bg-secondary px-3 py-2 text-sm">📍 {value.label}</div>
        )}

        {results.length > 0 && (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => {
                    onChange({ label: r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) });
                    setQ(r.display_name);
                    setResults([]);
                  }}
                  className="block w-full p-3 text-left text-sm hover:bg-muted"
                >
                  {r.display_name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function StepDates({ start, end, onChange, service }: { start: string; end: string; onChange: (s: string, e: string) => void; service: ServiceKey }) {
  const isSingleDay = service === "drop_in" || service === "walking" || service === "day_care" || service === "training";
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <StepHeader title={isSingleDay ? "When do you need it?" : "Drop-off & pick-up dates"} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-600 text-muted-foreground">{isSingleDay ? "Date" : "Drop-off"}</span>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
            <CalIcon className="h-4 w-4 text-primary" />
            <input type="date" min={today} value={start} onChange={(e) => onChange(e.target.value, end || e.target.value)} className="w-full bg-transparent text-sm outline-none" />
          </div>
        </label>
        {!isSingleDay && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-600 text-muted-foreground">Pick-up</span>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5">
              <CalIcon className="h-4 w-4 text-primary" />
              <input type="date" min={start || today} value={end} onChange={(e) => onChange(start, e.target.value)} className="w-full bg-transparent text-sm outline-none" />
            </div>
          </label>
        )}
      </div>
    </>
  );
}

function StepPetCount({ c, update }: { c: SearchCriteria; update: <K extends keyof SearchCriteria>(k: K, v: SearchCriteria[K]) => void }) {
  return (
    <>
      <StepHeader title="How many pets?" sub="Add as many as you'll need care for." />
      <div className="space-y-3">
        <Counter icon={<Dog className="h-5 w-5" />} label="Dogs" value={c.numDogs} onChange={(v) => update("numDogs", v)} />
        <Counter icon={<Dog className="h-5 w-5" />} label="Puppies (under 1 year)" value={c.numPuppies} onChange={(v) => update("numPuppies", v)} />
        <Counter icon={<Cat className="h-5 w-5" />} label="Cats" value={c.numCats} onChange={(v) => update("numCats", v)} />
      </div>
    </>
  );
}

function Counter({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center gap-3">
        <span className="text-primary">{icon}</span>
        <span className="font-600">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-muted">−</button>
        <span className="w-6 text-center font-700">{value}</span>
        <button onClick={() => onChange(Math.min(10, value + 1))} className="grid h-8 w-8 place-items-center rounded-full border border-border hover:bg-muted">+</button>
      </div>
    </div>
  );
}

function StepDogSize({ value, onChange }: { value: DogSize; onChange: (v: DogSize) => void }) {
  return (
    <>
      <StepHeader title="Dog size" sub="Largest dog you have." />
      <div className="grid gap-2">
        {DOG_SIZES.map((s) => (
          <button
            key={s.key}
            onClick={() => onChange(s.key)}
            className={`rounded-2xl border p-4 text-left ${value === s.key ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border hover:border-primary/50"}`}
          >
            <p className="font-600">{s.label}</p>
          </button>
        ))}
      </div>
    </>
  );
}

function StepBehavior({ c, update }: { c: SearchCriteria; update: <K extends keyof SearchCriteria>(k: K, v: SearchCriteria[K]) => void }) {
  return (
    <>
      <StepHeader title="Behavior" sub="Helps us match you with sitters who'll be a great fit." />
      <div className="space-y-3">
        <Toggle label="My dog gets along with other dogs" value={c.goodWithDogs} onChange={(v) => update("goodWithDogs", v)} />
        <Toggle label="My dog gets along with cats" value={c.goodWithCats} onChange={(v) => update("goodWithCats", v)} />
      </div>
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left ${value ? "border-primary bg-primary/5" : "border-border"}`}
    >
      <span className="font-600">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition-colors ${value ? "bg-primary" : "bg-muted"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${value ? "left-5" : "left-0.5"}`} />
      </span>
    </button>
  );
}

