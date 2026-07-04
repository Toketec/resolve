import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, FileText } from "lucide-react";
import { CategoryChip } from "@/components/ui/category-chip";
import { StatusChip } from "@/components/ui/status-chip";
import { TradePanel } from "@/components/trade-panel";
import { PriceChart } from "@/components/price-chart";
import { OracleDeliberation } from "@/components/oracle-deliberation";
import { marketBySlug, MOCK_TRADES } from "@/lib/mock";
import { MOCK_AGENTS } from "@/lib/mock/agents";
import { fetchMarket, fetchAgents, fetchMarketTrades } from "@/lib/api-client";
import { getPoolState } from "@/lib/contract/settlement";
import { derive8004Id, type ApiAgent } from "@/lib/mappers";
import { formatPct, formatRelative, formatUSD, shortAddr } from "@/lib/utils";
import { TRONSCAN_SHASTA } from "@/lib/constants";
import type { Market } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** 将 mock/agents.ts 的 Agent 转为 ApiAgent 形状（仅 API 不可用时兜底） */
function mockToApi(): ApiAgent[] {
  return MOCK_AGENTS.map((a) => ({
    ...a,
    agentId: a.id,
    roleLabel: a.kind,
    tier: "active" as const,
    stance: ((a.tier ?? "NEUT") as "BULL" | "BEAR" | "NEUT"),
    poweredBy: a.modelHint,
    ba8004Id: derive8004Id(a.id),
  }));
}

