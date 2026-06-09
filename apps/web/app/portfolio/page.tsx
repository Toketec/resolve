import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Wallet } from "lucide-react";
import { CategoryChip } from "@/components/ui/category-chip";
import { StatusChip } from "@/components/ui/status-chip";
import { MOCK_POSITIONS, MOCK_TRADES, portfolioStats } from "@/lib/mock";
import { cn, formatPct, formatRelative, formatUSD } from "@/lib/utils";

export default function PortfolioPage() {
  const stats = portfolioStats();
  const positionsByStatus = {
    open: MOCK_POSITIONS.filter((p) => p.status === "live" || p.status === "resolving"),
    resolved: MOCK_POSITIONS.filter((p) => p.status === "resolved"),
  };
  const trades = MOCK_TRADES.slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Top bar */}
      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border-2 border-ink bg-pitch-500 p-8 text-ink shadow-stamp">
          <span aria-hidden className="pointer-events-none absolute inset-0 opacity-25 pattern-dots" />
          <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-goal-500 border-2 border-ink" />
          <div className="relative">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink/75">
              Portfolio · total value
            </span>
            <p className="font-display mt-3 text-6xl font-black tabular-nums leading-[0.9] sm:text-8xl">
              {formatUSD(stats.value)}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-card px-3 py-1 text-sm font-black uppercase tracking-wider"
                style={{ color: stats.pnl >= 0 ? "#00B14F" : "#FF2D6F" }}
              >
                {stats.pnl >= 0 ? <ArrowUpRight className="size-4" strokeWidth={3} /> : <ArrowDownRight className="size-4" strokeWidth={3} />}
                {formatUSD(stats.pnl)} · {formatPct(stats.pnlPct, 1)}
              </span>
              <span className="font-score text-sm font-bold uppercase tracking-wider text-ink/80">
                cost · <span className="text-ink">{formatUSD(stats.cost)}</span>
              </span>
              <span className="font-score text-sm font-bold uppercase tracking-wider text-ink/80">
                open · <span className="text-ink">{stats.open}</span>
              </span>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card p-6 shadow-stamp-sm">
          <div className="flex items-center gap-2">
            <Wallet className="size-4 text-ink" strokeWidth={2.5} />
            <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Wallet
            </p>
          </div>
          <p className="mt-3 text-sm font-medium text-ink/75">
            Mock wallet — connect a real wallet in the next phase.
          </p>
          <div className="mt-5 space-y-2">
            <Row label="Address" value="0x77a8…D8a9F1" />
            <Row label="Balance" value="2,134.50 USDC" />
            <Row label="Network" value="HTX · L2" />
          </div>
          <button className="mt-5 w-full rounded-full border-2 border-ink bg-goal-500 py-2.5 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp">
            Deposit USDC
          </button>
        </div>
      </section>

      {/* Open positions */}
      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-royal-700">
              Open positions
            </span>
            <h2 className="font-display mt-2 text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
              Your book.
            </h2>
          </div>
          <p className="font-score text-[11px] font-bold uppercase tracking-wider text-muted">
            {positionsByStatus.open.length} active
          </p>
        </div>
        <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-raised text-left">
                {["Market", "Side", "Shares", "Avg", "Current", "Value", "P&L"].map((h, i) => (
                  <th
                    key={h}
                    className={`font-score px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted ${
                      i > 1 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {positionsByStatus.open.map((p) => {
                const value = p.shares * p.currentPrice;
                const cost = p.shares * p.avgPrice;
                const pnl = value - cost;
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <Link href={`/markets/`} className="font-semibold text-ink hover:text-royal-500">
                        {p.marketTitle}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <CategoryChip category={p.marketCategory} />
                        <StatusChip status={p.status} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="font-display text-base font-black"
                        style={{ color: p.side === "YES" ? "#00B14F" : "#FF2D6F" }}
                      >
                        {p.side}
                      </span>
                    </td>
                    <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">
                      {p.shares}
                    </td>
                    <td className="font-score px-4 py-3 text-right text-sm font-bold text-muted">
                      {formatPct(p.avgPrice, 1)}
                    </td>
                    <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">
                      {formatPct(p.currentPrice, 1)}
                    </td>
                    <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">
                      {formatUSD(value)}
                    </td>
                    <td
                      className={cn("font-score px-4 py-3 text-right text-sm font-black")}
                      style={{ color: pnl >= 0 ? "#00B14F" : "#FF2D6F" }}
                    >
                      {formatUSD(pnl)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Settled */}
      {positionsByStatus.resolved.length > 0 && (
        <section className="mt-12">
          <div className="mb-6">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-magenta-700">
              Settled
            </span>
            <h2 className="font-display mt-2 text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
              History.
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {positionsByStatus.resolved.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border-2 border-ink bg-card p-5 shadow-stamp-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-sm font-black uppercase leading-snug tracking-tight text-ink">
                    {p.marketTitle}
                  </p>
                  <StatusChip status={p.status} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <SettledCell label="Side" value={p.side} accent={p.side === "YES" ? "#00B14F" : "#FF2D6F"} />
                  <SettledCell label="Shares" value={p.shares.toString()} />
                  <SettledCell
                    label="Settled"
                    value={formatPct(p.currentPrice)}
                    accent={p.currentPrice >= 0.5 ? "#00B14F" : "#FF2D6F"}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity */}
      <section className="mt-12">
        <div className="mb-6">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
            Activity
          </span>
          <h2 className="font-display mt-2 text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
            Recent trades.
          </h2>
        </div>
        <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-raised text-left">
                {["Market", "Side", "Price", "Shares", "When"].map((h, i) => (
                  <th
                    key={h}
                    className={`font-score px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted ${
                      i > 1 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">{t.marketTitle}</td>
                  <td className="px-4 py-3">
                    <span
                      className="font-display text-sm font-black"
                      style={{ color: t.side === "YES" ? "#00B14F" : "#FF2D6F" }}
                    >
                      {t.side}
                    </span>
                  </td>
                  <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">
                    {formatPct(t.price, 1)}
                  </td>
                  <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">{t.shares}</td>
                  <td className="font-score px-4 py-3 text-right text-xs font-bold text-muted">
                    {formatRelative(t.at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border-2 border-ink bg-raised px-3 py-2">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p className="font-score text-sm font-bold text-ink">{value}</p>
    </div>
  );
}

function SettledCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border-2 border-ink bg-raised px-2.5 py-1.5">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <p
        className="font-score text-sm font-black"
        style={{ color: accent ?? "#0A0A0A" }}
      >
        {value}
      </p>
    </div>
  );
}
