# RESOLVE — 验收方案 & 测试检查表

> **版本**: 1.0 · **锚点**: 2026-06-28 · **用途**: AI 自检 + 人工验证，确保每次提交可跑可演
> **AI 自检原则**: 只跑 `pnpm typecheck` + `pnpm build` + curl 验证 — 不超过 60 秒
> **人工检查原则**: 步骤清晰、言简意赅、照着做就能验证

---

## 快速入口

| 阶段 | 交付物 | AI 自检 | 人工检查 | 对应 Spec |
|:----:|--------|:-------:|:--------:|:---------:|
| 1 | API 骨架 + 数据层 | ✓ 跑类型检查 | ✓ 浏览器/curl 验证 | spec 1 |
| 2 | TronLink 钱包连接 | ✓ 跑类型检查 | ✓ 浏览器实测 | spec 2 |
| 3 | AI Oracle 推理 | ✓ 跑类型检查 | ✓ 真实 API 调用 | spec 3 |
| 4 | 合约 + 链上逻辑 | ✓ 跑类型检查 | ✓ 链上验证 | spec 4 |
| 5 | Walking Skeleton 集成 | ✓ 跑类型检查 | ✓ 浏览器全流程 | spec 5 |
| 6 | Demo 打磨 (UX/动画) | ✓ 跑类型检查 | ✓ 浏览器 Demo 模拟 | spec 6 |

---

## 🔧 AI 自检（通用 — 每次提交前执行）

```bash
# === 1. 类型检查（10秒）===
pnpm typecheck

# === 2. 构建验证（30秒）===
pnpm build

# === 3. 开发服务器可达性（如果已启动）===
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/markets
```

如果以上任一失败 **→ 不提交，先修**。

---

## 🧪 人工检查（按 spec 逐步验证）

---

### ✅ Spec 1 — Core API Routes & Data Layer

**前提**: `pnpm dev` 在本地运行，终端无报错。

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 1.1 | `curl http://localhost:3000/api/markets` | 返回 JSON 数组，含 6 条以上市场记录，每条有 id/slug/title/status |
| 1.2 | `curl http://localhost:3000/api/markets/btc-150k-2026` | 返回单条 JSON，slug="btc-150k-2026"，status=live |
| 1.3 | `curl http://localhost:3000/api/markets/btc-150k-2026/resolve` | 返回 AIConsensus，含 status/votes/consensus 字段 |
| 1.4 | `curl http://localhost:3000/api/agents` | 返回 6 个 Agent，其中 3 个 role=active，3 个 role=standby |
| 1.5 | `curl -X POST http://localhost:3000/api/buy -H 'Content-Type: application/json' -d '{"marketId":"mk_btc_150k","side":"YES","amountUSDT":100,"walletAddress":"TTest123"}'` | 返回 Position，含 id/marketId/side/shares/txHash |
| 1.6 | `curl http://localhost:3000/api/price/BTC` | 返回 { symbol, price, source, at } |
| 1.7 | `curl http://localhost:3000/api/price/BTC` 再次调用 | 价格在合理范围波动（不是固定值） |

**验收通过条件**: 1.1–1.7 全部通过。

---

### ✅ Spec 2 — TronLink Wallet Connection

**前提**: Chrome 已安装 TronLink 扩展，已切换到 Shasta 测试网。

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 2.1 | 打开 Chrome 隐身窗口 → 访问 `localhost:3000` | 右上角显示 "Install TronLink →"（有下载链接） |
| 2.2 | 安装 TronLink 后刷新页面 | 按钮变为 "Connect Wallet" |
| 2.3 | 点击 "Connect Wallet" | TronLink 弹窗请求授权 |
| 2.4 | 在 TronLink 弹窗中点击确认 | 按钮变为地址缩写 `T...xxx`，旁边有绿点 + "Shasta" 标签 |
| 2.5 | 打开 TronLink 扩展，切换到另一个账户 | 前端地址自动更新 |
| 2.6 | 点击地址按钮 → 选择 "Disconnect" | 回到 "Connect Wallet" 状态 |
| 2.7 | 刷新页面 | 仍为已连接状态（会话持久化） |

**验收通过条件**: 2.1–2.6 全部通过。2.7 可选（取决于会话持久化实现）。

