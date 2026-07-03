---
title: "Spec 13 — Real On-Chain Settlement 验收方案"
version: "1.0"
date: "2026-07-03"
scope: "合约 settleBatch + 服务端分配计算 + 前端无气囊标签"
---

# ✅ Spec 13 — Real On-Chain Settlement 验收方案

> **用途**: AI 自检 + 人工验证，确保关闭气囊后完整结算闭环可执行。

---

## 📋 前提条件

- [ ] `TRON_PRIVATE_KEY` 环境变量已配置（服务端 owner 私钥）
- [ ] 新合约已部署至 Shasta，地址已更新到 `constants.ts`
- [ ] 合约有足够的 USDD 余额（之前 buy 交易的 USDD 在合约中）
- [ ] 存在至少一个已创建的市场，且有多个地址持有 YES/NO 持仓
- [ ] `.env` 中 `NEXT_PUBLIC_AIRBAG_ENABLED=false`
- [ ] Supabase 连接正常（`positions` 表有数据）

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查（10秒）===
pnpm typecheck

# === 2. 构建验证（30秒）===
pnpm build

# === 3. 合约编译 ===
pnpm --filter @resolve/contracts compile

# === 4. 验证 settleBatch ABI 存在 ===
grep -c 'settleBatch' apps/web/lib/constants.ts

# === 5. 验证合约封装存在 ===
grep -c 'settleBatch' apps/web/lib/contract/settlement.ts
```

> **AI 自检通过条件**: 1 + 2 + 3 均通过。4 和 5 的结果应 ≥ 1。

---

## 🧪 人工检查步骤

### 检查点 1 — 合约部署 + settleBatch 可见

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 13.1a | 打开 `https://shasta.tronscan.org/` → 搜索新合约地址 | 合约页面加载，显示 `ResolveSettlement` | — |
| 13.1b | 在合约 Read/Write 页面搜索 `settleBatch` | 函数可见，参数为 `marketId(bytes32)` + `outcome(bytes8)` + `winners(address[])` + `payouts(uint256[])` | — |
| 13.1c | 旧合约与新合约地址不同 | 确认地址已切换（旧合约可继续存在，作为历史参考） | 🏆 |

### 检查点 2 — 气囊模式仍能工作（回归测试）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 13.2a | 设置 `AIRBAG_ENABLED=true` → 重启 dev server | 气囊模式激活 | — |
| 13.2b | 触发 Force Resolve → 共识达成 → 点击 Settle | 返回 `{ simulated: true }`，显示 "Settled·YES"（无 airbag 字样） | — |
| 13.2c | 合约状态查询 | `getMarket().settled = true`，合约余额未变化 | 🏆 |

### 检查点 3 — 真实结算：单赢家

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 13.3a | 设置 `AIRBAG_ENABLED=false` → 重启 dev server | 气囊关闭 | — |
| 13.3b | 用单个钱包买入 YES，确保合约余额 > 0 | positions 表有 1 条 `wallet_address, yes_balance > 0` | — |
| 13.3c | 打开市场详情页 → `?dev=1` → Force Resolve | 6 agent 共识达成 | — |
| 13.3d | 点击 "Settle on-chain" 按钮 | 按钮切换为 **"Settled·YES"**（无 airbag 标签）+ txHash + Tronscan 链接 | — |
| 13.3e | 在 Shasta 搜索该 txHash | 交易类型 `ContractCall`，method=`settleBatch`，状态 `SUCCESS` | 🏆 |
| 13.3f | 比较赢家地址结算前后的 USDD 余额 | 余额增加 = 赔付金额 | 🏆 |
| 13.3g | 比较合约地址结算前后的 USDD 余额 | 余额减少 = 赔付总额 | 🏆 |

### 检查点 4 — 真实结算：多赢家

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 13.4a | 用 2-3 个不同钱包分别买入 YES，金额不等 | positions 表有 2-3 条 `wallet, yes_balance > 0` | — |
| 13.4b | 触发结算 | settleBatch 返回 txHash | — |
| 13.4c | 检查各赢家钱包 USDD 余额 | 每个赢家按比例收到赔付：持仓大者收到更多 | 🏆 |
| 13.4d | 检查合约余额 | 余额减少 = **所有赢家收到金额之和** | 🏆 |

### 检查点 5 — 边界条件

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 13.5a | 市场所有持仓已卖光（无赢家）后结算 | 返回 `{ paidOut: false, note: "No winning positions" }` | 🏆 |
| 13.5b | 合约 USDD 余额 < 应赔付总额时结算 | API 返回 500 错误 + 消息 "Insufficient contract balance for all winners" | 🏆 |
| 13.5c | 对已结算市场再次调用 settle | 合约返回 `"Resolve: settled"` 错误 | — |
| 13.5d | 非 owner 调用 settle API | API 返回 TronWeb 签名错误（非 owner 私钥无法签名） | 🏆 |

### 检查点 6 — 服务端日志确认

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 13.6a | 结算时观察服务端日志 | 日志打印: `[api/settle] winners=3 totalPool=150.00 distribution=[80,45,25]` | 🏆 |
| 13.6b | 结算后检查 API 返回体 | `{ txHash, paidOut: true, winnerCount: 3, totalPayout: "15000000" }` | 🏆 |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 2 + 3 + 5c 全部通过 | 合约就绪 + 气囊回归 + 单赢家结算 + 幂等保护 |
| **推荐** | 检查点 4 通过 | 多赢家按比例分摊赔付 |
| **加分** | 检查点 5 + 6 通过 | 边界处理 + 日志透明 |

---

## ⚡ 错误恢复

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | 合约 `settleBatch` 交易费不足 | 返回 `out of energy` 错误 | `feeLimit` 从 `1_000_000_000` 提高到 `10_000_000_000` |
| E2 | DB positions 查询为空 | 降级为 `settleSimulated()`，返回 `paidOut: false` | 检查 DB 连接 + positions 表数据 |
| E3 | USDD balanceOf 调用失败（RPC 问题） | 降级气囊模式（自动 fallback） | 稍后重试 |
| E4 | 部分赢家地址无效 | `settleBatch` 内 `require(usdd.transfer(...))` 会回滚整个 tx | API 层前置校验地址合法性 |
| E5 | 多赢家批次中一人转账失败 | Solidity 循环中 `require` 会回滚所有转账，无部分赔付风险 | 检查该地址是否为合约地址（非 EOA） |

---

## 📊 预期耗时

| 阶段 | 预计时间 |
|:----:|:--------:|
| 合约修改 + 编译 | ≤ 15 分钟 |
| 部署到 Shasta | ≤ 3 分钟 |
| AI 自检（typecheck + build） | ≤ 20 秒 |
| 单赢家验收（3 个检查点） | ≤ 10 分钟 |
| 多赢家验收（边界条件） | ≤ 15 分钟 |
