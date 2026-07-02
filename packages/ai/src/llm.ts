// ─────────────────────────────────────────────
// LLM 调用封装 — provider 无关
// ─────────────────────────────────────────────
// 默认走 OpenAI 兼容端点（OPENAI_BASE_URL，可指向 relay/B.AI/官方）。
// 无 API key 或调用失败时回退到确定性 mock，保证流程不崩。
// 结构化输出用 response_format: json_object。
// ─────────────────────────────────────────────

import OpenAI from "openai";
import type { Outcome } from "@resolve/shared";

export interface AgentAnswer {
  outcome: Outcome;
  confidence: number;
  rationale: string;
  evidenceRefs: string[];
  /** 标记本次结果来源：真实 LLM 还是 mock 兜底 */
  provider: "openai" | "mock";
}

export interface AskOptions {
  systemPrompt: string;
  userPrompt: string;
  /** 决定性 mock 兜底用的偏向 */
  temperament: "bullish" | "bearish" | "neutral";
  /** 兜底时引用的证据源名 */
  fallbackEvidenceRefs: string[];
  model?: string;
  maxRetries?: number;
}

let client: OpenAI | null = null;
function getClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  if (!client) {
    // SDK 会在 baseURL 后拼 /chat/completions，因此 baseURL 必须含 /v1。
    let baseURL = process.env.OPENAI_BASE_URL || undefined;
    if (baseURL && !/\/v\d+$/.test(baseURL.replace(/\/$/, ""))) {
      baseURL = `${baseURL.replace(/\/$/, "")}/v1`;
    }
    client = new OpenAI({
      apiKey,
      baseURL,
      timeout: 60_000, // 单请求 60s 上限
      maxRetries: 0, // 重试由 askAgent 自己控制
      // 部分中转/网关的 Cloudflare WAF 会拦截 OpenAI SDK 默认 UA → 覆盖为浏览器 UA
      defaultHeaders: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
  }
  return client;
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0.5;
  return Math.max(0, Math.min(1, n));
}

/** 决定性 mock 答案（无 key/失败时用），按温度给出合理偏向。 */
function mockAnswer(opts: AskOptions): AgentAnswer {
  const map = {
    bullish: { outcome: "YES" as Outcome, confidence: 0.8 },
    bearish: { outcome: "NO" as Outcome, confidence: 0.58 },
    neutral: { outcome: "YES" as Outcome, confidence: 0.68 },
  };
  const { outcome, confidence } = map[opts.temperament];
  return {
    outcome,
    confidence,
    rationale: `(offline) ${opts.temperament} reading of the curated evidence set.`,
    evidenceRefs: opts.fallbackEvidenceRefs.slice(0, 2),
    provider: "mock",
  };
}

function parseAnswer(raw: string, opts: AskOptions): AgentAnswer {
  // 容错：剥离可能的 markdown fence
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const obj = JSON.parse(cleaned) as Partial<AgentAnswer> & { outcome?: string };
  const outcome: Outcome = obj.outcome === "NO" ? "NO" : "YES";
  const confidence = clamp01(Number(obj.confidence));
  const refs =
    Array.isArray(obj.evidenceRefs) && obj.evidenceRefs.length > 0
      ? obj.evidenceRefs.map(String)
      : opts.fallbackEvidenceRefs.slice(0, 1);
  return {
    outcome,
    confidence,
    rationale: typeof obj.rationale === "string" ? obj.rationale : "",
    evidenceRefs: refs,
    provider: "openai",
  };
}

/** 调一个 Agent。失败重试 maxRetries 次，仍失败则 mock 兜底。 */
export async function askAgent(opts: AskOptions): Promise<AgentAnswer> {
  const c = getClient();
  if (!c) return mockAnswer(opts);

  const model = opts.model || process.env.OPENAI_MODEL || "gpt-5.5";
  const maxRetries = opts.maxRetries ?? 1;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await c.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: opts.systemPrompt },
          { role: "user", content: opts.userPrompt },
        ],
      });
      const content = res.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty LLM response");
      return parseAnswer(content, opts);
    } catch (err) {
      if (attempt === maxRetries) {
        console.error(`[ai/llm] askAgent failed after ${maxRetries + 1} tries, mock fallback:`, err);
        return mockAnswer(opts);
      }
    }
  }
  return mockAnswer(opts);
}

/** 是否配置了真实 LLM（供 index.ts 标注/调试）。 */
export function isLlmConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}
