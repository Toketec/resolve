# API 接口合约 — 第一天接口

状态：**写真实逻辑前先敲定。** 这些是三条切片之间的接缝。如果 A、B、C 第一天就敲定它们，每人都能独立开发（先造假、再做真），互不阻塞。

共享类型词汇已存在于 `packages/shared/src/index.ts` —— `Market`、`AIConsensus`、`AgentVote`、`Evidence`、`Position`、`Outcome`。**不通知另外两位开发者，禁止改动这些类型。**

---

## 接口合约 1 — 解析（C ↔ B）

RESOLVE 的核心。Dev B 实现；市场到期时 Dev C 调用。

```ts
// Dev B 负责函数体。Dev C 负责调用点。
async function resolve(market: Market): Promise<AIConsensus>;
```

- 输入：一个 `Market`（问题、`resolutionCriteria`、类别）。
- 输出：完整的 `AIConsensus`（`status`、`outcome`、`confidence`、`threshold`、`votes[]`、时间戳）——正是 `apps/web/components/consensus-meter.tsx` 和详情页 `apps/web/app/markets/[slug]/page.tsx` 已经在渲染的形状。
- 内部 B 对精选证据集做 N 次真实 Claude 调用（N = 3），然后跑共识数学。
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

## 接口合约 2 — 交易、AMM 与结算（C ↔ A）

Dev C 暴露 API 路由与 UI；Dev A 实现链上部分。

### AMM 定价模型（线性债券曲线）

每个市场是一个独立的 AMM 流动性池。市场创建者（单一 LP）在市场创建时注入初始流动性 USDD。所有交易——买入和卖出——都与该池交互。

```
YES_price = 0.5 + net / (2 * L)
NO_price  = 1 - YES_price

其中：
  net = 累计 YES 买入额 - 累计 NO 买入额（单位 USDD）
  L   = 市场创建者存入的初始流动性（单位 USDD）

价格钳制在 [0.01, 0.99]
```

用户买入 YES 时，`net` 增加 → YES 价格上升。用户卖出 YES 时，`net` 减少 → YES 价格下降。LP 存入的 USDD 作为所有交易对手方。

**示例**（市场 L = 1,000 USDD，尚无交易）：

| 操作 | net 变化 | YES 价格 | NO 价格 |
|:-------|:----------:|:---------:|:--------:|
| 初始状态 | net = 0 | 50% | 50% |
| 买入 $100 YES | net += 100 | **55% ↑** | 45% |
| 买入 $200 NO | net -= 200 | **45% ↓** | 55% |
| 卖出 50 YES 份额 | net -= 55 | ~43% | 57% |

### 接口

```ts
// ── 买入 ──────────────────────────────────────────────
// C 负责路由 + UI；A 负责签名/转账。
async function buyShares(args: {
  marketId: string;       // slug
  side: Outcome;          // "YES" | "NO"
  amountUSDD: number;     // USDD 输入
  walletAddress: string;  // 已连接的 TronLink 钱包
}): Promise<TransactionResult>;

// ── 卖出 ─────────────────────────────────────────────
// 新增：将份额卖回 AMM 池
async function sellShares(args: {
  marketId: string;
  side: Outcome;          // 卖出哪边（"YES" 或 "NO"）
  shares: number;         // 要卖出的份额数
  walletAddress: string;
}): Promise<TransactionResult>;

interface TransactionResult {
  txHash: string;
  shares: number;         // 实际买入/卖出的份额
  price: number;          // 执行价格 (0..1)
  usddAmount: number;     // 支付或收到的 USDD 金额
  fee: number;            // 平台收取的费用（USDD）
  simulated: boolean;     // 安全气囊模式
}

// ── 结算 ───────────────────────────────────────────
// 共识达成后，owner 结算赢家
async function settle(args: {
  marketId: string;
  outcome: Outcome;
  winnerWallet: string;
}): Promise<{ txHash: string; simulated: boolean }>;

// ── 池查询（只读）───────────────────────────────
async function getPoolState(marketId: string): Promise<{
  yesSupply: number;      // 流通中的 YES 份额
  noSupply: number;       // 流通中的 NO 份额
  yesPrice: number;       // 当前 YES 价格
  noPrice: number;        // 当前 NO 价格
  liquidity: number;      // 池中剩余 USDD
  feePool: number;        // 累计的平台费用
}>;

// ── 创建市场（含创建费）────────────────────────
async function createMarket(args: {
  marketIdBytes32: string;
  liquidity: number;      // 初始 USDD 存款
}): Promise<{ txHash: string }>;
```

