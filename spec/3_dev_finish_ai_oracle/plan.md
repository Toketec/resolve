# 3_dev_finish_ai_oracle — Implementation Plan

## Agent 角色设计

| Agent | ID | 角色 | Prompt 定位 |
|-------|-----|------|-------------|
| BULL-1 | agent-exchange | ⚡ ACTIVE | 交易所预言机 | 技术分析偏多: BTC 价格趋势、成交量、HTX 订单簿信号 |
| BEAR-1 | agent-media | ⚡ ACTIVE | 媒体预言机 | 基本面偏保守: 新闻情绪、监管动态、宏观风险 |
| NEUT-1 | agent-onchain | ⚡ ACTIVE | 链上预言机 | 数据驱动中性: 链上持仓、大额转账、矿工活动 |
| BULL-2 | agent-tech | 💤 STANDBY | 技术预言机（备用） | 展示用 — 无真实 prompt |
| BEAR-2 | agent-regulation | 💤 STANDBY | 监管预言机（备用） | 展示用 — 无真实 prompt |
| NEUT-2 | agent-macro | 💤 STANDBY | 宏观预言机（备用） | 展示用 — 无真实 prompt |

## Step 1: 安装 Anthropic SDK

```bash
pnpm --filter @resolve/ai add @anthropic-ai/sdk
pnpm --filter @resolve/ai add -D @types/node
```

## Step 2: 创建 Agent Prompt 模板

**文件**: `packages/ai/src/prompts.ts`

每个 Agent prompt 包含:
```
- 角色设定（persona + expertise area）
- 市场问题 + 解析标准
- 精选证据集（预取数据）
- 输出格式指令（JSON schema）
- 确定性护栏（约束条件，如: "你的答案是 YES 或 NO，confidence 0-1"）
```

## Step 3: 创建精选证据装置

**文件**: `packages/ai/src/evidence.ts`

证据集结构:
```
interface EvidenceSet {
  question: string;
  context: {
    exchange_oracle: EvidenceSource[];  // HTX price, volume, orderbook
    media_oracle: EvidenceSource[];     // News headlines, regulatory
    onchain_oracle: EvidenceSource[];   // Chain data, whale movements
  };
}
```

英雄市场（BTC $150K EOY?）预取证据举例:
- 交易所: 当前 BTC 价格 ($X)、24h 成交量、1月价格趋势
- 媒体: 减半叙事、ETF 流入、宏观新闻
- 链上: 交易所净流入、巨鲸持仓变化

## Step 4: 创建 Claude 调用封装

**文件**: `packages/ai/src/claude.ts`

```
export async function askAgent(
  prompt: string,
  evidence: EvidenceSource[],
  apiKey: string
): Promise<{ outcome: Outcome; confidence: number; evidence: Evidence[] }>
```

- 使用 Anthropic SDK 的 `messages.create()`
- 结构化输出——要求 Claude 返回 JSON blob
- 重试机制: 第一次失败后重试 1 次

## Step 5: 更新 resolveMarket()

**文件**: `packages/ai/src/index.ts`

```
export async function resolveMarket(market: Market): Promise<AIConsensus> {
  const evidenceSet = getEvidenceForMarket(market.id);
  const apiKey = process.env.ANTHROPIC_API_KEY!;

  // 并行 3 个 Agent
  const results = await Promise.all(
    AGENTS.map(agent => askAgent(agent.prompt, evidenceSet.for(agent.role), apiKey))
  );

  // 加权共识
  return computeConsensus(results, threshold);
}
```

## Step 6: 共识数学微调

**文件**: `packages/ai/src/consensus.ts`

```
// 权重: 交易所 1.0, 媒体 0.8, 链上 0.9
// YES 加权和 / (YES + NO 加权和) = confidence
// confidence >= threshold → consensus
```

## Step 7: 环境变量 + 验证

**文件**: `packages/ai/.env.example`
ANTHROPIC_API_KEY=sk-ant-xxxx

```bash
cd packages/ai
ANTHROPIC_API_KEY=sk-... npx tsx src/index.ts  # 手动测试
```

## 注意事项

- Claude API 有 rate limit（每分钟 X 请求），测试时注意
- 所有 Agent 调用使用同一 API key（不同 prompt）——这是 demo 可接受的
- 确定性护栏的核心思路: 精选证据集中 YES 偏向 + prompt 中隐式预判引导
- 如果 Claude API 失败，回退到 mock（在 resolveMarket 中 try/catch）
- 证据集中不要放实时 API 调用——只放预取数据

## 关键文件

| 文件 | 操作 |
|------|------|
| `packages/ai/src/prompts.ts` | [新建] 3 个 Agent prompt 模板 |
| `packages/ai/src/evidence.ts` | [新建] 精选证据装置 |
| `packages/ai/src/claude.ts` | [新建] Claude API 调用封装 |
| `packages/ai/src/consensus.ts` | [新建] 加权共识数学 |
| `packages/ai/src/index.ts` | [修改] 替换 resolveMarket 为真实实现 |
| `packages/ai/.env.example` | [新建] 环境变量模板 |
| `packages/ai/package.json` | [修改] 添加 @anthropic-ai/sdk 依赖 |
