import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { CategoryChip } from "@/components/ui/category-chip";
import { StatusChip } from "@/components/ui/status-chip";
import { TradePanel } from "@/components/trade-panel";
import { PriceChart } from "@/components/price-chart";
import { OracleDeliberation } from "@/components/oracle-deliberation";
import { marketBySlug, MOCK_TRADES } from "@/lib/mock";
import { fetchMarket, fetchAgents } from "@/lib/api-client";
import { FALLBACK_AGENTS, type ApiAgent } from "@/lib/mappers";
import { formatPct, formatRelative, formatUSD, shortAddr } from "@/lib/utils";
import type { Market } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;
  // 从 API 读取市场；失败回退 mock（视觉不变）
  let market: Market | undefined;
  let agents: ApiAgent[] = FALLBACK_AGENTS;
  try {
    const [m, a] = await Promise.all([fetchMarket(slug), fetchAgents()]);
    market = m;
    if (Array.isArray(a) && a.length) agents = a;
  } catch {
    market = marketBySlug(slug);
  }
  if (!market) notFound();

  const trades = MOCK_TRADES.filter((t) => t.marketId === market.id).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Breadcrumb */}
      <nav className="font-score flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
        <Link href="/markets" className="hover:text-ink">/ markets</Link>
        <span>·</span>
        <Link href={`/markets?category=${market.category}`} className="hover:text-ink">
          {market.category}
        </Link>
      </nav>

      {/* Title block */}
      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={market.category} size="md" />
            <StatusChip status={market.status} />
            <span className="font-score text-[11px] font-bold uppercase tracking-wider text-muted">
              expires {formatRelative(market.expiresAt)}
            </span>
          </div>
          <h1 className="font-display mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
            {market.title}
          </h1>
          <p className="mt-4 max-w-2xl text-base font-medium text-ink/75">{market.description}</p>
        </div>
        <div className="grid w-full max-w-md grid-cols-2 gap-3">
          <KPI label="Volume" value={formatUSD(market.volumeUSD, { compact: true })} />
          <KPI label="Liquidity" value={formatUSD(market.liquidityUSD, { compact: true })} />
          <KPI label="Traders" value={market.traders.toLocaleString()} />
          <KPI
            label={market.status === "resolved" ? "Outcome" : "YES price"}
            value={market.status === "resolved" ? market.resolvedOutcome ?? "—" : formatPct(market.yesPrice)}
            accent={market.yesPrice >= 0.5 ? "#00B14F" : "#FF2D6F"}
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <PriceChart history={market.history} yesPrice={market.yesPrice} />

          {/* Consensus + Agent votes (interactive: force resolve, staged reveal, x402) */}
          <OracleDeliberation market={market} agents={agents} />

          {/* Resolution criteria */}
          <section className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
            <div className="flex items-center justify-between border-b-2 border-ink bg-raised px-4 py-3">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Resolution criteria
              </p>
              <FileText className="size-3.5 text-muted" />
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-ink/85">{market.resolutionCriteria}</p>
            </div>
          </section>

          {/* Recent trades */}
          <section className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
            <div className="flex items-center justify-between border-b-2 border-ink bg-raised px-4 py-3">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Recent trades
              </p>
              <p className="font-score text-[10px] font-bold text-muted">{trades.length} latest</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-ink bg-card text-left">
                    {["Trader", "Side", "Price", "Shares", "When"].map((h, i) => (
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
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-ink">{t.user.name}</p>
                        <p className="font-score text-[10px] font-bold text-muted">{shortAddr(t.user.address)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="font-score text-xs font-black"
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

        {/* Sidebar */}
        <aside className="space-y-6">
          <TradePanel market={market} />

          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
            <div className="border-b-2 border-ink bg-raised px-4 py-3">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Market details
              </p>
            </div>
            <div className="divide-y-2 divide-line">
              <Row label="Created" value={formatRelative(market.createdAt)} />
              <Row label="Expires" value={formatRelative(market.expiresAt)} />
              <Row label="Creator" value={market.creator.name} sub={shortAddr(market.creator.address)} />
              <Row label="Category" value={market.category} />
              <Row label="Threshold" value={`${Math.round((market.consensus?.threshold ?? 0.65) * 100)}%`} />
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-goal-500 p-5 shadow-stamp-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink">
                Share market
              </p>
              <ArrowUpRight className="size-3.5 text-ink" />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink/85">
              Every outcome ships with a signed evidence bundle. Embed in a tweet,
              forum, or dashboard.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-card px-3 py-3 shadow-stamp-sm">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className="font-display mt-1 text-xl font-black tabular-nums"
        style={{ color: accent ?? "#0A0A0A" }}
      >
        {value}
      </p>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{label}</p>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{value}</p>
        {sub && <p className="font-score text-[10px] font-bold text-muted">{sub}</p>}
      </div>
    </div>
  );
}
