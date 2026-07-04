---
title: "Spec 16 — Complete Settlement Loop 验收方案"
version: "1.0"
date: "2026-07-04"
scope: "链上创建市场 → 真实结算 → 赢家到账"
---

# ✅ Spec 16 — Complete Settlement Loop 验收方案

> **用途**: AI 自检 + 人工验证，确保完整闭环：链上创建 → 交易 → settleBatch 转账 → 钱包到账。

---

## 📋 前提条件

- [ ] `.env.local` 中 `NEXT_PUBLIC_AIRBAG_ENABLED=false`
- [ ] `TRON_PRIVATE_KEY` 已配置（合约 owner 私钥）
- [ ] owner 地址 TRX ≥ 10（支付能量费）— `tw.trx.getBalance("TLVn5Sa9Y3f...")` 确认
- [ ] owner 地址 USDD ≥ 流动性金额 + 10（支付创建费和流动性）
- [ ] owner 已 approve USDD 给 SETTLEMENT_ADDRESS — `usddAllowance(owner, SETTLEMENT_ADDRESS)` 确认
- [ ] 合约 `ResolveSettlement` 已部署（当前地址 `TJUz9f7K4p9qa2SgKjgbEdSmBgGbZag53t`）
- [ ] `create-chain` API 端点已部署
- [ ] `createMarketAsOwner` 已在 settlement.ts 中实现

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查 ===
pnpm typecheck

# === 2. 构建 ===
pnpm build

# === 3. 确认 ABI 含 settleBatch ===
grep -c 'settleBatch' apps/web/lib/constants.ts   # 应 ≥ 1

# === 4. 确认 create-chain 路由存在 ===
ls apps/web/app/api/markets/create-chain/route.ts

# === 5. 确认 settlement.ts 有 createMarketAsOwner ===
grep -c 'createMarketAsOwner' apps/web/lib/contract/settlement.ts  # 应 ≥ 1

# === 6. 确认 AIRBAG_ENABLED=false ===
grep 'AIRBAG_ENABLED' .env.local | grep -v '^#'  # 应输出 NEXT_PUBLIC_AIRBAG_ENABLED=false
```

> **AI 自检通过条件**: 1 + 2 均通过。3 ≥ 1。4 文件存在。

---

## 🧪 人工检查步骤

### 检查点 1 — 链上创建市场

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.1a | 在创建页填市场信息 + 流动性金额 → 提交 | 返回成功，页面跳转到市场详情 | — |
| 16.1b | 服务端日志查看 | 日志打印 `[create-chain] marketId=xxx txHash=xxxx` | 🏆 |
| 16.1c | curl 调 `getMarket()` 验证 | `exists=true`, `settled=false` | — |
| 16.1d | Shasta scan 搜索 `createMarket` txHash | tx 状态 `SUCCESS`，method=`createMarket` | 🏆 |

### 检查点 2 — 双钱包交易

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.2a | TronLink 切换账户 A，买 10 USDD 的 YES | 交易成功，positions 表有账户 A 的 YES 持仓 | — |
| 16.2b | TronLink 切换账户 B，买 20 USDD 的 YES | 交易成功，positions 表有账户 B 的 YES 持仓 | — |
| 16.2c | 查合约地址 USDD 余额 | 余额 ≈ 30 USDD（buy 的总和） | 🏆 |
| 16.2d | 查合约 `getPoolState()` | yesSupply > 0, noSupply = 0（只买了 YES） | 🏆 |

### 检查点 3 — 真实结算（单赢家）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.3a | 确保 `AIRBAG_ENABLED=false` → 重启 dev server | 气囊关闭 | — |
| 16.3b | 打开市场详情页 → `?dev=1` → Force Resolve | 6 agent 共识达成 | — |
| 16.3c | 点 "Settle on-chain" | 按钮变为 "Settled · YES" + txHash 链接 | — |
| 16.3d | Shasta scan 搜索 txHash | method=`settleBatch`，状态 `SUCCESS` | 🏆 |
| 16.3e | 查赢家钱包 USDD | 余额增加 = 按比例分配的赔付额 | 🏆 |
| 16.3f | 查合约 USDD 余额 | 余额减少 = 赔付总额 | 🏆 |

### 检查点 4 — 真实结算（多赢家按比例）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.4a | 创建第二个测试市场（链上） | 市场 exists=true | — |
| 16.4b | A 买 5 USDD YES，B 买 15 USDD YES，C 买 30 USDD YES | 3 条 positions 记录 | — |
| 16.4c | 触发结算 | settleBatch 返回 SUCCESS | 🏆 |
| 16.4d | 查 3 个赢家钱包 | A 最少（5/50份额），C 最多（30/50份额） | 🏆 |
| 16.4e | 3 人收到金额之和 = 合约减少的 USDD | 一致 | 🏆 |

### 检查点 5 — 边界条件

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.5a | 对已结算市场再次调 settle | 合约返回 "Resolve: settled"，API 500 | — |
| 16.5b | 合约余额 < 应赔付总额时结算 | API 500 + "Insufficient contract balance" | 🏆 |
| 16.5c | 在 create-chain 重复创建已存在的 market | API 幂等返回已有 txHash（或合约报错） | 🏆 |
| 16.5d | settle API 日志打印 | `[api/settle] winners=3 totalPool=50.00 distribution=[5,15,30]` | 🏆 |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 3 + 5a 全部通过 | 链上创建 + 单赢家到账 + 幂等保护 |
| **推荐** | 检查点 2 + 4 通过 | 双钱包交易 + 多赢家按比例 |
| **加分** | 检查点 5b/c/d 通过 | 边界处理 |

---

## ⚡ 错误恢复

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | owner 地址 TRX 不足（能量不够） | create-chain 返回 "out of energy" | 从 Shasta faucet 领 TRX |
| E2 | owner 地址 USDD 不足（流动性/创建费） | createMarket 回滚 "pay failed" | 先给 owner mint USDD |
| E3 | create-chain 幂等失败 | 市场已存在时返回已有 txHash | 前端正常跳转 |
| E4 | settleBatch 交易费不足 | 返回 "out of energy" | `feeLimit` 从 10_000_000_000 提高到 20_000_000_000 |
| E5 | 合约 USDD 余额不足时 settle | API 500 + 不部分赔付 | 从外部地址向合约转入 USDD |
| E6 | DB positions 表无数据（所有人都卖了） | 降级为 settleSimulated，paidOut=false | 正常行为，非异常 |
| E7 | 部分赢家地址无效（非 EOA） | `usdd.transfer()` 回滚整个 tx | API 前置校验地址格式 |

---

## 📊 预期耗时

| 阶段 | 预计时间 |
|:----:|:--------:|
| 新增 create-chain API 端点 | ≤ 20 分钟 |
| 前端创建流程串联 | ≤ 15 分钟 |
| owner 地址准备（TRX + USDD） | ≤ 10 分钟 |
| 单赢家验收（检查点 1+3） | ≤ 15 分钟 |
| 多赢家验收（检查点 2+4） | ≤ 20 分钟 |
