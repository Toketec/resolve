# Spec 12: AMM + Sell 功能 + 费用模型

## 问题

TradePanel 目前只有 **Buy** 没有 **Sell**，用户买入仓位后无法在到期前退出（资金被锁定）。此外缺少：
1. AMM 定价模型（当前无连续价格发现）
2. 平台费用模型（无交易费、无创建费）
3. Recent Trades 展示仍是 mock（未接入真实数据）

**影响**：评委可能问"为什么只有 Buy 没有 Sell？"、"你们怎么赚钱？"

## 方案：线性债券曲线 AMM

### AMM 定价公式

```
YES_price = 0.5 + net / (2 * L)
NO_price  = 1 - YES_price

net: 累计 YES 买入额 - 累计 NO 买入额 (USDD)
L:   初始流动性 (USDD)，market creator 创建时注入
价格范围: [0.01, 0.99]
```

### 费用模型

| 费用 | 金额 | 去向 |
|:----|:----|:-----|
| 交易费 | 每笔 0.1% | 50% → LP，50% → 平台 feePool |
| 创建费 | 10 USDD（创建市场时支付） | 全部 → 平台 feePool |

### 合约新增函数

| 函数 | 触发者 | 作用 |
|:----|:------|:-----|
| `buyShares(marketId, isYes, amountSun)` | 用户 TronLink | 按 AMM 价格买入，扣 0.1% 费 |
| `sellShares(marketId, isYes, shares)` | 用户 TronLink | 按 AMM 价格卖回，扣 0.1% 费 |
| `createMarket(marketId, liquidity)` | Owner | 创建市场 + 存 L USDD + 付 10 USDD 创建费 |
| `claimFees()` | Owner | 提取 feePool |
| `getPoolState(marketId)` | 任何人 | 查询池状态 (yesSupply, noSupply, yesPrice, noPrice, liquidity, feePool) |
| `settle(marketId, outcome, winner, payoutSun)` | Owner | 结算支付赢家 |
| `settleSimulated(marketId, outcome)` | Owner | 气囊模式（不转账） |

### DB 变更

**positions 表** 改为按 `(market_id, wallet_address)` 唯一，追踪 `yes_balance` / `no_balance`：

```sql
-- 新增 trades 表
CREATE TABLE trades (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  market_id     UUID NOT NULL REFERENCES markets(id),
  wallet_address TEXT NOT NULL,
  side          TEXT NOT NULL CHECK (side IN ('YES', 'NO')),
  type          TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  shares        NUMERIC(20,6) NOT NULL,
  price         NUMERIC(10,6) NOT NULL,
  usdd_amount   NUMERIC(20,6) NOT NULL,
  fee           NUMERIC(20,6) DEFAULT 0,
  tx_hash       TEXT NOT NULL DEFAULT '',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- positions 表改为余额追踪（需要迁移现有数据）
ALTER TABLE positions
  DROP COLUMN amount,
  DROP COLUMN side,
  ADD COLUMN yes_balance NUMERIC(20,6) DEFAULT 0,
  ADD COLUMN no_balance  NUMERIC(20,6) DEFAULT 0,
  ADD COLUMN total_bought NUMERIC(20,6) DEFAULT 0,
  ADD COLUMN total_sold NUMERIC(20,6) DEFAULT 0,
  ADD UNIQUE (market_id, wallet_address);
```

### 前端变更

| 组件 | 变更 |
|:----|:-----|
| TradePanel | 加 **Sell tab**：选择 YES/NO → 读持仓余额 → 输入卖出份额 → 签名卖出 |
| TradePanel | **Buy tab** 更新：显示当前 AMM 价格、滑点估计 |
| Recent Trades | 改为调 `GET /api/trades?market=<id>`，展示真实交易 |
| Create Market | 部署时加付 10 USDD 创建费 |

## 不涉及的

- 多 LP 外部做市商（Phase 2，hackathon 后）
- \$HTX 质押/回购机制（独立 spec）
- 结算费（赛后优化）
- 价格图形化展示历史成交价（已通过 PriceChart 展示 yesPrice，足够）
