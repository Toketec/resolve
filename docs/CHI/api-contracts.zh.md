# API 接口 — 第一天接口

状态：**写真实逻辑前先敲定。** 这些是三条切片之间的接缝。如果 A、B、C 第一天就敲定它们，每人都能独立开发（先造假、再做真），互不阻塞。

共享类型词汇已存在于 `packages/shared/src/index.ts` —— `Market`、`AIConsensus`、`AgentVote`、`Evidence`、`Position`、`Outcome`。**不通知另外两位开发者，禁止改动这些类型。**

---

## 接口 1 — 解析（C ↔ B）

RESOLVE 的核心。Dev B 实现；市场到期时 Dev C 调用。

```ts
// Dev B 负责函数体。Dev C 负责调用点。
async function resolve(market: Market): Promise<AIConsensus>;
```

- 输入：一个 `Market`（问题、`resolutionCriteria`、类别）。
- 输出：完整的 `AIConsensus`（`status`、`outcome`、`confidence`、`threshold`、`votes[]`、时间戳）——正是 `apps/web/components/consensus-meter.tsx` 和详情页 `apps/web/app/markets/[slug]/page.tsx` 已经在渲染的形状。
- 内部 B 对精选证据集做 3 次真实 Claude 调用（已确认），然后跑共识数学。
- **走通骨架的桩：** 延迟一小会儿后返回一个预设的 `AIConsensus`。C 对着这个桩构建浮现效果；B 在相同签名背后换入真实推理。

**共识数学（B 负责，草图）：**
```
yesWeight = sum(vote.confidence where vote == YES)
noWeight  = sum(vote.confidence where vote == NO)
outcome    = yesWeight >= noWeight ? "YES" : "NO"
confidence = max(yesWeight, noWeight) / (yesWeight + noWeight)
status     = confidence >= threshold ? "consensus" : "dispute"
```

---

## 接口 2 — 交易与结算（C ↔ A）

Dev C 暴露 API 路由与 UI；Dev A 实现链上部分。

```ts
// 单边买入。C 负责路由 + UI；A 负责签名/转账。
async function buyShares(args: {
  marketId: string;
  side: Outcome;          // "YES" | "NO"
  amount: number;         // 单位 USDD
  walletAddress: string;  // 已连接的 TronLink 钱包
}): Promise<Position>;     // 含 walletAddress 以便赔付

// 共识达成后结算。A 实现合约调用。
async function settle(args: {
  marketId: string;
  outcome: Outcome;
  winnerWallet: string;
}): Promise<{ txHash: string; simulated: boolean }>;
```

- `buyShares` —— C 处理表单/路由（`apps/web/components/trade-panel.tsx`）；A 只处理签名或转移价值的那几行。
- `settle` —— A 的预注资合约向 `winnerWallet` 支付固定金额。当**安全气囊**触发（测试网不稳）时 `simulated: true`——无论如何 UI 都显示一个确认。
- **走通骨架的桩：** 两者都立即返回假的 `Position` / 假的 `txHash`。A 在相同签名背后换入真实 TronLink + TRC-20。

---

## 接口 3 — 价格数据（C → B）

```ts
// C 获取只读 HTX 行情数据；B 的交易所智能体消费。
async function getPrice(symbol: string): Promise<{
  symbol: string;
  price: number;
  source: "htx";
  at: string;
}>;
```

- 只读 HTTP。无钱包 → 这是 C 的数据层工作，不是 A 的。
- 在 `resolve()` 中喂给交易所预言机智能体的证据。
- **走通骨架的桩：** 返回静态价格；C 换入真实 HTX 端点。

---

## 接口 4 — B.AI 薄层集成（A 实现，B 指定）

与其说是切片间的代码接缝，不如说是一次规格交接：

- **B 指定：** 注册哪个智能体身份（一个），以及 x402 支付在 `resolve()` 中触发的位置。
- **A 实现：** 在 TRON 测试网上用 `@bankofai/agent-wallet`（签名）+ `@bankofai/x402`（支付）。一次真实 8004 注册，一笔真实 x402 微支付。
- 限时 2–3 天。若遇阻，回退到仅叙事——**对英雄镜头零影响**，因为推理是 Claude 直连。

---

## 接口 5 — Hybrid 数据层（C ↔ A/B）

跨切片的数据共享层，定义 A 和 B 写入结果、C 读取渲染的契约。

```ts
// A 写入结算结果；C 读取展示。
async function recordSettlement(args: {
  marketId: string;
  outcome: Outcome;
  txHash: string;
  simulated: boolean;
}): Promise<void>;

// B 写入共识结果；C 读取展示。
async function recordConsensus(args: {
  marketId: string;
  consensus: AIConsensus;
}): Promise<void>;

// C 读取给定市场的完整状态（仓位 + 共识 + 结算）。
async function getMarketState(marketId: string): Promise<{
  position: Position | null;
  consensus: AIConsensus | null;
  settlement: { txHash: string; simulated: boolean } | null;
}>;
```

- Hybrid 层混合了 Supabase Postgres（持久化）和内存缓存（demo 现场的即时读取）。
- C 定义该层的数据模型和路由；A 和 B 按此契约写入。
- **走通骨架的桩：** 全部用内存 Map 实现，无须数据库依赖。C 在后期换入真实 Supabase 客户端。

---

## 规则

上述每个接口都有用于走通骨架的**桩**形态，以及在完全相同签名背后换入的**真实**形态。一经敲定，签名永不改变——正是这一点让三条切片并行推进，也让英雄镜头从第一周起就能端到端跑通。

`@bankofai/x402`（v0.6.0）与 `@bankofai/agent-wallet`（v2.4.0）是真实的、TypeScript 编写、可经 npm 安装、Node ≥20——与本应用同一技术栈。无需语言桥接。
