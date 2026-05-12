import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type DateStatus = "available" | "blocked" | "booked";

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonth(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Sitter availability calendar.
 * - editable=true: sitter view, click to toggle blocked. Booked dates are read-only.
 * - editable=false: public/owner view, read-only.
 */
export function AvailabilityCalendar({
  sitterId,
  editable = false,
}: {
  sitterId: string;
  editable?: boolean;
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [booked, setBooked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busyDate, setBusyDate] = useState<string | null>(null);

  const monthCells = useMemo(() => buildMonth(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const monthLabel = cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const load = async () => {
    setLoading(true);
    const start = ymd(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
    const end = ymd(new Date(cursor.getFullYear(), cursor.getMonth() + 2, 0));

    const [{ data: avail }, { data: bks }] = await Promise.all([
      supabase
        .from("sitter_availability")
        .select("date, status")
        .eq("sitter_id", sitterId)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("bookings")
        .select("start_date, end_date, status, payment_status")
        .eq("sitter_id", sitterId)
        .gte("end_date", start)
        .lte("start_date", end),
    ]);

    const blockedSet = new Set<string>();
    (avail ?? []).forEach((r) => {
      if (r.status === "blocked") blockedSet.add(r.date);
    });

    const bookedSet = new Set<string>();
    (bks ?? []).forEach((b) => {
      const okStatus = ["confirmed", "accepted", "in_progress", "completed"].includes(b.status as string);
      const okPay = ["paid", "released"].includes(b.payment_status as string);
      if (!okStatus && !okPay) return;
      const s = new Date(b.start_date + "T00:00:00");
      const e = new Date(b.end_date + "T00:00:00");
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        bookedSet.add(ymd(d));
      }
    });

    setBlocked(blockedSet);
    setBooked(bookedSet);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [sitterId, cursor]);

  const statusOf = (d: Date): DateStatus => {
    const k = ymd(d);
    if (booked.has(k)) return "booked";
    if (blocked.has(k)) return "blocked";
    return "available";
  };

  const toggle = async (d: Date) => {
    if (!editable) return;
    const k = ymd(d);
    if (booked.has(k)) return toast.error("This date is booked — can't block it");
    setBusyDate(k);
    try {
      if (blocked.has(k)) {
        const { error } = await supabase.from("sitter_availability").delete().eq("sitter_id", sitterId).eq("date", k);
        if (error) throw error;
        const next = new Set(blocked); next.delete(k); setBlocked(next);
      } else {
        const { error } = await supabase
          .from("sitter_availability")
          .insert({ sitter_id: sitterId, date: k, status: "blocked" } as never);
        if (error) throw error;
        const next = new Set(blocked); next.add(k); setBlocked(next);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusyDate(null);
    }
  };

  const goPrev = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1));
  const goNext = () => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1));

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-700">
          <CalendarDays className="h-4 w-4 text-accent" /> {monthLabel}
        </h3>
        <div className="flex gap-1">
          <button onClick={goPrev} className="rounded-full border border-border px-2.5 py-1 text-xs font-600 hover:bg-muted">‹</button>
          <button onClick={goNext} className="rounded-full border border-border px-2.5 py-1 text-xs font-600 hover:bg-muted">›</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-700 uppercase tracking-wide text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i}>{d}</div>)}
      </div>

      {loading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {monthCells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = ymd(d);
            const s = statusOf(d);
            const past = k < ymd(today);
            const isToday = k === ymd(today);
            const base = "relative aspect-square rounded-lg text-xs font-600 transition select-none";
            const cls =
              s === "booked"
                ? "bg-primary text-primary-foreground"
                : s === "blocked"
                ? "bg-muted-foreground/30 text-foreground line-through"
                : past
                ? "bg-muted/40 text-muted-foreground"
                : "bg-emerald-500/10 text-foreground hover:bg-emerald-500/20";
            return (
              <button
                key={i}
                disabled={!editable || past || s === "booked" || busyDate === k}
                onClick={() => toggle(d)}
                className={`${base} ${cls} ${isToday ? "ring-2 ring-accent" : ""} ${editable && !past && s !== "booked" ? "cursor-pointer" : "cursor-default"}`}
                title={s === "booked" ? "Booked" : s === "blocked" ? "Blocked" : "Available"}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-emerald-500/30" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-muted-foreground/30" /> Blocked</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-primary" /> Booked</span>
        {editable && <span className="ml-auto">Tap a date to block / unblock</span>}
      </div>
    </div>
  );
}
