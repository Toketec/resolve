import Link from "next/link";
import { Cpu, Globe2, Newspaper, Radio, ShieldCheck, Activity, TrendingUp, TrendingDown, Scale, Database, BadgeCheck, ExternalLink } from "lucide-react";
import { MOCK_AGENTS, MOCK_MARKETS } from "@/lib/mock";
import { fetchAgents, fetchMarkets } from "@/lib/api-client";
import { formatPct } from "@/lib/utils";
import { AGENT_REGISTRY_ADDRESS, TRONSCAN_SHASTA } from "@/lib/constants";
import type { Agent, Market } from "@/lib/types";

const KIND_ICON: Record<string, React.ReactNode> = {
  "exchange-oracle": <Activity className="size-5" strokeWidth={2.5} />,
  "media-oracle": <Newspaper className="size-5" strokeWidth={2.5} />,
  "onchain-oracle": <Cpu className="size-5" strokeWidth={2.5} />,
  "tech-oracle": <Globe2 className="size-5" strokeWidth={2.5} />,
  "regulation-oracle": <ShieldCheck className="size-5" strokeWidth={2.5} />,
  "macro-oracle": <Radio className="size-5" strokeWidth={2.5} />,
};

/** Tier grouping with visual labels for 2+2+2 BULL/BEAR/NEUT architecture. */
const TIER_META: Record<string, { label: string; color: string }> = {
  BULL: { label: "BULL · Bullish", color: "bg-pitch-500 text-ink" },
  BEAR: { label: "BEAR · Bearish", color: "bg-magenta-500 text-canvas" },
  NEUT: { label: "NEUT · Neutral", color: "bg-royal-500 text-canvas" },
};

const STATUS_BG: Record<string, string> = {
  online: "bg-pitch-500",
  syncing: "bg-goal-500",
  offline: "bg-magenta-500",
};

const TONE_BY_INDEX = [
  { bg: "bg-royal-500", ink: "light" as const },
  { bg: "bg-pitch-500", ink: "dark" as const },
  { bg: "bg-magenta-500", ink: "light" as const },
  { bg: "bg-goal-500", ink: "dark" as const },
  { bg: "bg-cyan-500", ink: "dark" as const },
  { bg: "bg-indigo-500", ink: "light" as const },
];

