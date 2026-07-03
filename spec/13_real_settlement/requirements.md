# Spec 13: 真实链上结算（关闭气囊模式）

## 问题

当前结算流程只能在气囊模式（`AIRBAG_ENABLED=true`）下走通，气囊模式调用 `settleSimulated()` 仅标记合约状态 `settled=true`，**不执行真实 USDD 赔付转账**。

关闭气囊后有两个断裂点：

1. **前端 `handleSettle()` 未传 `winnerWallet` 和 `payoutSun`** → API 校验失败返回 400
2. **合约 `settle()` 只能赔付单个地址** → 多个赢家持仓时无法按比例分摊奖金池

## 目标

关闭气囊模式（`NEXT_PUBLIC_AIRBAG_ENABLED=false`）后，完整的结算闭环应自动跑通：

```
6 Agent 共识 → 前端展示 → 点击 Settle → 服务端查询所有赢家持仓 → 
按比例计算赔付 → settleBatch() 批量转账 → 链上确认
```

全程不改变前端用户操作流程（仍只点一次 "Settle on-chain" 按钮）。

## 现有基础设施

| 层 | 状态 | 说明 |
|:--|:----|------|
| `packages/db/src/data.ts` — `listPositionsByMarket()` | ✅ 已存在 | 按 market_id 查询所有持仓 |
| `apps/web/app/api/settle/route.ts` | ⚠️ 需重写 | 需增加赢家分配计算 + settleBatch 调用 |
| `apps/web/lib/contract/settlement.ts` — `getPoolState()` | ✅ 已存在 | 查询池状态（yesSupply/noSupply/liquidity/feePool） |
| `ResolveSettlement.sol` — `settle()` | ❌ 单地址 | 需新增 `settleBatch()` |
| `apps/web/components/oracle-deliberation.tsx` | ⚠️ 微调 | settle 后仅去掉 "airbag" 标签 |

## 依赖项

- `TRON_PRIVATE_KEY` 环境变量已配置（服务端 owner 私钥，当前 settle API 已有）
- Shasta 测试网合约已部署（当前已有地址 `TRpc78jLEq2wsxuB1mCvqSahU47B73UoVV`）
- `packages/db` 的 Supabase 连接正常（已有 `listPositionsByMarket`）
- **需要重新部署合约**（新增 `settleBatch()` 函数）

## 边界说明

- 如果某市场没有任何赢家持仓（所有人在到期前已卖光），归还未使用的流动性给创建者
- 如果合约 USDD 余额不足以支付全部赔付，API 应返回明确错误，**不部分赔付**
- 如果 `AIRBAG_ENABLED=true`（默认），仍走旧的 `settleSimulated()` 路径，不受本 spec 影响
- x402 微支付始终是 simulated（不在此 spec 范围内）