export default async function MarketDetailPage({ params }: PageProps) {
  const { slug } = await params;
  // 从 API 读取市场；失败回退 mock（视觉不变）
  let market: Market | undefined;
  let agents: ApiAgent[] = mockToApi();
  let poolState: {
    yesPrice: number;
    noPrice: number;
    yesSupply: bigint;
    noSupply: bigint;
    liquidity: bigint; // USDD sun (6 decimals)
    feePool: bigint;   // USDD sun (6 decimals)
  } | null = null;

  try {
    const [m, a] = await Promise.all([fetchMarket(slug), fetchAgents()]);
    market = m;
    if (Array.isArray(a) && a.length) agents = a;
  } catch {
    market = marketBySlug(slug);
  }
  if (!market) notFound();

  // 尝试从链上获取实时 AMM 池状态（仅 live 市场）
  if (market.status === "live") {
    try {
      const pool = await getPoolState(slug);
      const PRICE_DECIMALS = BigInt("1000000000000000000"); // 1e18
      poolState = {
        yesPrice: Number(pool.yesPrice) / Number(PRICE_DECIMALS),
        noPrice:  Number(pool.noPrice)  / Number(PRICE_DECIMALS),
        yesSupply: pool.yesSupply,
        noSupply:  pool.noSupply,
        liquidity: pool.liquidity,
        feePool:   pool.feePool,
      };
    } catch {
      // 链上查询失败 → 保持 mock/DB 数据
    }
  }

  // 使用链上价格 + 流动性覆盖 mock 数据
  const displayMarket: Market = poolState
    ? {
        ...market,
        yesPrice: poolState.yesPrice,
        liquidityUSD: Number(poolState.liquidity) / 1e6,
      }
    : market;

  const trades = await fetchMarketTrades(slug).catch(() =>
    MOCK_TRADES.filter((t) => t.marketId === displayMarket.id).slice(0, 8),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Breadcrumb */}
      <nav className="font-score flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-muted">
        <Link href="/markets" className="hover:text-ink">/ markets</Link>
        <span>·</span>
        <Link href={`/markets?category=${displayMarket.category}`} className="hover:text-ink">
          {displayMarket.category}
        </Link>
      </nav>

      {/* Two-column layout: left = content, right = KPIs + sidebar */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Title section */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <CategoryChip category={displayMarket.category} size="md" />
              <StatusChip status={displayMarket.status} />
              {poolState && (
                <span className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-goal-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                  ● live chain
                </span>
              )}
              <span className="font-score text-[11px] font-bold uppercase tracking-wider text-muted">
                expires {formatRelative(displayMarket.expiresAt)}
              </span>
            </div>
            <h1 className="font-display mt-4 text-4xl font-black uppercase leading-[0.95] tracking-tight text-ink sm:text-5xl">
              {displayMarket.title}
            </h1>
            <p className="mt-4 text-base font-medium text-ink/75">{displayMarket.description}</p>
          </div>

          <PriceChart history={displayMarket.history} yesPrice={displayMarket.yesPrice} />

          {/* Consensus + Agent votes (interactive: force resolve, staged reveal, x402) */}
          <OracleDeliberation market={displayMarket} agents={agents} />

          {/* Resolution criteria */}
          <section className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
            <div className="flex items-center justify-between border-b-2 border-ink bg-raised px-4 py-3">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Resolution criteria
              </p>
              <FileText className="size-3.5 text-muted" />
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-ink/85">{displayMarket.resolutionCriteria}</p>
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

        {/* RIGHT SIDEBAR: KPIs + trade + details */}
        <aside className="space-y-6">
          {/* Market KPIs */}
          <div className="grid grid-cols-2 gap-3">
            {poolState ? (
              <>
                <KPI label="YES price" value={formatPct(poolState.yesPrice)} accent={poolState.yesPrice >= 0.5 ? "#00B14F" : "#FF2D6F"} />
                <KPI label="NO price" value={formatPct(poolState.noPrice)} accent={poolState.noPrice >= 0.5 ? "#00B14F" : poolState.noPrice > 0.3 ? "#0A0A0A" : "#FF2D6F"} />
                <KPI label="Liquidity" value={formatUSD(Number(poolState.liquidity) / 1e6, { compact: true })} />
                <KPI label="Pool fees" value={formatUSD(Number(poolState.feePool) / 1e6, { compact: true })} />
                <KPI label="HTX Stake" value={formatUSD(Number(poolState.feePool) / 1e6, { compact: true }) + " $HTX"} className="col-span-2" />
              </>
            ) : (
              <>
                <KPI label="Volume" value={formatUSD(displayMarket.volumeUSD, { compact: true })} />
                <KPI label="Liquidity" value={formatUSD(displayMarket.liquidityUSD, { compact: true })} />
                <KPI label="Traders" value={displayMarket.traders.toLocaleString()} />
                <KPI
                  label={displayMarket.status === "resolved" ? "Outcome" : "YES price"}
                  value={displayMarket.status === "resolved" ? displayMarket.resolvedOutcome ?? "—" : formatPct(displayMarket.yesPrice)}
                  accent={displayMarket.yesPrice >= 0.5 ? "#00B14F" : "#FF2D6F"}
                />
                <KPI label="HTX Stake" value="— (airbag)" className="col-span-2" />
              </>
            )}
          </div>

          <TradePanel market={displayMarket} />

          <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
            <div className="border-b-2 border-ink bg-raised px-4 py-3">
              <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
                Market details
              </p>
            </div>
            <div className="divide-y-2 divide-line">
              <Row label="Created" value={formatRelative(displayMarket.createdAt)} />
              <Row label="Expires" value={formatRelative(displayMarket.expiresAt)} />
              <Row label="Creator" value={displayMarket.creator.name} sub={shortAddr(displayMarket.creator.address)} />
              {displayMarket.settlementTxHash && (
                <div className="flex items-center justify-between px-4 py-3">
                  <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                    Deployment
                  </p>
                  <a
                    href={`${TRONSCAN_SHASTA}/#/transaction/${displayMarket.settlementTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-1 text-right"
                  >
                    <p className="text-sm font-semibold text-ink underline decoration-line underline-offset-2 group-hover:text-pitch-700 transition">
                      {shortAddr(displayMarket.settlementTxHash)}
                    </p>
                    <ExternalLink className="size-3 text-muted group-hover:text-ink transition" />
                  </a>
                </div>
              )}
              <Row label="Category" value={displayMarket.category} />
              <Row label="Threshold" value={`${Math.round((displayMarket.consensus?.threshold ?? 0.65) * 100)}%`} />
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

function KPI({ label, value, accent, className }: { label: string; value: string; accent?: string; className?: string }) {
  return (
    <div className={`rounded-2xl border-2 border-ink bg-card px-3 py-3 shadow-stamp-sm ${className ?? ""}`}>
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