**费用模型（链上）：**
- **交易费**：每笔买入和卖出收取 0.1%
  - 50% → LP（市场创建者）
  - 50% → 平台 `feePool`（owner 可提取）
- **创建费**：每个市场固定 10 USDD（在 `createMarket()` 时支付，进入 `feePool`）
- **结算费**（未来）：赢家支付固定 1 USDD（黑客松后）

### AMM 合约状态流转

```
市场创建（支付 10 USDD 创建费）
    │
    ├── 买入/卖出交易发生 ←── 每笔 0.1% 费用
    │
    ├── 市场到期 → AI 解析 → 共识 ≥ 阈值
    │       │
    │       ├── 结算：从池余额支付赢家
    │       └── LP 提取剩余池（扣除 feePool）
    │
    └── 争议：共识 < 阈值 → 人工审查窗口
```

- **走通骨架的桩：** 买入和卖出都立即返回假的 `TransactionResult`。A 在相同签名背后换入真实 TronLink + AMM 合约。

---

## 接口合约 3 — 价格数据（C → B）

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

## 接口合约 4 — B.AI 薄层集成（A 实现，B 指定）

与其说是切片间的代码接缝，不如说是一次规格交接：

- **B 指定：** 注册哪个智能体身份（一个），以及 x402 支付在 `resolve()` 中触发的位置。
- **A 实现：** 在 TRON 测试网上用 `@bankofai/agent-wallet`（签名）+ `@bankofai/x402`（支付）。一次真实 8004 注册，一笔真实 x402 微支付。
- 限时 2–3 天。若遇阻，回退到仅叙事——**对英雄镜头零影响**，因为推理是 Claude 直连。

---

## 接口合约 5 — 混合数据层（C 拥有，三者共同消费）

RESOLVE 使用 **Web2 数据库 (Supabase) + TRON 链** 混合存储架构。本接口合约记录了各数据存放位置以及两套系统之间的接口签名。

### 存储分配

| 数据 | 存储位置 | 理由 |
|------|:-----:|-----------|
| 市场元数据（问题、描述、类别、状态） | **Supabase**（`markets` 表） | 搜索/过滤/排序需要 < 10ms；链上查询需要 3-5s |
| 智能体定义和推理记录 | **Supabase**（`agent_consensus`、`agent_votes`） | AI 日志不需要链级别的不可篡改性 |
| 用户仓位（每市场余额） | **Supabase**（`positions`）+ `tx_hash` 链接 | 快速投资组合渲染；`tx_hash` 提供链上可验证性 |
| **资产结算（USDD 支付）** | **TRON 链**（结算/AMM 合约） | 信任最小化——资金必须在链上流动 |
| **平台费用池** | **TRON 链**（合约状态） | 经济循环需要无需信任的执行 |
| **\\$HTX 质押 / 激励** | **TRON 链**（智能合约） | 经济循环需要无需信任的执行 |

### 仓位模式（已更新为 AMM）

每个仓位现在按每市场每钱包追踪 **YES 和 NO 余额**，而非单笔买入记录：

```
positions 表（Supabase）：
  id            UUID PRIMARY KEY
  market_id     UUID → markets(id)
  wallet_address TEXT
  yes_balance   NUMERIC(20,6) DEFAULT 0    ← 持有的 YES 份额
  no_balance    NUMERIC(20,6) DEFAULT 0    ← 持有的 NO 份额
  total_bought  NUMERIC(20,6) DEFAULT 0    ← 总共花费的 USDD（用于 PnL 计算）
  total_sold    NUMERIC(20,6) DEFAULT 0    ← 总共收到的 USDD
  updated_at    TIMESTAMPTZ
  UNIQUE(market_id, wallet_address)        ← 每市场每钱包一行
```

