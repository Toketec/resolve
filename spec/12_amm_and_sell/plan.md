# Spec 12: 执行计划

## 架构总览

```
packages/db/migrations/00003_amm_schema.sql        ←── 新增 trades 表 + positions 表迁移
packages/db/src/data.ts                            ←── 新增 insertTrade(), updatePosition()
apps/contracts/ResolveSettlement.sol               ←── AMM 重写合约（buyShares+ sellShares+ fee+ createMarket）
apps/contracts/scripts/deploy.js                   ←── 重新部署脚本
apps/web/lib/contract/settlement.ts                ←── 新增 sellShares(), claimFees(), getPoolState()
apps/web/app/api/markets/route.ts                  ←── POST 创建费校验
apps/web/app/api/trades/route.ts                   ←── 新增 ?market=<id> 参数
apps/web/app/api/buy/route.ts                      ←── 改为调用新的 positions 余额更新逻辑
apps/web/app/api/sell/route.ts                     ←── 新建：卖出 API（DB 层 + 合约调用）
apps/web/components/trade-panel.tsx                ←── 加 Sell tab + AMM 价格 + 持仓显示
apps/web/app/markets/[slug]/page.tsx               ←── Recent Trades 改为 API 调用
```

## 步骤

### Step 1: 合约重写 — AMM + Fee

**文件**: `apps/contracts/ResolveSettlement.sol`

核心结构：

```solidity
struct Market {
    bool exists;
    bool settled;
    bytes8 outcome;
    uint256 liquidity;      // 初始注入 USDD
    uint256 yesSupply;      // 当前 YES 份额数
    uint256 noSupply;       // 当前 NO 份额数
    uint256 feePool;        // 累积平台费
    uint256 net;            // 累计 YES 买入 - 累计 NO 买入 (USDD)
}
mapping(bytes32 => Market) public markets;
mapping(bytes32 => mapping(address => mapping(bool => uint256))) public stakes;
```

**buyShares()**: 
1. 检查市场存在且未结算
2. 计算当前价格: `price = 0.5 + net / (2 * L)`
3. 计算份额: `shares = amount / price`
4. 计算费用: `fee = amount × 0.001`
5. 更新 net, yesSupply/noSupply, feePool
6. 记录 stakes
7. 从买家拉取 USDD

**sellShares()**:
1. 检查市场存在且未结算
2. 检查用户 stake 充足
3. 计算当前价格
4. 计算返还: `usdd = shares × price × (1 - 0.001)`
5. 更新 net, yesSupply/noSupply, feePool
6. 返还 USDD 给用户

**createMarket()**:
1. 检查市场不存在
2. 收取 10 USDD 创建费（`transferFrom` → feePool）
3. 收取 L USDD 流动性（`transferFrom`）
4. 初始化市场池

### Step 2: DB 迁移

**文件**: `packages/db/migrations/00003_amm_schema.sql`

```sql
-- 新增 trades 表
-- 迁移 positions 表：现有单笔记录合并为余额格式
```

### Step 3: DB 数据层

**文件**: `packages/db/src/data.ts`

新增：
- `insertTrade(input)` → 写入 trades 表
- `updatePosition(marketId, wallet, side, shares, usddAmount, fee, txHash)` → 更新余额
- `listTradesByMarket(marketId)` → 按市场获取交易历史
- `getBalance(marketId, wallet)` → 读取单人持仓

### Step 4: 合约封装

**文件**: `apps/web/lib/contract/settlement.ts`

新增：
- `sellShares(marketId, side, shares)` → TronLink 签名
- `createMarket(marketId, liquiditySun)` → TronLink 签名（含 10 USDD 创建费）
- `claimFees()` → owner 签名
- `getPoolState(marketId)` → 只读查询

### Step 5: API 路由

**sells route**: `apps/web/app/api/sell/route.ts`（新建）
```
POST /api/sell
  body: { marketId, side, shares, walletAddress, txHash }
  1. 验证参数
  2. 更新 positions 表（扣减余额）
  3. 写入 trades 表
  4. 返回 { ... }
```

**trades API 扩展**: `apps/web/app/api/trades/route.ts`
- 新增 `?market=<marketId>` 参数过滤
- 无 wallet 但有 marketId → 返回该市场所有交易（用于 Recent Trades）

### Step 6: 前端 TradePanel

**文件**: `apps/web/components/trade-panel.tsx`

**新结构**：
```
┌──────────────────────────────┐
│  [Buy YES · 55%] [Buy NO]   │  ← 已有
│                              │
│  [Sell YES]  [Sell NO]      │  ← 新增 tab
└──────────────────────────────┘
```

**Buy tab**（已有，微调）：
- "Buy YES / NO" 按钮保留
- 显示当前 AMM 价格
- 显示 0.1% 费用提示
- 调用 `buyShares()` 合约

**Sell tab**（新建）：
- "Sell YES / Sell NO" 切换
- 显示当前持仓数量（从 API 读取）
- 输入要卖出的份额数（上限 = 当前持仓）
- 估算卖出金额
- 显示 0.1% 费用扣除
- 调用 `sellShares()` 合约

### Step 7: Recent Trades 接入

**文件**: `apps/web/app/markets/[slug]/page.tsx`

```typescript
// 之前
const trades = MOCK_TRADES.filter(...).slice(0, 8);

// 改为
const trades = await fetch(`/api/trades?market=${market.id}`).then(r => r.json());
// 失败时降级到空数组（不显示 mock）
```

### Step 8: 创建市场加创建费

**文件**: `apps/web/app/create/page.tsx`

"Deploy market" 按钮增加一步：
1. 先 POST /api/markets 创建 DB 记录
2. TronLink 连接 → approve USDD（流动性 L + 创建费 10）
3. TronLink 签名 createMarket() → 链上池创建 + 费用扣除
4. 跳转 `/markets/{slug}`

### Step 9: 验证

```bash
pnpm typecheck
pnpm build
# 手动测试: dev server
```

## 文件变更清单

| # | 文件 | 操作 |
|:-:|------|:----:|
| 1 | `apps/contracts/ResolveSettlement.sol` | 重写，AMM + fee |
| 2 | `apps/contracts/scripts/deploy.js` | 更新 |
| 3 | `packages/db/migrations/00003_amm_schema.sql` | 新建 |
| 4 | `packages/db/src/data.ts` | 新增函数 |
| 5 | `apps/web/lib/contract/settlement.ts` | 新增 sell/claim/create/getPoolState |
| 6 | `apps/web/app/api/sell/route.ts` | 新建 |
| 7 | `apps/web/app/api/trades/route.ts` | 扩展 market 参数 |
| 8 | `apps/web/app/api/buy/route.ts` | 改为新 positions 逻辑 |
| 9 | `apps/web/components/trade-panel.tsx` | Sell tab + AMM 价格 |
| 10 | `apps/web/app/create/page.tsx` | 创建费逻辑 |
| 11 | `apps/web/app/markets/[slug]/page.tsx` | Recent Trades 改 API |