---

### ✅ Spec 3 — AI Oracle Reasoning Pipeline

**前提**: `.env` 已配 `ANTHROPIC_API_KEY`。

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 3.1 | `ANTHROPIC_API_KEY=sk-xxx pnpm --filter @resolve/ai exec tsx src/index.ts` (或测试脚本) | 返回 AIConsensus，含 3 条 vote |
| 3.2 | 检查返回的 votes | 每条 vote 有 agentId/outcome/confidence/evidence[].{source,url,snippet} |
| 3.3 | 检查 consensus | status="consensus"，confidence ≥ 0.65（耶/否方加权和 > 阈值） |
| 3.4 | 检查 3 个 Agent 投票是否不同 | BULL-1 偏向 YES，BEAR-1 可能 NO/中性，NEUT-1 数据驱动 |
| 3.5 | 不带 API key 调用 | 返回 mock fallback，不崩溃 |
| 3.6 | 同参数调用 2 次 | 结果在合理范围内一致（确定性护栏） |
| 3.7 | 检查返回值中的 evidence | 至少 1 条 evidence 包含 HTX 价格数据（BULL-1 的证据） |

**验收通过条件**: 3.1–3.4 通过。3.7（HTX 加分项）可选。

---

### ✅ Spec 4 — Settlement Contract & B.AI Integration

**前提**: Shasta 测试网有 USDD 测试币，合约已部署。

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 4.1 | 在 Shasta 浏览器搜索合约地址 | 合约可见，有交易记录 |
| 4.2 | 合约地址写入 `lib/constants.ts` | 地址与实际部署一致 |
| 4.3 | 调用 `buyShares()`（通过 TronLink 签名） | TronLink 弹窗确认 → 交易成功 → txHash 返回 |
| 4.4 | 检查测试网浏览器中 buy 交易 | 交易状态 success，合约余额增加 |
| 4.5 | 设置 `NEXT_PUBLIC_AIRBAG_ENABLED=true` → 调用 settle | 返回 `{ txHash, simulated: true }`，合约余额不变 |
| 4.6 | 关闭气囊 → 调用 settle | 赢家地址收到 USDD，合约余额减少 |
| 4.7 | 🆕 检查 B.AI 8004 身份 | Agent 8004 ID 在 B.AI 平台可查询 |
| 4.8 | 🆕 检查 x402 支付 | resolve() 过程中触发 x402，返回交易哈希可查 |
| 4.9 | 搜索项目代码 | 无明文私钥/助记词（所有 key 在 .env） |

**验收通过条件**: 4.1–4.6 通过。4.7–4.8（加分项）可选。

---

### ✅ Spec 5 — Walking Skeleton Frontend ⇄ API

**前提**: spec 1–4 已全部完成，API 可以返回真实数据。

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 5.1 | 打开 `localhost:3000` | 首页展示市场列表，数据来源不再是直接 import mock |
| 5.2 | 点击第一个市场 → 进入 `/markets/btc-150k-2026` | 市场详情加载，包含价格走势、Agent 列表、TradePanel |
| 5.3 | 点击「Connect Wallet」→ 连接 TronLink | 右上角显示地址 |
| 5.4 | 选择 YES，输入 100 USDD，点击「Buy YES」 | TronLink 签名弹窗 → 确认后 TradePanel 显示 "Order placed" + 仓位信息 |
| 5.5 | 点击 `/markets` | 显示 6 个以上市场，包含英雄市场 |
| 5.6 | 点击 `/agents` | 显示 6 个 Agent（3 ACTIVE + 3 STANDBY） |
| 5.7 | 点击某个 ACTIVE Agent | 显示 Agent 详情，含 8004 ID 和链上链接（如已实现） |
| 5.8 | 在市场详情页执行 resolve（通过 dev 触发器） | ConsensusMeter 显示 consensus 进度，votes 出现 |
| 5.9 | 点击「Settle」 | 显示 txHash + "Settlement complete" 提示 |
| 5.10 | 🆕 检查 x402 展示 | ConsensusMeter 下方显示 x402 交易哈希 + 链上链接 |

**验收通过条件**: 5.1–5.6 通过。5.7–5.10（加分项）可选。

---

### ✅ Spec 6 — Demo Controls & UX Polish

