# Spec 17: 执行计划

## 完整闭环图

```
用户 TronLink 创建市场             ← createMarket 已 public（去 onlyOwner）
  → 用户买 YES/NO                   ← buyShares 已有，正常工作
  → 市场到期 + AI 共识达成           ← 6 Agent 裁决（已有，或 Spec 16 随机投票）
  → resolveOutcome(marketId, YES/NO) ← 任何人调（API 或前端 TronLink）
    → 合约记录 outcome，不转账
  → 赢家调 claimReward(marketId)     ← 每个赢家自己领
    → 合约自算：userStake / totalWinSupply × liquidity = payout
    → 转账 USDD 到赢家钱包
```

## 执行步骤

### Step 1: 合约 — 新增 `resolveOutcome` 和 `claimReward`

**文件**: `apps/contracts/ResolveSettlement.sol`

在现有的 `settle`/`settleBatch`（保留 `onlyOwner` 做兼容但不调用）旁边新增两个公开函数：

```solidity
// ── 公开结算（无需 owner）────────────────────────────

/**
 * 提交市场结果。任何人可调——合约只记录 outcome，不涉及转账。
 * 幂等：已 settled 的拒绝；相同 outcome 重复调会回滚于 settled 检查。
 */
function resolveOutcome(bytes32 marketId, bytes8 outcome) external {
    Market storage m = markets[marketId];
    require(m.exists, "Resolve: no market");
    require(!m.settled, "Resolve: settled");
    m.settled = true;
    m.outcome = outcome;
    emit MarketResolved(marketId, outcome);
}

event MarketResolved(bytes32 indexed marketId, bytes8 outcome);

/**
 * 赢家领取赔付。根据链上 stakes 自算应得金额。
 * 每个赢家独立调，只领一次（领取后清空 stake 防重入）。
 * 转账失败时整体回滚。
 */
function claimReward(bytes32 marketId) external {
    Market storage m = markets[marketId];
    require(m.settled, "Resolve: not resolved");
    require(m.exists, "Resolve: no market");

    bool isYesWin = (m.outcome == bytes8("0x5945530000000000")); // "YES" in bytes8
    uint256 userStake = stakes[marketId][msg.sender][isYesWin];
    require(userStake > 0, "Resolve: no winning stake");

    uint256 totalWinningSupply = isYesWin ? m.yesSupply : m.noSupply;
    require(totalWinningSupply > 0, "Resolve: no winning supply");

    // payout = userStake / totalWinningSupply * liquidity
    // 注意：liquidity 是初始注入池，实际可分配 = liquidity - 已 claim 金额
    // 但更精确的做法是跟踪 remainingPool
    // 简单实现：用 liquidity 比例分配，注意不要超额
    uint256 payout = (m.liquidity * userStake) / totalWinningSupply;

    // 清零防重入
    stakes[marketId][msg.sender][isYesWin] = 0;

    require(usdd.transfer(msg.sender, payout), "Resolve: claim transfer failed");
    emit Claimed(marketId, msg.sender, isYesWin, payout);
}

event Claimed(bytes32 indexed marketId, address indexed winner, bool isYesWin, uint256 payout);
```

**注意事项**：
- `liquidity` 是创建市场时注入的初始资金，所有赢家按比例分这笔钱
- 赢家不能重复领（`stakes` 清零）
- 如果没有人 claim，资金就一直锁在合约里（这不合理——见后续的 `sweepUnclaimed` 讨论）
- `outcome` 的 bytes8 比较要正确处理——"YES" 不是标准 bytes8 编码，需要确认前端使用的编码方式

#### 关于资金分配的精确定义

`liquidity` 是市场创建时注入的初始池。在 AMM 交易过程中：
- 用户买 YES/NO → 资金进入合约（transferFrom），但`liquidity` 不变
- 用户卖 YES/NO → 资金出合约（transfer），但`liquidity` 不变
- 交易费（0.1%）累积到 `feePool`

所以结算时的分配应该基于**合约实际余额**，而非仅 `liquidity`：

```solidity
// 合约中 USDD 的当前余额（扣除 feePool 部分为可分配池）
uint256 available = usdd.balanceOf(address(this)) - m.feePool;
uint256 payout = (available * userStake) / totalWinningSupply;
```

