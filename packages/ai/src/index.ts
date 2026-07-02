// ─────────────────────────────────────────────
// @resolve/ai — Oracle 推理引擎入口
// ─────────────────────────────────────────────
// resolveMarket(): 6 个 Agent 并行 LLM 推理（Promise.all，全部 ACTIVE，
// 无 orchestrator selector）→ 加权 6 票共识 → AIConsensus。
// 失败的 Agent 由 llm 层 mock 兜底，不降级整体票数。
// ─────────────────────────────────────────────

import type { Market, AIConsensus, AgentVote } from "@resolve/shared";
import { AGENT_PROFILES, buildUserPrompt } from "./prompts";
import { getEvidenceForMarket, toEvidence, type EvidenceSource } from "./evidence";
import { askAgent } from "./llm";
import { computeConsensus, DEFAULT_THRESHOLD, type WeightedVote } from "./consensus";

export { computeConsensus, ROLE_WEIGHTS, DEFAULT_THRESHOLD } from "./consensus";
export { AGENT_PROFILES } from "./prompts";
export { getEvidenceForMarket } from "./evidence";
export { isLlmConfigured } from "./llm";

/**
 * 解析市场：6 Agent 并行推理 → 加权共识。
 * @param market 市场对象（用 id/slug 选证据集，title 作为问题）
 */
export async function resolveMarket(market: Market): Promise<AIConsensus> {
  const startedAt = new Date().toISOString();
  const evidence = getEvidenceForMarket(market.id || market.slug);
  const question = market.title || evidence.question;

  // 6 Agent 并行
  const weightedVotes: WeightedVote[] = await Promise.all(
    AGENT_PROFILES.map(async (profile) => {
      const roleSources: EvidenceSource[] = [
        ...(evidence.byRole[profile.role] ?? []),
        ...evidence.shared,
      ];
      const evidenceLines = roleSources.map((s) => ({ source: s.source, snippet: s.snippet }));
      const fallbackRefs = roleSources.map((s) => s.source);

      const answer = await askAgent({
        systemPrompt: profile.systemPrompt,
        userPrompt: buildUserPrompt(question, evidenceLines),
        temperament: profile.temperament,
        fallbackEvidenceRefs: fallbackRefs,
      });

      // 把 LLM 引用的 evidenceRefs 对回完整 Evidence 对象（命中则用真实条目）
      const fullEvidence = toEvidence(roleSources);
      const cited = fullEvidence.filter((e) =>
        answer.evidenceRefs.some((ref) => e.source.toLowerCase().includes(ref.toLowerCase()) || ref.toLowerCase().includes(e.source.toLowerCase())),
      );
      const evidenceOut = cited.length > 0 ? cited : fullEvidence.slice(0, 1);

      const vote: WeightedVote = {
        agentId: profile.agentId,
        callsign: profile.callsign,
        vote: answer.outcome,
        confidence: answer.confidence,
        evidence: evidenceOut.map((e) => ({
          ...e,
          // 把 LLM 的 rationale 附到首条证据 snippet 前（让 UI 展示推理）
          snippet: e === evidenceOut[0] && answer.rationale ? `${answer.rationale} — ${e.snippet}` : e.snippet,
        })),
        decidedAt: new Date().toISOString(),
        role: profile.role,
      };
      return vote;
    }),
  );

  const result = computeConsensus(weightedVotes, DEFAULT_THRESHOLD);

  // 剥掉内部 role 字段，返回 @resolve/shared AgentVote
  const votes: AgentVote[] = weightedVotes.map(({ role, ...v }) => {
    void role;
    return v;
  });

  return {
    status: result.status,
    outcome: result.outcome,
    confidence: result.consensusScore,
    threshold: DEFAULT_THRESHOLD,
    votes,
    startedAt,
    finalizedAt: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// CLI 测试入口：`OPENAI_API_KEY=*** npx tsx packages/ai/src/index.ts`
// ─────────────────────────────────────────────
async function main() {
  const heroMarket = {
    id: "mk_btc_150k",
    slug: "btc-150k-2026",
    title: "Will Bitcoin close above $150,000 by Dec 31, 2026?",
  } as Market;

  console.log(`Resolving: "${heroMarket.title}"`);
  console.log(`LLM configured: ${Boolean(process.env.OPENAI_API_KEY)} | model: ${process.env.OPENAI_MODEL || "gpt-5.5"}\n`);

  const t0 = Date.now();
  const consensus = await resolveMarket(heroMarket);
  const ms = Date.now() - t0;

  for (const v of consensus.votes) {
    console.log(
      `  ${v.callsign.padEnd(7)} ${v.vote.padEnd(3)} conf=${v.confidence.toFixed(2)}  ` +
        `ev=${v.evidence.length}  "${(v.evidence[0]?.snippet ?? "").slice(0, 70)}…"`,
    );
  }
  console.log(
    `\nCONSENSUS: ${consensus.status.toUpperCase()} → ${consensus.outcome} ` +
      `@ ${(consensus.confidence * 100).toFixed(1)}% (threshold ${(consensus.threshold * 100).toFixed(0)}%)`,
  );
  console.log(`Elapsed: ${ms}ms`);
}

// 仅在直接运行时执行（被 import 时不触发）
const isMain =
  typeof process !== "undefined" &&
  process.argv?.[1] &&
  /index\.(ts|js|mts|mjs)$/.test(process.argv[1]);
if (isMain) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
