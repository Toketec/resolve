# Spec 16: 完整结算闭环（链上创建 → 真实转账 → 钱包到账）

## 问题

当前结算流程表面跑通了（有 txHash、无 500），但实际存在**两个断裂点**，导致结算交易链上失败、钱包收不到钱：

### 断裂点 1：市场上链失败

- `ResolveSettlement.sol` 的 `createMarket()` 标记为 `onlyOwner`（仅合约 owner 可调）
- 但前端 `create/page.tsx` **通过用户 TronLink 调用** `createMarket()` 
- 用户 TronLink 地址不是合约 owner → 交易回滚 ❌
- **结果**：市场在 DB 中存在，但链上合约完全不知道这个市场（`m.exists = false`）

### 断裂点 2：气囊模式不转账

- `AIRBAG_ENABLED=true` 时走 `settleSimulated()` → 仅设 `m.settled = true`，**不执行任何 USDD 转账**
- 即使断裂点 1 修复，气囊模式下赢家钱包余额也不会变化

### 连锁效应

```
用户创建市场
  → 前端调 createMarket() via TronLink → 回滚 ❌（onlyOwner 拒绝）
  → DB 写入市场记录
  → 用户买 YES/NO via TronLink → 成功（buyShares 非 onlyOwner）
  → 市场到期 → force resolve → 共识动画
  → 点 Settle → settleSimulated() → 链上交易回滚（m.exists = false）
  → 返回 txHash 但链上 FAILED
  → 赢家钱包余额 0 → 闭环断裂 ❌
```

## 目标

完成一个真正的端到端结算闭环：

```
平台管理员创建链上市场（server owner 私钥签名）
  → createMarket() 成功，市场在合约中存在 ✅
  → 用户买 YES/NO (TronLink) → DB + 链上持仓 ✅
  → 用户买 YES 的 USDD 进入合约地址
  → 市场到期 → AI 共识 → Settle
  → AIRBAG=false → settleBatch() → 真实 USDD 转账
  → 赢家在 Tronscan 上看到转账记录，钱包余额增加 ✅
```

## 现有基础设施

| 层 | 状态 | 说明 |
|:--|:----|------|
| `createMarket` (合约) | ✅ 已存在 | 但 `onlyOwner` 导致前端调用失败 |
| `buyShares` / `sellShares` (合约) | ✅ 可工作 | 非 onlyOwner，用户 TronLink 可正常交易 |
| `settleSimulated` (合约) | ✅ 已存在 | 气囊模式，不转账 |
| `settleBatch` (合约) | ✅ 已存在 | 批量多赢家转账，需 market 存在 |
| 合约 ABI (constants.ts) | ✅ 完整 | 含 settleBatch |
| `settlement.ts` — 合约封装 | ✅ 完整 | 含 settleBatch/createMarket/settleSimulated |
| `/api/settle/route.ts` | ✅ 已实现 | 气囊 + 真实两分支，逻辑完整 |
| DB `positions` 表 | ✅ 有数据 | 记录用户持仓 |
| DB `markets` 表 | ✅ 有数据 | 记录市场信息 |
| `TRON_PRIVATE_KEY` | ✅ 已配置 | owner 私钥 |
| `SETTLEMENT_ADDRESS` | ✅ 已配置 | 合约地址 |
| `AIRBAG_ENABLED` | ✅ 可配置 | 当前 true |

## 缺失的部分

| # | 缺失 | 影响 |
|:-:|------|------|
| 1 | **服务端 `createMarket()` API 端点** | 没有服务端端点用 owner 私钥创建链上市场 |
| 2 | **市场创建流程串联** | 创建市场时未自动调链上 `createMarket` |
| 3 | **`AIRBAG_ENABLED=false` 模式未验证** | 真实 settleBatch 路径未经过端到端测试 |
| 4 | **合约 USDD 余额确认** | 需要确认合约在 buy 后确实有 USDD |

## 边界条件

- 如果链上 market 已存在（重复创建），合约应返回 "Resolve: market exists"，API 需处理幂等
- 如果 owner 私钥余额不足 TRX（能量费），交易会失败，需前置检查
- 如果赢家地址无效（非 EOA），`settleBatch` 的 `usdd.transfer()` 会回滚整个批处理
- 如果合约 USDD 余额不足以支付全部赔付，API 返回明确错误，**不部分赔付**

## 依赖项

- Shasta 测试网 `TRX` 有余额（支付能量费）
- 合约地址已部署 `settleBatch`（当前地址 `TJUz9f7K4p9qa2SgKjgbEdSmBgGbZag53t` 已有）
- USDD 合约地址已配置（`TQAajpcg31edfttbuzvhWu7Vymy3LZLeZK`）
- Supabase 连接正常（`positions` / `markets` 表有数据）
- `TRON_PRIVATE_KEY` 为合约 owner
