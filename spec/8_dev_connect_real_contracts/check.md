---
title: "Spec 8 — 前端 ⇄ 真实合约调用集成 验收方案"
version: "1.0"
date: "2026-07-02"
scope: "lib/contract 封装层 → api/buy 去 mock → api/settle 真实调用 → TradePanel buy 流程 → 端到端验证"
---

# ✅ Spec 8 — 前端 ⇄ 真实合约调用集成 验收方案

> **用途**: AI 自检 + 人工验证，确保前端 buy/settle 从 mock txHash 切换到真实链上合约调用，TronLink 浏览器签名流程完整，气囊模式正常降级，无安全漏洞。

---

## 📋 前提条件

- [ ] `apps/web/lib/contract/` 三个文件已创建（tronweb.ts / usdd.ts / settlement.ts）
- [ ] `api/buy/route.ts` 已去除 mock txHash
- [ ] `api/settle/route.ts` 已接入真实 settle/settleSimulated
- [ ] TradePanel buy 流程已改造为 approve → buyShares → POST 记录
- [ ] 浏览器已安装 **TronLink 扩展**并切换到 **Shasta 测试网**
- [ ] TronLink 钱包有测试 TRX + USDD（或 MockUSDD `TYAw3pLComCus5SVxgGhxVbspqNj3PYDHY`）
- [ ] `.env` 已配置 `TRON_PRIVATE_KEY`（部署合约的 owner 私钥—仅 settle 用）
- [ ] Shasta 测试网可访问（`curl https://api.shasta.trongrid.io` 通）

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查（10秒）===
pnpm typecheck

# === 2. 构建验证（30秒）===
pnpm build

# === 3. 检查无硬编码私钥 ===
echo "=== 扫描私钥模式 ==="
grep -rn '0x[0-9a-fA-F]\{64\}' apps/web/lib/contract --include='*.ts' 2>/dev/null || echo "✓ 未发现硬编码私钥"
echo "=== 扫描 .env 是否被排除 ==="
grep '\.env' .gitignore | head -3 || echo "⚠ .gitignore 中没有 .env 规则"
```

> **自检通过条件**: 1 + 2 通过。3 的结果应显示 `✓`。

---

## 🧪 人工检查步骤

### 检查点 1 — TronLink 检测 + 连接状态

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 1a | 打开 `localhost:3000`（TronLink 未安装） | TradePanel 显示 "请安装 TronLink 浏览器扩展" 按钮/提示 |
| 1b | 安装 TronLink，创建钱包，切换到 Shasta | TradePanel 自动检测到 TronLink，显示 "连接钱包" 按钮 |
| 1c | 点击 "连接钱包" → TronLink 弹窗允许 | 页面显示已连接地址（`TLVn5Sa9Y3fJjiGZwkjkiF1dmR1XQwwgcQ` 或类似） |
| 1d | **容错**: 先在未连接状态打开页面，再连接 TronLink | 页面自动刷新或连接按钮变为已连接状态 |

### 检查点 2 — 买入全流程（approve + buyShares）

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 2a | 选择一个 live 市场 → 输入金额 → 点击 Buy YES | TronLink 弹出第一笔交易：`approve(SETTLEMENT_ADDRESS, amount)` |
| 2b | 在 TronLink 中确认 approve | 等待 ~5-10 秒 → 交易确认 |
| 2c | TronLink 自动弹出第二笔交易：`buyShares(marketId, isYes, amount)` | 方法名、参数清晰可见 |
| 2d | 确认 buyShares | 等待 ~5-10 秒 → 前端显示 "Order placed ✓" |
| 2e | 检查前端显示的 txHash | txHash 以 `0x...` 或 `0...` 开头，不是 `mock_` 前缀 |
| 2f | 点击 txHash 链接 | 跳转 `https://shasta.tronscan.org/#/transaction/<txHash>` |
| 2g | Tronscan 页面 | 交易类型 = `ContractCall`，method = `buyShares`，状态 `SUCCESS` |

### 检查点 3 — 气囊模式 settle

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 3a | `NEXT_PUBLIC_AIRBAG_ENABLED=true`（默认）→ 启动 dev server | 气囊模式激活 |
| 3b | 在 resolving 市场触发 settle | 服务端调用 `settleSimulated(marketId, outcome)` |
| 3c | 返回结果 | `{ marketId, outcome, txHash: "0x...真实哈希", paidOut: false, simulated: true }` |
| 3d | 在 Tronscan 搜索 txHash | 交易真实存在，method = `settleSimulated`，状态 `SUCCESS` |
| 3e | 检查合约市场状态 | `getMarket(marketId).settled = true`，但 USDD 余额未减少 |

