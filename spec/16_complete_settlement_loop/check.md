---
title: "Spec 16 — Complete Settlement Loop 验收方案"
version: "2.0"
date: "2026-07-04"
scope: "合约 createMarket 去 onlyOwner + 删除气囊 + 自动结算 + DEV 随机投票"
---

# ✅ Spec 16 — Complete Settlement Loop 验收方案

> **用途**: AI 自检 + 人工验证，确保完整闭环：用户创建市场 → 交易 → 6 Agent 共识 → 自动结算 → 赢家到账。

---

## 📋 前提条件

- [ ] 新合约已部署（`createMarket` 无 `onlyOwner`，无 `settleSimulated`）
- [ ] `.env.local` 中 `NEXT_PUBLIC_SETTLEMENT_ADDRESS` 已更新为新合约地址
- [ ] `NEXT_PUBLIC_AIRBAG_ENABLED` 已从 `.env.local` 删除
- [ ] `TRON_PRIVATE_KEY` 已配置（settleBatch 用 owner 私钥）
- [ ] Supabase 连接正常（`markets` / `positions` 表有数据）
- [ ] 至少一个 TronLink 钱包有 USDD（Shasta 测试网）

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查 ===
pnpm typecheck

# === 2. 构建 ===
pnpm build

# === 3. 确认 createMarket 不再 onlyOwner ===
grep 'onlyOwner' apps/contracts/ResolveSettlement.sol | grep -c 'createMarket'  # 应 = 0

# === 4. 确认 settleSimulated 已从合约删除 ===
grep -c 'settleSimulated' apps/contracts/ResolveSettlement.sol  # 应 = 0

# === 5. 确认 settleSimulated 已从 ABI 删除 ===
grep -c 'settleSimulated' apps/web/lib/constants.ts  # 应 = 0

# === 6. 确认 AIRBAG_ENABLED 已从常量删除 ===
grep -c 'AIRBAG_ENABLED' apps/web/lib/constants.ts  # 应 = 0

# === 7. 确认 isAirbag 已从 settlement.ts 删除 ===
grep -c 'isAirbag' apps/web/lib/contract/settlement.ts  # 应 = 0

# === 8. 确认 settleSimulated 已从 settlement.ts 删除 ===
grep -c 'settleSimulated' apps/web/lib/contract/settlement.ts  # 应 = 0

# === 9. 确认 llm.ts mock 使用了 Math.random() ===
grep -c 'Math.random' packages/ai/src/llm.ts  # 应 ≥ 1

# === 10. 确认 oracle-deliberation 自动调 handleSettle ===
grep -c 'handleSettle' apps/web/components/oracle-deliberation.tsx  # 应 ≥ 2
```

> **AI 自检通过条件**: 1 + 2 均通过。3-10 全部满足预期数字。

---

## 🧪 人工检查步骤

### 检查点 1 — 任何用户可创建链上市场

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.1a | 打开创建页 → 填市场信息 + 流动性金额 | 表单可填写 | — |
| 16.1b | 点击创建 → TronLink 弹出授权 USDD → 签名 | USDD approve 交易成功 | — |
| 16.1c | TronLink 弹出 createMarket 交易 → 签名 | 交易成功返回 txHash | — |
| 16.1d | 用 getMarket() 查链上市场 | `exists=true`, `settled=false` | 🏆 |
| 16.1e | DB 中有该市场记录 | Supabase markets 表有该行 | — |

### 检查点 2 — 双钱包交易

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.2a | 钱包 A 买 10 USDD 的 YES | buyShares 成功；positions 有 A 的 YES 持仓 | — |
| 16.2b | 钱包 B 买 20 USDD 的 YES | buyShares 成功；positions 有 B 的 YES 持仓 | — |
| 16.2c | 查合约 USDD 余额 | 余额 ≈ 30 USDD | 🏆 |

### 检查点 3 — DEV 模式：Force resolve + 随机投票

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.3a | 打开市场详情页 → `?dev=1` | 看到 Force resolve 按钮 | — |
| 16.3b | 点击 Force resolve | 6 Agent 投票逐个浮现 | — |
| 16.3c | 关闭页面重新打开 → 再次 Force resolve | 投票结果与上次不同（随机性） | 🏆 |
| 16.3d | 共识达成后 | **自动触发结算**（无需手动点按钮） | — |

### 检查点 4 — 真实结算

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.4a | 观察 consensus 动画 | votes 逐条浮现 → 全部显示 | — |
| 16.4b | 共识达成后 | 自动调 settleBatch（无需手动） | — |
| 16.4c | UI 显示 "Settled · YES" + txHash | 成功显示 | — |
| 16.4d | Tronscan 查 txHash | method=`settleBatch`，状态 `SUCCESS` | 🏆 |
| 16.4e | 查钱包 A 的 USDD | 余额增加（按比例赔付） | 🏆 |
| 16.4f | 查钱包 B 的 USDD | 余额增加（B 份额多 → 收更多） | 🏆 |
| 16.4g | 查合约 USDD 余额 | 减少额 = A + B 收到金额之和 | 🏆 |

### 检查点 5 — 无气囊，绑定检查

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.5a | 搜索代码库中的 `settleSimulated` | 零结果（已删除） | — |
| 16.5b | 搜索代码库中的 `AIRBAG_ENABLED` | 零结果（已删除） | 🏆 |
| 16.5c | 搜索代码库中的 `isAirbag` | 零结果（已删除） | 🏆 |

### 检查点 6 — 边界条件

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 16.6a | 对已结算市场再次触发 resolve | 合约返回 "Resolve: settled" 错误 | — |
| 16.6b | 创建市场后不买任何份额 → 到期 → 自动结算 | API 返回 "No winning positions" | 🏆 |
| 16.6c | 合约 USDD 余额不足时自动结算 | API 返回 500 + "Insufficient contract balance" | 🏆 |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 3 + 4 + 5 全部通过 | 用户创建 + DEV 随机 + 自动结算到账 + 无气囊 |
| **推荐** | 检查点 2 + 6a 通过 | 双钱包交易 + 幂等保护 |
| **加分** | 检查点 6b/c 通过 | 边界处理 |

---

## ⚡ 错误恢复

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | createMarket 时用户 USDD 不足 | 合约 "pay failed" 回滚 | 用户先领 USDD（faucet/mint） |
| E2 | createMarket 时未 approve | 合约 transferFrom 失败 | 用户先 approve USDD |
| E3 | settleBatch 交易费不足 | Shasta 返回 "out of energy" | owner 地址充值 TRX |
| E4 | 合约 USDD 余额不足 | API 500，不部分赔付 | 外部转入 USDD 到合约 |
| E5 | 已结算市场再次点 resolve | 合约 "Resolve: settled" | 正常行为，非异常 |

---

## 📊 预期耗时

| 阶段 | 预计时间 |
|:----:|:--------:|
| 合约修改（onlyOwner 删除 + settleSimulated 删除） | ≤ 10 分钟 |
| API/前端/LLM 改动 | ≤ 20 分钟 |
| 编译 + 部署合约 | ≤ 5 分钟 |
| 单用户创建市场验收 | ≤ 10 分钟 |
| 双钱包交易 + 结算验收 | ≤ 15 分钟 |
