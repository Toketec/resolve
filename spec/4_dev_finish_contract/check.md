---
title: "Spec 4 — Settlement Contract & Chain Logic 验收方案"
version: "1.0"
date: "2026-06-28"
scope: "Solidity结算合约 → Shasta部署 → 单边买入签名 → settle赔付 → B.AI 8004/x402 → 气囊"
---

# ✅ Spec 4 — Settlement Contract & Chain Logic 验收方案

> **用途**: AI 自检 + 人工验证，确保 Solidity 结算合约正确部署至 Shasta 测试网，buy/settle 流程可执行，气囊机制可用，B.AI 生态集成（8004 身份 + x402 微支付）正常展示，无安全漏洞。

---

## 📋 前提条件

- [ ] `apps/contracts/ResolveSettlement.sol` 已编写并编译通过
- [ ] TRON Shasta 测试网币已获取（从水龙头领取测试 TRX）
- [ ] USDD 测试币已转入合约部署地址
- [ ] 合约已部署至 Shasta，地址记录在 `apps/web/lib/constants.ts`
- [ ] TronLink 扩展已安装并切换到 Shasta 测试网
- [ ] `.env` 中已配置 `NEXT_PUBLIC_CONTRACT_ADDRESS`（必须）
- [ ] `.env` 中已配置 `BAI_8004_API_KEY`（加分项，非必须）
- [ ] `.env` 中已配置 `BAI_X402_WALLET`（加分项，非必须）
- [ ] `pnpm --filter @resolve/contracts compile` 编译通过
- [ ] **安全检查确认**: 代码库中无硬编码私钥/助记词（下文 AI 自检 4 将自动扫描）

---

## 🤖 AI 自检（终端执行）

```bash
# === 1. 类型检查（10秒）===
pnpm typecheck

# === 2. 构建验证（30秒）===
pnpm build

# === 3. 合约编译验证 ===
pnpm --filter @resolve/contracts compile

# === 4. 安全扫描 — 确认无明文私钥/助记词 ===
echo "=== 扫描私钥模式 ==="
grep -rn 'private_key\|privateKey\|0x[0-9a-fA-F]\{64\}' apps/contracts --include='*.sol' --include='*.ts' --include='*.js' --include='*.json' 2>/dev/null | grep -v node_modules | grep -v '.env' | grep -v 'example' || echo "✓ 未发现硬编码私钥"
echo "=== 扫描助记词模式 ==="
grep -rn 'mnemonic\|seed_phrase\|24 words' apps/contracts --include='*.sol' --include='*.ts' --include='*.js' 2>/dev/null | grep -v node_modules | grep -v '.env' | grep -v 'example' || echo "✓ 未发现硬编码助记词"
```

> **AI 自检通过条件**: 1 + 2 + 3 均通过。4 的结果应显示 `✓`（如发现硬编码私钥 → 立即修复，禁止提交）。

---

## 🧪 人工检查步骤

### 检查点 1 — 合约部署到 Shasta 测试网并可见

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.1a | 打开 Shasta 测试网浏览器 `https://shasta.tronscan.org/` → 搜索合约地址 | 合约页面加载，显示合约名称 `ResolveSettlement` | — |
| 4.1b | 检查合约的创建交易记录 | 交易类型为 `ContractCreation`，创建时间与部署时间一致 | — |
| 4.1c | 检查合约余额 | 显示 USDD / TRX 余额 > 0（预注资已存入） | 🏆 |

### 检查点 2 — buyShares() 通过 TronLink 签名

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.2a | 前端 `TradePanel` 中选择 YES → 输入金额 → 点击 "Buy YES" | TronLink 扩展弹出签名确认窗口，显示合约调用详情（method: buyShares, 金额） | — |
| 4.2b | 在 TronLink 弹窗中点击确认 | 等待 ~5–10 秒 → 返回 txHash | — |
| 4.2c | 交易完成后，前端 TradePanel 更新 | 显示 "Order placed ✓" + 仓位信息（金额、地址、txHash 链接） | 🏆 |
| 4.2d | 验证交易写入 Supabase `positions` 表 | `GET /api/markets/btc-150k-2026/positions?wallet=T...` 返回包含该笔买入记录 | 🏆 |