`tx_hash` 不再直接放在 `positions` 上。每笔交易（买入或卖出）记录在新的 `trades` 表中：

```
trades 表（Supabase）：                   ← 新增
  id            UUID PRIMARY KEY
  market_id     UUID → markets(id)
  wallet_address TEXT
  side          TEXT CHECK('YES'|'NO')
  type          TEXT CHECK('buy'|'sell')   ← 买入或卖出
  shares        NUMERIC(20,6)              ← 涉及的份额
  price         NUMERIC(10,6)              ← 执行价格
  usdd_amount   NUMERIC(20,6)              ← USDD 金额
  fee           NUMERIC(20,6) DEFAULT 0    ← 平台费用
  tx_hash       TEXT                       ← 链上凭证
  created_at    TIMESTAMPTZ
```

### 接口：Supabase 数据层

```ts
// Dev C 实现这些接口；A 和 B 通过 API 路由消费数据。

// 市场
async function getMarket(slug: string): Promise<Market>;
async function listMarkets(filter?: { status?: MarketStatus; category?: Category }): Promise<Market[]>;
async function updateMarketStatus(marketId: string, status: MarketStatus): Promise<void>;

// 仓位（每钱包每市场，含 YES/NO 余额追踪）
async function getPosition(marketId: string, wallet: string): Promise<Position | null>;
async function listPositionsByWallet(wallet: string): Promise<Position[]>;
async function updatePosition(marketId: string, wallet: string, delta: {
  side: 'YES' | 'NO';
  shares: number;           // 正数 = 买入，负数 = 卖出
  usddAmount: number;       // 正数 = 花费，负数 = 收到
  fee: number;
  txHash: string;
}): Promise<void>;
async function insertTrade(trade: Omit<Trade, 'id'>): Promise<Trade>;

// 共识与智能体投票
async function saveConsensus(marketId: string, consensus: AIConsensus): Promise<void>;
async function getConsensus(marketId: string): Promise<AIConsensus | null>;
```

### 接口：TRON 结算与 AMM

```ts
// Dev A 实现这些接口；C 从 API 路由调用。

// AMM 状态（只读，Trongrid）
async function getPoolState(marketId: string): Promise<{
  yesSupply: number; noSupply: number;
  yesPrice: number; noPrice: number;
  liquidity: number; feePool: number;
}>;

// 客户端买入（TronLink 签名）
async function buyShares(marketId: string, side: Outcome, amountSun: bigint): Promise<{ txHash: string }>;

// 客户端卖出（TronLink 签名）
async function sellShares(marketId: string, side: Outcome, shares: bigint): Promise<{ txHash: string }>;

// Owner 专用结算
async function settle(marketId: string, outcome: Outcome, winner: string, payoutSun: bigint): Promise<string>;
async function claimFees(): Promise<string>;                    // owner 提取 feePool
```

### 桥梁

两套系统通过两个字段连接：

- **`tx_hash`** 在 `trades` 上——将 Supabase 交易记录链接到其 TRON 交易，任何人都可在 Tronscan 上验证。
- **`wallet_address`** 在 `Position` / `Trade` 上——用户的 TRON 钱包是 Web2 身份与链上价值之间的外键。

这**不是纯链上设计**。对于英雄演示，Supabase 存储所有需要快速读取的数据（市场列表、仓位、智能体推理日志），而 TRON 仅处理 AMM 结算和质押。叙事：**"需要速度的地方用 Web2，需要信任的地方用 Web3。"**

---

## 规则

上述每个接口合约都有用于走通骨架的**桩**形态，以及在完全相同签名背后换入的**真实**形态。一经敲定，签名永不改变——正是这一点让三条切片并行推进，也让英雄镜头从第一周起就能端到端跑通。

`@bankofai/x402`（v0.6.0）与 `@bankofai/agent-wallet`（v2.4.0）是真实的、TypeScript 编写、可经 npm 安装、Node ≥20——与本应用同一技术栈。无需语言桥接。
