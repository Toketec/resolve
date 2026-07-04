# Spec 16: 执行计划

## 完整闭环图

```
用户 TronLink 创建市场
  → approve USDD → createMarket(mid, liquidity) via TronLink ✅（合约去掉 onlyOwner）
  → 前端 POST /api/markets → DB 写入同步

用户买卖 YES/NO via TronLink
  → buyShares/sellShares（已有，正常工作）
  → DB 同步持仓

市场到期（或 ?dev=1 强制触发）
  → 6 Agent 共识
  → 有 OPENAI_API_KEY → 真实 LLM 推理
  → 无 key + DEV 模式 → 随机投票（非确定性 mock）
  → 共识结果返回前端 → 动画逐条浮现

共识达成 → 自动触发结算
  → POST /api/settle（auto）
  → settleBatch() 真实转账 USDD
  → 赢家钱包到账 ✅
```

## 执行步骤

### Step 1: 合约 — `createMarket()` 去掉 `onlyOwner`

**文件**: `apps/contracts/ResolveSettlement.sol`

```diff
-    function createMarket(bytes32 marketId, uint256 liquidity) external onlyOwner {
+    function createMarket(bytes32 marketId, uint256 liquidity) external {
```

去掉 `onlyOwner` 修饰符后，任何用户都可以用自己的 TronLink 钱包创建链上市场。合约内部逻辑不变：
- 从 `msg.sender` 拉取 `(liquidity + 10 USDD 创建费)`
- 需要用户先 `approve` USDD 给合约地址
- 前端 `create/page.tsx` 的现有逻辑（走 TronLink）**就是正确的**，之前只是合约挡住了

**同时删除 `settleSimulated()` 函数**（不再需要气囊模式）：

```diff
-    /** 安全气囊：标记已结算但不转账（测试网不稳定时用）。 */
-    function settleSimulated(bytes32 marketId, bytes8 outcome) external onlyOwner {
-        Market storage m = markets[marketId];
-        require(m.exists, "Resolve: no market");
-        require(!m.settled, "Resolve: settled");
-        m.settled = true;
-        m.outcome = outcome;
-        emit SettledSimulated(marketId, outcome);
-    }
```

### Step 2: 合约 ABI — 删除 `settleSimulated` 条目

**文件**: `apps/web/lib/constants.ts`

从 `SETTLEMENT_ABI` 数组中移除 `settleSimulated` 的 ABI 条目。

### Step 3: 合约封装 — 重构 settlement.ts

**文件**: `apps/web/lib/contract/settlement.ts`

1. **删除 `settleSimulated()` 函数**
2. **删除 `isAirbag()` 函数**
3. **保留 `settle()` 和 `settleBatch()`**（供结算使用）
4. **保留 `createMarket()` 客户端函数**（它本来就是正确的，只因为合约 `onlyOwner` 阻塞了）

修改后 exported 函数列表：
```
✓ createMarket()        — 客户端 TronLink 签名（创建市场）
✓ buyShares()           — 客户端 TronLink 签名（买入）
✓ sellShares()          — 客户端 TronLink 签名（卖出）
✓ settle()              — 服务端 owner 签名（单赢家结算）
✓ settleBatch()         — 服务端 owner 签名（批量结算）
✗ settleSimulated()     — ⛔ 删除
✗ isAirbag()            — ⛔ 删除
```

### Step 4: API — 重构 `/api/settle/route.ts`

**文件**: `apps/web/app/api/settle/route.ts`

1. **删除气囊分支**（不再判断 `isAirbag()`）
2. **只保留真实结算路径**：
   - 查询持仓 → 筛赢家 → 查合约余额 → 计算分摊 → `settleBatch()` → 更新 DB
3. **如果 market 不存在链上** → 回滚（不需要降级气囊）

新的简化逻辑：

```typescript
export async function POST(req: Request) {
  const { marketId, outcome } = body;

  // 1. 查询所有持仓
  const positions = await listPositionsByMarket(marketId);
  const winners = positions.filter(...);
  
  // 2. 无赢家兜底
  if (winners.length === 0) {
    await updateMarket(marketId, { status: "settled", resolved_outcome: outcome });
    return Response.json({ paidOut: false, note: "No winning positions" });
  }
  
  // 3. 计算分摊 → settleBatch()
  const txHash = await settleBatch(marketId, outcome, winnerAddresses, payoutAmounts);
  await updateMarket(marketId, { status: "settled", resolved_outcome: outcome, settlement_tx_hash: txHash });
  
  return Response.json({ txHash, paidOut: true, winnerCount: winners.length });
}
```