**前提**: spec 5 已跑通，完整 Walking Skeleton 可操作。

| # | 操作步骤 | 预期结果 |
|:-:|----------|----------|
| 6.1 | 打开 `/markets/btc-150k-2026?dev=1` | 页面出现 "⚡ Force Resolve (dev only)" 按钮 |
| 6.2 | 打开 `/markets/btc-150k-2026`（不加 ?dev=1） | 看不到 Force Resolve 按钮 |
| 6.3 | 点击 Force Resolve | Market 状态变为 `resolving` |
| 6.4 | 观察 vote 动画 | 3 条 votes 每条间隔 ~1.5s 依次淡入上移出现 |
| 6.5 | 观察 ConsensusMeter | 进度条随每条 vote 逐步增长 |
| 6.6 | 全部 3 条 votes 出现后 | status → "consensus"，ConsensusMeter 显示 ✓ 标记 |
| 6.7 | 检查 TradePanel | 显示 "USDD" 而非 "USDC" |
| 6.8 | 检查所有页面 | USDC 全部替换为 USDD（可 `grep -rn USDC apps/web --include='*.tsx' --include='*.ts'` 确认无残留） |
| 6.9 | 断开网络 → 点击任意操作按钮 | 显示友好错误 + "Retry" 按钮，不崩溃 |
| 6.10 | 正常网络下买入 | 按钮显示 "Processing..." + 禁用状态，完成后恢复 |
| 6.11 | 🆕 检查 Agent 8004 卡片 | 页面某处显示 8004 ID + 点击跳转 Tronscan |
| 6.12 | 🆕 Consensus 达成后检查 x402 区域 | 显示交易哈希 + 链上跳转链接 |

**验收通过条件**: 6.1–6.8 通过。6.9–6.10（容错性）推荐通过。6.11–6.12（加分项）可选。

---

## 🎬 Hero Market 终验 — Demo 大检查

> 此检查在决赛前一次性跑通，每次改动后至少跑一轮端到端。

| # | 步骤 | 操作 | 通过标准 | 时间 |
|:-:|------|------|----------|:---:|
| H1 | 钱包连接 | 打开页面 → 连接 TronLink | 显示地址 `T...xxx` + 绿点 + Shasta | 5s |
| H2 | 进入市场 | 点击英雄市场卡片 | 详情页加载正常，TradePanel 可见 | 3s |
| H3 | 买入 | 选 YES → 输入金额 → Buy | TronLink 签名 → 仓位显示 | 10s |
| H4 | 触发 resolve | Secret tap / `?dev=1` Force | status → resolving | 1s |
| H5 | AI 推理 | 等待 votes 一条一条出现 | 3 条 votes × 1.5s = 4.5s | 5s |
| H6 | 共识达成 | 观察 ConsensusMeter | ≥0.65 ✓ | — |
| H7 | 结算 | 点击 Settle | txHash 显示 | 5s |
| H8 | 检查赔付 | 钱包余额变化 | USDD 余额增加 | — |
| H9 | 🆕 B.AI 展示 | Agent 8004 ID 可见 | 跳转 Tronscan | — |
| H10 | 🆕 x402 展示 | x402 txHash 可见 | 跳转链上 | — |

**总 Demo 时长**: ~30 秒（包括等待 AI 推理的 4.5s 间隙）

---

## 📋 决赛提交检查清单

- [ ] GitHub README 完整（项目介绍、团队、demo 链接、架构图）
- [ ] Demo 演示视频 45–60s 已录制（Screenflow 录屏）
- [ ] Pitch Deck 10+ 页（问题→方案→技术→商业→团队→路线图）
- [ ] 公网可访问（Vercel 部署 `resolve-prediction.vercel.app`）
- [ ] 提交表单信息完整
- [ ] 至少 3 个评委 Q&A 已准备
- [ ] Hero Market 端到端完整跑通 ≥ 5 次

---

## ⚡ AI 自检速查（开发阶段，每次提交前）

```bash
# 30秒检查清单
pnpm typecheck  || exit 1
pnpm build      || exit 1
echo "AI 自检通过 ✓"
```

**仅此两条。** 花哨的测试框架留给正式项目——黑客松 AI 自检唯一需要的就是不编译报错、不构建失败。