### 检查点 3 — 气囊模式 settle

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.3a | 设置环境变量 `NEXT_PUBLIC_AIRBAG_ENABLED=true` → 重启 dev server | 后端气囊模式激活 | — |
| 4.3b | 点击 "Settle" 按钮（共识达成后触发） | 返回 `{ txHash: "0xsimulated_..." , simulated: true }` | — |
| 4.3c | 打开 Shasta 浏览器搜索该 txHash | 交易 **不** 存在于链上（模拟 txHash） | — |
| 4.3d | 前端显示 "Settlement complete" 但注明 "Simulated" | UI 显示 "模拟结算 (气囊模式)" 或类似标记 | 🏆 |

### 检查点 4 — 真实 settle（关闭气囊）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.4a | 设置 `NEXT_PUBLIC_AIRBAG_ENABLED=false`（或删除该变量）→ 重启 dev server | 气囊模式关闭 | — |
| 4.4b | 确保合约有足够 USDD 余额 + 存在赢家地址可接收 | 合约余额 > 应付金额 | — |
| 4.4c | 触发 settle | TronLink 弹 owner 签名 → 交易成功 → 返回真实 txHash | — |
| 4.4d | 在 Shasta 浏览器搜索真实 txHash | 交易类型为 `ContractCall`，method=settle，状态 `SUCCESS` | — |
| 4.4e | 检查赢家地址余额 | 赢家 Shasta USDD 余额增加 = 赔付金额 | 🏆 |
| 4.4f | 检查合约余额 | 合约 USDD 余额减少 = 赔付金额 | 🏆 |

### 🆕 检查点 5 — B.AI 8004 Agent 身份注册

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.5a | 在 B.AI 平台查询 Agent 8004 ID | 8004 注册记录存在，包含 Agent 名称和钱包地址 | 🏆 |
| 4.5b | 前端 Agent 卡片显示 8004 ID | Agent 详情页或 Agent 卡片上可见 `B.AI 8004` ID 标签 | 🏆 |
| 4.5c | 点击 8004 ID 标签 | 跳转到 Tronscan 或 B.AI 平台的 Agent 详情页 | 🏆⭐ |

### 🆕 检查点 6 — B.AI x402 微支付

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.6a | 执行完整的 resolve 流程（orchestrator → parallel inference → consensus） | 流程结束后，控制台 / API 日志显示 x402 支付触发 | 🏆 |
| 4.6b | 检查 resolve 返回结果 | 包含 `x402Payment: { txHash, amount, status }` 字段 | 🏆 |
| 4.6c | 前端 ConsensusMeter 下方 | 显示 x402 交易哈希 + "View on Tronscan" 链接 | 🏆⭐ |
| 4.6d | 无 B.AI API key 时调用 resolve | x402 部分静默跳过（不崩溃，不阻塞 settle） | 🏆 |

### 检查点 7 — 安全检查：无明文私钥/助记词

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.7a | 全局搜索代码库中的私钥模式 | `grep -rn '0x[0-9a-fA-F]\{64\}' apps/contracts apps/web packages --include='*.sol' --include='*.ts' --include='*.js'` → 结果只出现在 `.env.example` 或注释中 | — |
| 4.7b | 搜索助记词模式 | `grep -rn 'mnemonic\|seed' apps/contracts apps/web packages` → 仅出现在 `.env.example` 或 Hardhat 配置模板中 | — |
| 4.7c | 检查 `.gitignore` | `.env` 和 `*.pkey` 等敏感文件被排除 | 🏆 |
| 4.7d | 检查 tronbox / Hardhat 配置文件 | 私钥通过环境变量引用（`process.env.PRIVATE_KEY`），非硬编码 | 🏆 |

