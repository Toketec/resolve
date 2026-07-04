"use client";

// ─────────────────────────────────────────────
// OracleDeliberation — 市场详情页的 AI 共识交互区
// ─────────────────────────────────────────────
// 负责：?dev=1 隐藏 Force Resolve 触发器、调用 resolve API、投票逐条浮现动画、
// resolving 轮询、共识达成后 x402 微支付展示、settle 结算、8004 身份 + Tronscan 链接。
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink, Globe2, ShieldCheck, Zap, Loader2, BadgeCheck, Database } from "lucide-react";
import { ConsensusMeter } from "@/components/consensus-meter";
import { resolveMarketConsensus, settle as settleApi } from "@/lib/api-client";
import { settleX402, type X402Receipt } from "@/lib/contract/x402";
import { TRONSCAN_SHASTA, AGENT_REGISTRY_ADDRESS } from "@/lib/constants";
import { formatPct } from "@/lib/utils";
import type { Market, AIConsensus, AgentVote } from "@/lib/types";
import type { ApiAgent } from "@/lib/mappers";

const REVEAL_MS = 1200;
const POLL_MS = 3000;

// 与 packages/ai/consensus.ts 对齐的角色权重（按 agentId）
const WEIGHT: Record<string, number> = {
  "bull-1": 1.0, "bull-2": 0.8, "bear-1": 0.8, "bear-2": 0.8, "neut-1": 0.9, "neut-2": 0.9,
};

type Phase = "idle" | "resolving" | "revealing" | "done" | "error";

function partialConsensus(full: AIConsensus, shown: number): AIConsensus {
  const votes = full.votes.slice(0, shown);
  let yesW = 0, noW = 0;
  for (const v of votes) {
    const w = WEIGHT[v.agentId] ?? 1;
    if (v.vote === "YES") yesW += w * v.confidence;
    else noW += w * v.confidence;
  }
  const total = yesW + noW;
  const confidence = total > 0 ? Math.max(yesW, noW) / total : 0;
  const allShown = shown >= full.votes.length;
  return {
    ...full,
    votes,
    confidence: allShown ? full.confidence : confidence,
    outcome: total > 0 ? (yesW >= noW ? "YES" : "NO") : full.outcome,
    status: allShown ? full.status : "deliberating",
  };
}