这样更准确——包括了交易产生的手续费收益（LP 部分留在池中）和任何额外转入的资金。

### Step 2: 合约 — `createMarket` 去掉 `onlyOwner`

**文件**: `apps/contracts/ResolveSettlement.sol`

```diff
-    function createMarket(bytes32 marketId, uint256 liquidity) external onlyOwner {
+    function createMarket(bytes32 marketId, uint256 liquidity) external {
```

这是 Spec 16 的一部分，但 Spec 17 部署新合约时一并处理。

### Step 3: 合约 — 删除 `settleSimulated`

**文件**: `apps/contracts/ResolveSettlement.sol`

删除整个 `settleSimulated()` 函数（Spec 16 气囊模式）。新合约不再有"只标记不转账"的路径。

### Step 4: 合约封装 — 重构 `settlement.ts`

**文件**: `apps/web/lib/contract/settlement.ts`

1. **新增客户端函数**：
   - `resolveOutcome(marketId, outcome)` — 用 TronLink 签名
   - `claimReward(marketId)` — 用 TronLink 签名

2. **保留**（仍然可用，但不作为自动流程一部分）：
   - `settle()` / `settleBatch()` — 改 public 后 owner 仍然可以手动调
   - 但 **不能** 从 API 路由自动调它们了（私钥已删除）

3. **删除客户端函数**：
   - 无（createMarket/buyShares/sellShares 保持不变）

4. **删除服务端函数**（不再需要）：
   - `settleBatch` 的服务端签名版本 → 删除
   - `settle` 的服务端签名版本 → 删除
   - `claimMarketFees` 的服务端签名版本 → 删除

修改后的 exported 函数列表：

```
✓ createMarket()        — 客户端 TronLink 签名（创建市场）     ✅ 不变
✓ buyShares()           — 客户端 TronLink 签名（买入）         ✅ 不变
✓ sellShares()          — 客户端 TronLink 签名（卖出）         ✅ 不变
✓ resolveOutcome()      — 客户端 TronLink 签名（提交结果）     ✨ 新增
✓ claimReward()         — 客户端 TronLink 签名（领钱）         ✨ 新增
✗ settle()              — 服务端签名 → 删除                    ⛔ 删除
✗ settleBatch()         — 服务端签名 → 删除                    ⛔ 删除
✗ claimMarketFees()     — 服务端签名 → 删除                    ⛔ 删除
```

### Step 5: TronWeb — 删除服务端实例工厂

**文件**: `apps/web/lib/contract/tronweb.ts`

删除 `getServerTronWeb()` 函数（从 `TRON_PRIVATE_KEY` 构建服务端 TronWeb 实例）。

保留：
- `getClientTronWeb()` — TronLink 浏览器注入
- `getReadOnlyTronWeb()` — 公共 full node（只读查询）

`tronweb.ts` 不再 import 任何环境变量。

### Step 6: API — 重写 `/api/settle/route.ts`

**文件**: `apps/web/app/api/settle/route.ts`

该 API 路由不再需要。结算流程改为纯前端触发：

1. **共识达成后** → 前端直接调 `resolveOutcome(marketId, outcome)` 通过 TronLink
2. **赢家领钱** → 前端按钮调 `claimReward(marketId)` 通过 TronLink

如果仍想保留服务端触发 resolveOutcome 的 API（方便自动流程），可以保留简化版本：

```typescript
// POST /api/settle
// 不再需要 TRON_PRIVATE_KEY
// 改为提供 resolveOutcome 所需的信息，由前端 TronLink 签名
// 或者完全删除，改为前端直接调合约
```

建议：**删除整个 API 路由**。 `resolveOutcome` 任何人都可以调，不需要服务端。共识组件达成共识后直接前端发起交易。

### Step 7: 前端 — 新增领钱入口

**文件**: `apps/web/app/market/[slug]/page.tsx`（或相关组件）

在市场详情页已结算状态下显示：

```
🏁 Market Resolved: YES

Your position: 1,000 YES shares
Estimated reward: 2.00 USDD

[ Claim Reward ]  ← 调 claimReward(marketId)
```

