import Link from "next/link";
import type { Market } from "@/lib/types";
import { formatPct, formatUSD } from "@/lib/utils";
import { Sparkline } from "./ui/sparkline";
import { CategoryChip } from "./ui/category-chip";
import { StatusChip } from "./ui/status-chip";

interface Props {
  market: Market;
  variant?: "default" | "compact";
}

export function MarketCard({ market, variant = "default" }: Props) {
  const yesPct = formatPct(market.yesPrice, 0);
  const noPct = formatPct(1 - market.yesPrice, 0);
  const positive = market.yesPrice >= 0.5;

  return (
    <Link
      href={`/markets/${market.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp"
    >
      <div className="flex items-start gap-3 p-5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-raised text-xl font-black">
          {market.imageHint || "◇"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryChip category={market.category} />
            <StatusChip status={market.status} />
          </div>
          <h3 className="font-display mt-2 line-clamp-2 text-[17px] font-extrabold leading-snug text-ink">
            {market.title}
          </h3>
        </div>
        <div className="text-right">
          <p
            className="font-score text-3xl font-black leading-none tabular-nums"
            style={{ color: positive ? "#00B14F" : "#FF2D6F" }}
          >
            {yesPct}
          </p>
          <p className="font-score mt-1 text-[10px] font-bold uppercase tracking-wider text-muted">
            YES
          </p>
        </div>
      </div>

      {variant === "default" && (
        <div className="px-5">
          <div className="overflow-hidden rounded-xl border-2 border-ink bg-raised">
            <Sparkline points={market.history} positive={positive} height={56} width={520} className="w-full" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 border-t-2 border-ink bg-raised">
        <Stat label="Vol" value={formatUSD(market.volumeUSD, { compact: true })} />
        <Stat label="Liq" value={formatUSD(market.liquidityUSD, { compact: true })} border />
        <Stat label="Traders" value={market.traders.toLocaleString()} border />
      </div>

      <div className="flex gap-2 border-t-2 border-ink p-3">
        <div className="flex flex-1 items-center justify-between rounded-xl border-2 border-ink bg-pitch-50 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-pitch-900">Buy YES</span>
          <span className="font-score text-xs font-bold text-pitch-700">{yesPct}</span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-xl border-2 border-ink bg-crowd-100 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-magenta-700">Buy NO</span>
          <span className="font-score text-xs font-bold text-magenta-700">{noPct}</span>
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, value, border }: { label: string; value: string; border?: boolean }) {
  return (
    <div className={`px-3 py-2.5 ${border ? "border-l-2 border-ink" : ""}`}>
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-score text-xs font-bold text-ink">{value}</p>
    </div>
  );
}
