---
title: "Spec 17 — Claim Settlement (No Owner Key) 验收方案"
version: "1.0"
date: "2026-07-04"
scope: "合约 resolveOutcome + claimReward + 删除 TRON_PRIVATE_KEY 运行时依赖"
---

# ✅ Spec 17 — Claim Settlement 验收方案

> **用途**: AI 自检 + 人工验证，确保结算流程不再依赖合约 owner 私钥。

---

## 📋 前提条件

- [ ] 新合约已部署（含 `resolveOutcome` / `claimReward` / `createMarket` 去 onlyOwner）
- [ ] `.env.local` 中 `NEXT_PUBLIC_SETTLEMENT_ADDRESS` 已更新为新合约地址
- [ ] `.env.local` 中 **无** `TRON_PRIVATE_KEY` 行
- [ ] `.env.local` 中 **无** `NEXT_PUBLIC_AIRBAG_ENABLED` 行
- [ ] Supabase 连接正常（`markets` / `positions` 表有数据）
- [ ] 至少两个 TronLink 钱包有 USDD（Shasta 测试网），用于创建市场 + 交易 + 领钱

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查 ===
pnpm typecheck

# === 2. 构建 ===
pnpm build

# === 3. 确认 resolveOutcome 存在且无 onlyOwner ===
grep 'function resolveOutcome' apps/contracts/ResolveSettlement.sol

# === 4. 确认 claimReward 存在且无 onlyOwner ===
grep 'function claimReward' apps/contracts/ResolveSettlement.sol

# === 5. 确认 createMarket 无 onlyOwner ===
grep 'onlyOwner' apps/contracts/ResolveSettlement.sol | grep -c 'createMarket'  # 应 = 0

# === 6. 确认 settleSimulated 已从合约删除 ===
grep -c 'settleSimulated' apps/contracts/ResolveSettlement.sol  # 应 = 0

# === 7. 确认 getServerTronWeb 已从 tronweb.ts 删除 ===
grep -c 'getServerTronWeb' apps/web/lib/contract/tronweb.ts  # 应 = 0

# === 8. 确认 tronweb.ts 无 TRON_PRIVATE_KEY 引用 ===
grep -c 'TRON_PRIVATE_KEY' apps/web/lib/contract/tronweb.ts  # 应 = 0

# === 9. 确认 settlement.ts 中存在 resolveOutcome ===
grep 'resolveOutcome' apps/web/lib/contract/settlement.ts

# === 10. 确认 settlement.ts 中存在 claimReward ===
grep 'claimReward' apps/web/lib/contract/settlement.ts

# === 11. 确认 settlement.ts 无服务端 settleBatch（依赖 getServerTronWeb） ===
grep 'getServerTronWeb' apps/web/lib/contract/settlement.ts  # 应 = 0

# === 12. 确认 apps/web/ 全部无 TRON_PRIVATE_KEY 引用 ===
grep -r 'TRON_PRIVATE_KEY' apps/web/  # 应 = 0（无输出）

