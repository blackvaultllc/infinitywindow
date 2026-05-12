import { CheckCircle2, Circle } from "lucide-react";

type Booking = {
  status: string;
  payment_status: string;
  payout_released: boolean;
  end_date?: string;
};

const STEPS = [
  { key: "requested", label: "Requested" },
  { key: "accepted", label: "Accepted" },
  { key: "paid", label: "Paid" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
] as const;

function progressOf(b: Booking): number {
  if (b.payout_released || b.status === "completed") return 5;
  const today = new Date().toISOString().slice(0, 10);
  if (b.payment_status === "paid" && b.end_date && today >= b.end_date) return 4;
  if (b.payment_status === "paid") return 3;
  if (b.status === "awaiting_payment" || b.status === "accepted") return 2;
  if (b.status === "pending") return 1;
  if (b.status === "cancelled") return 0;
  return 1;
}

export function BookingTimeline({ booking }: { booking: Booking }) {
  const reached = progressOf(booking);
  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
      {STEPS.map((s, i) => {
        const done = i + 1 <= reached;
        return (
          <div key={s.key} className="flex flex-1 items-center gap-1 min-w-0">
            <div className="flex flex-col items-center gap-0.5 min-w-0">
              {done ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span className={`truncate text-[10px] font-600 ${done ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-4 h-0.5 flex-1 ${i + 1 < reached ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
