type Props = {
  showOnline?: boolean | null;
  lastSeenAt?: string | null;
  /** Minutes considered "online". Default 5. */
  thresholdMinutes?: number;
  className?: string;
};

/** Returns true if presence should be shown as online. */
export function isOnline(showOnline: boolean | null | undefined, lastSeenAt: string | null | undefined, thresholdMinutes = 5): boolean {
  if (!showOnline || !lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < thresholdMinutes * 60_000;
}

export function OnlineDot({ showOnline, lastSeenAt, thresholdMinutes = 5, className = "" }: Props) {
  const online = isOnline(showOnline, lastSeenAt, thresholdMinutes);
  return (
    <span
      title={online ? "Online" : "Offline"}
      aria-label={online ? "Online" : "Offline"}
      className={`inline-block h-2 w-2 rounded-full ${online ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.9)]" : "bg-muted-foreground/40"} ${className}`}
    />
  );
}