### 🏆 加分 — $HTX Buyback UI 检查（C-20）

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.8a | 打开 TradePanel（买入面板） | 底部显示 `"0.1% fee → $HTX Buyback"` 文本 | 🏆 |
| 4.8b | 检查 Buyback 计数器值 | 显示累计的 $HTX 回购数量（如 `"12.45 $HTX burned"`） | 🏆 |
| 4.8c | 完成一次买入后刷新 | Buyback 计数器值增加（累计值更新） | 🏆 |
| 4.8d | 检查 Buyback 数据来源 | 从 API 或链上获取（非硬编码固定值） | 🏆⭐ |

### 检查点 9 — 合约代码开源性

| # | 操作步骤 | 预期结果 | 加分项 |
|:-:|----------|----------|:------:|
| 4.9a | 打开 `apps/contracts/ResolveSettlement.sol` | 合约完整，含 createMarket / buyShares / settle / settleSimulated 函数 | — |
| 4.9b | 检查 owner 权限控制 | 仅 `onlyOwner` 可调用 settle（`require(msg.sender == owner)`） | — |
| 4.9c | 检查合约安全性 | 无 `selfdestruct`，无 `delegatecall`，无无限循环，无任意提款函数 | 🏆 |
| 4.9d | 部署脚本可用 | `pnpm --filter @resolve/contracts deploy --network shasta` 可重复部署 | 🏆 |

---

## ✅ 验收通过条件

| 等级 | 条件 | 说明 |
|:----:|------|------|
| **必须** | 检查点 1 + 2 + 3 + 7 + 9 全部通过 | 合约部署可用、buy 签名正常、气囊可模拟、安全检查通过、代码开源性 |
| **推荐** | 检查点 4 通过 | 真实 settle 链上赔付跑通 |
| **加分** | 检查点 5 + 6 + 4.8 通过 | B.AI 8004、x402、$HTX Buyback 生态集成展示 |

---

## ⚡ 错误恢复 / 气囊检查

| # | 场景 | 预期行为 | 恢复方式 |
|:-:|------|----------|----------|
| E1 | Shasta 测试网 RPC 不可用 | `settle()` 自动降级为气囊模式（`simulated: true`） | 稍后重试或等待网络恢复 |
| E2 | TronLink 未安装 / 未登录 | buy 调用返回 "Please install/connect TronLink first" 错误提示 | 安装 TronLink → 连接钱包 |
| E3 | 合约余额不足（settle 时） | 返回 "Insufficient contract balance" 错误，不执行转账 | 向合约地址补充 USDD |
| E4 | B.AI 8004 注册失败 | Agent 卡片不显示 8004 ID，不影响 buy/settle 核心流程 | 检查 B.AI 平台注册状态 |
| E5 | x402 支付失败 | resolve 完成但不返回 x402 txHash，不阻塞共识和 settle | 检查 B.AI API key 配置 |
| E6 | buyShares 交易超时 | 前端显示 "Transaction pending..." 倒计时，超时后提示 "请查看 Tronscan 确认" | 手动在 Tronscan 搜索交易 |
| E7 | settle 被拒绝（非 owner） | 返回 "Only owner can settle" 错误 | 确保调用者钱包 = 部署合约的 owner 地址 |
| E8 | 环境变量配置错误 | 前端加载时报错或默认使用气囊模式 | 检查 `.env` 配置（特别是 `NEXT_PUBLIC_CONTRACT_ADDRESS`） |

---

## 📊 预期耗时

| 阶段 | 预计时间 |
|:----:|:--------:|
| AI 自检（typecheck + build + 安全扫描） | ≤ 30 秒 |
| 合约部署验证（浏览器查看 + 余额检查） | ≤ 2 分钟 |
| buyShares 签名测试 | ≤ 30 秒 |
| 气囊 / 真实 settle 测试 | ≤ 2 分钟 |
| B.AI 生态检查（8004 + x402） | ≤ 3 分钟 |
| 安全扫描确认 | ≤ 2 分钟 |
| $HTX Buyback UI 验证 | ≤ 1 分钟 |