# === 13. 确认 AIRBAG_ENABLED 已从常量删除 ===
grep -c 'AIRBAG_ENABLED' apps/web/lib/constants.ts  # 应 = 0
```

> **AI 自检通过条件**: 1 + 2 均通过。3-13 全部满足预期值。第 12 条 grep 输出为空。

---

## 🧪 人工检查步骤

### 检查点 1 — 创建市场 + 交易（可用 Spec 16 的流程）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 17.1a | 打开创建页 → 填信息 + 流动性 → approve USDD | approve 交易成功 | — |
| 17.1b | 调 createMarket via TronLink | 交易成功，txHash 返回 | — |
| 17.1c | 查链上 `getMarket(marketId).exists` | `exists=true` | 🏆 |
| 17.1d | 钱包 A 买 10 USDD 的 YES | buyShares 成功 | — |
| 17.1e | 钱包 B 买 5 USDD 的 YES | buyShares 成功 | — |
| 17.1f | 查合约 USDD 余额 | ≥ 15 USDD（含流动性） | — |

### 检查点 2 — resolveOutcome 提交结果

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 17.2a | 共识达成后 → 自动或手动调 resolveOutcome | TronLink 弹出签名 | — |
| 17.2b | 签名交易成功 | txHash 返回 | — |
| 17.2c | 查链上 `getMarket(marketId).settled` | `settled=true` | 🏆 |
| 17.2d | 查链上 `getMarket(marketId).outcome` | `outcome=YES`（或预期值） | 🏆 |
| 17.2e | 再次调 resolveOutcome（同一市场） | 合约回滚 "Resolve: settled" | — |

### 检查点 3 — Claim 领钱

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 17.3a | 钱包 A 打开市场详情页 | 看到领钱按钮（YES 赢家） | — |
| 17.3b | 显示预计领取金额 | ≈ 10/15 × 可用池（比例合理） | — |
| 17.3c | 点击 Claim Reward → TronLink 签名 | 交易成功 | — |
| 17.3d | 查钱包 A 的 USDD 余额 | 增加（赔付到账） | 🏆 |
| 17.3e | Tronscan 查 tx | `claimReward` method，状态 SUCCESS | 🏆 |
| 17.3f | UI 显示 "Claimed ✓" + txHash | 已领状态 | — |
| 17.3g | 钱包 A 再次点 Claim | 按钮禁用或回滚 "no winning stake" | — |

### 检查点 4 — 钱包 B 也领钱

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 17.4a | 钱包 B 打开市场详情页（切换 TronLink） | 看到领钱按钮 | — |
| 17.4b | 显示预计金额 | < 钱包 A 的金额（B 份额少） | 🏆 |
| 17.4c | 点击 Claim | 交易成功 | — |
| 17.4d | 查钱包 B 的 USDD | 增加 | 🏆 |
| 17.4e | 查合约 USDD 余额 | 减少额 = A + B 收到之和 | 🏆 |

### 检查点 5 — 无 TRON_PRIVATE_KEY 运行时依赖

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 17.5a | `grep -r 'TRON_PRIVATE_KEY' apps/web/` | 零输出 | — |
| 17.5b | `grep -r 'getServerTronWeb' apps/` | 零输出 | 🏆 |
| 17.5c | 全局搜 `TRON_PRIVATE_KEY`（不含 docs/ 和 spec/） | 仅有 apps/contracts/ 中部署脚本 | — |

### 检查点 6 — 边界条件

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 17.6a | NO 赢家点 Claim（市场结果 YES，用户持仓 NO） | 合约回滚 "no winning stake" | — |
| 17.6b | 非本市场用户点 Claim | 回滚 "no winning stake" | — |
| 17.6c | resolveOutcome 不存在的市场 ID | 回滚 "no market" | 🏆 |
| 17.6d | 已结算市场再次 resolve | 回滚 "settled" | — |
| 17.6e | 合约 USDD 余额为 0 时 claim | 转账失败回滚 | 🏆 |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 2 + 3 + 5 全部通过 | 创建+交易+resolve+claim+无私钥 |
| **推荐** | 检查点 4 + 6a/b 通过 | 多钱包领钱 + 边界保护 |
| **加分** | 检查点 6c/e 通过 | 异常处理完整 |

---

## ⚡ 错误恢复

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | resolveOutcome 时 TronLink 无网络 | 交易 pending | 等待网络恢复后重试 |
| E2 | claimReward 时合约 USDD 不足 | 转账失败回滚 | 外部转入 USDD 到合约 |
| E3 | 用户 TronLink 切换地址 | claim 检查新地址的 stakes | 切回原地址再 claim |
| E4 | 创建市场后未 approve USDD | createMarket 失败 | approve 后重试 |
| E5 | 部署新合约后旧市场中还有未领资金 | 旧合约资金永久锁定 | 部署前先 claim 所有市场 |
| E6 | 交易费不足（能量/带宽） | Shasta 返回 out of energy | 钱包充值 TRX |
