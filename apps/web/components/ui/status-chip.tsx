import { cn } from "@/lib/utils";
import type { MarketStatus } from "@/lib/types";

const STYLES: Record<MarketStatus, { bg: string; live?: boolean; label: string }> = {
  live:      { bg: "#00B14F", live: true, label: "LIVE" },
  resolving: { bg: "#FFB800", live: true, label: "RESOLVING" },
  resolved:  { bg: "#0A0A0A", label: "RESOLVED" },
  disputed:  { bg: "#FF2D6F", label: "DISPUTED" },
};

export function StatusChip({ status, className }: { status: MarketStatus; className?: string }) {
  const s = STYLES[status];
  const isDark = status === "resolved" || status === "disputed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em]",
        isDark ? "text-canvas" : "text-ink",
        className,
      )}
      style={{ backgroundColor: s.bg }}
    >
      {s.live && (
        <span
          className="pulse-dot inline-block size-1.5 rounded-full border border-ink bg-ink"
        />
      )}
      {s.label}
    </span>
  );
}