### 检查点 4 — 真实 settle 模式

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 4a | `NEXT_PUBLIC_AIRBAG_ENABLED=false` → 重启 dev server | 真实模式激活 |
| 4b | 确保合约地址 `TRpc78jLEq2wsxuB1mCvqSahU47B73UoVV` 有 USDD 余额 | 余额 > 应付金额 |
| 4c | 触发 settle（输入赢家地址和赔付金额） | 服务端调用 `settle(marketId, outcome, winner, payoutSun)` |
| 4d | 返回结果 | `{ marketId, outcome, txHash: "真实哈希", paidOut: true, simulated: false }` |
| 4e | Tronscan 搜索 txHash | method = `settle`，状态 `SUCCESS` |
| 4f | 检查赢家 USDD 余额 | 增加 = 赔付金额 |
| 4g | 检查合约 USDD 余额 | 减少 = 赔付金额 |

### 检查点 5 — 错误恢复

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 5a | TronLink 未安装时点击 Buy | 显示 "请安装 TronLink" 提示（不是崩溃或假成功） |
| 5b | TronLink 已安装但未连接到 Shasta | 提示 "请切换到 Shasta 测试网" |
| 5c | approve 被用户拒绝 | 显示 "授权被取消"，停留在 Buy 界面可重试 |
| 5d | buyShares 被用户拒绝 | 显示 "买入已取消"，可重试 |
| 5e | `TRON_PRIVATE_KEY` 未配置时调 settle | 返回错误 "服务端 TronWeb 未配置"，不崩溃 |
| 5f | 非 owner 地址调用 settle | 合约 revert "Only owner can settle" |

### 检查点 6 — Supabase 数据持久化

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 6a | 完成一次完整买入流程 | `POST /api/buy` 被调用 → Supabase `positions` 表写入 txHash + 元数据 |
| 6b | 检查 Supabase | `positions` 表有对应记录，`tx_hash` 字段为真实链上 txHash |
| 6c | Supabase 不可达时 | API 不崩溃，返回 success 但 `persisted: false` |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 2a–2e + 3 + 5a–5e + 6 | TronLink 检测、approve+buy 签名、气囊 settle、错误恢复、Supabase 记录 |
| **推荐** | 检查点 4 通过 | 真实 settle 链上赔付跑通 |
| **加分** | approve 和 buyShares 合并为一次签名 | 优化 UX，减少 TronLink 弹窗次数 |

---

## ⚡ 错误恢复

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | TronLink 未安装 | Buy 按钮显示安装提示 | 安装 TronLink 浏览器扩展 |
| E2 | TronLink 未连接到 Shasta | 提示切换网络 | 在 TronLink 中切换到 Shasta 测试网 |
| E3 | 用户 USDD 余额不足 | Buy 前检查余额，提示 "USDD 不足" | 向钱包充测试 USDD |
| E4 | 合约 USDD 余额不足（settle 时） | settle 返回 "Insufficient contract balance" | 向合约地址充 USDD |
| E5 | Shasta RPC 超时 | buy 等待 30s 后显示 "交易处理中，请查看 Tronscan" | 手动检查 Tronscan |
| E6 | approve 交易 pending | buyShares 等待 approve 确认后才弹出 | TronLink 会自动等待 |
| E7 | settle 时私钥无效 | 返回 "服务端签名失败" | 检查 `.env` 中的 TRON_PRIVATE_KEY |
| E8 | 合约地址变更 | 更新 `constants.ts` 中的地址 | 重新部署后修改地址 |

---

## 📊 预期耗时

| 阶段 | 预计时间 |
|:----:|:--------:|
| AI 自检（typecheck + build + 安全扫描） | ≤ 30 秒 |
| TronLink 安装 + 连接验证 | ≤ 2 分钟 |
| approve + buyShares 全流程测试 | ≤ 5 分钟 |
| 气囊 settle 测试 | ≤ 2 分钟 |
| 真实 settle 测试（需要合约有 USDD） | ≤ 3 分钟 |
| 错误恢复场景验证 | ≤ 3 分钟 |
| Supabase 数据检查 | ≤ 1 分钟 |
