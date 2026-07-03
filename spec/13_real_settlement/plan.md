# Spec 13: 执行计划

## 架构图

```
oracle-deliberation.tsx               settle/route.ts                     ResolveSettlement.sol
(前端的 Settle 按钮)                    (服务端 API)                        (合约)
         │                                   │                                │
         │ POST /api/settle                   │                                │
         │ {marketId, outcome}                │                                │
         │ ──────────────────────────►        │                                │
         │                                   │ ① listPositionsByMarket(id)    │
         │                                   │    ← [{wallet, yesBalance,     │
         │                                   │        noBalance, ...}]       │
         │                                   │                                │
         │                                   │ ② 筛出赢方持仓                  │
         │                                   │    例: outcome=YES             │
         │                                   │    → 取 yes_balance > 0 的行   │
         │                                   │                                │
         │                                   │ ③ getPoolState(marketId)       │
         │                                   │    ← {yesSupply, noSupply,     │
         │                                   │       liquidity, feePool}      │
         │                                   │                                │
         │                                   │ ④ 计算分摊                      │
         │                                   │    pool = contractUSDD - feePool│
         │                                   │    for each winner:             │
         │                                   │      share = balance / total    │
         │                                   │      payout = pool * share     │
         │                                   │                                │
         │                                   │ ⑤ settleBatch()                │
         │                                   │    (winners[], payouts[])      │
         │                                   │ ──────────────────────────►    │
         │                                   │                                │ 循环转账
         │                                   │ ◄──────────────────────────    │
         │                                   │                                │
         │ {txHash, paidOut:true,            │                                │
         │  winners: n, totalPayout}         │                                │
         │ ◄──────────────────────────       │                                │
         │                                   │                                │
         │ 显示 "Settled · YES"              │                                │
         │ + Tronscan 链接                   │                                │
```

## 执行步骤

### Step 1: 合约 — 新增 `settleBatch()` 函数

**文件**: `apps/contracts/ResolveSettlement.sol`

在现有 `settle()` 和 `settleSimulated()` 之后新增一个函数（不修改已有函数，保持向后兼容）：

```solidity
/// @notice 批量结算：向多个赢家赔付。owners 调用，仅一次。
/// @param marketId  市场 ID（bytes32）
/// @param outcome   结算结果（YES → 0x5945530000000000 / NO → 0x4e4f0000000000）
/// @param winners   赢家地址数组
/// @param payouts   对应赔付金额数组（最小单位 sun）
function settleBatch(
    bytes32 marketId,
    bytes8 outcome,
    address[] calldata winners,
    uint256[] calldata payouts
) external onlyOwner {
    Market storage m = markets[marketId];
    require(m.exists, "Resolve: no market");
    require(!m.settled, "Resolve: settled");
    require(winners.length == payouts.length, "Resolve: length mismatch");
    require(winners.length > 0, "Resolve: empty winners");

    m.settled = true;
    m.outcome = outcome;

    uint256 totalPayout = 0;
    for (uint i = 0; i < winners.length; i++) {
        if (payouts[i] > 0 && winners[i] != address(0)) {
            require(usdd.transfer(winners[i], payouts[i]), "Resolve: payout failed");
            totalPayout += payouts[i];
        }
    }

    emit Settled(marketId, outcome, winners[0], totalPayout);
}
```

> ⚠️ 重用了 `Settled` 事件（现有前端/索引器已监听该事件）。`winner` 参数传第一个赢家地址，`payout` 传总赔付额。

在 `SETTLEMENT_ABI`（`constants.ts`）中补充 `settleBatch` 的 ABI 条目。

### Step 2: 编译 & 重新部署合约

```bash
# 编译
cd /home/wst1/王圣滔/C主要项目/resolve
pnpm --filter @resolve/contracts compile

# 部署到 Shasta
TRON_PRIVATE_KEY=xxx pnpm --filter @resolve/contracts deploy:shasta
```

部署成功后把新合约地址更新到 `apps/web/lib/constants.ts` 的 `SETTLEMENT_ADDRESS`。