export function OracleDeliberation({
  market,
  agents,
}: {
  market: Market;
  agents: ApiAgent[];
}) {
  const initial = market.consensus;
  const [phase, setPhase] = useState<Phase>(
    initial?.status === "consensus" ? "done" : "idle",
  );
  const [full, setFull] = useState<AIConsensus | null>(
    initial && initial.votes.length > 0 ? initial : null,
  );
  const [shown, setShown] = useState(initial?.votes.length ?? 0);
  const [isDev, setIsDev] = useState(false);
  const [x402, setX402] = useState<X402Receipt | null>(null);
  const [settleTx, setSettleTx] = useState<{ txHash: string; simulated: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revealTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const agentMap = new Map(agents.map((a) => [a.agentId, a]));

  // ?dev=1 检测（SSR 安全）
  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      setIsDev(p.get("dev") === "1");
    }
  }, []);

  // 逐条浮现：full 就绪后启动
  const startReveal = useCallback((consensus: AIConsensus) => {
    setFull(consensus);
    setShown(0);
    setPhase("revealing");
    let i = 0;
    if (revealTimer.current) clearInterval(revealTimer.current);
    // 先立即显示第 1 条，之后每 REVEAL_MS 一条
    const tick = () => {
      i += 1;
      setShown(i);
      if (i >= consensus.votes.length) {
        if (revealTimer.current) clearInterval(revealTimer.current);
        setPhase("done");
        // 共识达成 → x402 微支付
        settleX402(consensus.votes.length).then(setX402).catch(() => {});
      }
    };
    tick();
    revealTimer.current = setInterval(tick, REVEAL_MS);
  }, []);

  const runResolve = useCallback(async () => {
    setError(null);
    setX402(null);
    setSettleTx(null);
    setPhase("resolving");
    try {
      const consensus = await resolveMarketConsensus(market.slug);
      startReveal(consensus);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Resolve failed");
      setPhase("error");
    }
  }, [market.slug, startReveal]);

  // resolving 状态 → 自动触发一次 resolve（轮询兜底见下）
  useEffect(() => {
    if (market.status === "resolving" && phase === "idle" && !full) {
      runResolve();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 轮询：resolving 期间每 3s 探测市场是否已产出共识（演示用兜底）
  useEffect(() => {
    if (phase !== "resolving") return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/markets/${market.slug}`, { cache: "no-store" });
        const m = (await res.json()) as Market;
        if (m.consensus?.status === "consensus" && m.consensus.votes.length > 0) {
          clearInterval(id);
          startReveal(m.consensus);
        }
      } catch {
        /* 忽略，继续轮询 */
      }
    }, POLL_MS);
    return () => clearInterval(id);
  }, [phase, market.slug, startReveal]);

  useEffect(() => () => { if (revealTimer.current) clearInterval(revealTimer.current); }, []);

  const display: AIConsensus | null = full ? partialConsensus(full, shown) : initial ?? null;
  const revealedVotes: AgentVote[] = display?.votes ?? [];
  const resolving = phase === "resolving";
  const settled = phase === "done";

  async function handleSettle() {
    if (!display?.outcome) return;
    try {
      const res = await settleApi({ marketId: market.id, outcome: display.outcome });
      setSettleTx({ txHash: res.txHash, simulated: res.simulated });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Settle failed");
    }
  }

  return (
    <section className="min-w-0 overflow-hidden rounded-3xl border-2 border-ink bg-card shadow-stamp-sm">
      <div className="flex items-center justify-between border-b-2 border-ink bg-raised px-4 py-3">
        <p className="font-score text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
          Oracle deliberation
        </p>
        <div className="flex items-center gap-2">
          {isDev && phase !== "done" && (
            <button
              onClick={runResolve}
              disabled={resolving}
              className="inline-flex items-center gap-1 rounded-full border-2 border-ink bg-goal-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-ink transition hover:-translate-y-0.5 disabled:opacity-60"
            >
              {resolving ? <Loader2 className="size-3 animate-spin" /> : <Zap className="size-3" />}
              Force resolve
            </button>
          )}
          <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">
            {settled ? "settled" : resolving ? "deliberating" : "open"}
          </p>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {display && <ConsensusMeter consensus={display} />}

        {/* 链上身份验证 — AgentRegistry 合约 */}
        {AGENT_REGISTRY_ADDRESS && (() => {
          // 检测是否有 Agent 带了真实链上地址（DB 已同步）
          const hasOnchain = agents.some(
            (a) => a.ba8004Id && a.ba8004Id.startsWith("T") && !a.ba8004Id.startsWith("TXYZ"),
          );
          return (
            <a
              href={`${TRONSCAN_SHASTA}/#/address/${AGENT_REGISTRY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-2xl border-2 border-pitch-500 bg-pitch-50 px-4 py-3 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border-2 border-pitch-500 bg-pitch-100">
                  <Database className="size-4 text-pitch-700" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="font-score text-[10px] font-bold uppercase tracking-[0.15em] text-pitch-700">
                    AgentRegistry · Shasta testnet
                  </p>
                  <p className="font-score text-[11px] font-bold text-ink">
                    {AGENT_REGISTRY_ADDRESS}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 ${
                  hasOnchain ? "border-pitch-500 bg-pitch-500" : "border-ink bg-card"
                }`}>
                  <BadgeCheck className={`size-3 ${hasOnchain ? "text-canvas" : "text-ink"}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${
                    hasOnchain ? "text-canvas" : "text-ink"
                  }`}>
                    {hasOnchain ? "6 verified" : "verify →"}
                  </span>
                </span>
                <ExternalLink className="size-3.5 text-pitch-600" />
              </div>
            </a>
          );
        })()}

        {/* resolving 且还没有任何票 → 骨架/思考态 */}
        {resolving && revealedVotes.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-raised p-5 text-center">
              <Loader2 className="mx-auto size-5 animate-spin text-ink" />
              <p className="font-score mt-2 text-[11px] font-bold uppercase tracking-wider text-muted">
                6 oracles independently analyzing evidence…
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {agents.slice(0, 6).map((a) => (
                <div key={a.agentId} className="flex items-center gap-2 rounded-xl border-2 border-ink bg-raised px-3 py-2">
                  <span className="pulse-dot size-1.5 rounded-full bg-goal-500" />
                  <span className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">{a.callsign}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-2xl border-2 border-magenta-500 bg-crowd-100 px-4 py-3">
            <p className="font-score text-[11px] font-bold uppercase tracking-wider text-magenta-700">
              {error}
            </p>
            <button
              onClick={runResolve}
              className="rounded-full border-2 border-ink bg-card px-3 py-1 text-[10px] font-black uppercase tracking-wider text-ink hover:bg-raised"
            >
              Retry
            </button>
          </div>
        )}

        {/* 已浮现的投票卡片 */}
        {revealedVotes.length > 0 && (
          <div className="space-y-3">
            {revealedVotes.map((v, i) => {
              const agent = agentMap.get(v.agentId);
              return (
                <div
                  key={v.agentId}
                  className="vote-enter min-w-0 overflow-hidden rounded-2xl border-2 border-ink bg-raised p-4"
                  style={{ animationDelay: `${Math.min(i, 1) * 40}ms` }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border-2 border-ink bg-card">
                        <ShieldCheck className="size-5 text-ink" strokeWidth={2.5} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-sm font-black uppercase tracking-tight text-ink">
                          {agent?.name ?? v.callsign}
                        </p>
                        <p className="truncate font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                          {v.callsign} · {agent?.poweredBy ?? "GPT"}
                          {agent?.poweredBy?.includes("B.AI") && (
                            <span className="ml-1.5 text-pitch-600">⚡ Powered by B.AI</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-right">
                      <div>
                        <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">vote</p>
                        <p className="font-display text-base font-black" style={{ color: v.vote === "YES" ? "#00B14F" : "#FF2D6F" }}>
                          {v.vote}
                        </p>
                      </div>
                      <div>
                        <p className="font-score text-[10px] font-bold uppercase tracking-wider text-muted">conf</p>
                        <p className="font-score text-sm font-bold text-ink">{formatPct(v.confidence)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 链上身份验证 — 数据来自 DB（deploy → sync 写入） */}
                  {agent && (() => {
                    const addr = agent.ba8004Id;
                    // 真实 TRON 地址（以 T 开头且非占位符）
                    const isRealAddr = addr && addr.startsWith("T") && !addr.startsWith("TXYZ");
                    return isRealAddr ? (
                      <a
                        href={`${TRONSCAN_SHASTA}/#/address/${addr}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border-2 border-pitch-500 bg-pitch-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink transition hover:bg-pitch-100"
                      >
                        <span className="shrink-0"><BadgeCheck className="size-3 text-pitch-600" /></span>
                        <span className="truncate">Verified on-chain · {addr.slice(0, 6)}…{addr.slice(-4)}</span>
                        <span className="shrink-0"><ExternalLink className="size-3 text-muted" /></span>
                      </a>
                    ) : addr ? (
                      <span className="mt-3 inline-flex max-w-full items-center gap-1.5 overflow-hidden rounded-full border-2 border-ink/20 bg-card px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                        <span className="shrink-0"><BadgeCheck className="size-3 text-muted" /></span>
                        <span className="truncate">8004 · {addr}</span>
                      </span>
                    ) : null;
                  })()}

                  {/* $HTX Earned */}
                  {agent?.htxEarned !== undefined && (
                    <p className="mt-1.5 font-score text-[10px] font-bold uppercase tracking-wider text-muted">
                      $HTX earned: {agent.htxEarned.toLocaleString()} USDD
                    </p>
                  )}

                  <div className="mt-3 space-y-2">
                    {v.evidence.map((e, j) => (
                      <div key={j} className="flex items-start gap-2 rounded-xl border-2 border-ink bg-card px-3 py-2">
                        <Globe2 className="mt-0.5 size-3.5 shrink-0 text-cyan-700" strokeWidth={2.5} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-score text-[10px] font-bold uppercase tracking-wider text-cyan-700">
                            {e.kind} · {e.source}
                          </p>
                          <p className="mt-0.5 break-words text-sm font-medium text-ink/80">&ldquo;{e.snippet}&rdquo;</p>
                        </div>
                        <a href={e.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted hover:text-ink">
                          <ExternalLink className="size-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 共识达成 → x402 微支付 + settle */}
        {settled && (
          <div className="space-y-3">
            {x402 && (
              <a
                href={x402.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-2xl border-2 border-ink bg-royal-500 px-4 py-3 text-canvas transition hover:-translate-y-0.5"
              >
                <div>
                  <p className="font-score text-[10px] font-bold uppercase tracking-[0.18em] text-canvas/75">
                    x402 micropayment · agent economics
                  </p>
                  <p className="font-score mt-0.5 text-sm font-bold">
                    {x402.amount} USDD → {x402.recipients} oracles
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                  {x402.txHash.slice(0, 10)}… <ExternalLink className="size-3.5" />
                </div>
              </a>
            )}

            {!settleTx ? (
              <button
                onClick={handleSettle}
                className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-ink bg-pitch-500 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-ink shadow-stamp-sm transition hover:-translate-y-0.5 hover:shadow-stamp"
              >
                <Zap className="size-4" /> Settle on-chain · pay winners
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-2xl border-2 border-ink bg-pitch-50 px-4 py-3">
                <p className="font-score text-[11px] font-black uppercase tracking-wider text-ink">
                  Settled · {display?.outcome}
                </p>
                <a
                  href={`${TRONSCAN_SHASTA}/#/transaction/${settleTx.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-score inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ink hover:text-royal-700"
                >
                  {settleTx.txHash.slice(0, 12)}… <ExternalLink className="size-3.5" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* 初始空态（live 市场尚未到期） */}
        {!display?.votes.length && !resolving && phase === "idle" && (
          <div className="rounded-2xl border-2 border-dashed border-ink/30 bg-raised p-8 text-center">
            <p className="font-score text-xs font-bold uppercase tracking-wider text-muted">
              Oracles begin deliberation when the market expires.
            </p>
            {isDev && (
              <button
                onClick={runResolve}
                className="mt-3 inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-goal-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-ink hover:-translate-y-0.5"
              >
                <Zap className="size-3" /> Force resolve (dev)
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