### Step 5: 前端 — 共识后自动触发结算

**文件**: `apps/web/components/oracle-deliberation.tsx`

修改 `startReveal()` 中的 `done` 阶段：

```typescript
// 当前：共识达成后只显示 Settle 按钮，用户手动点
// 改为：
if (i >= consensus.votes.length) {
  clearInterval(revealTimer.current);
  setPhase("done");
  // 自动触发结算（不再等用户手动点）
  handleSettle().catch(() => {});
}
```

同时删除 `<button>Settle on-chain</button>` 的手动触发 UI（不再需要用户干预）。

删除 `handleSettle()` 中的手动触发逻辑，改为在 `phase === "done"` 时自动执行。

### Step 6: DEV 模式 — 随机投票

**文件**: `packages/ai/src/llm.ts`

当前 `mockAnswer()` 是确定性输出（bullish→YES/0.8, bearish→NO/0.58...）。

改为 DEV 模式随机投票：

```typescript
function mockAnswer(opts: AskOptions): AgentAnswer {
  const outcome = Math.random() > 0.5 ? "YES" : "NO";
  const confidence = 0.5 + Math.random() * 0.4;  // 0.5 ~ 0.9
  return {
    outcome: outcome as Outcome,
    confidence: Number(confidence.toFixed(2)),
    rationale: `(dev mode) Random vote for testing.`,
    evidenceRefs: opts.fallbackEvidenceRefs.slice(0, 2),
    provider: "mock",
  };
}
```

这样每次 force resolve（DEV 模式）6 个 Agent 都会随机投票，能完整走通闭环并看到不同的结算结果。

### Step 7: 删除 AIRBAG 环境变量和依赖

**文件**: `.env.local`

```diff
- NEXT_PUBLIC_AIRBAG_ENABLED=true
  （整行删除，不再使用）
```

**文件**: `apps/web/lib/constants.ts`

```diff
- export const AIRBAG_ENABLED = process.env.NEXT_PUBLIC_AIRBAG_ENABLED !== "false";
  （删除）
```

### Step 8: 编译合约 + 重新部署

```bash
# 编译（含 createMarket 去掉 onlyOwner + 删除 settleSimulated）
cd /home/wst1/王圣滔/C主要项目/resolve
pnpm --filter @resolve/contracts compile

# 部署到 Shasta 测试网
TRON_PRIVATE_KEY=xxx pnpm --filter @resolve/contracts deploy:shasta
```

部署后更新 `.env.local` 中的合约地址。

### Step 9: 类型检查 + 构建

```bash
pnpm typecheck && pnpm build
```

### Step 10: 端到端验证

1. 用户 A（TronLink）创建市场 → approve USDD → createMarket() → 链上 exists=true ✅
2. 用户 B、C 分别买 YES → positions 表有数据 ✅
3. 市场到期 (或 `?dev=1`) → Force resolve → 6 Agent 随机投票 → 动画 ✅
4. 共识达成后自动触发 settleBatch() → 链上转账 USDD ✅
5. 用户 B、C 钱包收到 USDD → Tronscan SUCCESS ✅

## 关键考虑

### settleBatch 仍然 onlyOwner

`settleBatch()` 和 `settle()` 保持 `onlyOwner`。共识在链下完成（6 Agent 推理），平台作为可信节点用 owner 私钥将结果写入链上。这是合理的信任模型——平台不控制"投什么票"，只负责"把投票结果执行上链"。

### 创建市场的 USDD 从哪里来

用户必须：
1. 有 USDD（从 Shasta Faucet 领，或 MockUSDD mint）
2. approve USDD 给 ResolveSettlement 合约地址
3. 调用 `createMarket(marketId, liquidity)` → 合约从用户拉取 `(liquidity + 10 USDD)`

### 没有气囊后退

如果链上市场不存在（`createMarket` 没成功），`settleBatch` 会直接回滚。没有气囊降级。这意味着：
- 创建市场时必须确认链上市场存在
- 前端应在创建成功后调用 `getMarket()` 验证