export default async function AgentsPage() {
  // 服务端从 API 读取；失败回退 mock（视觉不变）
  let agents: Agent[] = MOCK_AGENTS;
  let markets: Market[] = MOCK_MARKETS;
  try {
    const [a, m] = await Promise.all([fetchAgents(), fetchMarkets()]);
    if (Array.isArray(a) && a.length) agents = a;
    if (Array.isArray(m) && m.length) markets = m;
  } catch {
    /* 保持 mock 兜底 */
  }

  // 检测是否有 Agent 带真实链上地址（DB 已通过 sync 脚本同步）
  const hasOnchain = agents.some(
    (a: any) => a.ba8004Id && a.ba8004Id.startsWith("T") && !a.ba8004Id.startsWith("TXYZ"),
  );

  const recent = markets.filter((m) => m.status === "resolved" || m.status === "resolving");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-ink bg-ink p-8 text-canvas shadow-stamp-lg sm:p-14">
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-25 pattern-dots-light" />
        <span aria-hidden className="pointer-events-none absolute -right-16 -top-16 size-44 rounded-full border-2 border-canvas bg-pitch-500" />
        <span aria-hidden className="pointer-events-none absolute -bottom-12 right-32 hidden size-28 rounded-tl-full bg-goal-500 sm:block" />
        <div className="relative">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-pitch-500">
            Oracle network
          </span>
          <h1 className="font-display mt-4 text-5xl font-black uppercase leading-[0.9] tracking-tight sm:text-8xl">
            Six oracles.<br />
            <span className="text-pitch-500">Always on.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base font-medium text-canvas/85">
            Each oracle is an independent AI agent reading a different slice of
            reality. They never see each other&apos;s output until they vote.
            Consensus is verifiable. Disagreement is logged.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi label="Active" value="6" />
            <Kpi label="Resolutions" value="19,351" />
            <Kpi label="Uptime" value="99.91%" accent="text-pitch-500" />
            <Kpi label="Avg conf" value="92%" accent="text-goal-500" />
          </div>
        </div>
      </section>

      {/* Agent grid */}
      <section className="mt-14">
        <header className="mb-8 flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-royal-700">
            Fleet
          </span>
          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-ink sm:text-5xl">
            Meet the agents.
          </h2>
        </header>

        {/* Tier group headers — BULL / BEAR / NEUT */}
        <div className="mb-6 flex flex-wrap gap-3">
          {(["BULL", "BEAR", "NEUT"] as const).map((tier) => {
            const meta = TIER_META[tier];
            const Icon = tier === "BULL" ? TrendingUp : tier === "BEAR" ? TrendingDown : Scale;
            return (
              <span
                key={tier}
                className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] shadow-stamp-sm ${meta.color}`}
              >
                <Icon className="size-3" strokeWidth={2.5} />
                {meta.label}
              </span>
            );
          })}
        </div>

        {/* 链上身份验证 — AgentRegistry 合约 */}
        {AGENT_REGISTRY_ADDRESS && (
          <a
            href={`${TRONSCAN_SHASTA}/#/address/${AGENT_REGISTRY_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 flex flex-col gap-3 rounded-2xl border-2 border-pitch-500 bg-pitch-50 p-5 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-pitch-500 bg-pitch-100">
                <Database className="size-5 text-pitch-700" strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-pitch-700">
                  AgentRegistry · On-chain · Shasta Testnet
                </p>
                <p className="font-score mt-0.5 text-xs font-bold text-ink">
                  {AGENT_REGISTRY_ADDRESS}
                </p>
              </div>
            </div>
            <span className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border-2 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-stamp-sm sm:self-center ${
              hasOnchain
                ? "border-pitch-500 bg-pitch-500 text-canvas"
                : "border-ink bg-card text-ink"
            }`}>
              <BadgeCheck className="size-3" />
              {hasOnchain ? "6 agents verified" : "verify on Tronscan"}
              <ExternalLink className="size-3" />
            </span>
          </a>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((a, i) => {
            const tone = TONE_BY_INDEX[i % TONE_BY_INDEX.length];
            const inkClass = tone.ink === "light" ? "text-canvas" : "text-ink";
            const dimClass = tone.ink === "light" ? "text-canvas/80" : "text-ink/70";
            return (
              <div
                key={a.id}
                className={`relative overflow-hidden rounded-3xl border-2 border-ink p-6 shadow-stamp transition hover:-translate-y-0.5 hover:shadow-stamp-lg ${tone.bg} ${inkClass}`}
              >
                <span
                  aria-hidden
                  className={`pointer-events-none absolute inset-0 opacity-25 ${
                    tone.ink === "light" ? "pattern-dots-light" : "pattern-dots"
                  }`}
                />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-xl border-2 border-current">
                      {KIND_ICON[a.kind]}
                    </span>
                    <p className={`font-score text-[10px] font-bold uppercase tracking-[0.18em] ${dimClass}`}>
                      {a.callsign}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border-2 border-ink ${STATUS_BG[a.status]} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink`}
                  >
                    <span className="pulse-dot inline-block size-1.5 rounded-full bg-ink" />
                    {a.status}
                  </span>
                </div>
                <h3 className="font-display relative mt-5 text-3xl font-black uppercase leading-[0.92] tracking-tight">
                  {a.name}
                </h3>
                <p className={`relative mt-3 text-sm font-medium ${dimClass}`}>{a.description}</p>
                <div className="relative mt-5 grid grid-cols-2 gap-2">
                  <Mini label="Uptime" value={formatPct(a.uptimePct, 2)} tone={tone.ink} />
                  <Mini label="Accuracy" value={formatPct(a.accuracyPct, 1)} tone={tone.ink} />
                  <Mini label="Resolutions" value={a.resolutions.toLocaleString()} tone={tone.ink} />
                  <Mini label="Avg conf" value={formatPct(a.avgConfidence)} tone={tone.ink} />
                </div>
                <div className={`font-score relative mt-4 flex flex-col gap-1 border-t-2 border-current pt-3 text-[10px] font-bold uppercase tracking-wider ${dimClass}`}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>model · {a.modelHint}</span>
                    {a.modelHint.includes("B.AI") && (
                      <span className="rounded-full border border-current px-1.5 py-px text-[9px] text-pitch-600 dark:text-pitch-400">⚡ Powered by B.AI</span>
                    )}
                  </div>
                  <span>$HTX earned · {(a.htxEarned ?? 0).toLocaleString()} USDD</span>
                  <span>{a.region}</span>
                  {/* 链上身份地址 — 数据来自 DB tron_address */}
                  {((a as any).ba8004Id &&
                    (a as any).ba8004Id.startsWith("T") &&
                    !(a as any).ba8004Id.startsWith("TXYZ")) && (
                    <span className="inline-flex items-center gap-1">
                      <BadgeCheck className="size-2.5 shrink-0 text-pitch-600" />
                      <span className="truncate">on-chain · {(a as any).ba8004Id.slice(0, 6)}…{(a as any).ba8004Id.slice(-4)}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent deliberations */}
      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-cyan-700">
              Recent deliberations
            </span>
            <h2 className="font-display mt-2 text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl">
              Latest calls.
            </h2>
          </div>
          <Link href="/markets" className="text-sm font-black uppercase tracking-wider text-ink hover:text-magenta-500">
            view all →
          </Link>
        </div>
        <div className="overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-ink bg-raised text-left">
                {["Market", "Status", "Confidence", "Outcome", "Votes"].map((h, i) => (
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
              {recent.map((m) => (
                <tr key={m.id} className="border-b border-line last:border-0 hover:bg-raised/60">
                  <td className="px-4 py-3">
                    <Link href={`/markets/${m.slug}`} className="font-semibold text-ink hover:text-royal-500">
                      {m.title}
                    </Link>
                    <p className="font-score mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      {m.category}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="font-score text-[10px] font-bold uppercase tracking-wider"
                      style={{
                        color: m.status === "resolved" ? "#0A0A0A" : "#E69500",
                      }}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">
                    {m.consensus ? formatPct(m.consensus.confidence) : "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className="font-display text-base font-black"
                      style={{
                        color:
                          m.consensus?.outcome === "YES"
                            ? "#00B14F"
                            : m.consensus?.outcome === "NO"
                            ? "#FF2D6F"
                            : "#5B5B58",
                      }}
                    >
                      {m.consensus?.outcome ?? "—"}
                    </span>
                  </td>
                  <td className="font-score px-4 py-3 text-right text-sm font-bold text-ink">
                    {m.consensus?.votes.length ?? 0} / 6
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

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-2xl border-2 border-canvas/40 bg-canvas/10 px-4 py-3 backdrop-blur">
      <p className="font-score text-[10px] font-bold uppercase tracking-wider text-canvas/65">
        {label}
      </p>
      <p className={`font-display mt-1 text-2xl font-black tabular-nums ${accent ?? "text-canvas"}`}>
        {value}
      </p>
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "light" | "dark";
}) {
  const bg = tone === "light" ? "bg-canvas/15 border-canvas/40" : "bg-ink/8 border-ink/30";
  const labelClass = tone === "light" ? "text-canvas/65" : "text-ink/55";
  return (
    <div className={`rounded-xl border-2 ${bg} px-2.5 py-1.5`}>
      <p className={`font-score text-[10px] font-bold uppercase tracking-wider ${labelClass}`}>
        {label}
      </p>
      <p className="font-score text-sm font-bold">{value}</p>
    </div>
  );
}