- 只有赢家才显示（根据当前 TronLink 地址的 stakes 判断）
- 已领过的显示 "Claimed ✓" 并禁用按钮
- 领取后显示 txHash 和 Tronscan 链接

### Step 8: 前端 — 共识后触发 resolveOutcome

**文件**: `apps/web/app/market/[slug]/oracle-deliberation.tsx`

共识达成后的 `done` 阶段不再调服务端 API，改为：

```typescript
// 共识达成 → 前端调 resolveOutcome
import { resolveOutcome } from "@/lib/contract/settlement";

// 在共识达成后的 done 阶段
const txHash = await resolveOutcome(marketId, consensus.outcome);
// 成功后 → 显示 "Resolution submitted ✓" + txHash
// 然后显示领钱按钮
```

### Step 9: ABI — 更新常量

**文件**: `apps/web/lib/constants.ts`

- 在 `SETTLEMENT_ABI` 中添加 `resolveOutcome` 和 `claimReward` 的 ABI 条目
- 从 `SETTLEMENT_ABI` 中删除 `settleSimulated` 条目
- 删除 `AIRBAG_ENABLED` 常量

### Step 10: 环境变量 — 清理

- `.env.local`：删除 `TRON_PRIVATE_KEY` 行（不再需要）
- `.env.local`：删除 `NEXT_PUBLIC_AIRBAG_ENABLED` 行（不再需要）
- `.env.example`：更新注释，TRON_PRIVATE_KEY 标注为"仅合约部署用"

### Step 11: 编译 + 部署合约

```bash
# 编译（含 resolveOutcome + claimReward + createMarket 去 onlyOwner）
cd /home/wst1/王圣滔/C主要项目/resolve
pnpm --filter @resolve/contracts compile

# 部署到 Shasta 测试网
TRON_PRIVATE_KEY=xxx pnpm --filter @resolve/contracts deploy:shasta
```

部署后更新 `.env.local` 中的合约地址。

注意：**`TRON_PRIVATE_KEY` 在部署这一步才会用到，运行时的所有代码不再引用它**。

### Step 12: 类型检查 + 构建

```bash
pnpm typecheck && pnpm build
```

### Step 13: 更新部署文档

- `docs/deployment-plan.md` / `.zh.md`：TRON_PRIVATE_KEY 从"运行环境变量"改为"仅部署时临时设置"
- `apps/contracts/README.md`：明确声明私钥仅部署用

## 关键考虑

### 谁来调 resolveOutcome？

任何人都可以。AI 共识结果公开后：
1. 前端自动调（共识组件的 done 阶段）
2. 也可以是手动按钮（"Submit resolution"）
3. 甚至可以是一个公开的 cron job

因为 `resolveOutcome` 只记录 outcome 不涉及转账，恶意提交唯一后果是"抢在正确结果前提交错误结果"。解决方案：
- **先到先得**：第一个调 `resolveOutcome` 的确定 outcome，后续调用被 `m.settled` 拒绝
- 风险：攻击者在共识到达前抢调 resolveOutcome 提交错误结果
- 缓解：共识组件只在共识页面显示"Submit"按钮；或者添加等待期/Agent 签名验证

**对于 demo**：直接前端调，简单可靠。

### claimReward 的资金安全

`claimReward` 不需要 `onlyOwner`，因为：
- 合约从 `stakes` 映射计算 payout，用户只能领自己的份额
- 用户不能伪造持仓（stakes 由 buyShares 写入，受 `msg.sender` 约束）
- 零和：总 payout ≤ 合约可用余额（比例分配）
- 防重入：领后 `stakes` 清零

### 无法领回的资金

如果赢家不调 `claimReward`，资金就一直锁在合约里。可以后续添加：
- 时间锁：N 天后未领的资金可被回收
- 或保持现状（用户的延迟领取是用户自己的事，资金安全）

### Spec 16 的改动与本 spec 的关系

Spec 16 的部分改动（`createMarket` 去 `onlyOwner`、删除 `settleSimulated`）被 Spec 17 吸收。Spec 16 的结算部分（自动调 `settleBatch`）被本方案取代。