> 如果旧合约上已有数据（已创建的市场、持仓），需要将旧合约地址也保留在 `.env` 中作为历史引用，或重新创建测试市场。

### Step 3: 合约封装 — `settleBatch()`

**文件**: `apps/web/lib/contract/settlement.ts`

新增函数：

```typescript
/**
 * 批量结算：向多个赢家转账赔付。
 * 由服务端 owner 私钥签名，仅 API route 中可用。
 */
export async function settleBatch(
  marketId: string,
  outcome: Outcome,
  winners: string[],
  payouts: bigint[],
): Promise<string> {
  const tw = getServerTronWeb();
  if (!tw) throw new Error("服务端 TronWeb 未配置（缺少 TRON_PRIVATE_KEY）");

  const c = tw.contract(SETTLEMENT_ABI as any, SETTLEMENT_ADDRESS);
  const mid = marketIdToBytes32(marketId);
  const out8 = outcomeToBytes8(outcome);
  const txHash: string = await (c as any)
    .settleBatch(mid, out8, winners, payouts.map(String))
    .send({ feeLimit: 10_000_000_000, callValue: 0 }); // 批量需更高费用上限
  return txHash;
}
```

同时需要在 `SETTLEMENT_ABI` 中增加 `settleBatch` 的 ABI 条目。

### Step 4: API — 重写 `/api/settle` 路由

**文件**: `apps/web/app/api/settle/route.ts`

核心逻辑：

```typescript
// 1. 气囊模式 → 走旧路径 settleSimulated()（不变）
// 2. 非气囊模式:
//    a. 从 DB 查 marketId 对应的所有持仓
//    b. 筛选 winning side 的持仓（yes_balance 或 no_balance > 0）
//    c. 计算总赢家份额
//    d. 通过 getPoolState 或 usdd.balanceOf 获取合约可用余额
//    e. 按比例分配：payout = (balance / totalWinningShares) * availablePool
//    f. 调用 settleBatch()
//    g. 更新 DB 中市场状态为 settled + settlement_tx_hash
```

新增 DB data 层函数 `updateMarket()`（已有 ✅）和 `getPoolState()` 封装（已有 ✅）。

### Step 5: 前端 — 去掉 "airbag" 标签

**文件**: `apps/web/components/oracle-deliberation.tsx`

第 329 行修改：
```tsx
// 当前：Settled {settleTx.simulated ? "(airbag)" : ""} · {display?.outcome}
// 改为：
Settled · {display?.outcome}
```

以及第 338 行的 "/#/transaction/" 路径确认在真实 Tronscan 上可点击跳转。

### Step 6: DB 迁移 — `markets` 表增加 `settlement_info` 字段（可选）

如果希望在 DB 中记录每笔结算的支付明细，可在 `markets` 表加一个 JSON 字段。不阻塞核心流程，列为加分项。

## 关键考虑

### 池分配计算

```
availablePool = usdd.balanceOf(contractAddress) - feePool
totalWinningShares = Σ 所有赢家的 winningBalance
winnerPayout[i] = floor(availablePool * winnerBalance[i] / totalWinningShares)
```

取 `floor`（向下取整）而非 `round`，避免池溢出。剩余的 1-2 sun 留在合约中，下次 `claimMarketFees` 时随 feePool 提取。

### 合约余额获取方式

两个选项：
- **A**: 合约内读 `usdd.balanceOf(address(this))`（需要新增 view 函数）→ 改合约
- **B**: 服务端直接查 USDD 合约的 `balanceOf(SETTLEMENT_ADDRESS)`（`apps/web/lib/contract/usdd.ts` 已有 `balanceOf`）→ 不改合约

选择 **B**，零合约改动。

### 无赢家时的兜底

如果 `listPositionsByMarket` 返回空，或所有赢方余额 = 0：
- 气囊模式：正常 `settleSimulated()`
- 真实模式：仅标记市场已结算（`settleSimulated()`），不转账。在前端显示 "No winning positions to pay out"
