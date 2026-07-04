# Spec 16: 完整结算闭环

## 问题

### 断裂点 1：合约访问控制错误

`ResolveSettlement.sol` 的 `createMarket()` 被 `onlyOwner` 修饰，但业务逻辑要求**任何用户**都可以用自己的 TronLink 钱包创建市场并注资流动性。当前的 `onlyOwner` 导致：

```
用户创建市场
  → 前端调 createMarket(slug, amountSun) via TronLink
  → 合约 require(msg.sender == owner) → 回滚 ❌
  → DB 写入市场（但链上 market 不存在）
```

**正确行为**：任意用户可调用 `createMarket()`，用自己的 USDD 注入流动性 + 支付创建费。

### 断裂点 2：气囊模式不转账

当前的 `AIRBAG_ENABLED=true` 走 `settleSimulated()`，只标记已结算，**不执行 USDD 转账**。这个模式应该整个删除——结算必须真实转账。

### 断裂点 3：共识后不自动结算

当前 consensus 达成后用户需要手动点 "Settle on-chain" 按钮。应该自动触发结算。

### 断裂点 4：Dev Mock 不合理

当前无 `OPENAI_API_KEY` 时 `llm.ts` 用确定性 mock 数据（bullish→YES/0.8, bearish→NO/0.58）。DEV 模式下应该**随机投票**，让开发者能完整走通闭环看到不同结果。

## 目标

```
任何用户用自己的 TronLink 钱包创建市场（注入 USDD 流动性）
  → 市场在合约中存在 ✅
  → 任何用户买 YES/NO（已有，正常工作）
  → 市场到期
  → 6 Agent 裁决（有 LLM key 走 LLM，DEV 模式随机投票）
  → 共识后自动触发 settleBatch()
  → 赢家钱包收到 USDD ✅
  → Tronscan 交易 SUCCESS ✅
```

## 变更清单

| # | 变更 | 影响 |
|:-:|------|------|
| 1 | 合约 `createMarket()` 去掉 `onlyOwner` | 用户可自己创建链上市场 |
| 2 | 删除 `AIRBAG_ENABLED` 概念和环境变量 | 结算永远真实转账 |
| 3 | 删除 `settleSimulated()` 函数（合约 + API + 封装） | 不再有"只标记不转账"路径 |
| 4 | 共识达成后自动触发结算 | 用户不需要手动点 Settle 按钮 |
| 5 | DEV 模式随机投票 | 无 LLM key 时随机 YES/NO + 随机 confidence |

## 现有基础设施

| 层 | 状态 | 说明 |
|:--|:----|------|
| `createMarket` (合约) | ❌ `onlyOwner` 阻塞 | 需去掉 onlyOwner |
| `buyShares` / `sellShares` (合约) | ✅ 可工作 | 非 onlyOwner，用户 TronLink 正常交易 |
| `settleBatch` (合约) | ✅ 已存在 | 批量多赢家转账 |
| `settleSimulated` (合约) | ✅ 已存在 | ⛔ 需要删除 |
| `AIRBAG_ENABLED` 配置 | ✅ 当前 true | ⛔ 需要整个删除 |
| `isAirbag()` (settlement.ts) | ✅ 已有 | ⛔ 需要删除 |
| 共识后自动结算 | ❌ 缺失 | 需要新增 |
| `llm.ts` mock | ✅ 确定性 mock | ⛔ 需改为 DEV 模式随机投票 |

## 边界条件

- `createMarket` 去掉 `onlyOwner` 后，任何人都可创建市场，但需要自己有 USDD 并 approve 给合约
- 结算必须有链上 market 存在（`m.exists=true`），否则 settleBatch 回滚
- 合约 USDD 余额不足时，API 返回明确错误，不部分赔付
- 已结算市场不能再次结算
