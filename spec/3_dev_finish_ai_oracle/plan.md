# 3_dev_finish_ai_oracle — Implementation Plan

## Agent 角色设计（更新：+Orchestrator）

| Agent | ID | 角色 | Prompt 定位 |
|-------|-----|------|-------------|
| **Orchestrator** | agent-selector | ⚡ **调度层** | 分析市场问题+6个Agent档案 → 选最优3个+理由 |
| **BULL-1** | bull-1 | ⚡ ACTIVE | 交易所预言机: BTC 价格趋势、成交量、HTX 订单簿信号 |
| **BEAR-1** | bear-1 | ⚡ ACTIVE | 媒体预言机: 新闻情绪、监管动态、宏观风险 |
| **NEUT-1** | neut-1 | ⚡ ACTIVE | 链上预言机: 链上持仓、大额转账、矿工活动 |
| **BULL-2** | bull-2 | 💤 STANDBY | 技术预言机（备用）— 展示用 |
| **BEAR-2** | bear-2 | 💤 STANDBY | 监管预言机（备用）— 展示用 |
| **NEUT-2** | neut-2 | 💤 STANDBY | 宏观预言机（备用）— 展示用 |

---

## Step 0: Prompt 工程先决（质量决定 Demo 命运）

> 以下 prompt 内容需要 Dev B 精心编写。每个 prompt 是独立文件，是项目的核心知识产权。

**文件**: `packages/ai/src/prompts.ts`

每个 prompt 结构:
```
/**
 * Agent 身份: 交易所预言机 / 媒体预言机 / 链上预言机
 * 角色温度: 偏多 / 偏保守 / 中性
 * 核心技能: 技术分析 / 新闻理解 / 链上数据解读
 */

Role: "You are an expert {role} oracle..."
Task: "Analyze the following market and evidence..."
Rules: [
  "Output ONLY valid JSON",
  "confidence must be between 0 and 1",
  "Must cite at least 1 evidence source"
]
Schema: {
  outcome: "YES" | "NO",
  confidence: number,
  evidence: [{ source, url, snippet, kind, timestamp }]
}
Guardrails: [
  "If evidence is insufficient, default confidence 0.50"
]
```

**Orchestrator prompt**（新增）:
```
Role: "You are an AI Agent dispatcher..."
Task: "Given this market question and 6 agent profiles, select the 3 best agents..."
Input: { market_question: string, agents: AgentProfile[] }
Output: { selected: string[], reasoning: string, confidence: number }
```

---

## Step 1: 安装 SDK

```bash
pnpm --filter @resolve/ai add @anthropic-ai/sdk
pnpm --filter @resolve/ai add -D @types/node
```

## Step 2: 创建精选证据装置

**文件**: `packages/ai/src/evidence.ts`

证据集结构:
```
interface EvidenceSet {
  question: string;
  context: {
    exchange_oracle: EvidenceSource[];   // HTX price, volume, orderbook
    media_oracle: EvidenceSource[];      // News headlines, regulatory
    onchain_oracle: EvidenceSource[];    // Chain data, whale movements
  }
}
```

英雄市场预取证据:
- 交易所: 当前 BTC 价格、24h 成交量、订单簿深度（HTX 实时 API）
- 媒体: 减半叙事、ETF 流入、宏观新闻预取
- 链上: 交易所净流入、巨鲸持仓变化

## Step 3: 创建 LLM 调用封装

**文件**: `packages/ai/src/llm.ts`（通用，不绑定 Claude）

```ts
export async function askAgent(
  prompt: string,
  evidence: EvidenceSource[],
  provider: 'claude' | 'bai',
  apiKey: string
): Promise<{ outcome: Outcome; confidence: number; evidence: Evidence[] }>

export async function selectAgents(
  market: Market,
  allAgents: AgentProfile[],
  provider: 'claude' | 'bai',
  apiKey: string
): Promise<{ selected: string[]; reasoning: string }>
```

- Claude: 使用 Anthropic SDK `messages.create()`
- B.AI: 使用 OpenAI-compatible fetch (`POST {BAI_API_ENDPOINT}/chat/completions`)
- 结构化输出 — 要求 LLM 返回 JSON blob
- 重试机制: 失败后重试 1 次

## Step 4: 创建共识数学

**文件**: `packages/ai/src/consensus.ts`

```ts
// 权重: 交易所 1.0, 媒体 0.8, 链上 0.9
// YES 加权和 / (YES + NO 加权和) = consensus_score
// consensus_score >= threshold(0.65) → consensus reached
```

## Step 5: 更新 resolveMarket()

**文件**: `packages/ai/src/index.ts`

```ts
export async function resolveMarket(market: Market): Promise<AIConsensus> {
  const evidenceSet = getEvidenceForMarket(market.id);
  const allAgents = getAgentProfiles();
  const apiKey = process.env.ANTHROPIC_API_KEY!;
  const baiKey = process.env.BAI_API_KEY;

  // Step 1: Orchestrator 选 Agent
  const { selected, reasoning } = await selectAgents(market, allAgents);

  // Step 2: 并行推理选中的 3 个 Agent（可按角色分配不同 provider）
  const votes = await Promise.all(
    selected.map(agentId => {
      const agent = allAgents.find(a => a.agentId === agentId)!;
      const provider = agentId === 'neut-1' && baiKey ? 'bai' : 'claude';
      return askAgent(agent.prompt, evidenceSet, provider, provider === 'bai' ? baiKey! : apiKey);
    })
  );

  // Step 3: 加权共识
  const consensus = computeConsensus(votes);
  return { ...consensus, orchestrator: { selected, reasoning } };
}
```

## Step 6: 环境变量 + 验证

**文件**: `packages/ai/.env.example`
```
ANTHROPIC_API_KEY=sk-ant-xxxx
BAI_API_KEY=xxx
BAI_API_ENDPOINT=https://...
```

```bash
cd packages/ai
ANTHROPIC_API_KEY=sk-... npx tsx src/index.ts  # 手动测试 selectAgent → resolve
```

## 注意事项

- Claude API 有 rate limit，测试时注意频率
- 确定性护栏的核心: 精选证据集中 YES 偏向 + prompt 中隐式预判引导
- 如果 Orchestrator 或 Agent 调用失败 → 回退到固定 3 个 Agent + mock fallback
- B.AI API 兼容 OpenAI 格式时，`llm.ts` 中 `askBai()` 只需一个 fetch 调用
- NEUT-1 建议优先走 B.AI（展示生态集成），其他走 Claude（稳定性优先）

## 关键文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `packages/ai/src/prompts.ts` | [新建] | 3 Agent prompt + 1 Orchestrator prompt |
| `packages/ai/src/evidence.ts` | [新建] | 精选证据集 |
| `packages/ai/src/llm.ts` | [新建] | 通用 LLM 调用（支持 Claude + B.AI） |
| `packages/ai/src/consensus.ts` | [新建] | 加权共识数学 |
| `packages/ai/src/index.ts` | [修改] | resolveMarket 真实实现（含 selector） |
| `packages/ai/.env.example` | [新建] | 环境变量模板 |
| `packages/ai/package.json` | [修改] | 添加 @anthropic-ai/sdk |
